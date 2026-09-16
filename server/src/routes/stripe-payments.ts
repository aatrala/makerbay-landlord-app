import { Router, type Request, type Response } from "express";
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

const router = Router();

// GET /api/stripe/config — get publishable key for frontend
router.get("/config", (_req: Request, res: Response) => {
  const publishableKey = getPublishableKey();
  if (!publishableKey) {
    return res.json({
      data: {
        configured: false,
        publishableKey: null,
        message: "Stripe is not configured. Set STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY.",
      },
    });
  }
  res.json({ data: { configured: true, publishableKey } });
});

// POST /api/stripe/create-payment-intent — landlord creates intent for tenant payment
router.post("/create-payment-intent", authMiddleware, async (req: Request, res: Response) => {
  if (!isStripeConfigured()) {
    return res.status(400).json({
      message: "Stripe is not configured",
      code: "STRIPE_NOT_CONFIGURED",
    });
  }

  const userId = (req as any).userId as string;

  const schema = z.object({
    paymentId: z.string().uuid(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Validation error",
      code: "VALIDATION",
      details: parsed.error.flatten(),
    });
  }

  try {
    // Verify the payment belongs to the landlord's property
    const paymentRecord = await db.query.payment.findFirst({
      where: eq(payment.id, parsed.data.paymentId),
      with: { unit: true },
    });

    if (!paymentRecord) {
      return res.status(404).json({ message: "Payment not found", code: "NOT_FOUND" });
    }

    // Verify ownership
    const prop = await db.query.property.findFirst({
      where: eq(property.id, paymentRecord.unit.propertyId),
    });
    if (!prop || prop.userId !== userId) {
      return res.status(403).json({ message: "Not authorized", code: "FORBIDDEN" });
    }

    // Calculate total due (rent + late fee)
    const totalDue = paymentRecord.amount + (paymentRecord.lateFee || 0);
    const amountRemaining = totalDue - (paymentRecord.amountPaid || 0);

    if (amountRemaining <= 0) {
      return res.status(400).json({
        message: "Payment already settled",
        code: "ALREADY_PAID",
      });
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
      return res.status(500).json({
        message: "Failed to create payment intent",
        code: "PAYMENT_INTENT_FAILED",
      });
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

    res.json({
      data: {
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
        amountDue: amountRemaining,
      },
    });
  } catch (error) {
    console.error("[Stripe] Create payment intent error:", error);
    res.status(500).json({
      message: "Failed to create payment intent",
      code: "PAYMENT_ERROR",
    });
  }
});

// POST /api/stripe/webhook — Stripe webhook handler (no auth middleware, uses signature)
router.post("/webhook", async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  if (!sig) {
    return res.status(400).json({ message: "Missing stripe-signature", code: "NO_SIGNATURE" });
  }

  const event = constructWebhookEvent(JSON.stringify(req.body), sig);
  if (!event) {
    return res.status(400).json({ message: "Webhook verification failed", code: "WEBHOOK_INVALID" });
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

    res.json({ received: true });
  } catch (error) {
    console.error("[Stripe] Webhook error:", error);
    res.status(500).json({ message: "Webhook processing failed", code: "WEBHOOK_ERROR" });
  }
});

// POST /api/stripe/confirm-payment — manually confirm a payment status
router.post("/confirm-payment", authMiddleware, async (req: Request, res: Response) => {
  const schema = z.object({ paymentId: z.string().uuid() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation error", code: "VALIDATION" });
  }

  const paymentRecord = await db.query.payment.findFirst({
    where: eq(payment.id, parsed.data.paymentId),
  });

  if (!paymentRecord?.stripePaymentIntentId) {
    return res.status(404).json({ message: "No Stripe payment found", code: "NOT_FOUND" });
  }

  const result = await confirmPaymentStatus(paymentRecord.stripePaymentIntentId);
  if (!result) {
    return res.status(500).json({ message: "Stripe not configured", code: "NOT_CONFIGURED" });
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

  res.json({ data: result });
});

export { router as stripeRouter };
