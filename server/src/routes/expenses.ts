import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { expense, property } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const router = Router();
router.use(authMiddleware);

const expenseSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid().nullable().optional(),
  category: z.enum([
    "advertising", "auto_travel", "cleaning", "insurance",
    "legal_professional", "management", "mortgage_interest",
    "other_interest", "repairs", "supplies", "taxes",
    "utilities", "depreciation", "other",
  ]),
  description: z.string().min(1),
  amount: z.number().min(0),
  date: z.string().min(1),
  vendor: z.string().nullable().optional(),
  receiptUrl: z.string().nullable().optional(),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.enum(["monthly", "quarterly", "annually"]).nullable().optional(),
  notes: z.string().nullable().optional(),
});

// GET /api/expenses
router.get("/", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const { propertyId, category, year, month } = req.query;

  const userProperties = await db.query.property.findMany({
    where: eq(property.userId, userId),
    columns: { id: true },
  });
  const propertyIds = new Set(userProperties.map((p) => p.id));

  const expenses = await db.query.expense.findMany();
  let filtered = expenses.filter((e) => propertyIds.has(e.propertyId));

  if (propertyId) filtered = filtered.filter((e) => e.propertyId === propertyId);
  if (category) filtered = filtered.filter((e) => e.category === category);
  if (year) {
    filtered = filtered.filter((e) => new Date(e.date).getFullYear() === Number(year));
  }
  if (month) {
    filtered = filtered.filter((e) => new Date(e.date).getMonth() + 1 === Number(month));
  }

  res.json({ data: filtered });
});

// GET /api/expenses/:id
router.get("/:id", async (req: Request, res: Response) => {
  const e = await db.query.expense.findFirst({
    where: eq(expense.id, (req.params.id as string)),
  });
  if (!e) return res.status(404).json({ message: "Not found", code: "NOT_FOUND" });
  res.json({ data: e });
});

// POST /api/expenses
router.post("/", async (req: Request, res: Response) => {
  const parsed = expenseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() });

  // Verify property ownership
  const userId = (req as any).userId as string;
  const prop = await db.query.property.findFirst({
    where: and(eq(property.id, parsed.data.propertyId), eq(property.userId, userId)),
  });
  if (!prop) return res.status(404).json({ message: "Property not found", code: "NOT_FOUND" });

  const [created] = await db.insert(expense).values(parsed.data).returning();
  res.status(201).json({ data: created });
});

// PUT /api/expenses/:id
router.put("/:id", async (req: Request, res: Response) => {
  const parsed = expenseSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() });

  const existing = await db.query.expense.findFirst({ where: eq(expense.id, (req.params.id as string)) });
  if (!existing) return res.status(404).json({ message: "Not found", code: "NOT_FOUND" });

  const [updated] = await db
    .update(expense)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(expense.id, (req.params.id as string)))
    .returning();
  res.json({ data: updated });
});

// DELETE /api/expenses/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const existing = await db.query.expense.findFirst({ where: eq(expense.id, (req.params.id as string)) });
  if (!existing) return res.status(404).json({ message: "Not found", code: "NOT_FOUND" });
  await db.delete(expense).where(eq(expense.id, (req.params.id as string)));
  res.json({ message: "Deleted" });
});

export { router as expensesRouter };
