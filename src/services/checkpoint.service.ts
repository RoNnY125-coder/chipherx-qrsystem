import QRCode from "qrcode";
import { prisma } from "../config/prisma";
import { generateQrToken, hashQrToken, encryptToken, decryptToken } from "../utils/token";

export interface CheckpointResponse {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CheckpointCreationResponse extends CheckpointResponse {
  qrToken: string;
}

export class CheckpointService {
  /**
   * Creates a new checkpoint.
   * Generates a 256-bit cryptographically secure token, stores its SHA-256 hash in the database,
   * stores an encrypted version for on-demand QR rendering, and returns the plaintext token only once to the admin.
   */
  static async createCheckpoint(name: string, isActive = true): Promise<CheckpointCreationResponse> {
    const existing = await prisma.checkpoint.findUnique({
      where: { name },
    });

    if (existing) {
      const error: any = new Error(`A checkpoint with name "${name}" already exists.`);
      error.statusCode = 409;
      throw error;
    }

    const rawToken = generateQrToken();
    const tokenHash = hashQrToken(rawToken);
    const encryptedToken = encryptToken(rawToken);

    const checkpoint = await prisma.checkpoint.create({
      data: {
        name,
        qrToken: tokenHash,
        qrTokenEncrypted: encryptedToken,
        isActive,
      },
    });

    return {
      id: checkpoint.id,
      name: checkpoint.name,
      isActive: checkpoint.isActive,
      createdAt: checkpoint.createdAt,
      updatedAt: checkpoint.updatedAt,
      qrToken: rawToken,
    };
  }

  /**
   * Retrieves all checkpoints with pagination.
   * Never exposes token hashes or encrypted tokens.
   */
  static async getAllCheckpoints(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [checkpoints, total] = await Promise.all([
      prisma.checkpoint.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.checkpoint.count(),
    ]);

    return {
      checkpoints,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Activates or deactivates a checkpoint.
   */
  static async updateStatus(id: string, isActive: boolean): Promise<CheckpointResponse> {
    const checkpoint = await prisma.checkpoint.findUnique({
      where: { id },
    });

    if (!checkpoint) {
      const error: any = new Error(`Checkpoint with ID "${id}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.checkpoint.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  /**
   * Renders a PNG QR code image for a checkpoint.
   * Securely decrypts the stored token in memory and streams the PNG image buffer.
   */
  static async getCheckpointQrImage(id: string): Promise<Buffer> {
    const checkpoint = await prisma.checkpoint.findUnique({
      where: { id },
    });

    if (!checkpoint) {
      const error: any = new Error(`Checkpoint with ID "${id}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    if (!checkpoint.qrTokenEncrypted) {
      const error: any = new Error("No encrypted QR token available for this checkpoint.");
      error.statusCode = 400;
      throw error;
    }

    const rawToken = decryptToken(checkpoint.qrTokenEncrypted);
    const pngBuffer = await QRCode.toBuffer(rawToken, {
      type: "png",
      width: 400,
      margin: 2,
      errorCorrectionLevel: "H",
    });

    return pngBuffer;
  }
}
