import { Router } from "express";
import { z } from "zod";
import { AttendanceController } from "../controllers/attendance.controller";
import { staffAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { attendanceScanRateLimiter } from "../middleware/rateLimiter";

const router = Router();

const scanAttendanceSchema = z.object({
  qrToken: z.string().trim().min(1, "QR token is required"),
});

// Primary event-day scanning route
router.post(
  "/scan",
  attendanceScanRateLimiter,
  staffAuth,
  validateBody(scanAttendanceSchema),
  AttendanceController.scan
);

export default router;
