import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeListing, setupDb, signUp, type Client } from "./helpers.js";
import { rangesOverlap, nightsBetween } from "../src/str/dates.js";

let close: () => Promise<void>;
let host: Client;
let listingId: string;
beforeAll(async () => {
  ({ close } = await setupDb());
  host = await signUp();
  listingId = (await makeListing(host)).listing.id;
});
afterAll(async () => close());

describe("date ranges", () => {
  it("treats stays as half-open [checkIn, checkOut)", () => {
    expect(rangesOverlap("2027-03-01", "2027-03-05", "2027-03-05", "2027-03-07")).toBe(false);
    expect(rangesOverlap("2027-03-01", "2027-03-05", "2027-03-04", "2027-03-07")).toBe(true);
    expect(rangesOverlap("2027-03-02", "2027-03-03", "2027-03-01", "2027-03-10")).toBe(true);
    expect(nightsBetween("2027-02-27", "2027-03-02")).toBe(3);
  });
});

describe("booking conflicts", () => {
  let firstId: string;

  it("creates a booking with totals derived from the listing", async () => {
    const r = await host.req("POST", "/api/str/bookings", { listingId, checkIn: "2027-03-01", checkOut: "2027-03-05" });
    expect(r.status).toBe(201);
    expect(r.json.data.accommodationTotal).toBe(800);
    expect(r.json.data.cleaningFee).toBe(80);
    firstId = r.json.data.id;
  });

  it("rejects overlapping bookings with 409 and lists the conflict", async () => {
    const r = await host.req("POST", "/api/str/bookings", { listingId, checkIn: "2027-03-04", checkOut: "2027-03-08" });
    expect(r.status).toBe(409);
    expect(r.json.code).toBe("CONFLICT");
    expect(r.json.conflicts.map((c: any) => c.id)).toContain(firstId);
  });

  it("allows back-to-back stays (checkout day = next check-in)", async () => {
    const r = await host.req("POST", "/api/str/bookings", { listingId, checkIn: "2027-03-05", checkOut: "2027-03-08" });
    expect(r.status).toBe(201);
  });

  it("blocks conflict with owner blocks too, and reports availability", async () => {
    const b = await host.req("POST", "/api/str/bookings", {
      listingId,
      checkIn: "2027-03-20",
      checkOut: "2027-03-21",
      status: "blocked",
    });
    expect(b.status).toBe(201);
    const a = await host.req("POST", "/api/str/bookings/check-availability", {
      listingId,
      checkIn: "2027-03-19",
      checkOut: "2027-03-22",
    });
    expect(a.json.data.available).toBe(false);
    const free = await host.req("POST", "/api/str/bookings/check-availability", {
      listingId,
      checkIn: "2027-03-10",
      checkOut: "2027-03-12",
    });
    expect(free.json.data.available).toBe(true);
  });

  it("enforces minimum stay unless overridden", async () => {
    const r = await host.req("POST", "/api/str/bookings", { listingId, checkIn: "2027-04-01", checkOut: "2027-04-02" });
    expect(r.status).toBe(400);
    expect(r.json.code).toBe("MIN_STAY");
    const ok = await host.req("POST", "/api/str/bookings", {
      listingId,
      checkIn: "2027-04-01",
      checkOut: "2027-04-02",
      allowShortStay: true,
    });
    expect(ok.status).toBe(201);
  });

  it("frees dates after cancel and checks conflicts on update", async () => {
    expect((await host.req("POST", `/api/str/bookings/${firstId}/cancel`)).status).toBe(200);
    const r = await host.req("POST", "/api/str/bookings", { listingId, checkIn: "2027-03-02", checkOut: "2027-03-04" });
    expect(r.status).toBe(201);
    const moved = await host.req("PUT", `/api/str/bookings/${r.json.data.id}`, {
      checkIn: "2027-03-06",
      checkOut: "2027-03-07",
    });
    expect(moved.status).toBe(409);
  });

  it("does not leak another host's listing", async () => {
    const other = await signUp();
    const r = await other.req("POST", "/api/str/bookings", { listingId, checkIn: "2027-05-01", checkOut: "2027-05-05" });
    expect(r.status).toBe(404);
  });
});
