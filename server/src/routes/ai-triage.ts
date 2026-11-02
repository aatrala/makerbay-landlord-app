import { Hono } from "hono";
import type { AppEnv } from "../env.js";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { maintenanceRequest, vendor, property } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";
import { triageMaintenanceRequest, findBestVendor } from "../services/ai-triage.js";

const router = new Hono<AppEnv>();
router.use("*", authMiddleware);

// POST /api/ai-triage/maintenance — AI-triage a maintenance request
router.post("/maintenance", async (c) => {
  const userId = c.get("userId");

  const inputSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    photos: z.array(z.string()).optional(),
    // Optional: if triaging an existing request
    maintenanceId: z.string().uuid().optional(),
    // Context fields
    unitId: z.string().uuid().optional(),
    propertyId: z.string().uuid().optional(),
    tenantId: z.string().uuid().nullable().optional(),
  });

  const parsed = inputSchema.safeParse(c.get("body"));
  if (!parsed.success) {
    return c.json({
      message: "Validation error",
      code: "VALIDATION",
      details: parsed.error.flatten(),
    }, 400);
  }

  try {
    // Run AI triage
    const triageResult = await triageMaintenanceRequest({
      title: parsed.data.title,
      description: parsed.data.description,
      photos: parsed.data.photos,
    });

    // Find best vendor from landlord's vendor list
    const landlordsVendors = await db.query.vendor.findMany({
      where: eq(vendor.userId, userId),
    });

    const recommendedVendorId = findBestVendor(
      landlordsVendors.map((v) => ({ id: v.id, trade: v.trade, name: v.name })),
      triageResult.category,
    );

    // If maintenanceId provided, update the existing record
    if (parsed.data.maintenanceId) {
      const [updated] = await db
        .update(maintenanceRequest)
        .set({
          aiCategory: triageResult.category,
          aiPriority: triageResult.priority,
          aiConfidence: triageResult.confidence,
          aiEstimatedCost: triageResult.estimatedCost,
          aiRecommendedVendorId: recommendedVendorId,
          priority: triageResult.priority as "emergency" | "urgent" | "routine",
          updatedAt: new Date(),
        })
        .where(eq(maintenanceRequest.id, parsed.data.maintenanceId))
        .returning();

      return c.json({
        data: {
          triage: triageResult,
          recommendedVendorId,
          updated,
        },
      });
    }

    // If propertyId + unitId provided, create a new triaged maintenance request
    if (parsed.data.propertyId && parsed.data.unitId) {
      const [created] = await db
        .insert(maintenanceRequest)
        .values({
          unitId: parsed.data.unitId,
          propertyId: parsed.data.propertyId,
          tenantId: parsed.data.tenantId || null,
          title: parsed.data.title,
          description: parsed.data.description,
          priority: triageResult.priority as "emergency" | "urgent" | "routine",
          status: "submitted",
          photos: parsed.data.photos || [],
          aiCategory: triageResult.category,
          aiPriority: triageResult.priority,
          aiConfidence: triageResult.confidence,
          aiEstimatedCost: triageResult.estimatedCost,
          aiRecommendedVendorId: recommendedVendorId,
          vendorId: recommendedVendorId, // Auto-assign recommended vendor
          submittedAt: new Date(),
        })
        .returning();

      return c.json({
        data: {
          triage: triageResult,
          recommendedVendorId,
          created,
        },
      }, 201);
    }

    // Just return triage result without creating/updating
    return c.json({
      data: {
        triage: triageResult,
        recommendedVendorId,
      },
    });
  } catch (error) {
    console.error("[AI Triage] Error:", error);
    return c.json({
      message: "AI triage failed",
      code: "TRIAGE_ERROR",
    }, 500);
  }
});

export { router as aiTriageRouter };
