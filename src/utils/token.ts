import crypto from "crypto";

/**
 * Generates a cryptographically secure, URL-safe random token
 * for checkpoint QR codes (256 bits of entropy = 64 hex chars).
 */
export function generateQrToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
