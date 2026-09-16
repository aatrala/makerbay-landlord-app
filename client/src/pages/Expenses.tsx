import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Label, Select } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { formatCurrency, formatDate, capitalize } from "../lib/utils";
import { toast } from "sonner";
import {
  Plus,
  Receipt,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  Filter,
} from "lucide-react";

const categories = [
  { value: "advertising", label: "Advertising" },
  { value: "auto_travel", label: "Auto & Travel" },
  { value: "cleaning", label: "Cleaning" },
  { value: "insurance", label: "Insurance" },
  { value: "legal_professional", label: "Legal & Professional" },
  { value: "management", label: "Management" },
  { value: "mortgage_interest", label: "Mortgage Interest" },
  { value: "other_interest", label: "Other Interest" },
  { value: "repairs", label: "Repairs" },
  { value: "supplies", label: "Supplies" },
  { value: "taxes", label: "Taxes" },
  { value: "utilities", label: "Utilities" },
  { value: "depreciation", label: "Depreciation" },
  { value: "other", label: "Other" },
];

const categoryVariant = (cat: string) => {
  if (["repairs", "cleaning", "supplies"].includes(cat)) return "warning";
  if (["insurance", "taxes", "mortgage_interest"].includes(cat)) return "signal";
  if (["legal_professional", "management"].includes(cat)) return "outline";
  return "default" as const;
};

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const emptyForm = {
  propertyId: "",
  category: "repairs",
  description: "",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  vendor: "",
  isRecurring: false,
};

export function Expenses() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // Filters
  const [filterProperty, setFilterProperty] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterYear, setFilterYear] = useState(String(currentYear));
  const [filterMonth, setFilterMonth] = useState("");

  const queryParams: Record<string, string | number | undefined> = {};
  if (filterProperty) queryParams.propertyId = filterProperty;
  if (filterCategory) queryParams.category = filterCategory;
  if (filterYear) queryParams.year = filterYear;
  if (filterMonth) queryParams.month = filterMonth;

  const { data, isLoading, error } = useQuery<any>({
    queryKey: ["expenses", queryParams],
    queryFn: () => api.get("/api/expenses", queryParams),
  });

  const { data: propertiesData } = useQuery<any>({
    queryKey: ["properties-select"],
    queryFn: () => api.get("/api/properties"),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post("/api/expenses", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setShowModal(false);
      setForm(emptyForm);
      toast.success("Expense added!");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to add expense"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense deleted.");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete expense"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      amount: Number(form.amount),
      isRecurring: form.isRecurring,
      vendor: form.vendor || undefined,
    });
  };

  const handleDelete = (id: string, desc: string) => {
    if (window.confirm(`Delete expense "${desc}"?`)) {
      deleteMutation.mutate(id);
    }
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
        <p className="text-sm text-muted">Failed to load expenses.</p>
      </div>
    );
  }

  const expenses: any[] = data?.data ?? [];
  const properties: any[] = propertiesData?.data ?? [];
  const propertyOptions = [{ value: "", label: "All Properties" }, ...properties.map((p: any) => ({ value: p.id, label: p.name }))];
  const categoryFilterOptions = [{ value: "", label: "All Categories" }, ...categories];

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = String(currentYear - i);
    return { value: y, label: y };
  });

  const monthOptions = [
    { value: "", label: "All Months" },
    ...Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1),
      label: new Date(2000, i).toLocaleString("default", { month: "short" }),
    })),
  ];

  const totalFiltered = expenses.reduce((s, e: any) => s + e.amount, 0);

  return (
    <div className="space-y-6 animate-rise">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Expenses</h1>
          <p className="mt-1 text-sm text-muted">
            {expenses.length} expenses &middot; {formatCurrency(totalFiltered)} total
          </p>
        </div>
        <Button variant="signal" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-muted">
            <Filter className="h-4 w-4" />
            Filters
          </div>
          <div className="min-w-[160px]">
            <Select options={propertyOptions} value={filterProperty} onChange={(e) => setFilterProperty(e.target.value)} />
          </div>
          <div className="min-w-[160px]">
            <Select options={categoryFilterOptions} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} />
          </div>
          <div className="min-w-[100px]">
            <Select options={yearOptions} value={filterYear} onChange={(e) => setFilterYear(e.target.value)} />
          </div>
          <div className="min-w-[120px]">
            <Select options={monthOptions} value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} />
          </div>
        </div>
      </Card>

      {/* Empty */}
      {expenses.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-16">
          <Receipt className="mb-4 h-12 w-12 text-muted/40" />
          <h3 className="text-lg font-bold text-ink">No expenses found</h3>
          <p className="mt-1 text-sm text-muted">Add your first expense or adjust filters.</p>
          <Button variant="signal" className="mt-4" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </Card>
      )}

      {/* Table */}
      {expenses.length > 0 && (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas/60">
                  <th className="px-5 py-3 font-semibold text-muted">Date</th>
                  <th className="px-5 py-3 font-semibold text-muted">Description</th>
                  <th className="px-5 py-3 font-semibold text-muted">Amount</th>
                  <th className="px-5 py-3 font-semibold text-muted">Category</th>
                  <th className="px-5 py-3 font-semibold text-muted">Vendor</th>
                  <th className="px-5 py-3 text-right font-semibold text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e: any) => (
                  <tr key={e.id} className="border-b border-line last:border-0 transition hover:bg-canvas/40">
                    <td className="px-5 py-3.5 text-muted">{formatDate(e.date)}</td>
                    <td className="px-5 py-3.5 font-semibold text-ink">
                      {e.description}
                      {e.isRecurring && (
                        <span className="ml-2 text-xs font-medium text-signal">Recurring</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-ink">{formatCurrency(e.amount)}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={categoryVariant(e.category) as any}>{capitalize(e.category)}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-muted">{e.vendor || "—"}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(e.id, e.description)}
                        className="rounded-lg p-1.5 text-muted transition hover:bg-red-50 hover:text-danger"
                        title="Delete expense"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
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
              <h2 className="text-lg font-bold text-ink">Add Expense</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1 text-muted transition hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="propertyId">Property</Label>
                <Select
                  id="propertyId"
                  options={properties.map((p: any) => ({ value: p.id, label: p.name }))}
                  placeholder="Select property"
                  value={form.propertyId}
                  onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    id="category"
                    options={categories}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g. Plumber for kitchen leak"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vendor">Vendor</Label>
                  <Input
                    id="vendor"
                    placeholder="Optional"
                    value={form.vendor}
                    onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="isRecurring"
                  type="checkbox"
                  checked={form.isRecurring}
                  onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                  className="h-4 w-4 rounded border-line text-signal focus:ring-signal/20"
                />
                <Label htmlFor="isRecurring" className="text-sm font-medium text-muted">
                  Recurring expense
                </Label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="signal" loading={createMutation.isPending}>Add Expense</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
