import { Hono } from "hono";
import type { AppEnv } from "../env.js";
import { z } from "zod";
import { partialUpdate } from "../lib/zod.js";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { unit, property } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const router = new Hono<AppEnv>();
router.use("*", authMiddleware);

const createUnitSchema = z.object({
  propertyId: z.string().uuid(),
  unitNumber: z.string().min(1),
  rentAmount: z.number().min(0),
  status: z.enum(["occupied", "vacant", "under_renovation"]).default("vacant"),
  bedrooms: z.number().int().nullable().optional(),
  bathrooms: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const updateUnitSchema = partialUpdate(createUnitSchema.omit({ propertyId: true }));

// GET /api/units?propertyId=xxx — list units (optionally by property)
router.get("/", async (c) => {
  const userId = c.get("userId");
  const propertyId = c.req.query("propertyId") as string | undefined;

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

  return c.json({ data: filtered });
});

// GET /api/units/:id
router.get("/:id", async (c) => {
  const userId = c.get("userId");
  const u = await db.query.unit.findFirst({
    where: eq(unit.id, c.req.param("id")),
    with: { property: true },
  });

  if (!u || (u as any).property.userId !== userId) {
    return c.json({ message: "Not found", code: "NOT_FOUND" }, 404);
  }

  return c.json({ data: u });
});

// POST /api/units
router.post("/", async (c) => {
  const userId = c.get("userId");
  const parsed = createUnitSchema.safeParse(c.get("body"));
  if (!parsed.success) return c.json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() }, 400);

  // Verify property ownership
  const prop = await db.query.property.findFirst({
    where: (p, { and }) =>
      and(eq(p.id, parsed.data.propertyId), eq(p.userId, userId)),
  });
  if (!prop) return c.json({ message: "Property not found", code: "NOT_FOUND" }, 404);

  const [created] = await db.insert(unit).values(parsed.data).returning();
  return c.json({ data: created }, 201);
});

// PUT /api/units/:id
router.put("/:id", async (c) => {
  const userId = c.get("userId");
  const parsed = updateUnitSchema.safeParse(c.get("body"));
  if (!parsed.success) return c.json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() }, 400);

  const existing = await db.query.unit.findFirst({
    where: eq(unit.id, c.req.param("id")),
    with: { property: true },
  });
  if (!existing || (existing as any).property.userId !== userId) {
    return c.json({ message: "Not found", code: "NOT_FOUND" }, 404);
  }

  const [updated] = await db
    .update(unit)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(unit.id, c.req.param("id")))
    .returning();

  return c.json({ data: updated });
});

// DELETE /api/units/:id
router.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const existing = await db.query.unit.findFirst({
    where: eq(unit.id, c.req.param("id")),
    with: { property: true },
  });
  if (!existing || (existing as any).property.userId !== userId) {
    return c.json({ message: "Not found", code: "NOT_FOUND" }, 404);
  }

  await db.delete(unit).where(eq(unit.id, c.req.param("id")));
  return c.json({ message: "Deleted" });
});

export { router as unitsRouter };
