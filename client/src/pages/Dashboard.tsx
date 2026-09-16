import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { StatCard } from "../components/ui/StatCard";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { formatCurrency } from "../lib/utils";
import {
  Building2,
  Home,
  Percent,
  DollarSign,
  TrendingDown,
  HandCoins,
  Wrench,
  FileText,
  AlertTriangle,
  ArrowRight,
  Loader2,
  LayoutDashboard,
} from "lucide-react";

export function Dashboard() {
  const { data, isLoading, error } = useQuery<any>({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/api/dashboard"),
  });

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
        <p className="text-sm text-muted">Failed to load dashboard data.</p>
      </div>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const stats = [
    {
      label: "Total Properties",
      value: d.properties?.total ?? 0,
      icon: <Building2 className="h-5 w-5" />,
      color: "deep" as const,
    },
    {
      label: "Total Units",
      value: d.units?.total ?? 0,
      icon: <Home className="h-5 w-5" />,
      color: "blue" as const,
    },
    {
      label: "Occupancy Rate",
      value: `${d.units?.occupancyRate ?? 0}%`,
      icon: <Percent className="h-5 w-5" />,
      color: "violet" as const,
    },
    {
      label: "Monthly Income",
      value: formatCurrency(d.financials?.monthlyIncome ?? 0),
      icon: <DollarSign className="h-5 w-5" />,
      color: "success" as const,
    },
    {
      label: "Monthly Expenses",
      value: formatCurrency(d.financials?.monthlyExpenses ?? 0),
      icon: <TrendingDown className="h-5 w-5" />,
      color: "signal" as const,
    },
    {
      label: "Collection Rate",
      value: `${d.rent?.collectionRate ?? 0}%`,
      icon: <HandCoins className="h-5 w-5" />,
      color: "deep" as const,
    },
  ];

  const alerts = [
    {
      label: "Open Maintenance",
      count: d.alerts?.openMaintenance ?? 0,
      icon: <Wrench className="h-4 w-4" />,
      variant: "warning" as const,
      href: "/maintenance",
    },
    {
      label: "Expiring Leases",
      count: d.alerts?.expiringLeases ?? 0,
      icon: <FileText className="h-4 w-4" />,
      variant: "signal" as const,
      href: "/leases",
    },
    {
      label: "Late Payments",
      count: d.alerts?.latePayments ?? 0,
      icon: <AlertTriangle className="h-4 w-4" />,
      variant: "danger" as const,
      href: "/payments",
    },
  ];

  const quickActions = [
    { label: "Properties", href: "/properties", icon: <Building2 className="h-4 w-4" /> },
    { label: "Tenants", href: "/tenants", icon: <Home className="h-4 w-4" /> },
    { label: "Payments", href: "/payments", icon: <DollarSign className="h-4 w-4" /> },
    { label: "Maintenance", href: "/maintenance", icon: <Wrench className="h-4 w-4" /> },
    { label: "Expenses", href: "/expenses", icon: <TrendingDown className="h-4 w-4" /> },
    { label: "Reports", href: "/reports", icon: <LayoutDashboard className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-8 animate-rise">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Overview of your property portfolio</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} />
        ))}
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Alerts &amp; Notices</CardTitle>
        </CardHeader>
        <div className="grid gap-3 sm:grid-cols-3">
          {alerts.map((a) => (
            <a
              key={a.label}
              href={a.href}
              className="flex items-center justify-between rounded-xl border border-line bg-canvas p-4 transition hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="text-muted">{a.icon}</div>
                <span className="text-sm font-semibold text-ink">{a.label}</span>
              </div>
              <Badge variant={a.variant}>{a.count}</Badge>
            </a>
          ))}
        </div>
      </Card>

      {/* Rent Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rent Collection</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Expected</span>
              <span className="font-semibold text-ink">{formatCurrency(d.rent?.monthlyExpected ?? 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Collected</span>
              <span className="font-semibold text-success">{formatCurrency(d.rent?.monthlyCollected ?? 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Outstanding</span>
              <span className="font-semibold text-danger">{formatCurrency(d.rent?.monthlyOutstanding ?? 0)}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-signal transition-all"
                style={{ width: `${Math.min(d.rent?.collectionRate ?? 0, 100)}%` }}
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unit Status</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Total Units</span>
              <span className="font-semibold text-ink">{d.units?.total ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Occupied</span>
              <span className="font-semibold text-success">{d.units?.occupied ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Vacant</span>
              <span className="font-semibold text-danger">{d.units?.vacant ?? 0}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${d.units?.occupancyRate ?? 0}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((qa) => (
            <a key={qa.label} href={qa.href}>
              <Button variant="secondary" size="sm" className="gap-2">
                {qa.icon}
                {qa.label}
                <ArrowRight className="h-3 w-3 opacity-50" />
              </Button>
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
