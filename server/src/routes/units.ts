import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { unit, property } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const router = Router();
router.use(authMiddleware);

const createUnitSchema = z.object({
  propertyId: z.string().uuid(),
  unitNumber: z.string().min(1),
  rentAmount: z.number().min(0),
  status: z.enum(["occupied", "vacant", "under_renovation"]).default("vacant"),
  bedrooms: z.number().int().nullable().optional(),
  bathrooms: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const updateUnitSchema = createUnitSchema.partial().omit({ propertyId: true });

// GET /api/units?propertyId=xxx — list units (optionally by property)
router.get("/", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const propertyId = req.query.propertyId as string | undefined;

  const userProperties = await db.query.property.findMany({
    where: eq(property.userId, userId),
    columns: { id: true },
  });
  const propertyIds = userProperties.map((p) => p.id);

  const conditions = propertyId
    ? and(eq(unit.propertyId, propertyId), eq(unit.propertyId, propertyId))
    : propertyIds.length > 0
      ? undefined // We'll filter below
      : undefined;

  const allUnits = await db.query.unit.findMany({
    where: conditions,
  });

  // Filter to only user's properties
  const filtered = propertyId
    ? allUnits
    : allUnits.filter((u) => propertyIds.includes(u.propertyId));

  res.json({ data: filtered });
});

// GET /api/units/:id
router.get("/:id", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const u = await db.query.unit.findFirst({
    where: eq(unit.id, (req.params.id as string)),
    with: { property: true },
  });

  if (!u || (u as any).property.userId !== userId) {
    return res.status(404).json({ message: "Not found", code: "NOT_FOUND" });
  }

  res.json({ data: u });
});

// POST /api/units
router.post("/", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const parsed = createUnitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() });

  // Verify property ownership
  const prop = await db.query.property.findFirst({
    where: (p, { and }) =>
      and(eq(p.id, parsed.data.propertyId), eq(p.userId, userId)),
  });
  if (!prop) return res.status(404).json({ message: "Property not found", code: "NOT_FOUND" });

  const [created] = await db.insert(unit).values(parsed.data).returning();
  res.status(201).json({ data: created });
});

// PUT /api/units/:id
router.put("/:id", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const parsed = updateUnitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() });

  const existing = await db.query.unit.findFirst({
    where: eq(unit.id, (req.params.id as string)),
    with: { property: true },
  });
  if (!existing || (existing as any).property.userId !== userId) {
    return res.status(404).json({ message: "Not found", code: "NOT_FOUND" });
  }

  const [updated] = await db
    .update(unit)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(unit.id, (req.params.id as string)))
    .returning();

  res.json({ data: updated });
});

// DELETE /api/units/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const existing = await db.query.unit.findFirst({
    where: eq(unit.id, (req.params.id as string)),
    with: { property: true },
  });
  if (!existing || (existing as any).property.userId !== userId) {
    return res.status(404).json({ message: "Not found", code: "NOT_FOUND" });
  }

  await db.delete(unit).where(eq(unit.id, (req.params.id as string)));
  res.json({ message: "Deleted" });
});

export { router as unitsRouter };
