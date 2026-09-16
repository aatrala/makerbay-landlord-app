import { Route, Switch, Redirect } from "wouter";
import { useAuth } from "./contexts/auth-context";
import { AppLayout } from "./components/layout/AppLayout";
import { TenantLayout } from "./components/layout/TenantLayout";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Dashboard } from "./pages/Dashboard";
import { Properties } from "./pages/Properties";
import { Tenants } from "./pages/Tenants";
import { Payments } from "./pages/Payments";
import { Maintenance } from "./pages/Maintenance";
import { Expenses } from "./pages/Expenses";
import { Reports } from "./pages/Reports";
import { TenantDashboard } from "./pages/TenantDashboard";
import { TenantPayments } from "./pages/TenantPayments";
import { TenantMaintenance } from "./pages/TenantMaintenance";
import { TenantLease } from "./pages/TenantLease";
import { NotFound } from "./pages/NotFound";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <Loader2 className="h-8 w-8 animate-spin text-signal" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <AppLayout>{children}</AppLayout>;
}

function TenantRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <Loader2 className="h-8 w-8 animate-spin text-signal" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <TenantLayout>{children}</TenantLayout>;
}

export default function App() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/properties">
        <ProtectedRoute>
          <Properties />
        </ProtectedRoute>
      </Route>
      <Route path="/tenants">
        <ProtectedRoute>
          <Tenants />
        </ProtectedRoute>
      </Route>
      <Route path="/payments">
        <ProtectedRoute>
          <Payments />
        </ProtectedRoute>
      </Route>
      <Route path="/maintenance">
        <ProtectedRoute>
          <Maintenance />
        </ProtectedRoute>
      </Route>
      <Route path="/expenses">
        <ProtectedRoute>
          <Expenses />
        </ProtectedRoute>
      </Route>
      <Route path="/reports">
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      </Route>

      {/* Tenant Portal Routes */}
      <Route path="/tenant">
        <TenantRoute>
          <TenantDashboard />
        </TenantRoute>
      </Route>
      <Route path="/tenant/payments">
        <TenantRoute>
          <TenantPayments />
        </TenantRoute>
      </Route>
      <Route path="/tenant/maintenance">
        <TenantRoute>
          <TenantMaintenance />
        </TenantRoute>
      </Route>
      <Route path="/tenant/lease">
        <TenantRoute>
          <TenantLease />
        </TenantRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}
