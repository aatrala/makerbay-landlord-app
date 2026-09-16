import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { property, unit } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const router = Router();
router.use(authMiddleware);

const createPropertySchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  type: z.enum(["single_family", "duplex", "multifamily", "condo", "townhouse"]),
  unitCount: z.number().int().min(1).default(1),
  status: z.enum(["active", "vacant", "under_renovation"]).default("active"),
  notes: z.string().nullable().optional(),
});

const updatePropertySchema = createPropertySchema.partial();

// GET /api/properties — list all properties for user
router.get("/", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const properties = await db.query.property.findMany({
    where: eq(property.userId, userId),
    with: { units: true },
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  });
  res.json({ data: properties });
});

// GET /api/properties/:id — get single property
router.get("/:id", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const p = await db.query.property.findFirst({
    where: (prop, { and }) =>
      and(eq(prop.id, (req.params.id as string)), eq(prop.userId, userId)),
    with: { units: true },
  });
  if (!p) return res.status(404).json({ message: "Not found", code: "NOT_FOUND" });
  res.json({ data: p });
});

// POST /api/properties — create property
router.post("/", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const parsed = createPropertySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() });

  const [created] = await db
    .insert(property)
    .values({ userId, ...parsed.data })
    .returning();

  // Auto-create units based on unitCount
  if (parsed.data.unitCount > 0) {
    const units = Array.from({ length: parsed.data.unitCount }, (_, i) => ({
      propertyId: created.id,
      unitNumber: String(i + 1),
      rentAmount: 0,
      status: "vacant" as const,
    }));
    await db.insert(unit).values(units);
  }

  res.status(201).json({ data: created });
});

// PUT /api/properties/:id — update property
router.put("/:id", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const parsed = updatePropertySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() });

  const existing = await db.query.property.findFirst({
    where: (p, { and }) => and(eq(p.id, (req.params.id as string)), eq(p.userId, userId)),
  });
  if (!existing) return res.status(404).json({ message: "Not found", code: "NOT_FOUND" });

  const [updated] = await db
    .update(property)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(property.id, (req.params.id as string)))
    .returning();

  res.json({ data: updated });
});

// DELETE /api/properties/:id — delete property
router.delete("/:id", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const existing = await db.query.property.findFirst({
    where: (p, { and }) => and(eq(p.id, (req.params.id as string)), eq(p.userId, userId)),
  });
  if (!existing) return res.status(404).json({ message: "Not found", code: "NOT_FOUND" });

  await db.delete(property).where(eq(property.id, (req.params.id as string)));
  res.json({ message: "Deleted" });
});

export { router as propertiesRouter };
