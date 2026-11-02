/** Parse Stripe's redirect params after confirmPayment returns to /payments. */
export function parseStripeReturn(search: string): { paymentId: string; outcome: "succeeded" | "processing" | "failed" } | null {
  const q = new URLSearchParams(search);
  const paymentId = q.get("pay");
  const status = q.get("redirect_status");
  if (!paymentId || !q.get("payment_intent") || !status) return null;
  if (status === "succeeded") return { paymentId, outcome: "succeeded" };
  if (status === "processing") return { paymentId, outcome: "processing" };
  return { paymentId, outcome: "failed" };
}

/**
 * Poll until the server (via the payment_intent.succeeded webhook) marks the payment received.
 * Returns "received", or "timeout" if it did not happen within `attempts`.
 */
export async function waitForReceived(
  check: () => Promise<string | undefined>,
  opts: { attempts?: number; delayMs?: number } = {},
): Promise<"received" | "timeout"> {
  const { attempts = 15, delayMs = 2000 } = opts;
  for (let i = 0; i < attempts; i++) {
    const status = await check().catch(() => undefined);
    if (status === "received") return "received";
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs));
  }
  return "timeout";
}
