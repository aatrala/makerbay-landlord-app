import { Hono } from "hono";
import type { AppEnv } from "../env.js";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { payment, property, unit, lease, tenant as tenantTable } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";
import {
  createPaymentIntent,
  confirmPaymentStatus,
  isStripeConfigured,
  getPublishableKey,
  constructWebhookEvent,
} from "../services/stripe-payments.js";

const router = new Hono<AppEnv>();

// GET /api/stripe/config — get publishable key for frontend
router.get("/config", (c) => {
  const publishableKey = getPublishableKey();
  if (!publishableKey) {
    return c.json({
      data: {
        configured: false,
        publishableKey: null,
        message: "Stripe is not configured. Set STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY.",
      },
    });
  }
  return c.json({ data: { configured: true, publishableKey } });
});

// POST /api/stripe/create-payment-intent — landlord creates intent for tenant payment
router.post("/create-payment-intent", authMiddleware, async (c) => {
  if (!isStripeConfigured()) {
    return c.json({
      message: "Stripe is not configured",
      code: "STRIPE_NOT_CONFIGURED",
    }, 400);
  }

  const userId = c.get("userId");

  const schema = z.object({
    paymentId: z.string().uuid(),
  });

  const parsed = schema.safeParse(c.get("body"));
  if (!parsed.success) {
    return c.json({
      message: "Validation error",
      code: "VALIDATION",
      details: parsed.error.flatten(),
    }, 400);
  }

  try {
    // Verify the payment belongs to the landlord's property
    const paymentRecord = await db.query.payment.findFirst({
      where: eq(payment.id, parsed.data.paymentId),
      with: { unit: true },
    });

    if (!paymentRecord) {
      return c.json({ message: "Payment not found", code: "NOT_FOUND" }, 404);
    }

    // Verify ownership
    const prop = await db.query.property.findFirst({
      where: eq(property.id, paymentRecord.unit.propertyId),
    });
    if (!prop || prop.userId !== userId) {
      return c.json({ message: "Not authorized", code: "FORBIDDEN" }, 403);
    }

    // Calculate total due (rent + late fee)
    const totalDue = paymentRecord.amount + (paymentRecord.lateFee || 0);
    const amountRemaining = totalDue - (paymentRecord.amountPaid || 0);

    if (amountRemaining <= 0) {
      return c.json({
        message: "Payment already settled",
        code: "ALREADY_PAID",
      }, 400);
    }

    // Create Stripe PaymentIntent
    const result = await createPaymentIntent({
      amount: amountRemaining,
      paymentId: paymentRecord.id,
      metadata: {
        unit_id: paymentRecord.unitId,
        tenant_id: paymentRecord.tenantId,
        landlord_id: userId,
      },
    });

    if (!result) {
      return c.json({
        message: "Failed to create payment intent",
        code: "PAYMENT_INTENT_FAILED",
      }, 500);
    }

    // Save Stripe references to payment record
    await db
      .update(payment)
      .set({
        stripePaymentIntentId: result.paymentIntentId,
        stripeClientSecret: result.clientSecret,
        updatedAt: new Date(),
      })
      .where(eq(payment.id, parsed.data.paymentId));

    return c.json({
      data: {
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
        amountDue: amountRemaining,
      },
    });
  } catch (error) {
    console.error("[Stripe] Create payment intent error:", error);
    return c.json({
      message: "Failed to create payment intent",
      code: "PAYMENT_ERROR",
    }, 500);
  }
});

// POST /api/stripe/webhook — Stripe webhook handler (no auth middleware, uses signature)
router.post("/webhook", async (c) => {
  const sig = c.req.header("stripe-signature") as string;
  if (!sig) {
    return c.json({ message: "Missing stripe-signature", code: "NO_SIGNATURE" }, 400);
  }

  const event = await constructWebhookEvent(c.get("rawBody") ?? "", sig);
  if (!event) {
    return c.json({ message: "Webhook verification failed", code: "WEBHOOK_INVALID" }, 400);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as any;
        const paymentId = paymentIntent.metadata?.rentlite_payment_id;
        if (paymentId) {
          await db
            .update(payment)
            .set({
              status: "received",
              amountPaid: paymentIntent.amount / 100,
              paidDate: new Date().toISOString().split("T")[0],
              method: "ach",
              stripePaymentMethod: paymentIntent.payment_method || null,
              updatedAt: new Date(),
            })
            .where(eq(payment.id, paymentId));
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as any;
        const paymentId = paymentIntent.metadata?.rentlite_payment_id;
        if (paymentId) {
          await db
            .update(payment)
            .set({
              status: "pending",
              updatedAt: new Date(),
            })
            .where(eq(payment.id, paymentId));
        }
        break;
      }
    }

    return c.json({ received: true });
  } catch (error) {
    console.error("[Stripe] Webhook error:", error);
    return c.json({ message: "Webhook processing failed", code: "WEBHOOK_ERROR" }, 500);
  }
});

// POST /api/stripe/confirm-payment — manually confirm a payment status
router.post("/confirm-payment", authMiddleware, async (c) => {
  const schema = z.object({ paymentId: z.string().uuid() });
  const parsed = schema.safeParse(c.get("body"));
  if (!parsed.success) {
    return c.json({ message: "Validation error", code: "VALIDATION" }, 400);
  }

  const paymentRecord = await db.query.payment.findFirst({
    where: eq(payment.id, parsed.data.paymentId),
  });

  if (!paymentRecord?.stripePaymentIntentId) {
    return c.json({ message: "No Stripe payment found", code: "NOT_FOUND" }, 404);
  }

  const result = await confirmPaymentStatus(paymentRecord.stripePaymentIntentId);
  if (!result) {
    return c.json({ message: "Stripe not configured", code: "NOT_CONFIGURED" }, 500);
  }

  // Update payment if succeeded
  if (result.status === "succeeded") {
    await db
      .update(payment)
      .set({
        status: "received",
        amountPaid: paymentRecord.amount + (paymentRecord.lateFee || 0),
        paidDate: new Date().toISOString().split("T")[0],
        stripePaymentMethod: result.paymentMethod || null,
        updatedAt: new Date(),
      })
      .where(eq(payment.id, parsed.data.paymentId));
  }

  return c.json({ data: result });
});

export { router as stripeRouter };
