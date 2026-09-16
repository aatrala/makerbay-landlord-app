import { Link } from "wouter";
import { Button } from "../components/ui/Button";
import { Home } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="text-center space-y-6 animate-rise">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-signal-soft">
          <span className="text-4xl font-extrabold text-signal">404</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">
            Page not found
          </h1>
          <p className="text-muted max-w-md">
            Sorry, we couldn't find the page you're looking for. It might have
            been moved or doesn't exist.
          </p>
        </div>

        <Link href="/">
          <Button variant="signal" size="lg">
            <Home className="h-4 w-4" />
            Back to home
          </Button>
        </Link>
      </div>
    </div>
  );
}
