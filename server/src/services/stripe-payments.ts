import Stripe from "stripe";

let stripeClient: Stripe | null = null;

function getStripeClient(): Stripe | null {
  if (stripeClient) return stripeClient;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  stripeClient = new Stripe(secretKey);
  return stripeClient;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/**
 * Create a Stripe PaymentIntent for a rent payment.
 * Returns the client_secret for the frontend to use with Stripe Elements.
 */
export async function createPaymentIntent(params: {
  amount: number;
  currency?: string;
  paymentId: string;
  metadata?: Record<string, string>;
}): Promise<{ paymentIntentId: string; clientSecret: string } | null> {
  const stripe = getStripeClient();
  if (!stripe) return null;

  // Stripe amounts are in cents
  const amountInCents = Math.round(params.amount * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: params.currency || "usd",
    automatic_payment_methods: { enabled: true },
    metadata: {
      rentlite_payment_id: params.paymentId,
      ...params.metadata,
    },
  });

  return {
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret!,
  };
}

/**
 * Confirm a payment intent status after the tenant completes payment.
 */
export async function confirmPaymentStatus(
  paymentIntentId: string,
): Promise<{ status: string; paymentMethod?: string } | null> {
  const stripe = getStripeClient();
  if (!stripe) return null;

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  return {
    status: paymentIntent.status,
    paymentMethod: paymentIntent.payment_method
      ? typeof paymentIntent.payment_method === "string"
        ? paymentIntent.payment_method
        : paymentIntent.payment_method.id
      : undefined,
  };
}

/**
 * Construct a Stripe webhook event for signature verification.
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
): Stripe.Event | null {
  const stripe = getStripeClient();
  if (!stripe) return null;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return null;

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Get the publishable key for the frontend.
 */
export function getPublishableKey(): string | null {
  return process.env.STRIPE_PUBLISHABLE_KEY || null;
}
