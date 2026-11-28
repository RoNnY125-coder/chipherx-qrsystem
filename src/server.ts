import express from "express";
import cors, { CorsOptions } from "cors";
import dotenv from "dotenv";
import adminRoutes from "./routes/admin.routes";
import attendanceRoutes from "./routes/attendance.routes";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();

// Trust reverse proxy if running behind one (e.g. Nginx, Cloudflare, Render, Railway)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// -----------------------------------------------------------------------------
// CORS Configuration
// -----------------------------------------------------------------------------
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((origin) => origin.trim())
  : ["http://localhost:3000", "http://localhost:5173"];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile scanner app, server-to-server, curl in dev)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} is not permitted by CORS policy.`));
    }
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-admin-key",
    "x-staff-id",
    "x-integration-secret",
  ],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "5mb" }));
app.use(express.text({ type: ["text/csv", "text/plain"], limit: "5mb" }));

// -----------------------------------------------------------------------------
// Base Health Route
// -----------------------------------------------------------------------------
app.get("/", (_req, res) => {
  res.json({
    name: "Treasure Hunt Attendance QR Backend",
    status: "operational",
    version: "2.0.0",
    features: [
      "bulk_participant_import",
      "secure_qr_generation",
      "bulk_zip_export",
      "atomic_attendance_scanning",
      "attendance_reporting",
    ],
  });
});

// -----------------------------------------------------------------------------
// API Route Registration
// -----------------------------------------------------------------------------
app.use("/api/admin", adminRoutes);
app.use("/api/attendance", attendanceRoutes);

// -----------------------------------------------------------------------------
// Centralized Error Handling
// -----------------------------------------------------------------------------
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Treasure Hunt Attendance QR Backend running on port ${PORT}`);
  });
}

export default app;
