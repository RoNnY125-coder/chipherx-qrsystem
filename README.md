# CipherX — Treasure Hunt Attendance QR Backend

Independent, security-hardened backend service for the **Treasure Hunt Event Attendance System**. Each registered participant receives a unique, cryptographically secure QR code before the event; on event day, authorized event staff scan each participant's QR code via the embedded scanner in the main event website to record attendance atomically.

---

## 1. System Responsibilities & Boundaries

| Domain | Owner |
|---|---|
| Bulk CSV Participant & Team Import | **Attendance QR Backend (This Service)** |
| 256-bit Cryptographic QR Token Generation (`TH26_...`) & SHA-256 Hashing | **Attendance QR Backend (This Service)** |
| AES-256-GCM Token Encryption & Individual / Bulk ZIP QR Export | **Attendance QR Backend (This Service)** |
| Atomic Event-Day Attendance Scanning (1 check-in per participant) | **Attendance QR Backend (This Service)** |
| Attendance Summary & Team Breakdown Reporting | **Attendance QR Backend (This Service)** |
| Embedded QR Scanner UI & Staff Login | Main Event Website Team |
| Quiz UI, Scoring & Leaderboard | Main Event Website Team |

---

## 2. Architecture & Tech Stack

```
              [ PARTICIPANTS' PERSONAL QRs ]
                            │
                            ▼ (Scanned by Event Staff)
                  [ MAIN EVENT WEBSITE ]
                            │
             ┌──────────────┴──────────────┐
             │ (POST /api/attendance/scan) │ (Admin Dashboard / CSV / ZIP)
             ▼                             ▼
      ┌──────────────────────────────────────────────┐
      │     TREASURE HUNT ATTENDANCE QR BACKEND      │
      │  - Node.js + Express 5 + TypeScript 7        │
      │  - Strict Zod Input Validation               │
      │  - Constant-Time Admin Key Comparison        │
      │  - SHA-256 Lookup + AES-256-GCM Encryption   │
      │  - Archiver v8 Streaming ZIP Export          │
      │  - IP-based Rate Limiting                    │
      │  - Whitelisted CORS                          │
      └──────────────────────┬───────────────────────┘
                             │ Prisma ORM (v6.12.0)
                             │ (Transaction Pooler :6543)
                             ▼
            [ SUPABASE POSTGRESQL (Mumbai ap-south-1) ]
             - Team
             - Participant (unique email, unique qrTokenHash)
             - Attendance (UNIQUE constraint on participantId)
```

- **Runtime:** Node.js (v20+)
- **Framework:** Express.js 5
- **Language:** TypeScript 7 (CommonJS, strict)
- **Database:** Supabase-hosted PostgreSQL (Mumbai `ap-south-1`) with PgBouncer connection pooling
- **ORM:** Prisma 6.12.0
- **Validation:** Zod
- **QR & Export:** `qrcode`, Node.js `crypto`, `archiver` v8 (`ZipArchive`), `multer`

---

## 3. API Documentation

### A. Health Check
- **Endpoint:** `GET /`
- **Response (`200 OK`):** Service status, version (`2.0.0`), and enabled features.

---

### B. Admin Endpoints
*All admin endpoints require `x-admin-key: <ADMIN_API_KEY>`.*

#### 1. Bulk Import Participants (CSV)
- **Endpoint:** `POST /api/admin/participants/import`
- **Headers:** `x-admin-key: <ADMIN_API_KEY>`, `Content-Type: multipart/form-data` (field name: `file`) or raw `text/csv`
- **CSV Columns:** `name,email,teamName` (optional `externalUserId`)
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Participant import completed",
    "data": {
      "totalRecords": 5,
      "successfulImports": 5,
      "failedImports": 0,
      "errors": []
    }
  }
  ```

#### 2. Generate Cryptographic QR Tokens
- **Endpoint:** `POST /api/admin/qr/generate`
- **Headers:** `x-admin-key: <ADMIN_API_KEY>`, `Content-Type: application/json`
- **Request Body (optional):**
  ```json
  {
    "forceRegenerate": false,
    "teamId": "optional-team-uuid"
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "QR code generation completed",
    "data": {
      "totalParticipants": 50,
      "tokensGenerated": 50,
      "tokensSkipped": 0
    }
  }
  ```

#### 3. Bulk Export All QR Codes (ZIP)
- **Endpoint:** `GET /api/admin/qr/export`
- **Headers:** `x-admin-key: <ADMIN_API_KEY>`
- **Response (`200 OK`):** Streams `attendance-qrs.zip` (`Content-Type: application/zip`) with PNG QR codes organized into folders by team (`<TeamName>/<ParticipantName>_<shortId>.png`).

#### 4. Download Single Participant QR (PNG)
- **Endpoint:** `GET /api/admin/participants/:id/qr`
- **Headers:** `x-admin-key: <ADMIN_API_KEY>`
- **Response (`200 OK`):** Binary PNG image (`Content-Type: image/png`).

#### 5. Attendance Dashboard Summary
- **Endpoint:** `GET /api/admin/attendance`
- **Headers:** `x-admin-key: <ADMIN_API_KEY>`
- **Response (`200 OK`):** Overall attendance totals, check-in percentage, and per-team summary list.

#### 6. Team Attendance Breakdown
- **Endpoint:** `GET /api/admin/attendance/:teamId`
- **Headers:** `x-admin-key: <ADMIN_API_KEY>`
- **Response (`200 OK`):** Team details with each member's attendance status (`PRESENT` / `ABSENT`) and scan timestamp.

#### 7. Participant Details
- **Endpoint:** `GET /api/admin/participants/:id`
- **Headers:** `x-admin-key: <ADMIN_API_KEY>`
- **Response (`200 OK`):** Participant profile, team info, and attendance status. Token hashes and encrypted tokens are never exposed.

---

### C. Event-Day Attendance Scanning

#### Scan Participant QR
- **Endpoint:** `POST /api/attendance/scan`
- **Headers:**
  - `Content-Type: application/json`
  - Staff credentials (one of):
    - `Authorization: Bearer <STAFF_JWT>`
    - `x-staff-id: <STAFF_ID>` + `x-integration-secret: <INTEGRATION_SHARED_SECRET>`
    - `x-staff-id: <STAFF_ID>` (in development when `NODE_ENV !== "production"`)
- **Request Body:**
  ```json
  {
    "qrToken": "TH26_<64_hex_chars>"
  }
  ```
- **Responses:**
  - **Success (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Attendance registered successfully",
      "data": {
        "participantName": "Arjun Sharma",
        "teamName": "Team Blaze",
        "attendanceStatus": "PRESENT",
        "scannedAt": "2026-11-27T05:20:34.695Z"
      }
    }
    ```
  - **Duplicate Scan (`409 Conflict`):** `"Attendance has already been registered."`
  - **Invalid QR (`404 Not Found`):** `"Invalid QR code."`
  - **Unauthorized (`401 Unauthorized`):** `"Unauthorized: Missing or invalid event staff credentials."`

---

## 4. Security Measures Implemented

1. **Cryptographic Randomness:** QR tokens use `crypto.randomBytes(32)` (256 bits of entropy) prefixed with `TH26_`.
2. **SHA-256 Database Lookup:** Raw tokens are never stored in plaintext. Incoming scans are hashed with SHA-256 before querying PostgreSQL.
3. **AES-256-GCM Token Encryption:** Tokens are stored encrypted with authentication tags so admins can export PNGs without storing plaintext tokens.
4. **PostgreSQL Atomic Lock:** `Attendance` enforces `@unique` on `participantId`. Concurrent duplicate scans are atomically rejected by PostgreSQL (`P2002` -> HTTP `409`).
5. **Constant-Time Admin Key Comparison:** `crypto.timingSafeEqual` protects `x-admin-key`.
6. **Rate Limiting & CORS:** IP-based rate limiters on scanning, CSV imports, QR generation, and admin routes, plus `FRONTEND_URL` CORS whitelist.

---

## 5. Local Setup & Commands

1. **Clone repository and checkout `backend` branch:**
   ```bash
   git clone https://github.com/RoNnY125-coder/chipherx-qrsystem.git
   cd chipherx-qrsystem
   git checkout backend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   # Fill in DATABASE_URL, DIRECT_URL, ADMIN_API_KEY, QR_ENCRYPTION_KEY, FRONTEND_URL
   ```
4. **Generate Prisma Client & Run Migrations:**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```
5. **Run Development Server:**
   ```bash
   npm run dev
   ```
6. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```
