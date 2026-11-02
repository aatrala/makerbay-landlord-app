import { Hono } from "hono";
import type { AppEnv } from "../env.js";
import { z } from "zod";
import { partialUpdate } from "../lib/zod.js";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { lease, unit, property, tenant as tenantTable } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const router = new Hono<AppEnv>();
router.use("*", authMiddleware);

const leaseSchema = z.object({
  unitId: z.string().uuid(),
  tenantId: z.string().uuid(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  rentAmount: z.number().min(0),
  deposit: z.number().nullable().optional(),
  terms: z.string().nullable().optional(),
  documentUrl: z.string().nullable().optional(),
  status: z.enum(["active", "expired", "terminated"]).default("active"),
});

// GET /api/leases
router.get("/", async (c) => {
  const userId = c.get("userId");
  const leases = await db.query.lease.findMany({
    with: { unit: true, tenant: true },
  });

  // Filter to user's properties
  const userProperties = await db.query.property.findMany({
    where: eq(property.userId, userId),
    columns: { id: true },
  });
  const propertyIds = new Set(userProperties.map((p) => p.id));

  const userUnits = await db.query.unit.findMany();
  const unitPropertyMap = new Map(userUnits.map((u) => [u.id, u.propertyId]));

  const filtered = leases.filter((l) => {
    const propId = unitPropertyMap.get(l.unitId);
    return propId && propertyIds.has(propId);
  });

  return c.json({ data: filtered });
});

// GET /api/leases/expiring — leases expiring within N days
router.get("/expiring", async (c) => {
  const userId = c.get("userId");
  const days = Number(c.req.query("days")) || 90;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);

  const allLeases = await db.query.lease.findMany({
    where: eq(lease.status, "active"),
    with: { unit: true, tenant: true },
  });

  const userProperties = await db.query.property.findMany({
    where: eq(property.userId, userId),
    columns: { id: true },
  });
  const propertyIds = new Set(userProperties.map((p) => p.id));
  const userUnits = await db.query.unit.findMany();
  const unitPropertyMap = new Map(userUnits.map((u) => [u.id, u.propertyId]));

  const expiring = allLeases.filter((l) => {
    const propId = unitPropertyMap.get(l.unitId);
    if (!propId || !propertyIds.has(propId)) return false;
    const endDate = new Date(l.endDate);
    return endDate <= cutoff && endDate >= new Date();
  });

  return c.json({ data: expiring });
});

// GET /api/leases/:id
router.get("/:id", async (c) => {
  const l = await db.query.lease.findFirst({
    where: eq(lease.id, c.req.param("id")),
    with: { unit: true, tenant: true },
  });
  if (!l) return c.json({ message: "Not found", code: "NOT_FOUND" }, 404);
  return c.json({ data: l });
});

// POST /api/leases
router.post("/", async (c) => {
  const userId = c.get("userId");
  const parsed = leaseSchema.safeParse(c.get("body"));
  if (!parsed.success) return c.json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() }, 400);

  // Verify unit and tenant ownership
  const u = await db.query.unit.findFirst({
    where: eq(unit.id, parsed.data.unitId),
    with: { property: true },
  });
  if (!u || (u as any).property.userId !== userId) {
    return c.json({ message: "Unit not found", code: "NOT_FOUND" }, 404);
  }

  const t = await db.query.tenant.findFirst({
    where: and(eq(tenantTable.id, parsed.data.tenantId), eq(tenantTable.userId, userId)),
  });
  if (!t) return c.json({ message: "Tenant not found", code: "NOT_FOUND" }, 404);

  const [created] = await db.insert(lease).values(parsed.data).returning();

  // Update unit status to occupied
  await db.update(unit).set({ status: "occupied" }).where(eq(unit.id, parsed.data.unitId));

  return c.json({ data: created }, 201);
});

// PUT /api/leases/:id
router.put("/:id", async (c) => {
  const parsed = partialUpdate(leaseSchema).safeParse(c.get("body"));
  if (!parsed.success) return c.json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() }, 400);

  const existing = await db.query.lease.findFirst({ where: eq(lease.id, c.req.param("id")) });
  if (!existing) return c.json({ message: "Not found", code: "NOT_FOUND" }, 404);

  const [updated] = await db
    .update(lease)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(lease.id, c.req.param("id")))
    .returning();

  // If lease terminated/expired, update unit status
  if (parsed.data.status === "terminated" || parsed.data.status === "expired") {
    await db.update(unit).set({ status: "vacant" }).where(eq(unit.id, existing.unitId));
  }

  return c.json({ data: updated });
});

// DELETE /api/leases/:id
router.delete("/:id", async (c) => {
  const existing = await db.query.lease.findFirst({ where: eq(lease.id, c.req.param("id")) });
  if (!existing) return c.json({ message: "Not found", code: "NOT_FOUND" }, 404);
  await db.delete(lease).where(eq(lease.id, c.req.param("id")));
  return c.json({ message: "Deleted" });
});

export { router as leasesRouter };
