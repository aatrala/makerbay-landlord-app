import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Label } from "../components/ui/Input";
import { toast } from "sonner";
import {
  Plus,
  Users,
  Mail,
  Phone,
  Briefcase,
  Trash2,
  Pencil,
  Loader2,
  AlertTriangle,
  X,
} from "lucide-react";

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  employer: "",
};

export function Tenants() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading, error } = useQuery<any>({
    queryKey: ["tenants"],
    queryFn: () => api.get("/api/tenants"),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post("/api/tenants", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      closeModal();
      toast.success("Tenant added successfully!");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to add tenant"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => api.put(`/api/tenants/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      closeModal();
      toast.success("Tenant updated successfully!");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update tenant"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/tenants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Tenant removed.");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete tenant"),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openEdit = (t: any) => {
    setEditingId(t.id);
    setForm({
      firstName: t.firstName ?? "",
      lastName: t.lastName ?? "",
      email: t.email ?? "",
      phone: t.phone ?? "",
      emergencyContactName: t.emergencyContactName ?? "",
      emergencyContactPhone: t.emergencyContactPhone ?? "",
      employer: t.employer ?? "",
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, body: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Remove tenant "${name}"? This cannot be undone.`)) {
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
        <p className="text-sm text-muted">Failed to load tenants.</p>
      </div>
    );
  }

  const tenants: any[] = data?.data ?? [];

  return (
    <div className="space-y-6 animate-rise">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Tenants</h1>
          <p className="mt-1 text-sm text-muted">{tenants.length} {tenants.length === 1 ? "tenant" : "tenants"} on record</p>
        </div>
        <Button variant="signal" onClick={() => { setForm(emptyForm); setEditingId(null); setShowModal(true); }}>
          <Plus className="h-4 w-4" />
          Add Tenant
        </Button>
      </div>

      {/* Empty */}
      {tenants.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-16">
          <Users className="mb-4 h-12 w-12 text-muted/40" />
          <h3 className="text-lg font-bold text-ink">No tenants yet</h3>
          <p className="mt-1 text-sm text-muted">Add your first tenant to get started.</p>
          <Button variant="signal" className="mt-4" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            Add Tenant
          </Button>
        </Card>
      )}

      {/* Table */}
      {tenants.length > 0 && (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas/60">
                  <th className="px-5 py-3 font-semibold text-muted">Name</th>
                  <th className="px-5 py-3 font-semibold text-muted">Email</th>
                  <th className="px-5 py-3 font-semibold text-muted">Phone</th>
                  <th className="px-5 py-3 font-semibold text-muted">Employer</th>
                  <th className="px-5 py-3 text-right font-semibold text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t: any) => (
                  <tr key={t.id} className="border-b border-line last:border-0 transition hover:bg-canvas/40">
                    <td className="px-5 py-3.5 font-semibold text-ink">
                      {t.firstName} {t.lastName}
                    </td>
                    <td className="px-5 py-3.5 text-muted">{t.email || "—"}</td>
                    <td className="px-5 py-3.5 text-muted">{t.phone || "—"}</td>
                    <td className="px-5 py-3.5 text-muted">{t.employer || "—"}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => openEdit(t)}
                          className="rounded-lg p-1.5 text-muted transition hover:bg-gray-100 hover:text-ink"
                          title="Edit tenant"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, `${t.firstName} ${t.lastName}`)}
                          className="rounded-lg p-1.5 text-muted transition hover:bg-red-50 hover:text-danger"
                          title="Delete tenant"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
              <h2 className="text-lg font-bold text-ink">{editingId ? "Edit Tenant" : "Add Tenant"}</h2>
              <button onClick={closeModal} className="rounded-lg p-1 text-muted transition hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>

              <div>
                <Label htmlFor="employer">Employer</Label>
                <Input id="employer" value={form.employer} onChange={(e) => setForm({ ...form, employer: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="ecName">Emergency Contact</Label>
                  <Input id="ecName" placeholder="Name" value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="ecPhone">Emergency Phone</Label>
                  <Input id="ecPhone" placeholder="Phone" value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                <Button type="submit" variant="signal" loading={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? "Save Changes" : "Add Tenant"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
