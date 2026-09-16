import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { lease, unit, property, tenant as tenantTable } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const router = Router();
router.use(authMiddleware);

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
router.get("/", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
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

  res.json({ data: filtered });
});

// GET /api/leases/expiring — leases expiring within N days
router.get("/expiring", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const days = Number(req.query.days) || 90;
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

  res.json({ data: expiring });
});

// GET /api/leases/:id
router.get("/:id", async (req: Request, res: Response) => {
  const l = await db.query.lease.findFirst({
    where: eq(lease.id, (req.params.id as string)),
    with: { unit: true, tenant: true },
  });
  if (!l) return res.status(404).json({ message: "Not found", code: "NOT_FOUND" });
  res.json({ data: l });
});

// POST /api/leases
router.post("/", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const parsed = leaseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() });

  // Verify unit and tenant ownership
  const u = await db.query.unit.findFirst({
    where: eq(unit.id, parsed.data.unitId),
    with: { property: true },
  });
  if (!u || (u as any).property.userId !== userId) {
    return res.status(404).json({ message: "Unit not found", code: "NOT_FOUND" });
  }

  const t = await db.query.tenant.findFirst({
    where: and(eq(tenantTable.id, parsed.data.tenantId), eq(tenantTable.userId, userId)),
  });
  if (!t) return res.status(404).json({ message: "Tenant not found", code: "NOT_FOUND" });

  const [created] = await db.insert(lease).values(parsed.data).returning();

  // Update unit status to occupied
  await db.update(unit).set({ status: "occupied" }).where(eq(unit.id, parsed.data.unitId));

  res.status(201).json({ data: created });
});

// PUT /api/leases/:id
router.put("/:id", async (req: Request, res: Response) => {
  const parsed = leaseSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() });

  const existing = await db.query.lease.findFirst({ where: eq(lease.id, (req.params.id as string)) });
  if (!existing) return res.status(404).json({ message: "Not found", code: "NOT_FOUND" });

  const [updated] = await db
    .update(lease)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(lease.id, (req.params.id as string)))
    .returning();

  // If lease terminated/expired, update unit status
  if (parsed.data.status === "terminated" || parsed.data.status === "expired") {
    await db.update(unit).set({ status: "vacant" }).where(eq(unit.id, existing.unitId));
  }

  res.json({ data: updated });
});

// DELETE /api/leases/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const existing = await db.query.lease.findFirst({ where: eq(lease.id, (req.params.id as string)) });
  if (!existing) return res.status(404).json({ message: "Not found", code: "NOT_FOUND" });
  await db.delete(lease).where(eq(lease.id, (req.params.id as string)));
  res.json({ message: "Deleted" });
});

export { router as leasesRouter };
