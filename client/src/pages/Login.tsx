import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { signIn } from "../lib/auth-client";
import { Button } from "../components/ui/Button";
import { Input, Label } from "../components/ui/Input";
import { Building2, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn.email({ email, password });

      if (result.error) {
        toast.error(result.error.message || "Invalid email or password");
        return;
      }

      toast.success("Welcome back!");
      setLocation("/");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left: Hero / Branding ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-deep p-12 text-white">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">RentLite</span>
        </div>

        <div className="max-w-md space-y-6">
          <p className="eyebrow text-signal">Property Management</p>
          <h1 className="hero-title text-white">
            Manage your properties with&nbsp;ease.
          </h1>
          <p className="text-lg leading-relaxed text-slate-400">
            Track tenants, collect rent, handle maintenance, and get real-time
            insights — all from one beautifully simple dashboard.
          </p>
        </div>

        <p className="text-sm text-slate-500">
          &copy; {new Date().getFullYear()} RentLite. All rights reserved.
        </p>
      </div>

      {/* ── Right: Login Form ── */}
      <div className="flex flex-1 items-center justify-center bg-canvas px-6 py-12">
        <div className="w-full max-w-md space-y-8 animate-rise">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-ink">
              RentLite
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">
              Sign in to your account
            </h2>
            <p className="text-sm text-muted">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-signal hover:underline"
              >
                Create one
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="signal"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
