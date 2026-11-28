import QRCode from "qrcode";
import { Response } from "express";
import { prisma } from "../config/prisma";
import { generateQrToken, hashQrToken, encryptToken, decryptToken } from "../utils/token";

// Archiver v8 uses named class exports instead of a factory function
const { ZipArchive } = require("archiver");

export interface QrGenerationResult {
  totalParticipants: number;
  tokensGenerated: number;
  tokensSkipped: number;
}

export class QrService {
  /**
   * Generates unique cryptographically secure QR tokens for participants.
   * If forceRegenerate is true, generates new tokens for all specified participants (or all participants),
   * which automatically invalidates previous tokens.
   */
  static async generateQrs(options: {
    forceRegenerate?: boolean;
    teamId?: string;
  } = {}): Promise<QrGenerationResult> {
    const { forceRegenerate = false, teamId } = options;

    const whereClause: any = {};
    if (teamId) {
      whereClause.teamId = teamId;
    }
    if (!forceRegenerate) {
      whereClause.qrTokenHash = null;
    }

    const eligibleParticipants = await prisma.participant.findMany({
      where: whereClause,
      select: { id: true, name: true, team: { select: { teamName: true } } },
    });

    let generatedCount = 0;

    for (const p of eligibleParticipants) {
      // 32 bytes (256 bits) of secure randomness
      const rawRandom = generateQrToken();
      const token = `TH26_${rawRandom}`;
      const tokenHash = hashQrToken(token);
      const encryptedToken = encryptToken(token);

      await prisma.participant.update({
        where: { id: p.id },
        data: {
          qrTokenHash: tokenHash,
          qrTokenEncrypted: encryptedToken,
        },
      });

      generatedCount++;
    }

    const totalCount = await prisma.participant.count({
      where: teamId ? { teamId } : {},
    });

    return {
      totalParticipants: totalCount,
      tokensGenerated: generatedCount,
      tokensSkipped: totalCount - generatedCount,
    };
  }

  /**
   * Generates a single PNG QR code for a participant.
   */
  static async getParticipantQrImage(participantId: string): Promise<Buffer> {
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      select: { qrTokenEncrypted: true, name: true },
    });

    if (!participant) {
      const error: any = new Error("Participant not found");
      error.statusCode = 404;
      throw error;
    }

    if (!participant.qrTokenEncrypted) {
      const error: any = new Error("QR token has not been generated for this participant yet");
      error.statusCode = 400;
      throw error;
    }

    const rawToken = decryptToken(participant.qrTokenEncrypted);
    return QRCode.toBuffer(rawToken, {
      type: "png",
      width: 400,
      margin: 2,
      errorCorrectionLevel: "H",
    });
  }

  /**
   * Streams a ZIP archive of all participant QR images grouped into folders by team.
   */
  static async exportAllQrsAsZip(res: Response): Promise<void> {
    const participants = await prisma.participant.findMany({
      where: { qrTokenEncrypted: { not: null } },
      select: {
        id: true,
        name: true,
        qrTokenEncrypted: true,
        team: { select: { teamName: true } },
      },
      orderBy: [{ team: { teamName: "asc" } }, { name: "asc" }],
    });

    if (participants.length === 0) {
      const error: any = new Error("No participant QR codes are available to export. Run QR generation first.");
      error.statusCode = 404;
      throw error;
    }

    return new Promise<void>((resolve, reject) => {
      res.status(200);
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", 'attachment; filename="attendance-qrs.zip"');
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");

      const archive = new ZipArchive({
        zlib: { level: 9 }, // Maximum compression
      });

      archive.on("error", (err: any) => {
        console.error("Archive error:", err);
        reject(err);
      });

      res.on("finish", () => {
        resolve();
      });

      archive.pipe(res);

      (async () => {
        for (let i = 0; i < participants.length; i++) {
          const p = participants[i];
          if (!p.qrTokenEncrypted) continue;

          try {
            const rawToken = decryptToken(p.qrTokenEncrypted);
            const qrBuffer = await QRCode.toBuffer(rawToken, {
              type: "png",
              width: 400,
              margin: 2,
              errorCorrectionLevel: "H",
            });

            // Clean directory & filenames (remove illegal path characters)
            const safeTeamName = p.team.teamName.replace(/[/\\?%*:|"<>]/g, "_").trim();
            const safeParticipantName = p.name.replace(/[/\\?%*:|"<>]/g, "_").trim();
            const shortId = p.id.slice(0, 8);
            const filePath = `${safeTeamName}/${safeParticipantName}_${shortId}.png`;

            archive.append(qrBuffer, { name: filePath });
          } catch (err) {
            console.error(`Failed to generate QR for participant ${p.id}:`, err);
          }
        }

        await archive.finalize();
      })().catch(reject);
    });
  }
}
