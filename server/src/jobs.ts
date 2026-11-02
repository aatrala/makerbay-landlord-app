import { and, eq, ne } from "drizzle-orm";
import { db } from "./db/index.js";
import { booking, turnoverTask, user } from "./db/schema.js";
import { processRentReminders } from "./services/rent-reminders.js";
import { syncAllFeeds, syncTurnoverForBooking } from "./str/service.js";
import { addDays, todayUtc } from "./str/dates.js";
import { sendEmail } from "./email/resend.js";
import { textToHtml } from "./str/templates.js";

/** Host digest: tomorrow's arrivals, departures and turnovers. */
export async function sendStrDigests(day = addDays(todayUtc(), 1)) {
  const arrivals = await db.query.booking.findMany({
    where: and(eq(booking.checkIn, day), eq(booking.status, "confirmed")),
    with: { listing: true, guest: true },
  });
  const departures = await db.query.booking.findMany({
    where: and(eq(booking.checkOut, day), eq(booking.status, "confirmed")),
    with: { listing: true },
  });
  // Safety net: make sure every departure has a turnover task.
  for (const d of departures) {
    const { listing: _l, ...row } = d;
    await syncTurnoverForBooking(row);
  }
  const tasks = await db.query.turnoverTask.findMany({
    where: and(eq(turnoverTask.dueDate, day), ne(turnoverTask.status, "cancelled")),
    with: { listing: true, vendor: true },
  });
  const users = new Set([...arrivals, ...departures].map((b) => b.userId));
  let sent = 0;
  for (const uid of users) {
    const u = await db.query.user.findFirst({ where: eq(user.id, uid) });
    if (!u?.email) continue;
    const a = arrivals.filter((b) => b.userId === uid);
    const d = departures.filter((b) => b.userId === uid);
    const t = tasks.filter((x) => x.userId === uid);
    const text = [
      `Schedule for ${day}`,
      "",
      `Arrivals (${a.length}):`,
      ...a.map((b) => `- ${b.listing.name}: ${b.guest ? b.guest.firstName : b.summary || "guest"} (${b.source})`),
      "",
      `Departures (${d.length}):`,
      ...d.map((b) => `- ${b.listing.name}`),
      "",
      `Turnovers (${t.length}):`,
      ...t.map((x) => `- ${x.listing.name}: ${x.vendor ? x.vendor.name : "UNASSIGNED"}${x.nextCheckIn ? " (same-day arrival)" : ""}`),
    ].join("\n");
    const r = await sendEmail({ to: u.email, subject: `Manage Homestay: tomorrow ${day}`, html: textToHtml(text) });
    if (r.success) sent++;
  }
  return { day, arrivals: arrivals.length, departures: departures.length, digestsSent: sent };
}

export async function runDailyJobs() {
  const out: Record<string, unknown> = {};
  try {
    out.ical = await syncAllFeeds();
  } catch (e) {
    out.icalError = String(e);
  }
  try {
    out.rent = await processRentReminders();
  } catch (e) {
    out.rentError = String(e);
  }
  try {
    out.str = await sendStrDigests();
  } catch (e) {
    out.strError = String(e);
  }
  console.log("[cron]", JSON.stringify(out));
  return out;
}
