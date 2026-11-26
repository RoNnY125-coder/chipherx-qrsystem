import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

/**
 * Derives a 32-byte encryption key from environment variable or fallback.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.QR_ENCRYPTION_KEY || process.env.ADMIN_API_KEY || "treasure-hunt-default-secure-key-32b!";
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Generates a cryptographically secure random QR token (32 bytes = 256 bits of entropy = 64 hex chars).
 */
export function generateQrToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Calculates the SHA-256 hash of a QR token.
 * This hash is stored in the database for lookups so the raw token is never stored in plaintext.
 */
export function hashQrToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Encrypts a QR token using AES-256-GCM.
 * Format: iv:authTag:ciphertext (all in hex).
 */
export function encryptToken(plainTextToken: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainTextToken, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted QR token.
 */
export function decryptToken(encryptedData: string): string {
  const parts = encryptedData.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token format");
  }

  const [ivHex, authTagHex, cipherText] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
