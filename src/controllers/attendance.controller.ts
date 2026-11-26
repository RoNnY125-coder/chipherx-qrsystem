import { Request, Response, NextFunction } from "express";
import { AttendanceService } from "../services/attendance.service";

export class AttendanceController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, externalUserId, teamName } = req.body;
      const result = await AttendanceService.registerParticipant({
        name,
        externalUserId,
        teamName,
      });

      res.status(result.isNew ? 201 : 200).json({
        success: true,
        message: result.isNew
          ? "Participant registered successfully"
          : "Participant attendance already recorded",
        data: result.participant,
      });
    } catch (error) {
      next(error);
    }
  }
}
