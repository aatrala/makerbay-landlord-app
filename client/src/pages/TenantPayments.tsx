import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { StripePayForm, type PayResult } from "../components/StripePayForm";
import { parseStripeReturn, waitForReceived } from "../lib/stripe-return";
import { api } from "../lib/api";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { CreditCard, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface PaymentRecord {
  id: string;
  amount: number;
  amountPaid: number;
  dueDate: string;
  paidDate: string | null;
  status: string;
  lateFee: number;
  method: string | null;
  stripePaymentIntentId: string | null;
  stripeClientSecret: string | null;
  unit: { unitNumber: string };
}

interface StripeConfig {
  configured: boolean;
  publishableKey: string | null;
}

export function TenantPayments() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [stripeConfig, setStripeConfig] = useState<StripeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<{ paymentId: string; clientSecret: string; amountDue: number } | null>(null);
  // Per-payment UI state: waiting for the webhook, confirmed, or failed
  const [payState, setPayState] = useState<Record<string, { kind: "pending" | "paid" | "failed" | "slow"; message?: string }>>({});

  const stripePromise = useMemo(
    () => (stripeConfig?.publishableKey ? loadStripe(stripeConfig.publishableKey) : null),
    [stripeConfig?.publishableKey],
  );

  const loadPayments = () =>
    api.get<{ data: PaymentRecord[] }>("/api/tenant-portal/payments").then((res) => {
      setPayments(res.data);
      return res.data;
    });

  useEffect(() => {
    Promise.all([loadPayments(), api.get<{ data: StripeConfig }>("/api/stripe/config")])
      .then(([, configRes]) => setStripeConfig(configRes.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Returning from a redirect-based payment method (3DS, bank redirect, ...)
    const ret = parseStripeReturn(window.location.search);
    if (ret) {
      window.history.replaceState(null, "", window.location.pathname);
      if (ret.outcome === "failed") {
        setPayState((s) => ({ ...s, [ret.paymentId]: { kind: "failed", message: "Payment was not completed." } }));
      } else {
        void awaitWebhook(ret.paymentId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function awaitWebhook(paymentId: string) {
    setPayState((s) => ({ ...s, [paymentId]: { kind: "pending" } }));
    const result = await waitForReceived(async () => {
      const list = await loadPayments();
      return list.find((p) => p.id === paymentId)?.status;
    });
    setPayState((s) => ({ ...s, [paymentId]: { kind: result === "received" ? "paid" : "slow" } }));
  }

  const handlePayOnline = async (paymentId: string) => {
    if (!stripeConfig?.configured) {
      alert("Online payments are not configured yet. Please contact your landlord.");
      return;
    }
    setPayingId(paymentId);
    setPayState((s) => {
      const { [paymentId]: _, ...rest } = s;
      return rest;
    });
    try {
      const { data } = await api.post<{ data: { clientSecret: string; paymentIntentId: string; amountDue: number } }>(
        "/api/stripe/create-payment-intent",
        { paymentId },
      );
      setCheckout({ paymentId, clientSecret: data.clientSecret, amountDue: data.amountDue });
    } catch (err) {
      console.error("Payment error:", err);
      setPayState((s) => ({ ...s, [paymentId]: { kind: "failed", message: "Could not start the payment. Please try again." } }));
    } finally {
      setPayingId(null);
    }
  };

  const handleResult = (paymentId: string, r: PayResult) => {
    if (r.outcome === "failed") {
      setPayState((s) => ({ ...s, [paymentId]: { kind: "failed", message: r.message } }));
      return;
    }
    setCheckout(null);
    void awaitWebhook(paymentId);
  };

  if (loading) return <div className="text-muted">Loading payments...</div>;

  const statusColors: Record<string, "success" | "warning" | "danger" | "default"> = {
    received: "success",
    pending: "warning",
    late: "danger",
    partial: "warning",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Payments</h1>
        <p className="text-sm text-muted">Your rent payment history</p>
      </div>

      {/* Payment List */}
      <div className="space-y-3">
        {payments.length === 0 && (
          <Card className="p-8 text-center">
            <CreditCard className="mx-auto h-10 w-10 text-muted" />
            <p className="mt-3 text-sm text-muted">No payment records yet</p>
          </Card>
        )}

        {payments.map((p) => {
          const totalDue = p.amount + (p.lateFee || 0) - p.amountPaid;
          const isOverdue = p.status === "late" || (p.status === "pending" && new Date(p.dueDate) < new Date());
          const canPay = (p.status === "pending" || p.status === "late") && totalDue > 0;

          return (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-ink">${p.amount.toLocaleString()}</p>
                    {p.lateFee > 0 && (
                      <span className="text-xs text-red-500">+ ${p.lateFee} late fee</span>
                    )}
                  </div>
                  <p className="text-sm text-muted">
                    Unit #{p.unit.unitNumber} &middot; Due {new Date(p.dueDate).toLocaleDateString()}
                  </p>
                  {p.paidDate && (
                    <p className="text-xs text-green-600">
                      Paid on {new Date(p.paidDate).toLocaleDateString()} via {p.method || "manual"}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={statusColors[p.status] || "gray"}>
                    {p.status === "received" ? "Paid" : p.status === "late" ? "Overdue" : p.status}
                  </Badge>
                  {canPay && (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={payingId === p.id || !!payState[p.id] && payState[p.id].kind !== "failed" || checkout?.paymentId === p.id}
                      onClick={() => handlePayOnline(p.id)}
                    >
                      {payingId === p.id ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : payState[p.id]?.kind === "paid" ? (
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      ) : (
                        <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      {payState[p.id]?.kind === "paid" ? "Paid" : payState[p.id]?.kind === "failed" ? "Try again" : "Pay Online"}
                    </Button>
                  )}
                </div>
              </div>
              {payState[p.id]?.kind === "pending" && (
                <p className="mt-3 flex items-center text-sm text-muted">
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Payment submitted. Waiting for confirmation from Stripe...
                </p>
              )}
              {payState[p.id]?.kind === "slow" && (
                <p className="mt-3 text-sm text-yellow-700">
                  Payment submitted. Confirmation is taking longer than usual; refresh this page in a few minutes.
                </p>
              )}
              {payState[p.id]?.kind === "paid" && (
                <p className="mt-3 text-sm text-green-600">Payment received. Thank you!</p>
              )}
              {payState[p.id]?.kind === "failed" && (
                <p className="mt-3 text-sm text-red-600">{payState[p.id]?.message || "Payment failed."}</p>
              )}
              {checkout?.paymentId === p.id && stripePromise && (
                <Elements stripe={stripePromise} options={{ clientSecret: checkout.clientSecret }}>
                  <StripePayForm
                    paymentId={p.id}
                    amountDue={checkout.amountDue}
                    onResult={(r) => handleResult(p.id, r)}
                    onCancel={() => setCheckout(null)}
                  />
                </Elements>
              )}
            </Card>
          );
        })}
      </div>

      {/* Stripe Config Notice */}
      {stripeConfig && !stripeConfig.configured && (
        <Card className="border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Online Payments Not Configured</p>
              <p className="text-xs text-yellow-600">
                Your landlord hasn't set up Stripe yet. You can still pay via check, cash, or other
                methods your landlord accepts.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
