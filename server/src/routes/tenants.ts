import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { tenant, user } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const router = Router();
router.use(authMiddleware);

const tenantSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  emergencyContactName: z.string().nullable().optional(),
  emergencyContactPhone: z.string().nullable().optional(),
  employer: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// GET /api/tenants
router.get("/", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const tenants = await db.query.tenant.findMany({
    where: eq(tenant.userId, userId),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
  res.json({ data: tenants });
});

// GET /api/tenants/:id
router.get("/:id", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const t = await db.query.tenant.findFirst({
    where: (t, { and }) => and(eq(t.id, (req.params.id as string)), eq(t.userId, userId)),
  });
  if (!t) return res.status(404).json({ message: "Not found", code: "NOT_FOUND" });
  res.json({ data: t });
});

// POST /api/tenants
router.post("/", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const parsed = tenantSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() });

  const [created] = await db.insert(tenant).values({ userId, ...parsed.data }).returning();
  res.status(201).json({ data: created });
});

// PUT /api/tenants/:id
router.put("/:id", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const parsed = tenantSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() });

  const existing = await db.query.tenant.findFirst({
    where: (t, { and }) => and(eq(t.id, (req.params.id as string)), eq(t.userId, userId)),
  });
  if (!existing) return res.status(404).json({ message: "Not found", code: "NOT_FOUND" });

  const [updated] = await db
    .update(tenant)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(tenant.id, (req.params.id as string)))
    .returning();
  res.json({ data: updated });
});

// DELETE /api/tenants/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const existing = await db.query.tenant.findFirst({
    where: (t, { and }) => and(eq(t.id, (req.params.id as string)), eq(t.userId, userId)),
  });
  if (!existing) return res.status(404).json({ message: "Not found", code: "NOT_FOUND" });
  await db.delete(tenant).where(eq(tenant.id, (req.params.id as string)));
  res.json({ message: "Deleted" });
});

// POST /api/tenants/:id/activate-portal — link tenant record to a user account by email
router.post("/:id/activate-portal", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const schema = z.object({ email: z.string().email() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() });
  }

  // Verify tenant ownership
  const existing = await db.query.tenant.findFirst({
    where: (t, { and }) => and(eq(t.id, (req.params.id as string)), eq(t.userId, userId)),
  });
  if (!existing) return res.status(404).json({ message: "Tenant not found", code: "NOT_FOUND" });

  // Look up user by email
  const tenantUser = await db.query.user.findFirst({
    where: eq(user.email, parsed.data.email),
  });

  if (!tenantUser) {
    return res.status(404).json({
      message: "No user found with that email. The tenant must sign up first, then the landlord can activate the portal.",
      code: "USER_NOT_FOUND",
    });
  }

  // Link tenant to user
  const [updated] = await db
    .update(tenant)
    .set({ tenantUserId: tenantUser.id, updatedAt: new Date() })
    .where(eq(tenant.id, (req.params.id as string)))
    .returning();

  res.json({
    data: {
      tenantId: updated.id,
      tenantUserId: updated.tenantUserId,
      message: `Tenant portal activated for ${parsed.data.email}`,
    },
  });
});

export { router as tenantsRouter };
