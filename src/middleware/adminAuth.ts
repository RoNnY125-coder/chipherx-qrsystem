import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

/**
 * Middleware to protect administrative endpoints using the x-admin-key header.
 * Uses constant-time buffer comparison to prevent timing attacks.
 */
export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const providedKey = req.headers["x-admin-key"];
  const expectedKey = process.env.ADMIN_API_KEY;

  if (!expectedKey) {
    res.status(500).json({
      success: false,
      message: "Server configuration error: ADMIN_API_KEY is not configured.",
    });
    return;
  }

  if (typeof providedKey !== "string" || !providedKey) {
    res.status(401).json({
      success: false,
      message: "Unauthorized: Missing administrator key.",
    });
    return;
  }

  // Constant-time comparison using sha256 digests to ensure equal length buffers
  const providedHash = crypto.createHash("sha256").update(providedKey).digest();
  const expectedHash = crypto.createHash("sha256").update(expectedKey).digest();

  if (!crypto.timingSafeEqual(providedHash, expectedHash)) {
    res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid administrator key.",
    });
    return;
  }

  next();
}
