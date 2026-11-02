import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "./env.js";
import { envVar } from "./env.js";
import { getAuth } from "./auth/index.js";
import { propertiesRouter } from "./routes/properties.js";
import { unitsRouter } from "./routes/units.js";
import { tenantsRouter } from "./routes/tenants.js";
import { leasesRouter } from "./routes/leases.js";
import { paymentsRouter } from "./routes/payments.js";
import { maintenanceRouter } from "./routes/maintenance.js";
import { expensesRouter } from "./routes/expenses.js";
import { vendorsRouter } from "./routes/vendors.js";
import { reportsRouter } from "./routes/reports.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { aiTriageRouter } from "./routes/ai-triage.js";
import { stripeRouter } from "./routes/stripe-payments.js";
import { tenantPortalRouter } from "./routes/tenant-portal.js";
import { remindersRouter } from "./routes/reminders.js";
import { strRouter, icalRouter } from "./routes/str.js";
import { uploadsRouter } from "./routes/uploads.js";

export function createApp() {
  const app = new Hono<AppEnv>();

  app.use(
    "/api/*",
    cors({
      origin: (origin) => {
        const allowed = [envVar("APP_URL"), "http://localhost:5173"].filter(Boolean);
        return allowed.includes(origin) ? origin : null;
      },
      credentials: true,
    }),
  );

  // Parse JSON bodies once (keeps the raw text for Stripe signature checks).
  app.use("/api/*", async (c, next) => {
    const method = c.req.method;
    const type = c.req.header("content-type") || "";
    if (method !== "GET" && method !== "HEAD" && !c.req.path.startsWith("/api/auth/") && !type.startsWith("multipart/")) {
      const raw = await c.req.text();
      c.set("rawBody", raw);
      if (raw && type.includes("json")) {
        try {
          c.set("body", JSON.parse(raw));
        } catch {
          return c.json({ message: "Invalid JSON", code: "BAD_JSON" }, 400);
        }
      }
    }
    await next();
  });

  app.on(["GET", "POST"], "/api/auth/*", (c) => getAuth().handler(c.req.raw));

  app.get("/api/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));
  app.get("/api/config", (c) =>
    c.json({ data: { turnstileSiteKey: c.env?.TURNSTILE_SITE_KEY || envVar("TURNSTILE_SITE_KEY") || null } }),
  );

  app.route("/api/properties", propertiesRouter);
  app.route("/api/units", unitsRouter);
  app.route("/api/tenants", tenantsRouter);
  app.route("/api/leases", leasesRouter);
  app.route("/api/payments", paymentsRouter);
  app.route("/api/maintenance", maintenanceRouter);
  app.route("/api/expenses", expensesRouter);
  app.route("/api/vendors", vendorsRouter);
  app.route("/api/reports", reportsRouter);
  app.route("/api/dashboard", dashboardRouter);
  app.route("/api/ai-triage", aiTriageRouter);
  app.route("/api/stripe", stripeRouter);
  app.route("/api/tenant-portal", tenantPortalRouter);
  app.route("/api/reminders", remindersRouter);
  app.route("/api/str", strRouter);
  app.route("/api/ical", icalRouter);
  app.route("/api/uploads", uploadsRouter);

  app.notFound((c) => c.json({ message: "Not found", code: "NOT_FOUND" }, 404));
  app.onError((err, c) => {
    // A malformed id in the URL (e.g. "null") makes Postgres raise 22P02
    // (invalid_text_representation); no such record can exist, so answer 404.
    if (isInvalidIdError(err)) return c.json({ message: "Not found", code: "NOT_FOUND" }, 404);
    console.error("[API]", err);
    return c.json({ message: "Internal error", code: "INTERNAL" }, 500);
  });
  return app;
}

function isInvalidIdError(err: unknown): boolean {
  for (let e: any = err, i = 0; e && i < 4; e = e.cause, i++) {
    if (e.code === "22P02") return true;
    if (/invalid input syntax for type uuid/i.test(String(e.message ?? ""))) return true;
  }
  return false;
}

export const app = createApp();
