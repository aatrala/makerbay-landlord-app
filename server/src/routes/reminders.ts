import { Hono } from "hono";
import type { AppEnv } from "../env.js";
import { db } from "../db/index.js";
import { authMiddleware } from "../auth/middleware.js";
import { processRentReminders, getUpcomingPayments } from "../services/rent-reminders.js";

const router = new Hono<AppEnv>();
router.use("*", authMiddleware);

// POST /api/reminders/process — manually trigger rent reminder processing
router.post("/process", async (c) => {
  try {
    const result = await processRentReminders();
    return c.json({ data: result });
  } catch (error) {
    console.error("[Reminders] Processing error:", error);
    return c.json({
      message: "Failed to process reminders",
      code: "REMINDER_ERROR",
    }, 500);
  }
});

// GET /api/reminders/upcoming — get upcoming and overdue payments for landlord
router.get("/upcoming", async (c) => {
  const userId = c.get("userId");
  try {
    const payments = await getUpcomingPayments(userId);
    return c.json({ data: payments });
  } catch (error) {
    console.error("[Reminders] Upcoming payments error:", error);
    return c.json({
      message: "Failed to fetch upcoming payments",
      code: "UPCOMING_ERROR",
    }, 500);
  }
});

export { router as remindersRouter };
