import rateLimit from "express-rate-limit";

/**
 * Rate limiter for attendance scanning at event entry gates.
 * Allows up to 120 scans per 1-minute window per staff scanner IP to support rapid queue check-in.
 */
export const attendanceScanRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Scanning rate limit reached. Please pause momentarily before scanning next participant.",
  },
});

/**
 * Rate limiter for bulk participant import.
 * Allows up to 10 imports per 15-minute window per IP.
 */
export const importRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many participant import attempts. Please try again later.",
  },
});

/**
 * Rate limiter for QR generation.
 * Allows up to 10 bulk generations per 15-minute window per IP.
 */
export const qrGenerateRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many QR generation attempts. Throttled to protect database resources.",
  },
});

/**
 * General administrator endpoints rate limiter.
 * Allows up to 150 requests per 15-minute window per IP.
 */
export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many administrative requests. Access temporarily throttled.",
  },
});
