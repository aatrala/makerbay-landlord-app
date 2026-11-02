import { Hono } from "hono";
import type { AppEnv } from "../env.js";
import { z } from "zod";
import { partialUpdate } from "../lib/zod.js";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { vendor } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const router = new Hono<AppEnv>();
router.use("*", authMiddleware);

const vendorSchema = z.object({
  name: z.string().min(1),
  trade: z.string().min(1),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  insuranceExpiry: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// GET /api/vendors
router.get("/", async (c) => {
  const userId = c.get("userId");
  const vendors = await db.query.vendor.findMany({
    where: eq(vendor.userId, userId),
    orderBy: (v, { asc }) => [asc(v.name)],
  });
  return c.json({ data: vendors });
});

// POST /api/vendors
router.post("/", async (c) => {
  const userId = c.get("userId");
  const parsed = vendorSchema.safeParse(c.get("body"));
  if (!parsed.success) return c.json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() }, 400);

  const [created] = await db.insert(vendor).values({ userId, ...parsed.data }).returning();
  return c.json({ data: created }, 201);
});

// PUT /api/vendors/:id
router.put("/:id", async (c) => {
  const userId = c.get("userId");
  const parsed = partialUpdate(vendorSchema).safeParse(c.get("body"));
  if (!parsed.success) return c.json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() }, 400);

  const existing = await db.query.vendor.findFirst({
    where: (v, { and }) => and(eq(v.id, c.req.param("id")), eq(v.userId, userId)),
  });
  if (!existing) return c.json({ message: "Not found", code: "NOT_FOUND" }, 404);

  const [updated] = await db
    .update(vendor)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(vendor.id, c.req.param("id")))
    .returning();
  return c.json({ data: updated });
});

// DELETE /api/vendors/:id
router.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const existing = await db.query.vendor.findFirst({
    where: (v, { and }) => and(eq(v.id, c.req.param("id")), eq(v.userId, userId)),
  });
  if (!existing) return c.json({ message: "Not found", code: "NOT_FOUND" }, 404);
  await db.delete(vendor).where(eq(vendor.id, c.req.param("id")));
  return c.json({ message: "Deleted" });
});

export { router as vendorsRouter };
