import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { maintenanceRequest, property } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const router = Router();
router.use(authMiddleware);

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
router.get("/", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const userProperties = await db.query.property.findMany({
    where: eq(property.userId, userId),
    columns: { id: true },
  });
  const propertyIds = new Set(userProperties.map((p) => p.id));

  const requests = await db.query.maintenanceRequest.findMany({
    with: { unit: true, tenant: true },
  });
  const filtered = requests.filter((r) => propertyIds.has(r.propertyId));

  const { status, priority } = req.query;
  let result = filtered;
  if (status) result = result.filter((r) => r.status === status);
  if (priority) result = result.filter((r) => r.priority === priority);

  res.json({ data: result });
});

// GET /api/maintenance/:id
router.get("/:id", async (req: Request, res: Response) => {
  const r = await db.query.maintenanceRequest.findFirst({
    where: eq(maintenanceRequest.id, (req.params.id as string)),
    with: { unit: true, tenant: true, vendor: true },
  });
  if (!r) return res.status(404).json({ message: "Not found", code: "NOT_FOUND" });
  res.json({ data: r });
});

// POST /api/maintenance — landlord or tenant submits
router.post("/", async (req: Request, res: Response) => {
  const parsed = maintenanceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() });

  const [created] = await db
    .insert(maintenanceRequest)
    .values({ ...parsed.data, submittedAt: new Date() })
    .returning();
  res.status(201).json({ data: created });
});

// PUT /api/maintenance/:id — update status, add completion photos
router.put("/:id", async (req: Request, res: Response) => {
  const parsed = maintenanceSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() });

  const existing = await db.query.maintenanceRequest.findFirst({
    where: eq(maintenanceRequest.id, (req.params.id as string)),
  });
  if (!existing) return res.status(404).json({ message: "Not found", code: "NOT_FOUND" });

  const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.status === "completed") {
    updates.completedAt = new Date();
  }

  const [updated] = await db
    .update(maintenanceRequest)
    .set(updates)
    .where(eq(maintenanceRequest.id, (req.params.id as string)))
    .returning();
  res.json({ data: updated });
});

// DELETE /api/maintenance/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const existing = await db.query.maintenanceRequest.findFirst({
    where: eq(maintenanceRequest.id, (req.params.id as string)),
  });
  if (!existing) return res.status(404).json({ message: "Not found", code: "NOT_FOUND" });
  await db.delete(maintenanceRequest).where(eq(maintenanceRequest.id, (req.params.id as string)));
  res.json({ message: "Deleted" });
});

export { router as maintenanceRouter };
