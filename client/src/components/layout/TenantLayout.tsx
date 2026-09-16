import { type ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../../contexts/auth-context";
import { signOut } from "../../lib/auth-client";
import { cn } from "../../lib/utils";
import {
  LayoutDashboard,
  CreditCard,
  Wrench,
  FileText,
  LogOut,
  Menu,
  X,
  Home,
  ChevronRight,
} from "lucide-react";

const TENANT_NAV = [
  { href: "/tenant", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tenant/payments", label: "Payments", icon: CreditCard },
  { href: "/tenant/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/tenant/lease", label: "My Lease", icon: FileText },
];

export function TenantLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen bg-canvas">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-deep">
            <Home className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight text-ink">RentLite</span>
            <span className="ml-1.5 rounded-md bg-deep/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-deep">
              Tenant
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {TENANT_NAV.map((item) => {
              const isActive =
                item.href === "/tenant"
                  ? location === "/tenant"
                  : location.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link href={item.href}>
                    <a
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                        isActive
                          ? "bg-deep/10 text-deep"
                          : "text-muted hover:bg-gray-50 hover:text-ink",
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                      {isActive && <ChevronRight className="ml-auto h-4 w-4 opacity-50" />}
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-line p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-deep text-sm font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || "T"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-semibold text-ink">{user?.name || "Tenant"}</p>
              <p className="truncate text-xs text-muted">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-lg p-2 text-muted transition hover:bg-gray-100 hover:text-ink"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center border-b border-line bg-surface px-4 lg:px-8">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-muted hover:bg-gray-100 lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
