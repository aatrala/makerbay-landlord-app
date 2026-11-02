import { and, eq, ne, lt, gt, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { booking, calendarFeed, listing, turnoverTask } from "../db/schema.js";
import { classifyEvent, parseIcal } from "./ical.js";

type BookingRow = typeof booking.$inferSelect;

/** Non-cancelled bookings/blocks on a listing overlapping [checkIn, checkOut). */
export async function findConflicts(
  listingId: string,
  checkIn: string,
  checkOut: string,
  excludeBookingId?: string,
) {
  const conds = [
    eq(booking.listingId, listingId),
    ne(booking.status, "cancelled"),
    lt(booking.checkIn, checkOut),
    gt(booking.checkOut, checkIn),
  ];
  if (excludeBookingId) conds.push(ne(booking.id, excludeBookingId));
  return db.select().from(booking).where(and(...conds));
}

/**
 * Keep exactly one turnover task per confirmed stay, due on the checkout day.
 * Cancelled/blocked stays cancel any open task.
 */
export async function syncTurnoverForBooking(b: BookingRow) {
  const task = await syncOwnTurnover(b);
  // A new/changed arrival may turn an earlier checkout into a same-day turnover.
  await refreshSameDayFlag(b.listingId, b.checkIn);
  return task && task.dueDate === b.checkIn ? ((await db.query.turnoverTask.findFirst({ where: eq(turnoverTask.id, task.id) })) ?? task) : task;
}

/** Set nextCheckIn on open tasks due `date` depending on whether a stay arrives that day. */
async function refreshSameDayFlag(listingId: string, date: string) {
  const arrival = await db.query.booking.findFirst({
    where: and(eq(booking.listingId, listingId), eq(booking.checkIn, date), ne(booking.status, "cancelled")),
  });
  await db
    .update(turnoverTask)
    .set({ nextCheckIn: arrival ? date : null, updatedAt: new Date() })
    .where(and(eq(turnoverTask.listingId, listingId), eq(turnoverTask.dueDate, date)));
}

async function syncOwnTurnover(b: BookingRow) {
  const existing = await db.query.turnoverTask.findFirst({
    where: eq(turnoverTask.bookingId, b.id),
  });
  if (b.status !== "confirmed") {
    if (existing && existing.status !== "done" && existing.status !== "cancelled") {
      await db
        .update(turnoverTask)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(turnoverTask.id, existing.id));
    }
    return null;
  }
  const next = await db.query.booking.findFirst({
    where: and(
      eq(booking.listingId, b.listingId),
      eq(booking.checkIn, b.checkOut),
      ne(booking.status, "cancelled"),
      ne(booking.id, b.id),
    ),
  });
  const nextCheckIn = next ? next.checkIn : null;
  if (existing) {
    const reopen = existing.status === "cancelled";
    const [updated] = await db
      .update(turnoverTask)
      .set({
        dueDate: b.checkOut,
        nextCheckIn,
        ...(reopen ? { status: existing.vendorId ? "assigned" : "pending" } : {}),
        updatedAt: new Date(),
      })
      .where(eq(turnoverTask.id, existing.id))
      .returning();
    return updated;
  }
  const [created] = await db
    .insert(turnoverTask)
    .values({
      userId: b.userId,
      listingId: b.listingId,
      bookingId: b.id,
      dueDate: b.checkOut,
      nextCheckIn,
      status: "pending",
    })
    .onConflictDoNothing()
    .returning();
  return created ?? null;
}

export type SyncResult = {
  feedId: string;
  imported: number;
  updated: number;
  cancelled: number;
  conflicts: { uid: string; start: string; end: string; withBookingIds: string[] }[];
};

/** Import an iCal feed into bookings (upsert by UID, cancel vanished events). */
export async function importIcalText(
  feed: typeof calendarFeed.$inferSelect,
  text: string,
): Promise<SyncResult> {
  const l = await db.query.listing.findFirst({ where: eq(listing.id, feed.listingId) });
  if (!l) throw new Error("Listing not found");
  const events = parseIcal(text);
  const result: SyncResult = { feedId: feed.id, imported: 0, updated: 0, cancelled: 0, conflicts: [] };
  const seen = new Set<string>();

  for (const e of events) {
    const uid = `${feed.source}:${e.uid}`;
    seen.add(uid);
    const status = classifyEvent(e);
    const existing = await db.query.booking.findFirst({
      where: and(eq(booking.listingId, l.id), eq(booking.externalUid, uid)),
    });
    let row: BookingRow;
    if (existing) {
      if (
        existing.checkIn === e.start &&
        existing.checkOut === e.end &&
        existing.status === status &&
        existing.summary === (e.summary ?? null)
      ) {
        continue;
      }
      [row] = await db
        .update(booking)
        .set({ checkIn: e.start, checkOut: e.end, status, summary: e.summary ?? null, updatedAt: new Date() })
        .where(eq(booking.id, existing.id))
        .returning();
      result.updated++;
    } else {
      if (status === "cancelled") continue;
      [row] = await db
        .insert(booking)
        .values({
          userId: l.userId,
          listingId: l.id,
          calendarFeedId: feed.id,
          source: feed.source,
          status,
          checkIn: e.start,
          checkOut: e.end,
          externalUid: uid,
          summary: e.summary ?? null,
        })
        .returning();
      result.imported++;
    }
    if (row.status !== "cancelled") {
      const clashes = (await findConflicts(l.id, row.checkIn, row.checkOut, row.id)).filter(
        (c) => c.calendarFeedId !== feed.id,
      );
      if (clashes.length) {
        result.conflicts.push({ uid: e.uid, start: e.start, end: e.end, withBookingIds: clashes.map((c) => c.id) });
      }
    }
    await syncTurnoverForBooking(row);
  }

  // Events that disappeared from the feed were cancelled on the channel.
  const fromFeed = await db
    .select()
    .from(booking)
    .where(and(eq(booking.calendarFeedId, feed.id), ne(booking.status, "cancelled")));
  const gone = fromFeed.filter((b) => b.externalUid && !seen.has(b.externalUid));
  if (gone.length) {
    const cancelled = await db
      .update(booking)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(inArray(booking.id, gone.map((g) => g.id)))
      .returning();
    for (const b of cancelled) await syncTurnoverForBooking(b);
    result.cancelled = cancelled.length;
  }
  return result;
}

export async function syncFeed(
  feed: typeof calendarFeed.$inferSelect,
  fetcher: typeof fetch = fetch,
): Promise<SyncResult> {
  try {
    const res = await fetcher(feed.url, {
      headers: { "user-agent": "ManageHomestay-iCal/1.0", accept: "text/calendar" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text.includes("BEGIN:VCALENDAR")) throw new Error("Response is not an iCal feed");
    const result = await importIcalText(feed, text);
    await db
      .update(calendarFeed)
      .set({
        lastSyncedAt: new Date(),
        lastStatus: `ok: +${result.imported} ~${result.updated} -${result.cancelled}, ${result.conflicts.length} conflicts`,
        lastError: null,
      })
      .where(eq(calendarFeed.id, feed.id));
    return result;
  } catch (err) {
    await db
      .update(calendarFeed)
      .set({ lastSyncedAt: new Date(), lastStatus: "error", lastError: String((err as Error).message ?? err) })
      .where(eq(calendarFeed.id, feed.id));
    throw err;
  }
}

export async function syncAllFeeds(fetcher: typeof fetch = fetch) {
  const feeds = await db.select().from(calendarFeed);
  const out: { feedId: string; ok: boolean; error?: string }[] = [];
  for (const f of feeds) {
    try {
      await syncFeed(f, fetcher);
      out.push({ feedId: f.id, ok: true });
    } catch (e) {
      out.push({ feedId: f.id, ok: false, error: String((e as Error).message ?? e) });
    }
  }
  return out;
}
