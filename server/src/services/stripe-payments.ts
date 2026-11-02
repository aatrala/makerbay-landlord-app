import Stripe from "stripe";

let stripeClient: Stripe | null = null;

function getStripeClient(): Stripe | null {
  if (stripeClient) return stripeClient;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  stripeClient = new Stripe(secretKey, { httpClient: Stripe.createFetchHttpClient() });
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
    currency: params.currency || process.env.STRIPE_CURRENCY || "usd",
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
export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
): Promise<Stripe.Event | null> {
  const stripe = getStripeClient();
  if (!stripe) return null;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return null;

  // Async + SubtleCrypto works on Workers (no Node crypto needed).
  try {
    return await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch {
    return null;
  }
}

/**
 * Get the publishable key for the frontend.
 */
export function getPublishableKey(): string | null {
  return process.env.STRIPE_PUBLISHABLE_KEY || null;
}

/** Map a Stripe payment method type to our payment_method enum. */
export function mapStripeMethodType(type: string | null | undefined):
  "card" | "ach" | "bank_transfer" | "other" {
  switch (type) {
    case "card":
    case "link":
    case "apple_pay":
    case "google_pay":
      return "card";
    case "us_bank_account":
      return "ach";
    case "au_becs_debit":
    case "sepa_debit":
    case "bacs_debit":
    case "acss_debit":
    case "customer_balance":
      return "bank_transfer";
    default:
      return "other";
  }
}

/**
 * Resolve the payment method type ("card", "us_bank_account", ...) for a PaymentIntent.
 * Uses the expanded object if present, otherwise retrieves it from Stripe.
 */
export async function getPaymentMethodType(
  pm: string | { type?: string } | null | undefined,
): Promise<string | null> {
  if (!pm) return null;
  if (typeof pm !== "string") return pm.type ?? null;
  const stripe = getStripeClient();
  if (!stripe) return null;
  try {
    const obj = await stripe.paymentMethods.retrieve(pm);
    return obj.type;
  } catch {
    return null;
  }
}
