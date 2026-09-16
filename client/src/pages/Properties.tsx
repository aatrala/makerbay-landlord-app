import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Label, Select } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { cn, capitalize } from "../lib/utils";
import { toast } from "sonner";
import {
  Plus,
  Building2,
  MapPin,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  Home,
} from "lucide-react";

const propertyTypes = [
  { value: "single_family", label: "Single Family" },
  { value: "duplex", label: "Duplex" },
  { value: "multifamily", label: "Multifamily" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
];

const statusVariant = (status: string) => {
  if (status === "active") return "success";
  if (status === "vacant") return "warning";
  if (status === "under_renovation") return "outline";
  return "default" as const;
};

export function Properties() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    type: "single_family",
    unitCount: 1,
  });

  const { data, isLoading, error } = useQuery<any>({
    queryKey: ["properties"],
    queryFn: () => api.get("/api/properties"),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post("/api/properties", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      setShowModal(false);
      setForm({ name: "", address: "", city: "", state: "", zip: "", type: "single_family", unitCount: 1 });
      toast.success("Property created successfully!");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create property"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/properties/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast.success("Property deleted.");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete property"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ ...form, unitCount: Number(form.unitCount) });
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete property "${name}"? This cannot be undone.`)) {
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
        <p className="text-sm text-muted">Failed to load properties.</p>
      </div>
    );
  }

  const properties: any[] = data?.data ?? [];

  return (
    <div className="space-y-6 animate-rise">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Properties</h1>
          <p className="mt-1 text-sm text-muted">
            {properties.length} {properties.length === 1 ? "property" : "properties"} managed
          </p>
        </div>
        <Button variant="signal" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          Add Property
        </Button>
      </div>

      {/* Empty State */}
      {properties.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-16">
          <Building2 className="mb-4 h-12 w-12 text-muted/40" />
          <h3 className="text-lg font-bold text-ink">No properties yet</h3>
          <p className="mt-1 text-sm text-muted">Add your first property to get started.</p>
          <Button variant="signal" className="mt-4" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            Add Property
          </Button>
        </Card>
      )}

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((p: any) => (
          <Card key={p.id} className="relative flex flex-col gap-3 animate-rise">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal-soft text-signal">
                  <Home className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">{p.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted">
                    <MapPin className="h-3 w-3" />
                    {p.city}, {p.state}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(p.id, p.name)}
                className="rounded-lg p-1.5 text-muted transition hover:bg-red-50 hover:text-danger"
                title="Delete property"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted">{p.address}</p>

            <div className="mt-auto flex items-center gap-2">
              <Badge variant="default">{capitalize(p.type)}</Badge>
              <Badge variant={statusVariant(p.status) as any}>{capitalize(p.status)}</Badge>
              <span className="ml-auto text-xs font-semibold text-muted">
                {p.unitCount ?? 0} units
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="animate-rise w-full max-w-lg rounded-[18px] border border-line bg-surface p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Add Property</h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-muted transition hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Property Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Sunset Apartments"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Street address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="CA"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="zip">Zip</Label>
                  <Input
                    id="zip"
                    placeholder="90210"
                    value={form.zip}
                    onChange={(e) => setForm({ ...form, zip: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    id="type"
                    options={propertyTypes}
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="unitCount">Unit Count</Label>
                  <Input
                    id="unitCount"
                    type="number"
                    min={1}
                    value={form.unitCount}
                    onChange={(e) => setForm({ ...form, unitCount: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="signal" loading={createMutation.isPending}>
                  Create Property
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
