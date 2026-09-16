import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Resolve .env from multiple possible locations
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPaths = [
  path.resolve(__dirname, "../../.env"),   // server/src -> root
  path.resolve(__dirname, "../.env"),      // server -> root (compiled)
  path.resolve(process.cwd(), "../.env"),  // CWD server -> root
  path.resolve(process.cwd(), ".env"),     // CWD root
];
for (const p of envPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}
import express from "express";
import cors from "cors";
import { authHandler } from "./auth/middleware.js";
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

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ── Global Middleware ──

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));

// ── Auth Routes (Better-Auth) ──

app.all("/api/auth/*", authHandler);

// ── API Routes ──

app.use("/api/properties", propertiesRouter);
app.use("/api/units", unitsRouter);
app.use("/api/tenants", tenantsRouter);
app.use("/api/leases", leasesRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/maintenance", maintenanceRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/vendors", vendorsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/dashboard", dashboardRouter);

// ── Phase 1 Feature Routes ──

app.use("/api/ai-triage", aiTriageRouter);
app.use("/api/stripe", stripeRouter);
app.use("/api/tenant-portal", tenantPortalRouter);
app.use("/api/reminders", remindersRouter);

// ── Health Check ──

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Start ──

app.listen(PORT, () => {
  console.log(`[RentLite] Server running on http://localhost:${PORT}`);
});

export default app;
