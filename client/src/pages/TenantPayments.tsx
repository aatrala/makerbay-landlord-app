import { useEffect, useState } from "react";
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
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<{ data: PaymentRecord[] }>("/api/tenant-portal/payments"),
      api.get<{ data: StripeConfig }>("/api/stripe/config"),
    ])
      .then(([paymentsRes, configRes]) => {
        setPayments(paymentsRes.data);
        setStripeConfig(configRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePayOnline = async (paymentId: string) => {
    if (!stripeConfig?.configured) {
      alert("Online payments are not configured yet. Please contact your landlord.");
      return;
    }

    setPayingId(paymentId);
    try {
      // Create Stripe PaymentIntent
      const { data } = await api.post<{ data: { clientSecret: string; paymentIntentId: string; amountDue: number } }>(
        "/api/stripe/create-payment-intent",
        { paymentId },
      );

      // In a full implementation, we'd use @stripe/react-stripe-js Elements here.
      // For now, redirect to Stripe Checkout or show a payment form.
      // This is a placeholder that shows the payment flow structure.
      const confirmed = window.confirm(
        `Pay $${data.amountDue.toFixed(2)} online via Stripe?\n\n` +
        `In production, this would open a secure Stripe payment form.\n` +
        `Payment Intent: ${data.paymentIntentId}`,
      );

      if (confirmed) {
        // Confirm payment status
        await api.post("/api/stripe/confirm-payment", { paymentId });
        setPaymentSuccess(paymentId);

        // Refresh payments
        const res = await api.get<{ data: PaymentRecord[] }>("/api/tenant-portal/payments");
        setPayments(res.data);
      }
    } catch (err) {
      console.error("Payment error:", err);
      alert("Payment failed. Please try again.");
    } finally {
      setPayingId(null);
    }
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
                      disabled={payingId === p.id || paymentSuccess === p.id}
                      onClick={() => handlePayOnline(p.id)}
                    >
                      {payingId === p.id ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : paymentSuccess === p.id ? (
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      ) : (
                        <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      {paymentSuccess === p.id ? "Paid" : "Pay Online"}
                    </Button>
                  )}
                </div>
              </div>
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
