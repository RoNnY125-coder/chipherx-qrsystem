import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { QrScanService } from "../services/qrScan.service";

export class QrScanController {
  static async scan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { qrToken } = req.body;
      const externalUserId = req.participant?.externalUserId;

      if (!externalUserId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized: Unverified participant identity.",
        });
        return;
      }

      const result = await QrScanService.validateAndClaimScan(qrToken, externalUserId);

      if (!result.success) {
        res.status(result.statusCode).json({
          success: false,
          message: result.message,
        });
        return;
      }

      res.status(result.statusCode).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      next(error);
    }
  }
}
