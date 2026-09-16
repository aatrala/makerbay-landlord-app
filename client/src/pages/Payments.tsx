import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Label, Select } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { StatCard } from "../components/ui/StatCard";
import { formatCurrency, formatDate, capitalize } from "../lib/utils";
import { toast } from "sonner";
import {
  Plus,
  DollarSign,
  HandCoins,
  AlertTriangle,
  Clock,
  Loader2,
  X,
  CreditCard,
} from "lucide-react";

const methodOptions = [
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "zelle", label: "Zelle" },
  { value: "venmo", label: "Venmo" },
  { value: "ach", label: "ACH" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" },
];

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "received", label: "Received" },
  { value: "late", label: "Late" },
  { value: "partial", label: "Partial" },
];

const statusBadgeVariant = (status: string) => {
  if (status === "received") return "success";
  if (status === "late") return "danger";
  if (status === "pending") return "warning";
  if (status === "partial") return "outline";
  return "default" as const;
};

const emptyForm = {
  unitId: "",
  tenantId: "",
  amount: "",
  amountPaid: "",
  dueDate: "",
  method: "",
  status: "pending",
};

export function Payments() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading, error } = useQuery<any>({
    queryKey: ["payments"],
    queryFn: () => api.get("/api/payments"),
  });

  const { data: summaryData } = useQuery<any>({
    queryKey: ["payments-summary"],
    queryFn: () => api.get("/api/payments/summary"),
  });

  // Fetch units and tenants for select dropdowns
  const { data: unitsData } = useQuery<any>({
    queryKey: ["units-select"],
    queryFn: () => api.get("/api/units"),
  });

  const { data: tenantsData } = useQuery<any>({
    queryKey: ["tenants-select"],
    queryFn: () => api.get("/api/tenants"),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post("/api/payments", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payments-summary"] });
      setShowModal(false);
      setForm(emptyForm);
      toast.success("Payment recorded!");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to record payment"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      unitId: form.unitId,
      tenantId: form.tenantId,
      amount: Number(form.amount),
      amountPaid: Number(form.amountPaid) || 0,
      dueDate: form.dueDate,
      method: form.method || undefined,
      status: form.status,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-signal" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <AlertTriangle className="h-8 w-8 text-danger" />
        <p className="text-sm text-muted">Failed to load payments.</p>
      </div>
    );
  }

  const payments: any[] = data?.data ?? [];
  const summary = summaryData?.data;
  const units: any[] = unitsData?.data ?? [];
  const tenants: any[] = tenantsData?.data ?? [];

  const unitOptions = units.map((u: any) => ({ value: u.id, label: `Unit ${u.unitNumber}` }));
  const tenantOptions = tenants.map((t: any) => ({ value: t.id, label: `${t.firstName} ${t.lastName}` }));

  return (
    <div className="space-y-6 animate-rise">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Payments</h1>
          <p className="mt-1 text-sm text-muted">Track rent payments and collections</p>
        </div>
        <Button variant="signal" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          Record Payment
        </Button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Expected" value={formatCurrency(summary.totalExpected ?? 0)} icon={<DollarSign className="h-5 w-5" />} color="deep" />
          <StatCard label="Collected" value={formatCurrency(summary.totalCollected ?? 0)} icon={<HandCoins className="h-5 w-5" />} color="success" />
          <StatCard label="Outstanding" value={formatCurrency(summary.totalOutstanding ?? 0)} icon={<AlertTriangle className="h-5 w-5" />} color="signal" />
          <StatCard label="Collection Rate" value={`${summary.collectionRate ?? 0}%`} icon={<Clock className="h-5 w-5" />} color="violet" />
        </div>
      )}

      {/* Empty */}
      {payments.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-16">
          <CreditCard className="mb-4 h-12 w-12 text-muted/40" />
          <h3 className="text-lg font-bold text-ink">No payments recorded</h3>
          <p className="mt-1 text-sm text-muted">Record your first rent payment to start tracking.</p>
          <Button variant="signal" className="mt-4" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            Record Payment
          </Button>
        </Card>
      )}

      {/* Table */}
      {payments.length > 0 && (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas/60">
                  <th className="px-5 py-3 font-semibold text-muted">Unit</th>
                  <th className="px-5 py-3 font-semibold text-muted">Tenant</th>
                  <th className="px-5 py-3 font-semibold text-muted">Due</th>
                  <th className="px-5 py-3 font-semibold text-muted">Paid</th>
                  <th className="px-5 py-3 font-semibold text-muted">Due Date</th>
                  <th className="px-5 py-3 font-semibold text-muted">Status</th>
                  <th className="px-5 py-3 font-semibold text-muted">Method</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p: any) => (
                  <tr key={p.id} className="border-b border-line last:border-0 transition hover:bg-canvas/40">
                    <td className="px-5 py-3.5 font-semibold text-ink">
                      {p.unit?.unitNumber ? `Unit ${p.unit.unitNumber}` : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {p.tenant ? `${p.tenant.firstName} ${p.tenant.lastName}` : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-ink">{formatCurrency(p.amount)}</td>
                    <td className="px-5 py-3.5 font-semibold text-success">{formatCurrency(p.amountPaid)}</td>
                    <td className="px-5 py-3.5 text-muted">{formatDate(p.dueDate)}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={statusBadgeVariant(p.status) as any}>{capitalize(p.status)}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-muted">{p.method ? capitalize(p.method) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="animate-rise w-full max-w-lg rounded-[18px] border border-line bg-surface p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Record Payment</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1 text-muted transition hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="unitId">Unit</Label>
                  <Select
                    id="unitId"
                    options={unitOptions}
                    placeholder="Select unit"
                    value={form.unitId}
                    onChange={(e) => setForm({ ...form, unitId: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tenantId">Tenant</Label>
                  <Select
                    id="tenantId"
                    options={tenantOptions}
                    placeholder="Select tenant"
                    value={form.tenantId}
                    onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="amount">Amount Due</Label>
                  <Input id="amount" type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="amountPaid">Amount Paid</Label>
                  <Input id="amountPaid" type="number" min={0} step="0.01" value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input id="dueDate" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="method">Method</Label>
                  <Select
                    id="method"
                    options={methodOptions}
                    placeholder="Select method"
                    value={form.method}
                    onChange={(e) => setForm({ ...form, method: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  id="status"
                  options={statusOptions}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="signal" loading={createMutation.isPending}>Record Payment</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
