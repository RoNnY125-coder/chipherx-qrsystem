import { Request, Response, NextFunction } from "express";
import { ParticipantService } from "../services/participant.service";
import { QrService } from "../services/qr.service";
import { AttendanceService } from "../services/attendance.service";

export class AdminController {
  /**
   * Bulk imports participants from CSV file upload or raw CSV text body.
   */
  static async importParticipants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let csvContent = "";

      if (req.file) {
        csvContent = req.file.buffer.toString("utf-8");
      } else if (typeof req.body === "string" && req.body.trim()) {
        csvContent = req.body;
      } else if (req.body && typeof req.body.csv === "string") {
        csvContent = req.body.csv;
      } else {
        res.status(400).json({
          success: false,
          message: "No CSV content provided. Upload a file using form field 'file' or supply raw CSV string in body.",
        });
        return;
      }

      const result = await ParticipantService.importParticipants(csvContent);

      res.status(200).json({
        success: true,
        message: "Participant import completed",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generates QR codes for registered participants.
   */
  static async generateQrs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const forceRegenerate = Boolean(req.body?.forceRegenerate);
      const teamId = typeof req.body?.teamId === "string" ? req.body.teamId : undefined;

      const result = await QrService.generateQrs({ forceRegenerate, teamId });

      res.status(200).json({
        success: true,
        message: "QR code generation completed",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Exports all participant QR codes in a ZIP archive organized by team.
   */
  static async exportQrs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await QrService.exportAllQrsAsZip(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves single participant QR code image.
   */
  static async getParticipantQr(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const pngBuffer = await QrService.getParticipantQrImage(id);

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.status(200).send(pngBuffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves individual participant details and attendance status.
   */
  static async getParticipantDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const participant = await ParticipantService.getParticipantById(id);

      res.status(200).json({
        success: true,
        data: participant,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves overall attendance summary statistics.
   */
  static async getAttendanceSummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await AttendanceService.getAttendanceSummary();

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves team-specific attendance breakdown.
   */
  static async getTeamAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const teamAttendance = await AttendanceService.getTeamAttendance(teamId);

      res.status(200).json({
        success: true,
        data: teamAttendance,
      });
    } catch (error) {
      next(error);
    }
  }
}
