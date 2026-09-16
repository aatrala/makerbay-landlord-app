import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { payment, unit, property, tenant as tenantTable } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const router = Router();
router.use(authMiddleware);

const paymentSchema = z.object({
  unitId: z.string().uuid(),
  tenantId: z.string().uuid(),
  amount: z.number().min(0),
  amountPaid: z.number().min(0).default(0),
  dueDate: z.string().min(1),
  paidDate: z.string().nullable().optional(),
  method: z.enum(["cash", "check", "zelle", "venmo", "ach", "card", "bank_transfer", "other"]).nullable().optional(),
  status: z.enum(["pending", "received", "late", "partial"]).default("pending"),
  lateFee: z.number().min(0).default(0),
  notes: z.string().nullable().optional(),
});

// GET /api/payments
router.get("/", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const { month, year, status, unitId } = req.query;

  const userProperties = await db.query.property.findMany({
    where: eq(property.userId, userId),
    columns: { id: true },
  });
  const propertyIds = new Set(userProperties.map((p) => p.id));
  const allUnits = await db.query.unit.findMany();
  const validUnitIds = new Set(
    allUnits.filter((u) => propertyIds.has(u.propertyId)).map((u) => u.id),
  );

  const payments = await db.query.payment.findMany({
    with: { unit: true, tenant: true },
  });

  let filtered = payments.filter((p) => validUnitIds.has(p.unitId));

  if (month && year) {
    filtered = filtered.filter((p) => {
      const d = new Date(p.dueDate);
      return d.getMonth() + 1 === Number(month) && d.getFullYear() === Number(year);
    });
  }
  if (status) {
    filtered = filtered.filter((p) => p.status === status);
  }
  if (unitId) {
    filtered = filtered.filter((p) => p.unitId === unitId);
  }

  res.json({ data: filtered });
});

// GET /api/payments/summary — monthly rent collection summary
router.get("/summary", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();

  const userProperties = await db.query.property.findMany({
    where: eq(property.userId, userId),
    columns: { id: true },
  });
  const propertyIds = new Set(userProperties.map((p) => p.id));
  const allUnits = await db.query.unit.findMany();
  const validUnitIds = new Set(
    allUnits.filter((u) => propertyIds.has(u.propertyId)).map((u) => u.id),
  );

  const payments = await db.query.payment.findMany();
  const monthPayments = payments.filter((p) => {
    if (!validUnitIds.has(p.unitId)) return false;
    const d = new Date(p.dueDate);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  const totalExpected = monthPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalCollected = monthPayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const totalOutstanding = totalExpected - totalCollected;
  const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

  res.json({
    data: {
      totalExpected,
      totalCollected,
      totalOutstanding,
      collectionRate: Math.round(collectionRate * 100) / 100,
      paymentCount: monthPayments.length,
      receivedCount: monthPayments.filter((p) => p.status === "received").length,
      lateCount: monthPayments.filter((p) => p.status === "late").length,
      pendingCount: monthPayments.filter((p) => p.status === "pending").length,
    },
  });
});

// POST /api/payments
router.post("/", async (req: Request, res: Response) => {
  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() });

  const [created] = await db.insert(payment).values(parsed.data).returning();
  res.status(201).json({ data: created });
});

// PUT /api/payments/:id — record payment / update status
router.put("/:id", async (req: Request, res: Response) => {
  const parsed = paymentSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() });

  const existing = await db.query.payment.findFirst({ where: eq(payment.id, (req.params.id as string)) });
  if (!existing) return res.status(404).json({ message: "Not found", code: "NOT_FOUND" });

  const [updated] = await db
    .update(payment)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(payment.id, (req.params.id as string)))
    .returning();
  res.json({ data: updated });
});

// DELETE /api/payments/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const existing = await db.query.payment.findFirst({ where: eq(payment.id, (req.params.id as string)) });
  if (!existing) return res.status(404).json({ message: "Not found", code: "NOT_FOUND" });
  await db.delete(payment).where(eq(payment.id, (req.params.id as string)));
  res.json({ message: "Deleted" });
});

export { router as paymentsRouter };
