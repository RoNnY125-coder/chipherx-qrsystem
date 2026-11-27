import { Request, Response, NextFunction } from "express";
import { CheckpointService } from "../services/checkpoint.service";

export class CheckpointController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, isActive } = req.body;
      const checkpoint = await CheckpointService.createCheckpoint(name, isActive);

      res.status(201).json({
        success: true,
        message: "Checkpoint created successfully",
        data: checkpoint,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await CheckpointService.getAllCheckpoints(page, limit);

      res.status(200).json({
        success: true,
        data: result.checkpoints,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { isActive } = req.body;

      const updated = await CheckpointService.updateStatus(id, isActive);

      res.status(200).json({
        success: true,
        message: `Checkpoint ${isActive ? "activated" : "deactivated"} successfully`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getQrImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const pngBuffer = await CheckpointService.getCheckpointQrImage(id);

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.status(200).send(pngBuffer);
    } catch (error) {
      next(error);
    }
  }
}
