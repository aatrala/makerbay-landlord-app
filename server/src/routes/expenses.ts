import { Hono } from "hono";
import type { AppEnv } from "../env.js";
import { z } from "zod";
import { partialUpdate } from "../lib/zod.js";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { expense, property } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const router = new Hono<AppEnv>();
router.use("*", authMiddleware);

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
router.get("/", async (c) => {
  const userId = c.get("userId");
  const { propertyId, category, year, month } = c.req.query();

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

  return c.json({ data: filtered });
});

// GET /api/expenses/:id
router.get("/:id", async (c) => {
  const e = await db.query.expense.findFirst({
    where: eq(expense.id, c.req.param("id")),
  });
  if (!e) return c.json({ message: "Not found", code: "NOT_FOUND" }, 404);
  return c.json({ data: e });
});

// POST /api/expenses
router.post("/", async (c) => {
  const parsed = expenseSchema.safeParse(c.get("body"));
  if (!parsed.success) return c.json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() }, 400);

  // Verify property ownership
  const userId = c.get("userId");
  const prop = await db.query.property.findFirst({
    where: and(eq(property.id, parsed.data.propertyId), eq(property.userId, userId)),
  });
  if (!prop) return c.json({ message: "Property not found", code: "NOT_FOUND" }, 404);

  const [created] = await db.insert(expense).values(parsed.data).returning();
  return c.json({ data: created }, 201);
});

// PUT /api/expenses/:id
router.put("/:id", async (c) => {
  const parsed = partialUpdate(expenseSchema).safeParse(c.get("body"));
  if (!parsed.success) return c.json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() }, 400);

  const existing = await db.query.expense.findFirst({ where: eq(expense.id, c.req.param("id")) });
  if (!existing) return c.json({ message: "Not found", code: "NOT_FOUND" }, 404);

  const [updated] = await db
    .update(expense)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(expense.id, c.req.param("id")))
    .returning();
  return c.json({ data: updated });
});

// DELETE /api/expenses/:id
router.delete("/:id", async (c) => {
  const existing = await db.query.expense.findFirst({ where: eq(expense.id, c.req.param("id")) });
  if (!existing) return c.json({ message: "Not found", code: "NOT_FOUND" }, 404);
  await db.delete(expense).where(eq(expense.id, c.req.param("id")));
  return c.json({ message: "Deleted" });
});

export { router as expensesRouter };
