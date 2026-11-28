import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { AdminController } from "../controllers/admin.controller";
import { adminAuth } from "../middleware/adminAuth";
import { validateParams } from "../middleware/validate";
import {
  adminRateLimiter,
  importRateLimiter,
  qrGenerateRateLimiter,
} from "../middleware/rateLimiter";

const router = Router();

// Configure multer for memory storage (CSV uploads up to 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid participant ID format"),
});

// All admin routes require administrator authentication and basic rate limiting
router.use(adminRateLimiter);
router.use(adminAuth);

// -----------------------------------------------------------------------------
// Phase 1: Participant Import
// -----------------------------------------------------------------------------
router.post(
  "/participants/import",
  importRateLimiter,
  upload.single("file"),
  AdminController.importParticipants
);

// -----------------------------------------------------------------------------
// Phase 2: Secure QR Generation & Regeneration
// -----------------------------------------------------------------------------
router.post("/qr/generate", qrGenerateRateLimiter, AdminController.generateQrs);

// -----------------------------------------------------------------------------
// Phase 3: Bulk QR Export (ZIP) & Individual QR Retrieval
// -----------------------------------------------------------------------------
router.get("/qr/export", AdminController.exportQrs);
router.get("/participants/:id/qr", validateParams(uuidParamSchema), AdminController.getParticipantQr);

// -----------------------------------------------------------------------------
// Phase 5: Attendance Dashboard & Participant Details
// -----------------------------------------------------------------------------
router.get("/attendance", AdminController.getAttendanceSummary);
router.get("/attendance/:teamId", AdminController.getTeamAttendance);
router.get("/participants/:id", validateParams(uuidParamSchema), AdminController.getParticipantDetails);

export default router;
