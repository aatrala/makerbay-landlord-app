import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Wrench, Plus, AlertCircle, Loader2 } from "lucide-react";

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string | null;
  submittedDate: string;
  aiCategory: string | null;
  aiPriority: string | null;
  aiConfidence: number | null;
  unit: { unitNumber: string };
}

export function TenantMaintenance() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "other",
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const { data } = await api.get<{ data: MaintenanceRequest[] }>(
        "/api/tenant-portal/maintenance",
      );
      setRequests(data);
    } catch (err) {
      console.error("Failed to load maintenance requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/api/tenant-portal/maintenance", formData);
      setShowForm(false);
      setFormData({ title: "", description: "", category: "other" });
      await loadRequests();
    } catch (err) {
      console.error("Failed to submit request:", err);
      alert("Failed to submit maintenance request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-muted">Loading...</div>;

  const statusColors: Record<string, "signal" | "warning" | "success" | "default" | "outline"> = {
    open: "signal",
    submitted: "signal",
    acknowledged: "outline",
    in_progress: "warning",
    completed: "success",
    closed: "default",
  };

  const priorityColors: Record<string, "danger" | "warning" | "success" | "default"> = {
    emergency: "danger",
    urgent: "warning",
    high: "danger",
    medium: "warning",
    routine: "success",
    low: "default",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Maintenance</h1>
          <p className="text-sm text-muted">Submit and track maintenance requests</p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* Submit Form */}
      {showForm && (
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-ink">Submit Maintenance Request</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                placeholder="e.g., Leaky faucet in kitchen"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Description</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                placeholder="Describe the issue in detail..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
              >
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="hvac">HVAC</option>
                <option value="appliance">Appliance</option>
                <option value="structural">Structural</option>
                <option value="pest">Pest Control</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex gap-3">
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Requests List */}
      <div className="space-y-3">
        {requests.length === 0 && !showForm && (
          <Card className="p-8 text-center">
            <Wrench className="mx-auto h-10 w-10 text-muted" />
            <p className="mt-3 text-sm text-muted">No maintenance requests yet</p>
            <Button variant="primary" className="mt-4" onClick={() => setShowForm(true)}>
              Submit your first request
            </Button>
          </Card>
        )}

        {requests.map((req) => (
          <Card key={req.id} className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-ink">{req.title}</h3>
                  {req.aiCategory && (
                    <Badge variant="signal" className="text-xs">
                      AI: {req.aiCategory}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">{req.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant={statusColors[req.status] || "gray"}>
                    {req.status.replace("_", " ")}
                  </Badge>
                  <Badge variant={priorityColors[req.priority] || "gray"}>
                    {req.priority} priority
                  </Badge>
                  {req.category && (
                    <span className="text-xs text-muted">• {req.category}</span>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted">
                  Unit #{req.unit.unitNumber} • Submitted{" "}
                  {new Date(req.submittedDate).toLocaleDateString()}
                </p>
                {req.aiConfidence && (
                  <p className="mt-1 text-xs text-deep">
                    AI confidence: {Math.round(req.aiConfidence * 100)}%
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* AI Triage Notice */}
      {requests.some((r) => r.aiCategory) && (
        <Card className="border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">AI-Powered Triage</p>
              <p className="text-xs text-blue-700">
                Your requests are automatically categorized and prioritized by our AI system to
                ensure faster response times.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
