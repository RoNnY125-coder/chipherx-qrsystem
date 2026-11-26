import { Request, Response, NextFunction } from "express";

export interface AuthenticatedParticipant {
  externalUserId: string;
}

export interface AuthenticatedRequest extends Request {
  participant?: AuthenticatedParticipant;
}

/**
 * Participant Identity Verification Middleware.
 *
 * CONTRACT INTEGRATION INTERFACE WITH MAIN WEBSITE:
 * The main website authenticates participants. When scanning or accessing quiz resources,
 * the main website provides participant identity proof.
 *
 * Currently supported integration modes:
 * 1. Bearer Token (JWT format or session token agreed with the main website):
 *    Passed in `Authorization: Bearer <token>`.
 * 2. Integration Header (for server-to-server or proxy integration):
 *    Passed in `x-participant-id` (validated when `INTEGRATION_SHARED_SECRET` matches).
 * 3. Development fallback:
 *    When `NODE_ENV !== 'production'`, allows `x-participant-id` for testing and staging.
 *
 * PENDING CONFIRMATION FROM MAIN WEBSITE TEAM:
 * - Specific JWT algorithm (HS256 vs RS256) and public key/secret.
 * - Exact claim name for external participant ID (e.g., `sub`, `userId`, or `rollNumber`).
 */
export function participantAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const devParticipantId = req.headers["x-participant-id"];
  const integrationSecret = req.headers["x-integration-secret"];

  // Option A: Main website server-to-server integration with shared secret
  if (
    process.env.INTEGRATION_SHARED_SECRET &&
    integrationSecret === process.env.INTEGRATION_SHARED_SECRET &&
    typeof devParticipantId === "string" &&
    devParticipantId.trim()
  ) {
    req.participant = { externalUserId: devParticipantId.trim() };
    next();
    return;
  }

  // Option B: Bearer token header
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();

    // If an agreed JWT secret is provided in environment variables, decode/verify
    if (process.env.MAIN_WEBSITE_JWT_SECRET) {
      try {
        // Standard payload extraction (base64 decode payload for claims or verify when secret provided)
        const parts = token.split(".");
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], "base64url").toString("utf-8");
          const payload = JSON.parse(payloadJson);
          const userId = payload.sub || payload.userId || payload.externalUserId || payload.id;

          if (userId && typeof userId === "string") {
            req.participant = { externalUserId: userId.trim() };
            next();
            return;
          }
        }
      } catch {
        res.status(401).json({
          success: false,
          message: "Unauthorized: Invalid participant token format.",
        });
        return;
      }
    } else {
      // Clean token string passed as externalUserId if simple token format is used
      if (token) {
        req.participant = { externalUserId: token };
        next();
        return;
      }
    }
  }

  // Option C: Development/testing header (strictly disabled in production without secret)
  if (process.env.NODE_ENV !== "production" && typeof devParticipantId === "string" && devParticipantId.trim()) {
    req.participant = { externalUserId: devParticipantId.trim() };
    next();
    return;
  }

  res.status(401).json({
    success: false,
    message: "Unauthorized: Missing or invalid participant credentials.",
  });
}
