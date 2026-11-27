import express from "express";
import cors, { CorsOptions } from "cors";
import dotenv from "dotenv";
import checkpointRoutes from "./routes/checkpoint.routes";
import attendanceRoutes from "./routes/attendance.routes";
import qrScanRoutes from "./routes/qrScan.routes";
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
    // Allow non-browser requests (e.g. mobile apps, server-to-server, curl in dev)
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
    "x-participant-id",
    "x-integration-secret",
  ],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

// -----------------------------------------------------------------------------
// Base Health Route
// -----------------------------------------------------------------------------
app.get("/", (_req, res) => {
  res.json({
    name: "Treasure Hunt QR Backend",
    status: "operational",
    version: "1.0.0",
  });
});

// -----------------------------------------------------------------------------
// API Route Registration
// -----------------------------------------------------------------------------
app.use("/api/checkpoints", checkpointRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/qr", qrScanRoutes);

// -----------------------------------------------------------------------------
// Centralized Error Handling
// -----------------------------------------------------------------------------
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Treasure Hunt QR Backend running on port ${PORT}`);
  });
}

export default app;
