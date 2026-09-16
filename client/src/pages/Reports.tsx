import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { formatCurrency } from "../lib/utils";
import { toast } from "sonner";
import {
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  Download,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const tabs = [
  { key: "cashflow", label: "Cash Flow", icon: <BarChart3 className="h-4 w-4" /> },
  { key: "pnl", label: "Profit & Loss", icon: <TrendingUp className="h-4 w-4" /> },
  { key: "schedule-e", label: "Schedule E", icon: <FileSpreadsheet className="h-4 w-4" /> },
] as const;

type TabKey = (typeof tabs)[number]["key"];

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => {
  const y = String(currentYear - i);
  return { value: y, label: y };
});

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function Reports() {
  const [activeTab, setActiveTab] = useState<TabKey>("cashflow");
  const [year, setYear] = useState(String(currentYear));

  const { data: cashflowData, isLoading: cfLoading } = useQuery<any>({
    queryKey: ["reports-cashflow", year],
    queryFn: () => api.get("/api/reports/cashflow", { year }),
    enabled: activeTab === "cashflow",
  });

  const { data: pnlData, isLoading: pnlLoading } = useQuery<any>({
    queryKey: ["reports-pnl", year],
    queryFn: () => api.get("/api/reports/pnl", { year }),
    enabled: activeTab === "pnl",
  });

  const { data: scheduleEData, isLoading: seLoading } = useQuery<any>({
    queryKey: ["reports-schedule-e", year],
    queryFn: () => api.get("/api/reports/schedule-e", { year }),
    enabled: activeTab === "schedule-e",
  });

  const isLoading = (activeTab === "cashflow" && cfLoading) || (activeTab === "pnl" && pnlLoading) || (activeTab === "schedule-e" && seLoading);

  // Chart data for cash flow — aggregate across all properties per month
  const chartData = useMemo(() => {
    const cf: any[] = cashflowData?.data ?? [];
    if (cf.length === 0) return [];
    return monthNames.map((name, i) => {
      let income = 0;
      let expenses = 0;
      cf.forEach((prop: any) => {
        const month = prop.monthly?.[i];
        if (month) {
          income += month.income ?? 0;
          expenses += month.expenses ?? 0;
        }
      });
      return { name, income, expenses, net: income - expenses };
    });
  }, [cashflowData]);

  // CSV export
  const handleExport = () => {
    try {
      if (activeTab === "cashflow") {
        const cf: any[] = cashflowData?.data ?? [];
        const rows: string[][] = [["Property", "Month", "Income", "Expenses", "Net"]];
        cf.forEach((prop: any) => {
          prop.monthly?.forEach((m: any) => {
            rows.push([prop.propertyName, m.month, String(m.income), String(m.expenses), String(m.net)]);
          });
        });
        downloadCsv(`cashflow-${year}.csv`, rows);
      } else if (activeTab === "pnl") {
        const pnl: any[] = pnlData?.data ?? [];
        const rows: string[][] = [["Property", "Income", "Expenses", "Net Income", "Period"]];
        pnl.forEach((p: any) => {
          rows.push([p.propertyName, String(p.totalIncome), String(p.totalExpenses), String(p.netIncome), p.period]);
        });
        downloadCsv(`pnl-${year}.csv`, rows);
      } else {
        const se: any[] = scheduleEData?.data ?? [];
        const rows: string[][] = [["Property", "Address", "Rent Received", "Line", "Category", "Amount", "Total Expenses", "Net Income"]];
        se.forEach((p: any) => {
          p.lineItems?.forEach((li: any) => {
            rows.push([p.propertyName, p.address, String(p.rentReceived), String(li.line), li.description, String(li.amount), String(p.totalExpenses), String(p.netIncome)]);
          });
        });
        downloadCsv(`schedule-e-${year}.csv`, rows);
      }
      toast.success("CSV downloaded!");
    } catch {
      toast.error("Failed to export CSV");
    }
  };

  return (
    <div className="space-y-6 animate-rise">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Reports</h1>
          <p className="mt-1 text-sm text-muted">Financial analytics and tax reports</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={yearOptions}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-24"
          />
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.key
                ? "bg-deep text-white"
                : "bg-surface text-muted border border-line hover:bg-gray-50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-signal" />
        </div>
      )}

      {/* Cash Flow Tab */}
      {!isLoading && activeTab === "cashflow" && (
        <div className="space-y-6 animate-rise">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Cash Flow — {year}</CardTitle>
            </CardHeader>
            {chartData.length > 0 && chartData.some((d) => d.income > 0 || d.expenses > 0) ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-sm text-muted">No cash flow data for {year}.</p>
            )}
          </Card>

          {/* Net Income Line */}
          {chartData.length > 0 && chartData.some((d) => d.net !== 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Net Income Trend</CardTitle>
              </CardHeader>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="net" name="Net Income" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Per-property breakdown */}
          <div className="grid gap-4 sm:grid-cols-2">
            {(cashflowData?.data ?? []).map((prop: any) => (
              <Card key={prop.propertyId}>
                <CardHeader>
                  <CardTitle>{prop.propertyName}</CardTitle>
                </CardHeader>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Total Income</span>
                    <span className="font-semibold text-success">{formatCurrency(prop.totalIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Total Expenses</span>
                    <span className="font-semibold text-danger">{formatCurrency(prop.totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between border-t border-line pt-2">
                    <span className="font-semibold text-ink">Net Income</span>
                    <span className={`font-bold ${prop.netIncome >= 0 ? "text-success" : "text-danger"}`}>
                      {formatCurrency(prop.netIncome)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* P&L Tab */}
      {!isLoading && activeTab === "pnl" && (
        <div className="space-y-4 animate-rise">
          {(pnlData?.data ?? []).length === 0 && (
            <Card className="flex flex-col items-center justify-center py-16">
              <TrendingUp className="mb-4 h-12 w-12 text-muted/40" />
              <h3 className="text-lg font-bold text-ink">No P&L data</h3>
              <p className="mt-1 text-sm text-muted">No financial data available for {year}.</p>
            </Card>
          )}

          {(pnlData?.data ?? []).map((prop: any) => (
            <Card key={prop.propertyId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{prop.propertyName}</CardTitle>
                  <Badge variant="outline">{prop.period}</Badge>
                </div>
              </CardHeader>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Total Income</span>
                  <span className="font-semibold text-success">{formatCurrency(prop.totalIncome)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Total Expenses</span>
                  <span className="font-semibold text-danger">{formatCurrency(prop.totalExpenses)}</span>
                </div>
                <div className="flex justify-between border-t border-line pt-3">
                  <span className="font-bold text-ink">Net Income</span>
                  <span className={`text-lg font-extrabold ${prop.netIncome >= 0 ? "text-success" : "text-danger"}`}>
                    {formatCurrency(prop.netIncome)}
                  </span>
                </div>
                {/* Visual bar */}
                {prop.totalIncome > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span className="w-20">Income</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: "100%" }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span className="w-20">Expenses</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-signal"
                          style={{ width: `${Math.min((prop.totalExpenses / prop.totalIncome) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Schedule E Tab */}
      {!isLoading && activeTab === "schedule-e" && (
        <div className="space-y-4 animate-rise">
          {(scheduleEData?.data ?? []).length === 0 && (
            <Card className="flex flex-col items-center justify-center py-16">
              <FileSpreadsheet className="mb-4 h-12 w-12 text-muted/40" />
              <h3 className="text-lg font-bold text-ink">No Schedule E data</h3>
              <p className="mt-1 text-sm text-muted">No expense data available for {year}.</p>
            </Card>
          )}

          {(scheduleEData?.data ?? []).map((prop: any) => (
            <Card key={prop.propertyId}>
              <CardHeader>
                <div>
                  <CardTitle>{prop.propertyName}</CardTitle>
                  <p className="mt-0.5 text-xs text-muted">{prop.address}</p>
                </div>
              </CardHeader>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Rent Received (Line 3)</span>
                  <span className="font-semibold text-success">{formatCurrency(prop.rentReceived)}</span>
                </div>

                {prop.lineItems?.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-line">
                          <th className="py-2 pr-4 text-xs font-semibold text-muted">Line</th>
                          <th className="py-2 pr-4 text-xs font-semibold text-muted">Description</th>
                          <th className="py-2 text-right text-xs font-semibold text-muted">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prop.lineItems.map((li: any, idx: number) => (
                          <tr key={idx} className="border-b border-line last:border-0">
                            <td className="py-2 pr-4 font-mono text-xs text-muted">{li.line}</td>
                            <td className="py-2 pr-4 text-ink">{li.description}</td>
                            <td className="py-2 text-right font-semibold text-ink">{formatCurrency(li.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex justify-between border-t border-line pt-3 text-sm">
                  <span className="text-muted">Total Expenses</span>
                  <span className="font-semibold text-danger">{formatCurrency(prop.totalExpenses)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-ink">Net Income</span>
                  <span className={`text-lg font-extrabold ${prop.netIncome >= 0 ? "text-success" : "text-danger"}`}>
                    {formatCurrency(prop.netIncome)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
