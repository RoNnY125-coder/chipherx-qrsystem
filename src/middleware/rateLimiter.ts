import rateLimit from "express-rate-limit";

/**
 * Rate limiter for QR scan attempts.
 * Allows up to 40 scan attempts per 15-minute window per IP to prevent brute-forcing QR tokens.
 */
export const scanRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many scan attempts. Please wait before scanning again.",
  },
});

/**
 * Rate limiter for attendance registration.
 * Allows up to 30 registrations per 15-minute window per IP.
 */
export const attendanceRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many registration requests. Please try again later.",
  },
});

/**
 * Rate limiter for administrator endpoints.
 * Allows up to 100 requests per 15-minute window per IP.
 */
export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many administrative requests. Access temporarily throttled.",
  },
});
