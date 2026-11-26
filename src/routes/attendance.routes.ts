import { Router } from "express";
import { z } from "zod";
import { AttendanceController } from "../controllers/attendance.controller";
import { validateBody } from "../middleware/validate";
import { attendanceRateLimiter } from "../middleware/rateLimiter";

const router = Router();

const attendanceRegistrationSchema = z.object({
  name: z.string().trim().min(1, "Participant name is required").max(100, "Name cannot exceed 100 characters"),
  externalUserId: z.string().trim().min(1, "External user ID is required"),
  teamName: z.string().trim().min(1, "Team name is required").max(100, "Team name cannot exceed 100 characters"),
});

router.post("/register", attendanceRateLimiter, validateBody(attendanceRegistrationSchema), AttendanceController.register);

export default router;
