import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Label, Select, Textarea } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { capitalize } from "../lib/utils";
import { toast } from "sonner";
import {
  Plus,
  Wrench,
  AlertTriangle,
  Loader2,
  X,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

const statuses = ["submitted", "acknowledged", "in_progress", "completed"] as const;
const statusLabels: Record<string, string> = {
  submitted: "Submitted",
  acknowledged: "Acknowledged",
  in_progress: "In Progress",
  completed: "Completed",
};

const priorityOptions = [
  { value: "routine", label: "Routine" },
  { value: "urgent", label: "Urgent" },
  { value: "emergency", label: "Emergency" },
];

const priorityBadgeVariant = (priority: string) => {
  if (priority === "emergency") return "danger";
  if (priority === "urgent") return "warning";
  return "default" as const;
};

const columnColors: Record<string, string> = {
  submitted: "bg-blue-500",
  acknowledged: "bg-amber-500",
  in_progress: "bg-signal",
  completed: "bg-emerald-500",
};

const nextStatus: Record<string, string> = {
  submitted: "acknowledged",
  acknowledged: "in_progress",
  in_progress: "completed",
};

const emptyForm = {
  propertyId: "",
  unitId: "",
  title: "",
  description: "",
  priority: "routine",
};

export function Maintenance() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading, error } = useQuery<any>({
    queryKey: ["maintenance"],
    queryFn: () => api.get("/api/maintenance"),
  });

  const { data: propertiesData } = useQuery<any>({
    queryKey: ["properties-select"],
    queryFn: () => api.get("/api/properties"),
  });

  const { data: unitsData } = useQuery<any>({
    queryKey: ["units-select"],
    queryFn: () => api.get("/api/units"),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post("/api/maintenance", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      setShowModal(false);
      setForm(emptyForm);
      toast.success("Maintenance request created!");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create request"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/api/maintenance/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      toast.success("Status updated!");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update status"),
  });

  const aiTriageMutation = useMutation({
    mutationFn: (body: { title: string; description: string; maintenanceId: string }) =>
      api.post("/api/ai-triage/maintenance", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      toast.success("AI triage complete! Category and priority updated.");
    },
    onError: (err: Error) => toast.error(err.message || "AI triage failed"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
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
        <p className="text-sm text-muted">Failed to load maintenance requests.</p>
      </div>
    );
  }

  const requests: any[] = data?.data ?? [];
  const properties: any[] = propertiesData?.data ?? [];
  const units: any[] = unitsData?.data ?? [];

  const propertyOptions = properties.map((p: any) => ({ value: p.id, label: p.name }));
  const unitOptions = units.map((u: any) => ({ value: u.id, label: `Unit ${u.unitNumber}` }));

  const filteredRequests = activeTab === "all" ? requests : requests.filter((r: any) => r.status === activeTab);

  // Group by status for kanban view
  const grouped: Record<string, any[]> = {};
  statuses.forEach((s) => {
    grouped[s] = requests.filter((r: any) => r.status === s);
  });

  return (
    <div className="space-y-6 animate-rise">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Maintenance</h1>
          <p className="mt-1 text-sm text-muted">{requests.length} {requests.length === 1 ? "request" : "requests"}</p>
        </div>
        <Button variant="signal" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("all")}
          className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === "all"
              ? "bg-deep text-white"
              : "bg-surface text-muted border border-line hover:bg-gray-50"
          }`}
        >
          All ({requests.length})
        </button>
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setActiveTab(s)}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === s
                ? "bg-deep text-white"
                : "bg-surface text-muted border border-line hover:bg-gray-50"
            }`}
          >
            {statusLabels[s]} ({grouped[s]?.length ?? 0})
          </button>
        ))}
      </div>

      {/* Empty */}
      {filteredRequests.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-16">
          <Wrench className="mb-4 h-12 w-12 text-muted/40" />
          <h3 className="text-lg font-bold text-ink">No maintenance requests</h3>
          <p className="mt-1 text-sm text-muted">
            {activeTab === "all" ? "Create a new request to get started." : `No ${statusLabels[activeTab]?.toLowerCase()} requests.`}
          </p>
          {activeTab === "all" && (
            <Button variant="signal" className="mt-4" onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4" />
              New Request
            </Button>
          )}
        </Card>
      )}

      {/* Kanban columns (when "all") or list (when filtered) */}
      {activeTab === "all" && filteredRequests.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-4">
          {statuses.map((s) => (
            <div key={s} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${columnColors[s]}`} />
                <h3 className="text-sm font-bold text-ink">{statusLabels[s]}</h3>
                <span className="ml-auto text-xs font-semibold text-muted">{grouped[s]?.length ?? 0}</span>
              </div>
              <div className="space-y-3">
                {grouped[s]?.map((r: any) => (
                  <MaintenanceCard
                    key={r.id}
                    request={r}
                    nextStatus={nextStatus[r.status]}
                    onAdvance={(status) => updateStatusMutation.mutate({ id: r.id, status })}
                    advancing={updateStatusMutation.isPending}
                    onAiTriage={(title, desc, id) => aiTriageMutation.mutate({ title, description: desc, maintenanceId: id })}
                    triaging={aiTriageMutation.isPending}
                  />
                ))}
                {(!grouped[s] || grouped[s].length === 0) && (
                  <div className="rounded-xl border border-dashed border-line p-6 text-center text-xs text-muted">
                    No items
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRequests.map((r: any) => (
            <MaintenanceCard
              key={r.id}
              request={r}
              nextStatus={nextStatus[r.status]}
              onAdvance={(status) => updateStatusMutation.mutate({ id: r.id, status })}
              advancing={updateStatusMutation.isPending}
              onAiTriage={(title, desc, id) => aiTriageMutation.mutate({ title, description: desc, maintenanceId: id })}
              triaging={aiTriageMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="animate-rise w-full max-w-lg rounded-[18px] border border-line bg-surface p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">New Maintenance Request</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1 text-muted transition hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="propertyId">Property</Label>
                  <Select
                    id="propertyId"
                    options={propertyOptions}
                    placeholder="Select property"
                    value={form.propertyId}
                    onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
                    required
                  />
                </div>
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
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Leaking faucet in kitchen"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the issue in detail..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  id="priority"
                  options={priorityOptions}
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="signal" loading={createMutation.isPending}>Create Request</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MaintenanceCard({
  request,
  nextStatus,
  onAdvance,
  advancing,
  onAiTriage,
  triaging,
}: {
  request: any;
  nextStatus?: string;
  onAdvance: (status: string) => void;
  advancing: boolean;
  onAiTriage: (title: string, description: string, id: string) => void;
  triaging: boolean;
}) {
  return (
    <Card className="animate-rise space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-bold text-ink leading-snug">{request.title}</h4>
        <Badge variant={priorityBadgeVariant(request.priority) as any}>{capitalize(request.priority)}</Badge>
      </div>

      <p className="text-xs text-muted line-clamp-2">{request.description}</p>

      {/* AI Triage Info */}
      {request.aiCategory && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-signal/5 px-2.5 py-1.5">
          <Sparkles className="h-3.5 w-3.5 text-signal" />
          <span className="text-xs font-medium text-signal">
            AI: {request.aiCategory}
          </span>
          {request.aiPriority && (
            <Badge variant={priorityBadgeVariant(request.aiPriority) as any} className="text-[10px]">
              {request.aiPriority}
            </Badge>
          )}
          {request.aiConfidence && (
            <span className="text-[10px] text-muted">
              {Math.round(request.aiConfidence * 100)}% conf.
            </span>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {/* AI Triage Button */}
        {!request.aiCategory && (
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-center gap-1.5 text-xs"
            onClick={() => onAiTriage(request.title, request.description, request.id)}
            disabled={triaging}
          >
            {triaging ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            AI Triage
          </Button>
        )}

        {nextStatus && (
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-center gap-1.5 text-xs"
            onClick={() => onAdvance(nextStatus)}
            disabled={advancing}
          >
            {nextStatus === "completed" ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5" />
            )}
            Move to {statusLabels[nextStatus]}
          </Button>
        )}
      </div>

      {request.status === "completed" && (
        <div className="flex items-center gap-1.5 text-xs text-success">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Completed
        </div>
      )}
    </Card>
  );
}
