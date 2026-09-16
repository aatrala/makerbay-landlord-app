import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { CreditCard, Wrench, Calendar, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface TenantProfile {
  tenant: { id: string; firstName: string; lastName: string; email: string };
  activeLease: {
    id: string;
    unitNumber: string;
    propertyName: string;
    propertyAddress: string;
    rentAmount: number;
    endDate: string;
  } | null;
}

interface DuePayment {
  id: string;
  amount: number;
  amountPaid: number;
  dueDate: string;
  status: string;
  lateFee: number;
  unit: { unitNumber: string };
}

export function TenantDashboard() {
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [duePayment, setDuePayment] = useState<DuePayment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ data: TenantProfile }>("/api/tenant-portal/profile"),
      api.get<{ data: DuePayment | null }>("/api/tenant-portal/payments/due"),
    ])
      .then(([profileRes, paymentRes]) => {
        setProfile(profileRes.data);
        setDuePayment(paymentRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted">Loading...</div>;

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg">
        <Card className="p-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-signal" />
          <h2 className="mt-4 text-lg font-bold text-ink">Tenant Portal Not Activated</h2>
          <p className="mt-2 text-sm text-muted">
            Your landlord hasn't linked your tenant account yet. Please ask your landlord to activate
            your tenant portal from the Tenants page.
          </p>
        </Card>
      </div>
    );
  }

  const totalDue = duePayment ? duePayment.amount + (duePayment.lateFee || 0) - duePayment.amountPaid : 0;
  const isOverdue = duePayment && new Date(duePayment.dueDate) < new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">
          Welcome, {profile.tenant.firstName}
        </h1>
        <p className="text-sm text-muted">Your tenant portal at a glance</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal/10">
              <CreditCard className="h-5 w-5 text-signal" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted">Next Payment</p>
              <p className="text-lg font-bold text-ink">
                {duePayment ? `$${totalDue.toLocaleString()}` : "All paid"}
              </p>
            </div>
          </div>
          {duePayment && (
            <div className="mt-3 flex items-center gap-2">
              {isOverdue ? (
                <Badge variant="danger">Overdue</Badge>
              ) : (
                <Badge variant="warning">Due {new Date(duePayment.dueDate).toLocaleDateString()}</Badge>
              )}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-deep/10">
              <Calendar className="h-5 w-5 text-deep" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted">Lease Expires</p>
              <p className="text-lg font-bold text-ink">
                {profile.activeLease
                  ? new Date(profile.activeLease.endDate).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted">Monthly Rent</p>
              <p className="text-lg font-bold text-ink">
                ${profile.activeLease?.rentAmount.toLocaleString() || "0"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Property Info */}
      {profile.activeLease && (
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-ink">Your Home</h3>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Property</span>
              <span className="font-medium text-ink">{profile.activeLease.propertyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Unit</span>
              <span className="font-medium text-ink">#{profile.activeLease.unitNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Address</span>
              <span className="font-medium text-ink">{profile.activeLease.propertyAddress}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href="/tenant/payments"
          className="flex items-center gap-4 rounded-xl border border-line bg-surface p-5 transition hover:border-signal/30 hover:shadow-sm"
        >
          <CreditCard className="h-8 w-8 text-signal" />
          <div>
            <p className="font-semibold text-ink">Pay Rent</p>
            <p className="text-xs text-muted">Make a payment online</p>
          </div>
        </a>
        <a
          href="/tenant/maintenance"
          className="flex items-center gap-4 rounded-xl border border-line bg-surface p-5 transition hover:border-signal/30 hover:shadow-sm"
        >
          <Wrench className="h-8 w-8 text-deep" />
          <div>
            <p className="font-semibold text-ink">Request Repair</p>
            <p className="text-xs text-muted">Submit a maintenance request</p>
          </div>
        </a>
      </div>
    </div>
  );
}
