import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { payment, lease, tenant, unit, property, notification } from "../db/schema.js";

/**
 * Process rent reminders for upcoming and overdue payments.
 * This is designed to be called by a scheduled job (cron) or manually via API.
 *
 * Reminder schedule:
 * - 3 days before due date: friendly reminder
 * - On due date: payment due today
 * - 1 day after due date: late notice + auto-apply late fee per lease terms
 */
export async function processRentReminders(): Promise<{
  remindersSent: number;
  lateFeesApplied: number;
  errors: string[];
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = { remindersSent: 0, lateFeesApplied: 0, errors: [] as string[] };

  try {
    // Find all active leases
    const activeLeases = await db.query.lease.findMany({
      where: eq(lease.status, "active"),
      with: { unit: true, tenant: true },
    });

    for (const activeLease of activeLeases) {
      try {
        // Find the landlord who owns this property
        const unitData = activeLease.unit;
        if (!unitData) continue;

        const prop = await db.query.property.findFirst({
          where: eq(property.id, unitData.propertyId),
        });
        if (!prop) continue;

        const landlordId = prop.userId;
        const tenantData = activeLease.tenant;
        if (!tenantData?.email) continue;

        // Calculate the next rent due date (day of month from lease start)
        const dueDay = new Date(activeLease.startDate).getDate();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // Build due dates for current month
        const dueDate = new Date(currentYear, currentMonth, dueDay);
        dueDate.setHours(0, 0, 0, 0);

        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Check if there's already a payment record for this period
        const dueDateStr = dueDate.toISOString().split("T")[0];
        const existingPayment = await db.query.payment.findFirst({
          where: and(
            eq(payment.unitId, activeLease.unitId),
            eq(payment.tenantId, activeLease.tenantId),
            eq(payment.dueDate, dueDateStr),
          ),
        });

        // If payment already received, skip
        if (existingPayment?.status === "received") continue;

        // Create payment record if it doesn't exist
        if (!existingPayment) {
          const [newPayment] = await db
            .insert(payment)
            .values({
              unitId: activeLease.unitId,
              tenantId: activeLease.tenantId,
              amount: activeLease.rentAmount,
              amountPaid: 0,
              dueDate: dueDateStr,
              status: "pending",
              lateFee: 0,
            })
            .returning();

          // Send reminder based on days until due
          if (daysUntilDue === 3) {
            await createNotification(landlordId, {
              type: "rent_reminder",
              channel: "email",
              recipient: tenantData.email,
              subject: `Rent Reminder: $${activeLease.rentAmount} due in 3 days`,
              body: `Hi ${tenantData.firstName}, this is a friendly reminder that your rent of $${activeLease.rentAmount} for unit ${unitData.unitNumber} is due on ${dueDate.toLocaleDateString()}.`,
              scheduledAt: today,
            });
            result.remindersSent++;
          } else if (daysUntilDue === 0) {
            await createNotification(landlordId, {
              type: "rent_reminder",
              channel: "email",
              recipient: tenantData.email,
              subject: `Rent Due Today: $${activeLease.rentAmount}`,
              body: `Hi ${tenantData.firstName}, your rent of $${activeLease.rentAmount} for unit ${unitData.unitNumber} is due today.`,
              scheduledAt: today,
            });
            result.remindersSent++;
          } else if (daysUntilDue === -1) {
            // Auto-apply late fee from lease terms
            const lateFee = calculateLateFee(activeLease);
            if (lateFee > 0) {
              await db
                .update(payment)
                .set({
                  status: "late",
                  lateFee,
                  updatedAt: new Date(),
                })
                .where(eq(payment.id, newPayment.id));
              result.lateFeesApplied++;
            }

            await createNotification(landlordId, {
              type: "late_rent",
              channel: "email",
              recipient: tenantData.email,
              subject: `Late Notice: Rent overdue for unit ${unitData.unitNumber}`,
              body: `Hi ${tenantData.firstName}, your rent of $${activeLease.rentAmount} for unit ${unitData.unitNumber} was due yesterday. A late fee of $${lateFee} has been applied. Total due: $${activeLease.rentAmount + lateFee}.`,
              scheduledAt: today,
            });
            result.remindersSent++;
          }
        } else if (existingPayment.status === "pending" || existingPayment.status === "late") {
          // Existing payment record but not yet received — send reminders
          if (daysUntilDue === 3) {
            await createNotification(landlordId, {
              type: "rent_reminder",
              channel: "email",
              recipient: tenantData.email,
              subject: `Rent Reminder: $${existingPayment.amount} due in 3 days`,
              body: `Hi ${tenantData.firstName}, this is a friendly reminder that your rent of $${existingPayment.amount} for unit ${unitData.unitNumber} is due on ${dueDate.toLocaleDateString()}.`,
              scheduledAt: today,
            });
            result.remindersSent++;
          } else if (daysUntilDue === 0) {
            await createNotification(landlordId, {
              type: "rent_reminder",
              channel: "email",
              recipient: tenantData.email,
              subject: `Rent Due Today: $${existingPayment.amount}`,
              body: `Hi ${tenantData.firstName}, your rent of $${existingPayment.amount} for unit ${unitData.unitNumber} is due today.`,
              scheduledAt: today,
            });
            result.remindersSent++;
          } else if (daysUntilDue < 0 && existingPayment.status !== "late") {
            // Auto-apply late fee
            const lateFee = calculateLateFee(activeLease);
            if (lateFee > 0) {
              await db
                .update(payment)
                .set({
                  status: "late",
                  lateFee,
                  updatedAt: new Date(),
                })
                .where(eq(payment.id, existingPayment.id));
              result.lateFeesApplied++;
            }

            await createNotification(landlordId, {
              type: "late_rent",
              channel: "email",
              recipient: tenantData.email,
              subject: `Late Notice: Rent overdue for unit ${unitData.unitNumber}`,
              body: `Hi ${tenantData.firstName}, your rent of $${existingPayment.amount} for unit ${unitData.unitNumber} is overdue. A late fee of $${lateFee} has been applied.`,
              scheduledAt: today,
            });
            result.remindersSent++;
          }
        }
      } catch (err) {
        result.errors.push(`Lease ${activeLease.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  } catch (err) {
    result.errors.push(`Global: ${err instanceof Error ? err.message : String(err)}`);
  }

  return result;
}

/**
 * Calculate late fee based on lease terms.
 * Default: $50 or 5% of rent, whichever is greater.
 */
function calculateLateFee(leaseData: { rentAmount: number; terms: string | null }): number {
  // Try to parse late fee from lease terms
  const terms = leaseData.terms || "";

  // Look for patterns like "late fee: $50" or "late fee: 5%"
  const dollarMatch = terms.match(/late\s*fee[:\s]*\$(\d+)/i);
  if (dollarMatch) return Number(dollarMatch[1]);

  const percentMatch = terms.match(/late\s*fee[:\s]*(\d+)%/i);
  if (percentMatch) return Math.round(leaseData.rentAmount * Number(percentMatch[1]) / 100);

  // Default late fee: max of $50 or 5% of rent
  return Math.max(50, Math.round(leaseData.rentAmount * 0.05));
}

/**
 * Create a notification record.
 */
async function createNotification(
  userId: string,
  data: {
    type: "rent_reminder" | "late_rent" | "lease_renewal" | "maintenance_update" | "rent_increase" | "inspection" | "custom";
    channel: "email" | "sms" | "in_app";
    recipient: string;
    subject: string | null;
    body: string;
    scheduledAt: Date;
  },
) {
  await db.insert(notification).values({
    userId,
    ...data,
    status: "pending",
  });
}

/**
 * Get upcoming and overdue payments for a landlord.
 */
export async function getUpcomingPayments(userId: string) {
  const userProperties = await db.query.property.findMany({
    where: eq(property.userId, userId),
    columns: { id: true },
  });
  const propertyIds = new Set(userProperties.map((p) => p.id));

  const allUnits = await db.query.unit.findMany();
  const validUnitIds = new Set(
    allUnits.filter((u) => propertyIds.has(u.propertyId)).map((u) => u.id),
  );

  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const payments = await db.query.payment.findMany({
    with: { unit: true, tenant: true },
  });

  return payments
    .filter((p) => validUnitIds.has(p.unitId))
    .filter((p) => p.dueDate >= today && p.dueDate <= thirtyDaysFromNow)
    .filter((p) => p.status === "pending" || p.status === "late")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
