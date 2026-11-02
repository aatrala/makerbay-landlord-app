import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildIcal, classifyEvent, parseIcal } from "../src/str/ical.js";
import { call, makeListing, setupDb, signUp } from "./helpers.js";

const AIRBNB = [
  "BEGIN:VCALENDAR",
  "PRODID:-//Airbnb Inc//Hosting Calendar 0.8.8//EN",
  "VERSION:2.0",
  "BEGIN:VEVENT",
  "DTEND;VALUE=DATE:20270310",
  "DTSTART;VALUE=DATE:20270307",
  "UID:1418fb94e984-abc@airbnb.com",
  "DESCRIPTION:Reservation URL: https://www.airbnb.com/hosting/reservations/d",
  " etails/HMABCDEF\\nPhone Number (Last 4 Digits): 1234",
  "SUMMARY:Reserved",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "DTEND;VALUE=DATE:20270320",
  "DTSTART;VALUE=DATE:20270318",
  "UID:7f2a-blocked@airbnb.com",
  "SUMMARY:Airbnb (Not available)",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

const BOOKING_COM = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Booking.com//EN
BEGIN:VEVENT
UID:bdc-1
DTSTART:20270401T140000Z
DTEND:20270403T100000Z
SUMMARY:CLOSED - Not available
END:VEVENT
END:VCALENDAR`;

describe("iCal parse", () => {
  it("parses Airbnb feeds incl. folded lines and VALUE=DATE", () => {
    const ev = parseIcal(AIRBNB);
    expect(ev).toHaveLength(2);
    expect(ev[0]).toMatchObject({ uid: "1418fb94e984-abc@airbnb.com", start: "2027-03-07", end: "2027-03-10" });
    expect(ev[0].description).toContain("reservations/details/HMABCDEF");
    expect(classifyEvent(ev[0])).toBe("confirmed");
    expect(classifyEvent(ev[1])).toBe("blocked");
  });

  it("parses date-time values and Booking.com closed events", () => {
    const ev = parseIcal(BOOKING_COM);
    expect(ev[0]).toMatchObject({ start: "2027-04-01", end: "2027-04-03" });
    expect(classifyEvent(ev[0])).toBe("blocked");
  });
});

describe("iCal export", () => {
  it("builds RFC5545 output with CRLF, folding and all-day dates", () => {
    const out = buildIcal({
      calendarName: "A very long listing name ".repeat(5),
      events: [{ uid: "x@y", start: "2027-03-01", end: "2027-03-04", summary: "Reserved" }],
      now: new Date("2027-01-01T00:00:00Z"),
    });
    expect(out.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(out).toContain("DTSTART;VALUE=DATE:20270301\r\n");
    expect(out).toContain("DTEND;VALUE=DATE:20270304\r\n");
    for (const line of out.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    // Round-trip
    expect(parseIcal(out)[0]).toMatchObject({ uid: "x@y", start: "2027-03-01", end: "2027-03-04" });
  });
});

describe("iCal import + export via API", () => {
  let close: () => Promise<void>;
  beforeAll(async () => ({ close } = await setupDb()));
  afterAll(async () => close());

  it("imports a channel feed, is idempotent, cancels removed events, and exports a feed", async () => {
    const host = await signUp();
    const { listing } = await makeListing(host);
    const feed = await host.req("POST", `/api/str/listings/${listing.id}/feeds`, {
      source: "airbnb",
      url: "webcal://www.airbnb.com/calendar/ical/123.ics?s=abc",
    });
    expect(feed.status).toBe(201);
    expect(feed.json.data.url.startsWith("https://")).toBe(true);
    const feedId = feed.json.data.id;

    const imp = await host.req("POST", `/api/str/feeds/${feedId}/import`, { ics: AIRBNB });
    expect(imp.status).toBe(200);
    const again = await host.req("POST", `/api/str/feeds/${feedId}/import`, { ics: AIRBNB });
    expect(again.status).toBe(200);

    let list = await host.req("GET", `/api/str/bookings?listingId=${listing.id}`);
    expect(list.json.data).toHaveLength(2);
    const stay = list.json.data.find((b: any) => b.status === "confirmed");
    expect(stay.source).toBe("airbnb");
    expect(list.json.data.find((b: any) => b.status === "blocked")).toBeTruthy();

    // Imported stay blocks direct bookings on the same nights.
    const clash = await host.req("POST", "/api/str/bookings", {
      listingId: listing.id,
      checkIn: "2027-03-08",
      checkOut: "2027-03-12",
    });
    expect(clash.status).toBe(409);

    // Event removed from the channel -> cancelled locally.
    const onlyBlock = AIRBNB.replace(/BEGIN:VEVENT[\s\S]*?END:VEVENT\r\n/, "");
    await host.req("POST", `/api/str/feeds/${feedId}/import`, { ics: onlyBlock });
    list = await host.req("GET", `/api/str/bookings?listingId=${listing.id}`);
    expect(list.json.data).toHaveLength(1);

    // Public export by token, no guest details.
    const token = listing.icalToken;
    const ics = await call("GET", `/api/ical/${token}.ics`);
    expect(ics.status).toBe(200);
    expect(ics.text).toContain("BEGIN:VCALENDAR");
    expect(ics.text).toContain("SUMMARY:Not available");
    expect(ics.text).not.toContain("HMABCDEF");
    expect((await call("GET", `/api/ical/${"0".repeat(32)}.ics`)).status).toBe(404);
  });
});
