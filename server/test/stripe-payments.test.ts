import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Stripe from "stripe";
import { eq } from "drizzle-orm";

vi.mock("../src/services/stripe-payments.js", async (orig) => {
  const actual: any = await orig();
  return {
    ...actual,
    createPaymentIntent: vi.fn(async ({ paymentId }: { paymentId: string }) => ({
      paymentIntentId: `pi_test_${paymentId.slice(0, 8)}`,
      clientSecret: `pi_test_${paymentId.slice(0, 8)}_secret_x`,
    })),
    confirmPaymentStatus: vi.fn(async () => ({ status: "succeeded", paymentMethod: "pm_test_1" })),
    getPaymentMethodType: vi.fn(async () => "card"),
  };
});

import { call, makeListing, setupDb, signUp, type Client } from "./helpers";
import * as schema from "../src/db/schema.js";

const WHSEC = "whsec_test_only_not_a_real_secret";
let db: any;
let landlord: Client;
let tenantUser: Client;
let stranger: Client;
let tenantId: string;
let unitId: string;

async function userId(c: Client) {
  const r = await c.req("GET", "/api/auth/get-session");
  return r.json.user.id as string;
}

async function newPayment(over: Partial<typeof schema.payment.$inferInsert> = {}) {
  const [row] = await db
    .insert(schema.payment)
    .values({ unitId, tenantId, amount: 500, lateFee: 25, dueDate: "2026-11-01", ...over })
    .returning();
  return row;
}


async function sendWebhook(event: object) {
  const payload = JSON.stringify(event);
  const header = Stripe.webhooks.generateTestHeaderString({ payload, secret: WHSEC });
  const { app } = await import("../src/app.js");
  const res = await app.request("/api/stripe/webhook", {
    method: "POST",
    headers: { "content-type": "application/json", "stripe-signature": header },
    body: payload,
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}

function piEvent(type: string, piId: string, paymentId: string) {
  return {
    id: `evt_${Math.random().toString(36).slice(2)}`,
    object: "event",
    type,
    data: { object: { id: piId, object: "payment_intent", amount: 52500, payment_method: "pm_test_1", metadata: { rentlite_payment_id: paymentId } } },
  };
}

describe("tenant Stripe payments", () => {
  beforeAll(async () => {
    ({ db } = await setupDb());
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy_not_real";
    process.env.STRIPE_WEBHOOK_SECRET = WHSEC;
    landlord = await signUp();
    tenantUser = await signUp();
    stranger = await signUp();
    const listing = await makeListing(landlord);
    unitId = listing.unitId;
    const [t] = await db
      .insert(schema.tenant)
      .values({ userId: await userId(landlord), tenantUserId: await userId(tenantUser), firstName: "Tia", lastName: "Tenant" })
      .returning();
    tenantId = t.id;
  });
  beforeEach(() => vi.clearAllMocks());

  it("lets the tenant create an intent for their own payment (amount from DB)", async () => {
    const p = await newPayment({ amountPaid: 100 });
    const r = await tenantUser.req("POST", "/api/stripe/create-payment-intent", { paymentId: p.id });
    expect(r.status).toBe(200);
    expect(r.json.data.amountDue).toBe(425);
    expect(r.json.data.clientSecret).toContain("_secret_");
  });

  it("forbids the landlord and other users from creating an intent", async () => {
    const p = await newPayment();
    expect((await landlord.req("POST", "/api/stripe/create-payment-intent", { paymentId: p.id })).status).toBe(403);
    expect((await stranger.req("POST", "/api/stripe/create-payment-intent", { paymentId: p.id })).status).toBe(403);
  });

  it("forbids other users from /confirm-payment", async () => {
    const p = await newPayment({ stripePaymentIntentId: "pi_x" });
    expect((await stranger.req("POST", "/api/stripe/confirm-payment", { paymentId: p.id })).status).toBe(403);
    const ok = await tenantUser.req("POST", "/api/stripe/confirm-payment", { paymentId: p.id });
    expect(ok.status).toBe(200);
    expect(ok.json.data.paymentStatus).toBe("received");
  });

  it("webhook marks received with method card, idempotently", async () => {
    const p = await newPayment({ stripePaymentIntentId: "pi_ok" });
    const ev = piEvent("payment_intent.succeeded", "pi_ok", p.id);
    expect((await sendWebhook(ev)).status).toBe(200);
    let row = await db.query.payment.findFirst({ where: eq(schema.payment.id, p.id) });
    expect(row.status).toBe("received");
    expect(row.method).toBe("card");
    expect(row.amountPaid).toBe(525);
    const firstUpdated = row.updatedAt.getTime();

    // replay + late failure event must not change anything
    expect((await sendWebhook(ev)).status).toBe(200);
    expect((await sendWebhook(piEvent("payment_intent.payment_failed", "pi_ok", p.id))).status).toBe(200);
    row = await db.query.payment.findFirst({ where: eq(schema.payment.id, p.id) });
    expect(row.status).toBe("received");
    expect(row.amountPaid).toBe(525);
    expect(row.updatedAt.getTime()).toBe(firstUpdated);
  });

  it("webhook ignores a succeeded intent that is not the payment's current intent", async () => {
    const p = await newPayment({ stripePaymentIntentId: "pi_current" });
    await sendWebhook(piEvent("payment_intent.succeeded", "pi_stale", p.id));
    const row = await db.query.payment.findFirst({ where: eq(schema.payment.id, p.id) });
    expect(row.status).toBe("pending");
  });

  it("rejects unsigned webhooks", async () => {
    const r = await call("POST", "/api/stripe/webhook", { type: "payment_intent.succeeded" }, { "stripe-signature": "t=1,v1=bad" });
    expect(r.status).toBe(400);
  });
});
