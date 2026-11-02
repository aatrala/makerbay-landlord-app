import { useState, type FormEvent } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Button } from "./ui/Button";
import { Loader2 } from "lucide-react";

export type PayResult = { outcome: "succeeded" | "processing" } | { outcome: "failed"; message: string };

export function StripePayForm({
  paymentId,
  amountDue,
  onResult,
  onCancel,
}: {
  paymentId: string;
  amountDue: number;
  onResult: (r: PayResult) => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    const returnUrl = `${window.location.origin}/payments?pay=${encodeURIComponent(paymentId)}`;
    const { error: err, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });
    setSubmitting(false);
    if (err) {
      // Validation errors stay in the form; card declines etc. are reported too.
      setError(err.message || "Payment failed");
      if (err.type !== "validation_error") onResult({ outcome: "failed", message: err.message || "Payment failed" });
      return;
    }
    if (paymentIntent?.status === "succeeded") onResult({ outcome: "succeeded" });
    else if (paymentIntent?.status === "processing") onResult({ outcome: "processing" });
    else onResult({ outcome: "failed", message: `Payment status: ${paymentIntent?.status ?? "unknown"}` });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm" disabled={!stripe || submitting}>
          {submitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          Pay ${amountDue.toFixed(2)}
        </Button>
        <Button type="button" variant="secondary" size="sm" disabled={submitting} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
