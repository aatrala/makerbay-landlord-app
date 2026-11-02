import { Hono } from "hono";
import type { AppEnv } from "../env.js";
import { z } from "zod";
import { partialUpdate } from "../lib/zod.js";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { maintenanceRequest, property } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const router = new Hono<AppEnv>();
router.use("*", authMiddleware);

const maintenanceSchema = z.object({
  unitId: z.string().uuid(),
  propertyId: z.string().uuid(),
  tenantId: z.string().uuid().nullable().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(["emergency", "urgent", "routine"]).default("routine"),
  status: z.enum(["submitted", "acknowledged", "in_progress", "completed"]).default("submitted"),
  photos: z.array(z.string()).default([]),
  completionPhotos: z.array(z.string()).default([]),
  vendorId: z.string().uuid().nullable().optional(),
  cost: z.number().nullable().optional(),
});

// GET /api/maintenance
router.get("/", async (c) => {
  const userId = c.get("userId");
  const userProperties = await db.query.property.findMany({
    where: eq(property.userId, userId),
    columns: { id: true },
  });
  const propertyIds = new Set(userProperties.map((p) => p.id));

  const requests = await db.query.maintenanceRequest.findMany({
    with: { unit: true, tenant: true },
  });
  const filtered = requests.filter((r) => propertyIds.has(r.propertyId));

  const { status, priority } = c.req.query();
  let result = filtered;
  if (status) result = result.filter((r) => r.status === status);
  if (priority) result = result.filter((r) => r.priority === priority);

  return c.json({ data: result });
});

// GET /api/maintenance/:id
router.get("/:id", async (c) => {
  const r = await db.query.maintenanceRequest.findFirst({
    where: eq(maintenanceRequest.id, c.req.param("id")),
    with: { unit: true, tenant: true, vendor: true },
  });
  if (!r) return c.json({ message: "Not found", code: "NOT_FOUND" }, 404);
  return c.json({ data: r });
});

// POST /api/maintenance — landlord or tenant submits
router.post("/", async (c) => {
  const parsed = maintenanceSchema.safeParse(c.get("body"));
  if (!parsed.success) return c.json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() }, 400);

  const [created] = await db
    .insert(maintenanceRequest)
    .values({ ...parsed.data, submittedAt: new Date() })
    .returning();
  return c.json({ data: created }, 201);
});

// PUT /api/maintenance/:id — update status, add completion photos
router.put("/:id", async (c) => {
  const parsed = partialUpdate(maintenanceSchema).safeParse(c.get("body"));
  if (!parsed.success) return c.json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() }, 400);

  const existing = await db.query.maintenanceRequest.findFirst({
    where: eq(maintenanceRequest.id, c.req.param("id")),
  });
  if (!existing) return c.json({ message: "Not found", code: "NOT_FOUND" }, 404);

  const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.status === "completed") {
    updates.completedAt = new Date();
  }

  const [updated] = await db
    .update(maintenanceRequest)
    .set(updates)
    .where(eq(maintenanceRequest.id, c.req.param("id")))
    .returning();
  return c.json({ data: updated });
});

// DELETE /api/maintenance/:id
router.delete("/:id", async (c) => {
  const existing = await db.query.maintenanceRequest.findFirst({
    where: eq(maintenanceRequest.id, c.req.param("id")),
  });
  if (!existing) return c.json({ message: "Not found", code: "NOT_FOUND" }, 404);
  await db.delete(maintenanceRequest).where(eq(maintenanceRequest.id, c.req.param("id")));
  return c.json({ message: "Deleted" });
});

export { router as maintenanceRouter };
