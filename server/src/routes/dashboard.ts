import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { property, unit, tenant, lease, payment, maintenanceRequest, expense } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const router = Router();
router.use(authMiddleware);

// GET /api/dashboard — overview stats for landlord
router.get("/", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;

  const properties = await db.query.property.findMany({
    where: eq(property.userId, userId),
  });
  const propertyIds = new Set(properties.map((p) => p.id));

  const allUnits = await db.query.unit.findMany();
  const units = allUnits.filter((u) => propertyIds.has(u.propertyId));

  const allTenants = await db.query.tenant.findMany({
    where: eq(tenant.userId, userId),
  });

  const allPayments = await db.query.payment.findMany();
  const unitIds = new Set(units.map((u) => u.id));
  const payments = allPayments.filter((p) => unitIds.has(p.unitId));

  const allMaintenance = await db.query.maintenanceRequest.findMany();
  const maintenance = allMaintenance.filter((m) => propertyIds.has(m.propertyId));

  const allExpenses = await db.query.expense.findMany();
  const expenses = allExpenses.filter((e) => propertyIds.has(e.propertyId));

  const allLeases = await db.query.lease.findMany();
  const leases = allLeases.filter((l) => unitIds.has(l.unitId));

  // Current month
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const monthPayments = payments.filter((p) => {
    const d = new Date(p.dueDate);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });

  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });

  // Occupancy
  const occupiedUnits = units.filter((u) => u.status === "occupied").length;
  const totalUnits = units.length;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  // Rent collection
  const totalExpected = monthPayments.reduce((s, p) => s + p.amount, 0);
  const totalCollected = monthPayments.reduce((s, p) => s + p.amountPaid, 0);
  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  // Monthly totals
  const monthlyIncome = monthPayments.reduce((s, p) => s + p.amountPaid, 0);
  const monthlyExpenses = monthExpenses.reduce((s, e) => s + e.amount, 0);

  // Open maintenance
  const openMaintenance = maintenance.filter(
    (m) => m.status !== "completed",
  ).length;

  // Expiring leases (next 90 days)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + 90);
  const expiringLeases = leases.filter((l) => {
    if (l.status !== "active") return false;
    const end = new Date(l.endDate);
    return end >= now && end <= cutoff;
  }).length;

  res.json({
    data: {
      properties: {
        total: properties.length,
        active: properties.filter((p) => p.status === "active").length,
      },
      units: {
        total: totalUnits,
        occupied: occupiedUnits,
        vacant: totalUnits - occupiedUnits,
        occupancyRate,
      },
      tenants: {
        total: allTenants.length,
      },
      rent: {
        monthlyExpected: totalExpected,
        monthlyCollected: totalCollected,
        monthlyOutstanding: totalExpected - totalCollected,
        collectionRate,
      },
      financials: {
        monthlyIncome,
        monthlyExpenses,
        monthlyNet: monthlyIncome - monthlyExpenses,
        yearIncome: payments
          .filter((p) => new Date(p.dueDate).getFullYear() === currentYear)
          .reduce((s, p) => s + p.amountPaid, 0),
        yearExpenses: expenses
          .filter((e) => new Date(e.date).getFullYear() === currentYear)
          .reduce((s, e) => s + e.amount, 0),
      },
      alerts: {
        openMaintenance,
        expiringLeases,
        latePayments: monthPayments.filter((p) => p.status === "late").length,
      },
    },
  });
});

export { router as dashboardRouter };
