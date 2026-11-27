import { Router } from "express";
import { z } from "zod";
import { CheckpointController } from "../controllers/checkpoint.controller";
import { adminAuth } from "../middleware/adminAuth";
import { validateBody, validateParams } from "../middleware/validate";
import { adminRateLimiter } from "../middleware/rateLimiter";

const router = Router();

const createCheckpointSchema = z.object({
  name: z.string().trim().min(1, "Checkpoint name is required").max(100, "Name cannot exceed 100 characters"),
  isActive: z.boolean().optional().default(true),
});

const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

const checkpointParamsSchema = z.object({
  id: z.string().uuid("Invalid checkpoint ID format"),
});

// All checkpoint management routes require administrator authorization
router.use(adminRateLimiter);
router.use(adminAuth);

router.post("/", validateBody(createCheckpointSchema), CheckpointController.create);
router.get("/", CheckpointController.getAll);
router.patch("/:id/status", validateParams(checkpointParamsSchema), validateBody(updateStatusSchema), CheckpointController.updateStatus);
router.get("/:id/qr", validateParams(checkpointParamsSchema), CheckpointController.getQrImage);

export default router;
