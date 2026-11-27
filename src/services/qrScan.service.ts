import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { hashQrToken } from "../utils/token";

export interface ScanResult {
  success: boolean;
  statusCode: number;
  message: string;
  data?: {
    checkpointId: string;
    teamId: string;
    accessGranted: boolean;
  };
}

export class QrScanService {
  /**
   * Atomically validates a scanned QR token and grants access to the checkpoint quiz.
   * Enforces that only one member per team can ever claim a given checkpoint.
   */
  static async validateAndClaimScan(qrToken: string, externalUserId: string): Promise<ScanResult> {
    // 1. Resolve participant and their team
    const participant = await prisma.participant.findUnique({
      where: { externalUserId },
      include: { team: true },
    });

    if (!participant || !participant.team) {
      return {
        success: false,
        statusCode: 403,
        message: "Participant is not registered or has no verified team association.",
      };
    }

    // 2. Hash submitted QR token and look up checkpoint
    const tokenHash = hashQrToken(qrToken);
    const checkpoint = await prisma.checkpoint.findUnique({
      where: { qrToken: tokenHash },
    });

    // 3. Verify checkpoint exists
    if (!checkpoint) {
      return {
        success: false,
        statusCode: 404,
        message: "Invalid QR code.",
      };
    }

    // 4. Verify checkpoint is active
    if (!checkpoint.isActive) {
      return {
        success: false,
        statusCode: 400,
        message: "This checkpoint is currently inactive.",
      };
    }

    // 5. Pre-check if team has already claimed this checkpoint
    const existingAccess = await prisma.quizAccess.findUnique({
      where: {
        teamId_checkpointId: {
          teamId: participant.teamId,
          checkpointId: checkpoint.id,
        },
      },
    });

    if (existingAccess) {
      return {
        success: false,
        statusCode: 409,
        message: "Your team has already accessed this checkpoint.",
      };
    }

    // 6. Atomically claim checkpoint access inside a transaction
    try {
      await prisma.$transaction(async (tx) => {
        await tx.quizAccess.create({
          data: {
            teamId: participant.teamId,
            checkpointId: checkpoint.id,
            participantId: participant.id,
            status: "IN_PROGRESS",
          },
        });
      });

      return {
        success: true,
        statusCode: 200,
        message: "Checkpoint access granted",
        data: {
          checkpointId: checkpoint.id,
          teamId: participant.teamId,
          accessGranted: true,
        },
      };
    } catch (error) {
      // Catch atomic unique constraint violation (teamId, checkpointId)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return {
          success: false,
          statusCode: 409,
          message: "Your team has already accessed this checkpoint.",
        };
      }
      throw error;
    }
  }
}
