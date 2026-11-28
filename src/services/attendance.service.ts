import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { hashQrToken } from "../utils/token";

export interface ScanAttendanceResult {
  success: boolean;
  statusCode: number;
  message: string;
  data?: {
    participantName: string;
    teamName: string;
    attendanceStatus: "PRESENT";
    scannedAt: Date;
  };
}

export class AttendanceService {
  /**
   * Primary event-day API: Scans a participant's personal QR code and atomically records attendance.
   * Guarantees single-attendance enforcement via @@unique([participantId]) in PostgreSQL.
   */
  static async recordAttendance(
    qrToken: string,
    scannedBy?: string
  ): Promise<ScanAttendanceResult> {
    // 1. Hash the submitted QR token using SHA-256
    const tokenHash = hashQrToken(qrToken);

    // 2. Find participant associated with this token hash
    const participant = await prisma.participant.findUnique({
      where: { qrTokenHash: tokenHash },
      include: {
        team: true,
        attendance: true,
      },
    });

    // 3. Reject invalid tokens
    if (!participant) {
      return {
        success: false,
        statusCode: 404,
        message: "Invalid QR code.",
      };
    }

    // 4. Check if attendance already exists
    if (participant.attendance) {
      return {
        success: false,
        statusCode: 409,
        message: "Attendance has already been registered.",
      };
    }

    // 5. Atomically create the attendance record inside a transaction
    try {
      const attendance = await prisma.$transaction(async (tx) => {
        return tx.attendance.create({
          data: {
            participantId: participant.id,
            scannedBy: scannedBy || null,
          },
        });
      });

      return {
        success: true,
        statusCode: 200,
        message: "Attendance registered successfully",
        data: {
          participantName: participant.name,
          teamName: participant.team.teamName,
          attendanceStatus: "PRESENT",
          scannedAt: attendance.scannedAt,
        },
      };
    } catch (error) {
      // Catch concurrent scan collisions via unique constraint
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return {
          success: false,
          statusCode: 409,
          message: "Attendance has already been registered.",
        };
      }
      throw error;
    }
  }

  /**
   * Retrieves overall attendance summary statistics and team-wise attendance breakdown.
   */
  static async getAttendanceSummary() {
    const [totalParticipants, totalPresent, teams] = await Promise.all([
      prisma.participant.count(),
      prisma.attendance.count(),
      prisma.team.findMany({
        select: {
          id: true,
          teamName: true,
          participants: {
            select: {
              id: true,
              attendance: {
                select: { id: true },
              },
            },
          },
        },
        orderBy: { teamName: "asc" },
      }),
    ]);

    const totalAbsent = totalParticipants - totalPresent;
    const attendancePercentage =
      totalParticipants > 0
        ? Number(((totalPresent / totalParticipants) * 100).toFixed(2))
        : 0;

    const teamBreakdown = teams.map((team) => {
      const teamTotal = team.participants.length;
      const teamPresent = team.participants.filter((p) => p.attendance !== null).length;
      const teamAbsent = teamTotal - teamPresent;
      const teamPct = teamTotal > 0 ? Number(((teamPresent / teamTotal) * 100).toFixed(2)) : 0;

      return {
        teamId: team.id,
        teamName: team.teamName,
        totalMembers: teamTotal,
        presentMembers: teamPresent,
        absentMembers: teamAbsent,
        attendancePercentage: teamPct,
      };
    });

    return {
      totalParticipants,
      totalPresent,
      totalAbsent,
      attendancePercentage,
      teams: teamBreakdown,
    };
  }

  /**
   * Retrieves detailed attendance for a specific team.
   */
  static async getTeamAttendance(teamId: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            email: true,
            externalUserId: true,
            attendance: {
              select: {
                id: true,
                scannedAt: true,
                scannedBy: true,
              },
            },
          },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!team) {
      const error: any = new Error(`Team with ID "${teamId}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    const totalMembers = team.participants.length;
    const presentMembers = team.participants.filter((p) => p.attendance !== null).length;
    const absentMembers = totalMembers - presentMembers;

    const members = team.participants.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      externalUserId: p.externalUserId,
      attendanceStatus: p.attendance ? "PRESENT" : "ABSENT",
      scannedAt: p.attendance?.scannedAt || null,
      scannedBy: p.attendance?.scannedBy || null,
    }));

    return {
      teamId: team.id,
      teamName: team.teamName,
      totalMembers,
      presentMembers,
      absentMembers,
      members,
    };
  }
}
