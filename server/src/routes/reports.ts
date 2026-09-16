import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { property, unit, payment, expense } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const router = Router();
router.use(authMiddleware);

// Schedule E line-item mapping
const SCHEDULE_E_LINES: Record<string, { line: number; description: string }> = {
  advertising: { line: 5, description: "Advertising" },
  auto_travel: { line: 6, description: "Auto and travel" },
  cleaning: { line: 7, description: "Cleaning and maintenance" },
  insurance: { line: 9, description: "Insurance" },
  legal_professional: { line: 10, description: "Legal and other professional fees" },
  management: { line: 11, description: "Management fees" },
  mortgage_interest: { line: 12, description: "Mortgage interest paid to banks" },
  other_interest: { line: 13, description: "Other interest" },
  repairs: { line: 14, description: "Repairs" },
  supplies: { line: 15, description: "Supplies" },
  taxes: { line: 16, description: "Taxes" },
  utilities: { line: 17, description: "Utilities" },
  depreciation: { line: 18, description: "Depreciation expense or depletion" },
  other: { line: 19, description: "Other" },
};

// GET /api/reports/cashflow — monthly cash flow per property
router.get("/cashflow", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const year = Number(req.query.year) || new Date().getFullYear();

  const properties = await db.query.property.findMany({
    where: eq(property.userId, userId),
  });

  const allExpenses = await db.query.expense.findMany();
  const allPayments = await db.query.payment.findMany();
  const allUnits = await db.query.unit.findMany();

  const unitPropertyMap = new Map(allUnits.map((u) => [u.id, u.propertyId]));

  const result = properties.map((prop) => {
    const propUnits = allUnits.filter((u) => u.propertyId === prop.id);
    const unitIds = new Set(propUnits.map((u) => u.id));

    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;

      const monthIncome = allPayments
        .filter((p) => unitIds.has(p.unitId) && new Date(p.dueDate).getFullYear() === year && new Date(p.dueDate).getMonth() + 1 === month)
        .reduce((sum, p) => sum + p.amountPaid, 0);

      const monthExpenses = allExpenses
        .filter((e) => e.propertyId === prop.id && new Date(e.date).getFullYear() === year && new Date(e.date).getMonth() + 1 === month)
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        month: new Date(year, i, 1).toISOString().slice(0, 7),
        income: monthIncome,
        expenses: monthExpenses,
        net: monthIncome - monthExpenses,
      };
    });

    return {
      propertyId: prop.id,
      propertyName: prop.name,
      monthly: monthlyData,
      totalIncome: monthlyData.reduce((s, m) => s + m.income, 0),
      totalExpenses: monthlyData.reduce((s, m) => s + m.expenses, 0),
      netIncome: monthlyData.reduce((s, m) => s + m.net, 0),
    };
  });

  res.json({ data: result });
});

// GET /api/reports/schedule-e — Schedule E helper
router.get("/schedule-e", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const year = Number(req.query.year) || new Date().getFullYear();

  const properties = await db.query.property.findMany({
    where: eq(property.userId, userId),
  });

  const allExpenses = await db.query.expense.findMany();
  const allPayments = await db.query.payment.findMany();

  const result = await Promise.all(properties.map(async (prop) => {
    const propExpenses = allExpenses.filter(
      (e) => e.propertyId === prop.id && new Date(e.date).getFullYear() === year,
    );

    // Group by category
    const byCategory: Record<string, number> = {};
    propExpenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });

    const lineItems = Object.entries(byCategory).map(([category, amount]) => ({
      category,
      line: SCHEDULE_E_LINES[category]?.line || 19,
      description: SCHEDULE_E_LINES[category]?.description || "Other",
      amount,
    }));

    // Total rent received
    const totalRent = allPayments
      .filter((p) => {
        const d = new Date(p.paidDate || p.dueDate);
        return d.getFullYear() === year;
      })
      .reduce((sum, p) => sum + p.amountPaid, 0);

    return {
      propertyId: prop.id,
      propertyName: prop.name,
      address: `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip}`,
      rentReceived: totalRent,
      lineItems: lineItems.sort((a, b) => a.line - b.line),
      totalExpenses: lineItems.reduce((s, l) => s + l.amount, 0),
      netIncome: totalRent - lineItems.reduce((s, l) => s + l.amount, 0),
    };
  }));

  res.json({ data: result });
});

// GET /api/reports/pnl — profit & loss per property
router.get("/pnl", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const year = Number(req.query.year) || new Date().getFullYear();
  const quarter = req.query.quarter ? Number(req.query.quarter) : undefined;

  const properties = await db.query.property.findMany({
    where: eq(property.userId, userId),
  });
  const allUnits = await db.query.unit.findMany();
  const allPayments = await db.query.payment.findMany();
  const allExpenses = await db.query.expense.findMany();

  const unitPropertyMap = new Map(allUnits.map((u) => [u.id, u.propertyId]));

  const result = properties.map((prop) => {
    const propUnits = allUnits.filter((u) => u.propertyId === prop.id);
    const unitIds = new Set(propUnits.map((u) => u.id));

    const payments = allPayments.filter((p) => {
      if (!unitIds.has(p.unitId)) return false;
      const d = new Date(p.paidDate || p.dueDate);
      if (d.getFullYear() !== year) return false;
      if (quarter) {
        const q = Math.floor(d.getMonth() / 3) + 1;
        return q === quarter;
      }
      return true;
    });

    const expenses = allExpenses.filter((e) => {
      if (e.propertyId !== prop.id) return false;
      const d = new Date(e.date);
      if (d.getFullYear() !== year) return false;
      if (quarter) {
        const q = Math.floor(d.getMonth() / 3) + 1;
        return q === quarter;
      }
      return true;
    });

    return {
      propertyId: prop.id,
      propertyName: prop.name,
      totalIncome: payments.reduce((s, p) => s + p.amountPaid, 0),
      totalExpenses: expenses.reduce((s, e) => s + e.amount, 0),
      netIncome: payments.reduce((s, p) => s + p.amountPaid, 0) - expenses.reduce((s, e) => s + e.amount, 0),
      period: quarter ? `${year} Q${quarter}` : `${year}`,
    };
  });

  res.json({ data: result });
});

export { router as reportsRouter };
