import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { FileText, Calendar, DollarSign, Home, AlertTriangle } from "lucide-react";

interface LeaseData {
  id: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  securityDeposit: number;
  terms: string | null;
  status: string;
  unit: {
    unitNumber: string;
    property: {
      name: string;
      address: string;
      city: string;
      state: string;
      zip: string;
    };
  };
  tenant: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}

export function TenantLease() {
  const [lease, setLease] = useState<LeaseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: LeaseData | null }>("/api/tenant-portal/lease")
      .then((res) => setLease(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted">Loading...</div>;

  if (!lease) {
    return (
      <div className="mx-auto max-w-lg">
        <Card className="p-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-signal" />
          <h2 className="mt-4 text-lg font-bold text-ink">No Active Lease</h2>
          <p className="mt-2 text-sm text-muted">
            There's no active lease on your account. Please contact your landlord for more
            information.
          </p>
        </Card>
      </div>
    );
  }

  const isExpiringSoon =
    lease.endDate &&
    new Date(lease.endDate) < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  const daysUntilExpiry = lease.endDate
    ? Math.ceil((new Date(lease.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">My Lease</h1>
        <p className="text-sm text-muted">Your current lease agreement details</p>
      </div>

      {/* Lease Status Banner */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-deep/10">
              <FileText className="h-6 w-6 text-deep" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-ink">Lease Agreement</h3>
              <p className="text-sm text-muted">
                {lease.unit.property.name} &middot; Unit #{lease.unit.unitNumber}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="success">Active</Badge>
            {isExpiringSoon && (
              <Badge variant="warning">Expires in {daysUntilExpiry} days</Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Key Details */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal/10">
              <DollarSign className="h-5 w-5 text-signal" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted">Monthly Rent</p>
              <p className="text-lg font-bold text-ink">${lease.rentAmount.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted">Security Deposit</p>
              <p className="text-lg font-bold text-ink">
                ${lease.securityDeposit.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted">Lease Start</p>
              <p className="text-lg font-bold text-ink">
                {new Date(lease.startDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted">Lease End</p>
              <p className="text-lg font-bold text-ink">
                {new Date(lease.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Property Address */}
      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-ink">Property Address</h3>
        <div className="flex items-start gap-3">
          <Home className="mt-0.5 h-5 w-5 text-muted" />
          <div className="text-sm">
            <p className="font-medium text-ink">{lease.unit.property.name}</p>
            <p className="text-muted">
              {lease.unit.property.address}
              <br />
              {lease.unit.property.city}, {lease.unit.property.state} {lease.unit.property.zip}
            </p>
          </div>
        </div>
      </Card>

      {/* Tenant Info */}
      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-ink">Tenant Information</h3>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between">
            <span className="text-muted">Name</span>
            <span className="font-medium text-ink">
              {lease.tenant.firstName} {lease.tenant.lastName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Email</span>
            <span className="font-medium text-ink">{lease.tenant.email}</span>
          </div>
          {lease.tenant.phone && (
            <div className="flex justify-between">
              <span className="text-muted">Phone</span>
              <span className="font-medium text-ink">{lease.tenant.phone}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Lease Terms */}
      {lease.terms && (
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-ink">Lease Terms & Conditions</h3>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
            {lease.terms}
          </div>
        </Card>
      )}
    </div>
  );
}
