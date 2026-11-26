import { Router } from "express";
import { z } from "zod";
import { QrScanController } from "../controllers/qrScan.controller";
import { participantAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { scanRateLimiter } from "../middleware/rateLimiter";

const router = Router();

const scanSchema = z.object({
  qrToken: z.string().trim().min(1, "QR token is required"),
});

router.post("/scan", scanRateLimiter, participantAuth, validateBody(scanSchema), QrScanController.scan);

export default router;
