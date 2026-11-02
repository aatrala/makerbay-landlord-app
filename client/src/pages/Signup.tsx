import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { getSession, signUp } from "../lib/auth-client";
import { completeAuthRedirect } from "../lib/post-auth";
import { Button } from "../components/ui/Button";
import { Input, Label } from "../components/ui/Input";
import { Building2, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useTurnstile } from "../components/auth/Turnstile";

export function Signup() {
  const captcha = useTurnstile();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const result = await signUp.email({ name, email, password }, { headers: captcha.headers() });

      if (result.error) {
        captcha.reset();
        toast.error(result.error.message || "Failed to create account");
        return;
      }

      toast.success("Account created successfully!");
      const ok = await completeAuthRedirect({ getSession: () => getSession(), navigate: (to) => window.location.assign(to) });
      if (!ok) setLocation("/");
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
          <span className="text-xl font-extrabold tracking-tight">Manage Homestay</span>
        </div>

        <div className="max-w-md space-y-6">
          <p className="eyebrow text-signal">Homestay &amp; Rental Management</p>
          <h1 className="hero-title text-white">
            Start managing smarter today.
          </h1>
          <p className="text-lg leading-relaxed text-slate-400">
            Join thousands of landlords who simplify their property management
            with Manage Homestay. Get started in minutes.
          </p>
        </div>

        <p className="text-sm text-slate-500">
          &copy; {new Date().getFullYear()} Appa Technologies Pty Ltd. All rights reserved.
        </p>
      </div>

      {/* ── Right: Signup Form ── */}
      <div className="flex flex-1 items-center justify-center bg-canvas px-6 py-12">
        <div className="w-full max-w-md space-y-8 animate-rise">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-ink">
              Manage Homestay
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">
              Create your account
            </h2>
            <p className="text-sm text-muted">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-signal hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {captcha.element}

            <Button
              type="submit"
              variant="signal"
              size="lg"
              loading={loading}
              disabled={!captcha.ready}
              className="w-full"
            >
              Create account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
