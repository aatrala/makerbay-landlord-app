import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { vendor } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const router = Router();
router.use(authMiddleware);

const vendorSchema = z.object({
  name: z.string().min(1),
  trade: z.string().min(1),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  insuranceExpiry: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// GET /api/vendors
router.get("/", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const vendors = await db.query.vendor.findMany({
    where: eq(vendor.userId, userId),
    orderBy: (v, { asc }) => [asc(v.name)],
  });
  res.json({ data: vendors });
});

// POST /api/vendors
router.post("/", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const parsed = vendorSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() });

  const [created] = await db.insert(vendor).values({ userId, ...parsed.data }).returning();
  res.status(201).json({ data: created });
});

// PUT /api/vendors/:id
router.put("/:id", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const parsed = vendorSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() });

  const existing = await db.query.vendor.findFirst({
    where: (v, { and }) => and(eq(v.id, (req.params.id as string)), eq(v.userId, userId)),
  });
  if (!existing) return res.status(404).json({ message: "Not found", code: "NOT_FOUND" });

  const [updated] = await db
    .update(vendor)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(vendor.id, (req.params.id as string)))
    .returning();
  res.json({ data: updated });
});

// DELETE /api/vendors/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const existing = await db.query.vendor.findFirst({
    where: (v, { and }) => and(eq(v.id, (req.params.id as string)), eq(v.userId, userId)),
  });
  if (!existing) return res.status(404).json({ message: "Not found", code: "NOT_FOUND" });
  await db.delete(vendor).where(eq(vendor.id, (req.params.id as string)));
  res.json({ message: "Deleted" });
});

export { router as vendorsRouter };
