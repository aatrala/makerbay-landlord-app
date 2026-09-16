import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  tenant as tenantTable,
  lease,
  unit,
  property,
  payment,
  maintenanceRequest,
} from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const router = Router();
router.use(authMiddleware);

/**
 * Tenant portal routes — accessed by the tenant's own user account.
 * The tenant's user.id is matched against tenant.tenantUserId.
 */

// Helper: find the tenant record for the logged-in user
async function getTenantForUser(userId: string) {
  return db.query.tenant.findFirst({
    where: eq(tenantTable.tenantUserId, userId),
    with: {
      leases: {
        with: { unit: { with: { property: true } } },
      },
    },
  });
}

// GET /api/tenant-portal/profile — get tenant's profile and active lease
router.get("/profile", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const tenantRecord = await getTenantForUser(userId);

  if (!tenantRecord) {
    return res.status(404).json({
      message: "No tenant account linked. Ask your landlord to activate your tenant portal.",
      code: "TENANT_NOT_LINKED",
    });
  }

  // Find active lease
  const activeLease = tenantRecord.leases.find((l) => l.status === "active");

  res.json({
    data: {
      tenant: {
        id: tenantRecord.id,
        firstName: tenantRecord.firstName,
        lastName: tenantRecord.lastName,
        email: tenantRecord.email,
        phone: tenantRecord.phone,
      },
      activeLease: activeLease
        ? {
            id: activeLease.id,
            unitId: activeLease.unitId,
            startDate: activeLease.startDate,
            endDate: activeLease.endDate,
            rentAmount: activeLease.rentAmount,
            deposit: activeLease.deposit,
            terms: activeLease.terms,
            unitNumber: activeLease.unit?.unitNumber,
            propertyName: activeLease.unit?.property?.name,
            propertyAddress: activeLease.unit?.property
              ? `${activeLease.unit.property.address}, ${activeLease.unit.property.city}, ${activeLease.unit.property.state} ${activeLease.unit.property.zip}`
              : null,
          }
        : null,
    },
  });
});

// GET /api/tenant-portal/payments — get tenant's payment history
router.get("/payments", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const tenantRecord = await getTenantForUser(userId);
  if (!tenantRecord) {
    return res.status(404).json({ message: "No tenant account linked", code: "TENANT_NOT_LINKED" });
  }

  const payments = await db.query.payment.findMany({
    where: eq(payment.tenantId, tenantRecord.id),
    with: { unit: true },
    orderBy: (payment, { desc }) => [desc(payment.dueDate)],
  });

  res.json({ data: payments });
});

// GET /api/tenant-portal/payments/due — get current due payment
router.get("/payments/due", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const tenantRecord = await getTenantForUser(userId);
  if (!tenantRecord) {
    return res.status(404).json({ message: "No tenant account linked", code: "TENANT_NOT_LINKED" });
  }

  const today = new Date().toISOString().split("T")[0];

  const payments = await db.query.payment.findMany({
    where: and(
      eq(payment.tenantId, tenantRecord.id),
      eq(payment.status, "pending"),
    ),
    with: { unit: true },
  });

  // Find the most urgent due payment
  const duePayment = payments
    .filter((p) => p.dueDate <= today || p.status === "late")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

  res.json({ data: duePayment || null });
});

// GET /api/tenant-portal/maintenance — tenant's maintenance requests
router.get("/maintenance", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const tenantRecord = await getTenantForUser(userId);
  if (!tenantRecord) {
    return res.status(404).json({ message: "No tenant account linked", code: "TENANT_NOT_LINKED" });
  }

  const requests = await db.query.maintenanceRequest.findMany({
    where: eq(maintenanceRequest.tenantId, tenantRecord.id),
    with: { unit: true, vendor: true },
    orderBy: (mr, { desc }) => [desc(mr.submittedAt)],
  });

  res.json({ data: requests });
});

// POST /api/tenant-portal/maintenance — tenant submits maintenance request
router.post("/maintenance", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const tenantRecord = await getTenantForUser(userId);
  if (!tenantRecord) {
    return res.status(404).json({ message: "No tenant account linked", code: "TENANT_NOT_LINKED" });
  }

  const schema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    photos: z.array(z.string()).default([]),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation error", code: "VALIDATION", details: parsed.error.flatten() });
  }

  // Find the tenant's active lease to get unit/property
  const activeLease = tenantRecord.leases.find((l) => l.status === "active");
  if (!activeLease) {
    return res.status(400).json({ message: "No active lease found", code: "NO_ACTIVE_LEASE" });
  }

  const [created] = await db
    .insert(maintenanceRequest)
    .values({
      unitId: activeLease.unitId,
      propertyId: activeLease.unit.propertyId,
      tenantId: tenantRecord.id,
      title: parsed.data.title,
      description: parsed.data.description,
      priority: "routine",
      status: "submitted",
      photos: parsed.data.photos,
      submittedAt: new Date(),
    })
    .returning();

  res.status(201).json({ data: created });
});

// GET /api/tenant-portal/lease — tenant's current lease document
router.get("/lease", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const tenantRecord = await getTenantForUser(userId);
  if (!tenantRecord) {
    return res.status(404).json({ message: "No tenant account linked", code: "TENANT_NOT_LINKED" });
  }

  const activeLease = tenantRecord.leases.find((l) => l.status === "active");
  if (!activeLease) {
    return res.status(404).json({ message: "No active lease", code: "NO_ACTIVE_LEASE" });
  }

  res.json({
    data: {
      id: activeLease.id,
      startDate: activeLease.startDate,
      endDate: activeLease.endDate,
      rentAmount: activeLease.rentAmount,
      deposit: activeLease.deposit,
      terms: activeLease.terms,
      documentUrl: activeLease.documentUrl,
      status: activeLease.status,
    },
  });
});

export { router as tenantPortalRouter };
