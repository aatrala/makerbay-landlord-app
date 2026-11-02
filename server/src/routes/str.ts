import { Hono } from "hono";
import { z } from "zod";
import { partialUpdate } from "../lib/zod.js";
import { and, eq, gte, lt, lte, gt, ne, inArray, desc, asc } from "drizzle-orm";
import type { AppEnv } from "../env.js";
import { db } from "../db/index.js";
import {
  booking,
  calendarFeed,
  expense,
  guest,
  guestMessage,
  homeowner,
  listing,
  messageTemplate,
  property,
  turnoverTask,
  unit,
  vendor,
} from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";
import { findConflicts, importIcalText, syncFeed, syncTurnoverForBooking } from "../str/service.js";
import { buildIcal } from "../str/ical.js";
import { addDays, nightsBetween, todayUtc } from "../str/dates.js";
import { computeListingMetrics, statementLine } from "../str/metrics.js";
import { DEFAULT_CHECKIN_TEMPLATE, renderTemplate, textToHtml } from "../str/templates.js";
import { sendEmail } from "../email/resend.js";

const router = new Hono<AppEnv>();
router.use("*", authMiddleware);

const validation = (details: unknown) => ({ message: "Validation error", code: "VALIDATION", details });
const notFound = { message: "Not found", code: "NOT_FOUND" };
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const time = z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM");
const source = z.enum(["direct", "airbnb", "booking_com", "vrbo", "other"]);

function randomToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function ownedListing(userId: string, id: string) {
  return db.query.listing.findFirst({
    where: and(eq(listing.id, id), eq(listing.userId, userId)),
    with: { property: true, unit: true },
  });
}

// ══════════════ Listings ══════════════

const listingSchema = z.object({
  unitId: z.string().uuid(),
  homeownerId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  nightlyRate: z.number().nonnegative(),
  minStay: z.number().int().min(1).default(1),
  cleaningFee: z.number().nonnegative().default(0),
  maxGuests: z.number().int().positive().nullable().optional(),
  houseRules: z.string().nullable().optional(),
  checkInTime: time.default("15:00"),
  checkOutTime: time.default("10:00"),
  checkInInstructions: z.string().nullable().optional(),
  managementFeePct: z.number().min(0).max(100).nullable().optional(),
  active: z.boolean().default(true),
});

router.get("/listings", async (c) => {
  const rows = await db.query.listing.findMany({
    where: eq(listing.userId, c.get("userId")),
    with: { property: true, unit: true, homeowner: true, calendarFeeds: true },
    orderBy: [asc(listing.name)],
  });
  return c.json({ data: rows });
});

router.get("/listings/:id", async (c) => {
  const l = await ownedListing(c.get("userId"), c.req.param("id"));
  if (!l) return c.json(notFound, 404);
  const feeds = await db.select().from(calendarFeed).where(eq(calendarFeed.listingId, l.id));
  return c.json({ data: { ...l, calendarFeeds: feeds } });
});

router.post("/listings", async (c) => {
  const userId = c.get("userId");
  const parsed = listingSchema.safeParse(c.get("body"));
  if (!parsed.success) return c.json(validation(parsed.error.flatten()), 400);
  const u = await db.query.unit.findFirst({
    where: eq(unit.id, parsed.data.unitId),
    with: { property: true },
  });
  if (!u || u.property.userId !== userId) return c.json({ message: "Unit not found", code: "NOT_FOUND" }, 404);
  const dup = await db.query.listing.findFirst({ where: eq(listing.unitId, u.id) });
  if (dup) return c.json({ message: "This unit already has a listing", code: "DUPLICATE" }, 409);
  const [created] = await db
    .insert(listing)
    .values({ ...parsed.data, userId, propertyId: u.propertyId, icalToken: randomToken() })
    .returning();
  return c.json({ data: created }, 201);
});

router.put("/listings/:id", async (c) => {
  const userId = c.get("userId");
  const parsed = partialUpdate(listingSchema.omit({ unitId: true })).safeParse(c.get("body"));
  if (!parsed.success) return c.json(validation(parsed.error.flatten()), 400);
  const l = await ownedListing(userId, c.req.param("id"));
  if (!l) return c.json(notFound, 404);
  const [updated] = await db
    .update(listing)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(listing.id, l.id))
    .returning();
  return c.json({ data: updated });
});

router.post("/listings/:id/rotate-ical-token", async (c) => {
  const l = await ownedListing(c.get("userId"), c.req.param("id"));
  if (!l) return c.json(notFound, 404);
  const [updated] = await db
    .update(listing)
    .set({ icalToken: randomToken(), updatedAt: new Date() })
    .where(eq(listing.id, l.id))
    .returning();
  return c.json({ data: updated });
});

router.delete("/listings/:id", async (c) => {
  const l = await ownedListing(c.get("userId"), c.req.param("id"));
  if (!l) return c.json(notFound, 404);
  await db.delete(listing).where(eq(listing.id, l.id));
  return c.json({ message: "Deleted" });
});

// ══════════════ iCal feeds (import) ══════════════

const feedSchema = z.object({
  source: source.exclude(["direct"]),
  url: z.string().url().refine((u) => /^https?:\/\//i.test(u) || /^webcal:\/\//i.test(u), "http(s) or webcal URL"),
});

router.post("/listings/:id/feeds", async (c) => {
  const l = await ownedListing(c.get("userId"), c.req.param("id"));
  if (!l) return c.json(notFound, 404);
  const parsed = feedSchema.safeParse(c.get("body"));
  if (!parsed.success) return c.json(validation(parsed.error.flatten()), 400);
  const url = parsed.data.url.replace(/^webcal:\/\//i, "https://");
  const [created] = await db
    .insert(calendarFeed)
    .values({ listingId: l.id, source: parsed.data.source, url })
    .returning();
  return c.json({ data: created }, 201);
});

async function ownedFeed(userId: string, id: string) {
  const f = await db.query.calendarFeed.findFirst({
    where: eq(calendarFeed.id, id),
    with: { listing: true },
  });
  return f && f.listing.userId === userId ? f : undefined;
}

router.delete("/feeds/:id", async (c) => {
  const f = await ownedFeed(c.get("userId"), c.req.param("id"));
  if (!f) return c.json(notFound, 404);
  await db.delete(calendarFeed).where(eq(calendarFeed.id, f.id));
  return c.json({ message: "Deleted" });
});

router.post("/feeds/:id/sync", async (c) => {
  const f = await ownedFeed(c.get("userId"), c.req.param("id"));
  if (!f) return c.json(notFound, 404);
  try {
    const { listing: _l, ...feedRow } = f;
    return c.json({ data: await syncFeed(feedRow) });
  } catch (err) {
    return c.json({ message: `Sync failed: ${(err as Error).message}`, code: "SYNC_FAILED" }, 502);
  }
});

// Paste .ics contents directly (useful when a channel needs manual export)
router.post("/feeds/:id/import", async (c) => {
  const f = await ownedFeed(c.get("userId"), c.req.param("id"));
  if (!f) return c.json(notFound, 404);
  const parsed = z.object({ ics: z.string().min(1) }).safeParse(c.get("body"));
  if (!parsed.success) return c.json(validation(parsed.error.flatten()), 400);
  const { listing: _l, ...feedRow } = f;
  return c.json({ data: await importIcalText(feedRow, parsed.data.ics) });
});

// ══════════════ Guests ══════════════

const guestSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

router.get("/guests", async (c) => {
  const rows = await db.query.guest.findMany({
    where: eq(guest.userId, c.get("userId")),
    with: { bookings: true },
    orderBy: [desc(guest.createdAt)],
  });
  return c.json({ data: rows });
});

router.post("/guests", async (c) => {
  const parsed = guestSchema.safeParse(c.get("body"));
  if (!parsed.success) return c.json(validation(parsed.error.flatten()), 400);
  const [created] = await db.insert(guest).values({ ...parsed.data, userId: c.get("userId") }).returning();
  return c.json({ data: created }, 201);
});

router.put("/guests/:id", async (c) => {
  const parsed = partialUpdate(guestSchema).safeParse(c.get("body"));
  if (!parsed.success) return c.json(validation(parsed.error.flatten()), 400);
  const [updated] = await db
    .update(guest)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(guest.id, c.req.param("id")), eq(guest.userId, c.get("userId"))))
    .returning();
  if (!updated) return c.json(notFound, 404);
  return c.json({ data: updated });
});

router.delete("/guests/:id", async (c) => {
  const [deleted] = await db
    .delete(guest)
    .where(and(eq(guest.id, c.req.param("id")), eq(guest.userId, c.get("userId"))))
    .returning();
  if (!deleted) return c.json(notFound, 404);
  return c.json({ message: "Deleted" });
});

// ══════════════ Bookings ══════════════

const bookingFields = z.object({
    listingId: z.string().uuid(),
    guestId: z.string().uuid().nullable().optional(),
    source: source.default("direct"),
    status: z.enum(["tentative", "confirmed", "blocked", "cancelled"]).default("confirmed"),
    checkIn: isoDate,
    checkOut: isoDate,
    numGuests: z.number().int().positive().nullable().optional(),
    accommodationTotal: z.number().nonnegative().optional(),
    cleaningFee: z.number().nonnegative().optional(),
    platformFee: z.number().nonnegative().default(0),
    taxes: z.number().nonnegative().default(0),
    notes: z.string().nullable().optional(),
    allowShortStay: z.boolean().optional(),
  });
const bookingSchema = bookingFields.refine((b) => b.checkOut > b.checkIn, { message: "checkOut must be after checkIn", path: ["checkOut"] });

router.get("/bookings", async (c) => {
  const userId = c.get("userId");
  const from = c.req.query("from");
  const to = c.req.query("to");
  const listingId = c.req.query("listingId");
  const conds = [eq(booking.userId, userId)];
  if (from) conds.push(gt(booking.checkOut, from));
  if (to) conds.push(lt(booking.checkIn, to));
  if (listingId) conds.push(eq(booking.listingId, listingId));
  if (c.req.query("includeCancelled") !== "true") conds.push(ne(booking.status, "cancelled"));
  const rows = await db.query.booking.findMany({
    where: and(...conds),
    with: { guest: true, listing: true },
    orderBy: [asc(booking.checkIn)],
  });
  return c.json({ data: rows });
});

router.get("/bookings/:id", async (c) => {
  const b = await db.query.booking.findFirst({
    where: and(eq(booking.id, c.req.param("id")), eq(booking.userId, c.get("userId"))),
    with: { guest: true, listing: true },
  });
  if (!b) return c.json(notFound, 404);
  return c.json({ data: b });
});

router.post("/bookings/check-availability", async (c) => {
  const parsed = z
    .object({ listingId: z.string().uuid(), checkIn: isoDate, checkOut: isoDate, excludeBookingId: z.string().uuid().optional() })
    .safeParse(c.get("body"));
  if (!parsed.success) return c.json(validation(parsed.error.flatten()), 400);
  const l = await ownedListing(c.get("userId"), parsed.data.listingId);
  if (!l) return c.json(notFound, 404);
  const conflicts = await findConflicts(l.id, parsed.data.checkIn, parsed.data.checkOut, parsed.data.excludeBookingId);
  return c.json({ data: { available: conflicts.length === 0, conflicts } });
});

router.post("/bookings", async (c) => {
  const userId = c.get("userId");
  const parsed = bookingSchema.safeParse(c.get("body"));
  if (!parsed.success) return c.json(validation(parsed.error.flatten()), 400);
  const { allowShortStay, ...data } = parsed.data;
  const l = await ownedListing(userId, data.listingId);
  if (!l) return c.json(notFound, 404);
  if (data.guestId) {
    const g = await db.query.guest.findFirst({ where: and(eq(guest.id, data.guestId), eq(guest.userId, userId)) });
    if (!g) return c.json({ message: "Guest not found", code: "NOT_FOUND" }, 404);
  }
  const nights = nightsBetween(data.checkIn, data.checkOut);
  if (data.status !== "blocked" && nights < l.minStay && !allowShortStay) {
    return c.json({ message: `Minimum stay is ${l.minStay} nights`, code: "MIN_STAY" }, 400);
  }
  if (data.status !== "cancelled") {
    const conflicts = await findConflicts(l.id, data.checkIn, data.checkOut);
    if (conflicts.length) {
      return c.json({ message: "Dates conflict with an existing booking or block", code: "CONFLICT", conflicts }, 409);
    }
  }
  const isStay = data.status !== "blocked";
  const [created] = await db
    .insert(booking)
    .values({
      ...data,
      userId,
      accommodationTotal: data.accommodationTotal ?? (isStay ? l.nightlyRate * nights : 0),
      cleaningFee: data.cleaningFee ?? (isStay ? l.cleaningFee : 0),
    })
    .returning();
  const turnover = await syncTurnoverForBooking(created);
  return c.json({ data: { ...created, turnoverTask: turnover } }, 201);
});

router.put("/bookings/:id", async (c) => {
  const userId = c.get("userId");
  const existing = await db.query.booking.findFirst({
    where: and(eq(booking.id, c.req.param("id")), eq(booking.userId, userId)),
  });
  if (!existing) return c.json(notFound, 404);
  const parsed = partialUpdate(bookingFields.omit({ listingId: true })).safeParse(c.get("body"));
  if (!parsed.success) return c.json(validation(parsed.error.flatten()), 400);
  const { allowShortStay: _a, ...data } = parsed.data;
  const merged = { ...existing, ...data };
  if (merged.checkOut <= merged.checkIn) return c.json(validation({ checkOut: ["checkOut must be after checkIn"] }), 400);
  if (merged.status !== "cancelled") {
    const conflicts = await findConflicts(existing.listingId, merged.checkIn, merged.checkOut, existing.id);
    if (conflicts.length) {
      return c.json({ message: "Dates conflict with an existing booking or block", code: "CONFLICT", conflicts }, 409);
    }
  }
  const [updated] = await db
    .update(booking)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(booking.id, existing.id))
    .returning();
  await syncTurnoverForBooking(updated);
  return c.json({ data: updated });
});

router.post("/bookings/:id/cancel", async (c) => {
  const [updated] = await db
    .update(booking)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(eq(booking.id, c.req.param("id")), eq(booking.userId, c.get("userId"))))
    .returning();
  if (!updated) return c.json(notFound, 404);
  await syncTurnoverForBooking(updated);
  return c.json({ data: updated });
});

router.delete("/bookings/:id", async (c) => {
  const [deleted] = await db
    .delete(booking)
    .where(and(eq(booking.id, c.req.param("id")), eq(booking.userId, c.get("userId"))))
    .returning();
  if (!deleted) return c.json(notFound, 404);
  return c.json({ message: "Deleted" });
});

// ══════════════ Turnover / cleaning tasks ══════════════

router.get("/turnovers", async (c) => {
  const userId = c.get("userId");
  const conds = [eq(turnoverTask.userId, userId)];
  const from = c.req.query("from");
  const to = c.req.query("to");
  const status = c.req.query("status");
  if (from) conds.push(gte(turnoverTask.dueDate, from));
  if (to) conds.push(lte(turnoverTask.dueDate, to));
  if (status) conds.push(eq(turnoverTask.status, status as any));
  const rows = await db.query.turnoverTask.findMany({
    where: and(...conds),
    with: { listing: true, vendor: true, booking: true },
    orderBy: [asc(turnoverTask.dueDate)],
  });
  return c.json({ data: rows });
});

const turnoverUpdate = z.object({
  vendorId: z.string().uuid().nullable().optional(),
  status: z.enum(["pending", "assigned", "in_progress", "done", "cancelled"]).optional(),
  cost: z.number().nonnegative().nullable().optional(),
  notes: z.string().nullable().optional(),
  dueDate: isoDate.optional(),
  notifyVendor: z.boolean().optional(),
});

router.put("/turnovers/:id", async (c) => {
  const userId = c.get("userId");
  const parsed = turnoverUpdate.safeParse(c.get("body"));
  if (!parsed.success) return c.json(validation(parsed.error.flatten()), 400);
  const existing = await db.query.turnoverTask.findFirst({
    where: and(eq(turnoverTask.id, c.req.param("id")), eq(turnoverTask.userId, userId)),
    with: { listing: { with: { property: true } } },
  });
  if (!existing) return c.json(notFound, 404);
  const { notifyVendor, ...data } = parsed.data;
  let v: typeof vendor.$inferSelect | undefined;
  if (data.vendorId) {
    v = await db.query.vendor.findFirst({ where: and(eq(vendor.id, data.vendorId), eq(vendor.userId, userId)) });
    if (!v) return c.json({ message: "Vendor not found", code: "NOT_FOUND" }, 404);
  }
  const updates: Record<string, unknown> = { ...data, updatedAt: new Date() };
  if (data.vendorId && !data.status && existing.status === "pending") updates.status = "assigned";
  if (data.status === "done") updates.completedAt = new Date();
  const [updated] = await db.update(turnoverTask).set(updates).where(eq(turnoverTask.id, existing.id)).returning();
  let notified: boolean | undefined;
  if (notifyVendor && v?.email) {
    const p = existing.listing.property;
    const r = await sendEmail({
      to: v.email,
      subject: `Cleaning job: ${existing.listing.name} on ${updated.dueDate}`,
      html: textToHtml(
        `Hi ${v.name},\n\nYou have been assigned a turnover clean at ${existing.listing.name} (${p.address}, ${p.city}) on ${updated.dueDate}.\nGuest checkout: ${existing.listing.checkOutTime}${updated.nextCheckIn ? `\nNext guest arrives the same day at ${existing.listing.checkInTime}.` : ""}\n${updated.notes ? `\nNotes: ${updated.notes}\n` : ""}\nThanks,\nManage Homestay`,
      ),
    });
    notified = r.success;
  }
  return c.json({ data: updated, notified });
});

// ══════════════ Homeowners & owner statements ══════════════

const homeownerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().nullable().optional(),
  managementFeePct: z.number().min(0).max(100).default(0),
  notes: z.string().nullable().optional(),
});

router.get("/homeowners", async (c) => {
  const rows = await db.query.homeowner.findMany({
    where: eq(homeowner.userId, c.get("userId")),
    with: { listings: true },
  });
  return c.json({ data: rows });
});

router.post("/homeowners", async (c) => {
  const parsed = homeownerSchema.safeParse(c.get("body"));
  if (!parsed.success) return c.json(validation(parsed.error.flatten()), 400);
  const [created] = await db.insert(homeowner).values({ ...parsed.data, userId: c.get("userId") }).returning();
  return c.json({ data: created }, 201);
});

router.put("/homeowners/:id", async (c) => {
  const parsed = partialUpdate(homeownerSchema).safeParse(c.get("body"));
  if (!parsed.success) return c.json(validation(parsed.error.flatten()), 400);
  const [updated] = await db
    .update(homeowner)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(homeowner.id, c.req.param("id")), eq(homeowner.userId, c.get("userId"))))
    .returning();
  if (!updated) return c.json(notFound, 404);
  return c.json({ data: updated });
});

router.delete("/homeowners/:id", async (c) => {
  const [deleted] = await db
    .delete(homeowner)
    .where(and(eq(homeowner.id, c.req.param("id")), eq(homeowner.userId, c.get("userId"))))
    .returning();
  if (!deleted) return c.json(notFound, 404);
  return c.json({ message: "Deleted" });
});

function monthRange(c: { req: { query: (k: string) => string | undefined } }) {
  const from = c.req.query("from");
  const to = c.req.query("to");
  if (from && to) return { from, to };
  const now = new Date();
  const y = Number(c.req.query("year")) || now.getUTCFullYear();
  const m = Number(c.req.query("month")) || now.getUTCMonth() + 1;
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const end = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  return { from: start, to: end };
}

async function metricsFor(listingIds: string[], from: string, to: string) {
  if (!listingIds.length) return [];
  return db
    .select()
    .from(booking)
    .where(
      and(
        inArray(booking.listingId, listingIds),
        ne(booking.status, "cancelled"),
        lt(booking.checkIn, to),
        gte(booking.checkOut, from),
      ),
    );
}

router.get("/reports/listings", async (c) => {
  const userId = c.get("userId");
  const { from, to } = monthRange(c);
  const listings = await db.select().from(listing).where(eq(listing.userId, userId));
  const bookings = await metricsFor(listings.map((l) => l.id), from, to);
  const rows = listings.map((l) => ({ name: l.name, ...computeListingMetrics(l.id, bookings, from, to) }));
  const totals = rows.reduce(
    (a, r) => ({
      nightsBooked: a.nightsBooked + r.nightsBooked,
      nightsAvailable: a.nightsAvailable + r.nightsAvailable,
      grossRevenue: a.grossRevenue + r.grossRevenue,
      accommodationRevenue: a.accommodationRevenue + r.accommodationRevenue,
    }),
    { nightsBooked: 0, nightsAvailable: 0, grossRevenue: 0, accommodationRevenue: 0 },
  );
  return c.json({
    data: {
      from,
      to,
      listings: rows,
      totals: {
        ...totals,
        occupancy: totals.nightsAvailable ? Math.round((totals.nightsBooked / totals.nightsAvailable) * 100) / 100 : 0,
        adr: totals.nightsBooked ? Math.round((totals.accommodationRevenue / totals.nightsBooked) * 100) / 100 : 0,
      },
    },
  });
});

router.get("/homeowners/:id/statement", async (c) => {
  const userId = c.get("userId");
  const owner = await db.query.homeowner.findFirst({
    where: and(eq(homeowner.id, c.req.param("id")), eq(homeowner.userId, userId)),
  });
  if (!owner) return c.json(notFound, 404);
  const { from, to } = monthRange(c);
  const listings = await db
    .select()
    .from(listing)
    .where(and(eq(listing.userId, userId), eq(listing.homeownerId, owner.id)));
  const ids = listings.map((l) => l.id);
  const bookings = await metricsFor(ids, from, to);
  const propertyIds = [...new Set(listings.map((l) => l.propertyId))];
  const expenses = propertyIds.length
    ? await db
        .select()
        .from(expense)
        .where(and(inArray(expense.propertyId, propertyIds), gte(expense.date, from), lt(expense.date, to)))
    : [];
  const turnovers = ids.length
    ? await db
        .select()
        .from(turnoverTask)
        .where(and(inArray(turnoverTask.listingId, ids), gte(turnoverTask.dueDate, from), lt(turnoverTask.dueDate, to), ne(turnoverTask.status, "cancelled")))
    : [];
  const lines = listings.map((l) => {
    // Unit-level expenses go to that listing; property-level ones split across the property's listings.
    const siblings = listings.filter((x) => x.propertyId === l.propertyId).length;
    const exp = expenses
      .filter((e) => e.propertyId === l.propertyId && (!e.unitId || e.unitId === l.unitId))
      .reduce((s, e) => s + (e.unitId ? e.amount : e.amount / siblings), 0);
    const tCost = turnovers.filter((t) => t.listingId === l.id).reduce((s, t) => s + (t.cost ?? 0), 0);
    return statementLine(
      l.id,
      l.name,
      computeListingMetrics(l.id, bookings, from, to),
      l.managementFeePct ?? owner.managementFeePct,
      exp,
      tCost,
    );
  });
  const sum = (k: "managementFee" | "expenses" | "turnoverCosts" | "net") =>
    Math.round(lines.reduce((s, l) => s + l[k], 0) * 100) / 100;
  const gross = Math.round(lines.reduce((s, l) => s + l.metrics.grossRevenue, 0) * 100) / 100;
  const platformFees = Math.round(lines.reduce((s, l) => s + l.metrics.platformFees, 0) * 100) / 100;
  return c.json({
    data: {
      homeowner: owner,
      from,
      to,
      lines,
      totals: {
        grossRevenue: gross,
        platformFees,
        managementFee: sum("managementFee"),
        expenses: sum("expenses"),
        turnoverCosts: sum("turnoverCosts"),
        netPayout: sum("net"),
      },
    },
  });
});

// ══════════════ Guest message templates ══════════════

const templateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
});

router.get("/templates", async (c) => {
  const userId = c.get("userId");
  let rows = await db.select().from(messageTemplate).where(eq(messageTemplate.userId, userId));
  if (!rows.length) {
    rows = await db.insert(messageTemplate).values({ ...DEFAULT_CHECKIN_TEMPLATE, userId }).returning();
  }
  return c.json({ data: rows });
});

router.post("/templates", async (c) => {
  const parsed = templateSchema.safeParse(c.get("body"));
  if (!parsed.success) return c.json(validation(parsed.error.flatten()), 400);
  const [created] = await db.insert(messageTemplate).values({ ...parsed.data, userId: c.get("userId") }).returning();
  return c.json({ data: created }, 201);
});

router.put("/templates/:id", async (c) => {
  const parsed = partialUpdate(templateSchema).safeParse(c.get("body"));
  if (!parsed.success) return c.json(validation(parsed.error.flatten()), 400);
  const [updated] = await db
    .update(messageTemplate)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(messageTemplate.id, c.req.param("id")), eq(messageTemplate.userId, c.get("userId"))))
    .returning();
  if (!updated) return c.json(notFound, 404);
  return c.json({ data: updated });
});

router.delete("/templates/:id", async (c) => {
  const [deleted] = await db
    .delete(messageTemplate)
    .where(and(eq(messageTemplate.id, c.req.param("id")), eq(messageTemplate.userId, c.get("userId"))))
    .returning();
  if (!deleted) return c.json(notFound, 404);
  return c.json({ message: "Deleted" });
});

async function draftFor(userId: string, templateId: string, bookingId: string) {
  const tpl = await db.query.messageTemplate.findFirst({
    where: and(eq(messageTemplate.id, templateId), eq(messageTemplate.userId, userId)),
  });
  const b = await db.query.booking.findFirst({
    where: and(eq(booking.id, bookingId), eq(booking.userId, userId)),
    with: { guest: true, listing: { with: { property: true } } },
  });
  if (!tpl || !b) return null;
  const p = b.listing.property;
  const ctx = {
    guest_name: b.guest ? [b.guest.firstName, b.guest.lastName].filter(Boolean).join(" ") : "there",
    listing_name: b.listing.name,
    check_in: b.checkIn,
    check_out: b.checkOut,
    nights: nightsBetween(b.checkIn, b.checkOut),
    check_in_time: b.listing.checkInTime,
    check_out_time: b.listing.checkOutTime,
    address: `${p.address}, ${p.city}, ${p.state} ${p.zip}`,
    house_rules: b.listing.houseRules ?? "",
    check_in_instructions: b.listing.checkInInstructions ?? "",
  };
  return {
    templateId: tpl.id,
    bookingId: b.id,
    recipient: b.guest?.email ?? null,
    subject: renderTemplate(tpl.subject, ctx),
    body: renderTemplate(tpl.body, ctx),
  };
}

// Preview only: renders, stores nothing, sends nothing.
router.post("/messages/preview", async (c) => {
  const parsed = z.object({ templateId: z.string().uuid(), bookingId: z.string().uuid() }).safeParse(c.get("body"));
  if (!parsed.success) return c.json(validation(parsed.error.flatten()), 400);
  const d = await draftFor(c.get("userId"), parsed.data.templateId, parsed.data.bookingId);
  if (!d) return c.json(notFound, 404);
  return c.json({ data: { ...d, html: textToHtml(d.body) } });
});

// Save a draft (optionally edited) for review.
router.post("/messages", async (c) => {
  const userId = c.get("userId");
  const parsed = z
    .object({
      templateId: z.string().uuid(),
      bookingId: z.string().uuid(),
      subject: z.string().optional(),
      body: z.string().optional(),
      recipient: z.string().email().optional(),
    })
    .safeParse(c.get("body"));
  if (!parsed.success) return c.json(validation(parsed.error.flatten()), 400);
  const d = await draftFor(userId, parsed.data.templateId, parsed.data.bookingId);
  if (!d) return c.json(notFound, 404);
  const recipient = parsed.data.recipient ?? d.recipient;
  if (!recipient) return c.json({ message: "Guest has no email address", code: "NO_RECIPIENT" }, 400);
  const [created] = await db
    .insert(guestMessage)
    .values({
      userId,
      bookingId: d.bookingId,
      templateId: d.templateId,
      recipient,
      subject: parsed.data.subject ?? d.subject,
      body: parsed.data.body ?? d.body,
      status: "draft",
    })
    .returning();
  return c.json({ data: created }, 201);
});

router.get("/messages", async (c) => {
  const rows = await db
    .select()
    .from(guestMessage)
    .where(eq(guestMessage.userId, c.get("userId")))
    .orderBy(desc(guestMessage.createdAt));
  return c.json({ data: rows });
});

// Explicit send of a reviewed draft.
router.post("/messages/:id/send", async (c) => {
  const msg = await db.query.guestMessage.findFirst({
    where: and(eq(guestMessage.id, c.req.param("id")), eq(guestMessage.userId, c.get("userId"))),
  });
  if (!msg) return c.json(notFound, 404);
  if (msg.status === "sent") return c.json({ message: "Already sent", code: "ALREADY_SENT" }, 409);
  const r = await sendEmail({ to: msg.recipient, subject: msg.subject, html: textToHtml(msg.body) });
  const [updated] = await db
    .update(guestMessage)
    .set(r.success ? { status: "sent", sentAt: new Date(), error: null } : { status: "failed", error: r.error ?? "send failed" })
    .where(eq(guestMessage.id, msg.id))
    .returning();
  return c.json({ data: updated }, r.success ? 200 : 502);
});

// ══════════════ Calendar overview ══════════════

router.get("/calendar", async (c) => {
  const userId = c.get("userId");
  const from = c.req.query("from") || todayUtc();
  const to = c.req.query("to") || addDays(from, 30);
  const listings = await db.select().from(listing).where(eq(listing.userId, userId)).orderBy(asc(listing.name));
  const rows = listings.length
    ? await db
        .select()
        .from(booking)
        .where(and(eq(booking.userId, userId), ne(booking.status, "cancelled"), lt(booking.checkIn, to), gt(booking.checkOut, from)))
    : [];
  return c.json({
    data: {
      from,
      to,
      listings: listings.map((l) => ({ id: l.id, name: l.name, bookings: rows.filter((b) => b.listingId === l.id) })),
    },
  });
});

export { router as strRouter };

// ══════════════ Public iCal export (no auth; secret token) ══════════════

export const icalRouter = new Hono<AppEnv>();

icalRouter.get("/:file", async (c) => {
  const token = c.req.param("file").replace(/\.ics$/i, "");
  if (!/^[a-f0-9]{32,64}$/.test(token)) return c.text("Not found", 404);
  const l = await db.query.listing.findFirst({ where: eq(listing.icalToken, token) });
  if (!l) return c.text("Not found", 404);
  const since = addDays(todayUtc(), -60);
  const rows = await db
    .select()
    .from(booking)
    .where(and(eq(booking.listingId, l.id), ne(booking.status, "cancelled"), gte(booking.checkOut, since)));
  // Re-exporting a channel's own events back to it creates loops; channels
  // de-duplicate by UID, so we export everything under stable UIDs but never
  // include guest details.
  const host = new URL(c.req.url).host;
  const body = buildIcal({
    calendarName: l.name,
    events: rows.map((b) => ({
      uid: `${b.id}@${host}`,
      start: b.checkIn,
      end: b.checkOut,
      summary: b.status === "blocked" ? "Not available" : "Reserved",
    })),
  });
  return c.body(body, 200, {
    "content-type": "text/calendar; charset=utf-8",
    "cache-control": "no-store",
    "content-disposition": `inline; filename="${l.id}.ics"`,
  });
});
