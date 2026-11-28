import { Response, NextFunction } from "express";
import { StaffAuthenticatedRequest } from "../middleware/auth";
import { AttendanceService } from "../services/attendance.service";

export class AttendanceController {
  /**
   * Primary event-day API: Scans a participant's QR code and records attendance.
   * Requires verified staff authentication.
   */
  static async scan(req: StaffAuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { qrToken } = req.body;
      const scannedBy = req.staff?.userId || "authorized_staff";

      const result = await AttendanceService.recordAttendance(qrToken, scannedBy);

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
