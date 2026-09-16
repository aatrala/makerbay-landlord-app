import { cn } from "../../lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color?: "signal" | "success" | "blue" | "violet" | "deep";
}

const colorClasses = {
  signal: "bg-signal-soft text-signal",
  success: "bg-emerald-50 text-emerald-600",
  blue: "bg-sky-50 text-sky-600",
  violet: "bg-violet-50 text-violet-600",
  deep: "bg-slate-100 text-ink",
};

export function StatCard({ label, value, icon, trend, color = "signal" }: StatCardProps) {
  return (
    <div className="animate-rise rounded-[18px] border border-line bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            {label}
          </p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                trend.value >= 0 ? "text-success" : "text-danger",
              )}
            >
              {trend.value >= 0 ? "+" : ""}
              {trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            colorClasses[color],
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
