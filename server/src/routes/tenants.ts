import { Hono } from "hono";
import type { AppEnv } from "../env.js";
import { z } from "zod";
import { partialUpdate } from "../lib/zod.js";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { tenant, user } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const router = new Hono<AppEnv>();
router.use("*", authMiddleware);

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
router.get("/", async (c) => {
  const userId = c.get("userId");
  const tenants = await db.query.tenant.findMany({
    where: eq(tenant.userId, userId),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
  return c.json({ data: tenants });
});

// GET /api/tenants/:id
router.get("/:id", async (c) => {
  const userId = c.get("userId");
  const t = await db.query.tenant.findFirst({
    where: (t, { and }) => and(eq(t.id, c.req.param("id")), eq(t.userId, userId)),
  });
  if (!t) return c.json({ message: "Not found", code: "NOT_FOUND" }, 404);
  return c.json({ data: t });
});

// POST /api/tenants
router.post("/", async (c) => {
  const userId = c.get("userId");
  const parsed = tenantSchema.safeParse(c.get("body"));
  if (!parsed.success) return c.json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() }, 400);

  const [created] = await db.insert(tenant).values({ userId, ...parsed.data }).returning();
  return c.json({ data: created }, 201);
});

// PUT /api/tenants/:id
router.put("/:id", async (c) => {
  const userId = c.get("userId");
  const parsed = partialUpdate(tenantSchema).safeParse(c.get("body"));
  if (!parsed.success) return c.json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() }, 400);

  const existing = await db.query.tenant.findFirst({
    where: (t, { and }) => and(eq(t.id, c.req.param("id")), eq(t.userId, userId)),
  });
  if (!existing) return c.json({ message: "Not found", code: "NOT_FOUND" }, 404);

  const [updated] = await db
    .update(tenant)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(tenant.id, c.req.param("id")))
    .returning();
  return c.json({ data: updated });
});

// DELETE /api/tenants/:id
router.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const existing = await db.query.tenant.findFirst({
    where: (t, { and }) => and(eq(t.id, c.req.param("id")), eq(t.userId, userId)),
  });
  if (!existing) return c.json({ message: "Not found", code: "NOT_FOUND" }, 404);
  await db.delete(tenant).where(eq(tenant.id, c.req.param("id")));
  return c.json({ message: "Deleted" });
});

// POST /api/tenants/:id/activate-portal — link tenant record to a user account by email
router.post("/:id/activate-portal", async (c) => {
  const userId = c.get("userId");
  const schema = z.object({ email: z.string().email() });
  const parsed = schema.safeParse(c.get("body"));
  if (!parsed.success) {
    return c.json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() }, 400);
  }

  // Verify tenant ownership
  const existing = await db.query.tenant.findFirst({
    where: (t, { and }) => and(eq(t.id, c.req.param("id")), eq(t.userId, userId)),
  });
  if (!existing) return c.json({ message: "Tenant not found", code: "NOT_FOUND" }, 404);

  // Look up user by email
  const tenantUser = await db.query.user.findFirst({
    where: eq(user.email, parsed.data.email),
  });

  if (!tenantUser) {
    return c.json({
      message: "No user found with that email. The tenant must sign up first, then the landlord can activate the portal.",
      code: "USER_NOT_FOUND",
    }, 404);
  }

  // Link tenant to user
  const [updated] = await db
    .update(tenant)
    .set({ tenantUserId: tenantUser.id, updatedAt: new Date() })
    .where(eq(tenant.id, c.req.param("id")))
    .returning();

  return c.json({
    data: {
      tenantId: updated.id,
      tenantUserId: updated.tenantUserId,
      message: `Tenant portal activated for ${parsed.data.email}`,
    },
  });
});

export { router as tenantsRouter };
