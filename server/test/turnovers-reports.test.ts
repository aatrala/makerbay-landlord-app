import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeListing, setupDb, signUp, type Client } from "./helpers.js";
import { computeListingMetrics } from "../src/str/metrics.js";

let close: () => Promise<void>;
let host: Client;
let listingId: string;
let propertyId: string;
beforeAll(async () => {
  ({ close } = await setupDb());
  host = await signUp();
  const owner = await host.req("POST", "/api/str/homeowners", { name: "Jane Owner", managementFeePct: 20 });
  expect(owner.status).toBe(201);
  const m = await makeListing(host, { homeownerId: owner.json.data.id });
  listingId = m.listing.id;
  propertyId = m.propertyId;
});
afterAll(async () => close());

describe("turnover tasks", () => {
  it("auto-creates one task due on checkout, detects same-day arrival, and assigns to a vendor", async () => {
    const b1 = await host.req("POST", "/api/str/bookings", { listingId, checkIn: "2027-06-01", checkOut: "2027-06-04" });
    expect(b1.json.data.turnoverTask).toMatchObject({ dueDate: "2027-06-04", status: "pending" });
    await host.req("POST", "/api/str/bookings", { listingId, checkIn: "2027-06-04", checkOut: "2027-06-06" });

    const tasks = await host.req("GET", "/api/str/turnovers");
    expect(tasks.json.data).toHaveLength(2);
    const first = tasks.json.data.find((t: any) => t.dueDate === "2027-06-04");
    expect(first.nextCheckIn).toBe("2027-06-04");

    const vendor = await host.req("POST", "/api/vendors", { name: "Sparkle Cleaning", trade: "cleaning" });
    expect(vendor.status).toBe(201);
    const assigned = await host.req("PUT", `/api/str/turnovers/${first.id}`, { vendorId: vendor.json.data.id, cost: 60 });
    expect(assigned.json.data.status).toBe("assigned");
    const done = await host.req("PUT", `/api/str/turnovers/${first.id}`, { status: "done" });
    expect(done.json.data.completedAt).toBeTruthy();
  });

  it("cancels the task when the booking is cancelled; blocks get no task", async () => {
    const b = await host.req("POST", "/api/str/bookings", { listingId, checkIn: "2027-06-10", checkOut: "2027-06-12" });
    await host.req("POST", `/api/str/bookings/${b.json.data.id}/cancel`);
    const blk = await host.req("POST", "/api/str/bookings", {
      listingId,
      checkIn: "2027-06-20",
      checkOut: "2027-06-22",
      status: "blocked",
    });
    expect(blk.json.data.turnoverTask).toBeFalsy();
    const tasks = await host.req("GET", "/api/str/turnovers");
    const t = tasks.json.data.find((x: any) => x.dueDate === "2027-06-12");
    expect(t?.status ?? "cancelled").toBe("cancelled");
    expect(tasks.json.data.find((x: any) => x.dueDate === "2027-06-22")).toBeFalsy();
  });
});

describe("reports", () => {
  it("computes occupancy, ADR and RevPAR with per-night attribution", () => {
    const m = computeListingMetrics(
      "l",
      [
        { listingId: "l", status: "confirmed", checkIn: "2027-01-30", checkOut: "2027-02-03", accommodationTotal: 400, cleaningFee: 50, platformFee: 30 },
        { listingId: "l", status: "blocked", checkIn: "2027-02-10", checkOut: "2027-02-12", accommodationTotal: 0, cleaningFee: 0, platformFee: 0 },
      ],
      "2027-02-01",
      "2027-03-01",
    );
    expect(m.nightsBooked).toBe(2);
    expect(m.nightsBlocked).toBe(2);
    expect(m.nightsAvailable).toBe(26);
    expect(m.accommodationRevenue).toBe(200);
    expect(m.adr).toBe(100);
    expect(m.cleaningRevenue).toBe(50);
    expect(m.platformFees).toBe(30);
  });

  it("per-listing report and owner statement: revenue minus fees and expenses", async () => {
    const r = await host.req("GET", "/api/str/reports/listings?year=2027&month=6");
    expect(r.status).toBe(200);
    const row = r.json.data.listings[0];
    // June stays: 3 nights + 2 nights at 200 = 1000 (cancelled excluded)
    expect(row.nightsBooked).toBe(5);
    expect(row.accommodationRevenue).toBe(1000);
    expect(row.adr).toBe(200);
    expect(row.nightsAvailable).toBe(28); // 30 - 2 blocked

    const exp = await host.req("POST", "/api/expenses", {
      propertyId,
      category: "repairs",
      amount: 100,
      date: "2027-06-15",
      description: "Fix tap",
    });
    expect(exp.status).toBe(201);

    const owners = await host.req("GET", "/api/str/homeowners");
    const st = await host.req("GET", `/api/str/homeowners/${owners.json.data[0].id}/statement?year=2027&month=6`);
    expect(st.status).toBe(200);
    const t = st.json.data.totals;
    expect(t.grossRevenue).toBe(1160); // 1000 + 2 cleaning fees
    expect(t.managementFee).toBe(200); // 20% of accommodation
    expect(t.expenses).toBe(100);
    expect(t.turnoverCosts).toBe(60);
    expect(t.netPayout).toBe(1160 - 200 - 100 - 60);
  });
});
