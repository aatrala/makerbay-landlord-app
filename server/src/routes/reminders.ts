import { Router, type Request, type Response } from "express";
import { db } from "../db/index.js";
import { authMiddleware } from "../auth/middleware.js";
import { processRentReminders, getUpcomingPayments } from "../services/rent-reminders.js";

const router = Router();
router.use(authMiddleware);

// POST /api/reminders/process — manually trigger rent reminder processing
router.post("/process", async (req: Request, res: Response) => {
  try {
    const result = await processRentReminders();
    res.json({ data: result });
  } catch (error) {
    console.error("[Reminders] Processing error:", error);
    res.status(500).json({
      message: "Failed to process reminders",
      code: "REMINDER_ERROR",
    });
  }
});

// GET /api/reminders/upcoming — get upcoming and overdue payments for landlord
router.get("/upcoming", async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  try {
    const payments = await getUpcomingPayments(userId);
    res.json({ data: payments });
  } catch (error) {
    console.error("[Reminders] Upcoming payments error:", error);
    res.status(500).json({
      message: "Failed to fetch upcoming payments",
      code: "UPCOMING_ERROR",
    });
  }
});

export { router as remindersRouter };
