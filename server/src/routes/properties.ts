import { Hono } from "hono";
import type { AppEnv } from "../env.js";
import { z } from "zod";
import { partialUpdate } from "../lib/zod.js";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { property, unit } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const router = new Hono<AppEnv>();
router.use("*", authMiddleware);

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

const updatePropertySchema = partialUpdate(createPropertySchema);

// GET /api/properties — list all properties for user
router.get("/", async (c) => {
  const userId = c.get("userId");
  const properties = await db.query.property.findMany({
    where: eq(property.userId, userId),
    with: { units: true },
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  });
  return c.json({ data: properties });
});

// GET /api/properties/:id — get single property
router.get("/:id", async (c) => {
  const userId = c.get("userId");
  const p = await db.query.property.findFirst({
    where: (prop, { and }) =>
      and(eq(prop.id, c.req.param("id")), eq(prop.userId, userId)),
    with: { units: true },
  });
  if (!p) return c.json({ message: "Not found", code: "NOT_FOUND" }, 404);
  return c.json({ data: p });
});

// POST /api/properties — create property
router.post("/", async (c) => {
  const userId = c.get("userId");
  const parsed = createPropertySchema.safeParse(c.get("body"));
  if (!parsed.success) return c.json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() }, 400);

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

  return c.json({ data: created }, 201);
});

// PUT /api/properties/:id — update property
router.put("/:id", async (c) => {
  const userId = c.get("userId");
  const parsed = updatePropertySchema.safeParse(c.get("body"));
  if (!parsed.success) return c.json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() }, 400);

  const existing = await db.query.property.findFirst({
    where: (p, { and }) => and(eq(p.id, c.req.param("id")), eq(p.userId, userId)),
  });
  if (!existing) return c.json({ message: "Not found", code: "NOT_FOUND" }, 404);

  const [updated] = await db
    .update(property)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(property.id, c.req.param("id")))
    .returning();

  return c.json({ data: updated });
});

// DELETE /api/properties/:id — delete property
router.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const existing = await db.query.property.findFirst({
    where: (p, { and }) => and(eq(p.id, c.req.param("id")), eq(p.userId, userId)),
  });
  if (!existing) return c.json({ message: "Not found", code: "NOT_FOUND" }, 404);

  await db.delete(property).where(eq(property.id, c.req.param("id")));
  return c.json({ message: "Deleted" });
});

export { router as propertiesRouter };
