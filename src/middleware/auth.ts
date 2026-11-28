import { Request, Response, NextFunction } from "express";

export interface AuthenticatedStaff {
  userId: string;
  role?: string;
}

export interface StaffAuthenticatedRequest extends Request {
  staff?: AuthenticatedStaff;
}

/**
 * Staff Identity Verification Middleware for Attendance Scanning.
 *
 * INTEGRATION INTERFACE CONTRACT WITH MAIN EVENT WEBSITE:
 * On event day, authorized staff members operate the embedded scanner. When a scan is performed,
 * the main website forwards the request along with verified staff credentials.
 *
 * Supported integration mechanisms:
 * 1. Bearer Token (JWT issued by main website):
 *    Passed in `Authorization: Bearer <token>`.
 * 2. Server-to-server proxy with shared secret:
 *    Passed via `x-staff-id: <STAFF_ID>` with `x-integration-secret: <SECRET>`.
 * 3. Development testing:
 *    In development (`NODE_ENV !== 'production'`), accepts `x-staff-id: <STAFF_ID>`.
 *
 * PENDING CONFIRMATION FROM MAIN WEBSITE TEAM:
 * - Staff JWT signing algorithm and shared secret / public key.
 * - Staff user ID claim field name (e.g., `sub` vs `staffId` vs `email`).
 */
export function staffAuth(
  req: StaffAuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const staffIdHeader = req.headers["x-staff-id"];
  const integrationSecret = req.headers["x-integration-secret"];

  // 1. Server-to-server integration with shared secret
  if (
    process.env.INTEGRATION_SHARED_SECRET &&
    integrationSecret === process.env.INTEGRATION_SHARED_SECRET &&
    typeof staffIdHeader === "string" &&
    staffIdHeader.trim()
  ) {
    req.staff = { userId: staffIdHeader.trim(), role: "staff" };
    next();
    return;
  }

  // 2. Bearer token
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();

    if (process.env.STAFF_JWT_SECRET) {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], "base64url").toString("utf-8");
          const payload = JSON.parse(payloadJson);
          const userId = payload.sub || payload.userId || payload.staffId || payload.id;

          if (userId && typeof userId === "string") {
            req.staff = { userId: userId.trim(), role: payload.role || "staff" };
            next();
            return;
          }
        }
      } catch {
        res.status(401).json({
          success: false,
          message: "Unauthorized: Invalid staff token format.",
        });
        return;
      }
    } else {
      if (token) {
        req.staff = { userId: token, role: "staff" };
        next();
        return;
      }
    }
  }

  // 3. Development testing fallback
  if (process.env.NODE_ENV !== "production" && typeof staffIdHeader === "string" && staffIdHeader.trim()) {
    req.staff = { userId: staffIdHeader.trim(), role: "staff" };
    next();
    return;
  }

  res.status(401).json({
    success: false,
    message: "Unauthorized: Missing or invalid event staff credentials.",
  });
}
