# CipherX — Treasure Hunt QR Backend

Independent, security-hardened backend service for a college Treasure Hunt event. It handles checkpoint lifecycle management, cryptographic QR token generation & rendering, participant-to-team identity resolution, and database-level team access restrictions.

---

## 1. System Responsibilities & Boundaries

| Domain | Owner |
|---|---|
| Checkpoint Creation, Listing & Toggling | **QR Backend (This Service)** |
| 256-bit Cryptographic QR Token Generation & SHA-256 Hashing | **QR Backend (This Service)** |
| Dynamic PNG QR Code Generation | **QR Backend (This Service)** |
| Atomic Team-Level Checkpoint Access Enforcement (1 attempt per team) | **QR Backend (This Service)** |
| Quiz Access Records (`QuizAccess`) | **QR Backend (This Service)** |
| Participant Registration & Login | Main Website Team |
| Embedded QR Scanner Frontend | Main Website Team |
| Quiz UI, Questions & Answer Evaluation | Main Website Team |
| Answer Locking & Immutability | Main Website Team |
| Leaderboard & Scoring | Main Website Team |

---

## 2. Architecture & Tech Stack

```
               [ PARTICIPANTS' PHONES ]
                          │
                          ▼ (Web Browser)
                [ MAIN EVENT WEBSITE ]
                          │
           ┌──────────────┴──────────────┐
           │ (API: Scan / Attendance)    │ (Admin Dashboard)
           ▼                             ▼
    ┌──────────────────────────────────────────────┐
    │          TREASURE HUNT QR BACKEND            │
    │  - Node.js + Express 5 + TypeScript 7        │
    │  - Strict Zod Input Validation               │
    │  - Constant-Time Admin Key Comparison        │
    │  - AES-256-GCM Token Encryption              │
    │  - IP-based Rate Limiting (express-rate-limit)│
    │  - Whitelisted CORS                          │
    └──────────────────────┬───────────────────────┘
                           │ Prisma ORM (v6.12.0)
                           │ (Transaction Pooler :6543)
                           ▼
          [ SUPABASE POSTGRESQL (Mumbai ap-south-1) ]
           - Checkpoint (unique SHA-256 hash)
           - Team
           - Participant (mapped to Team)
           - QuizAccess (UNIQUE constraint: teamId + checkpointId)
```

- **Runtime:** Node.js (v20+)
- **Framework:** Express.js 5
- **Language:** TypeScript 7 (CommonJS, strict)
- **Database:** Supabase-hosted PostgreSQL (Mumbai `ap-south-1`) with PgBouncer connection pooling
- **ORM:** Prisma 6.12.0
- **Validation:** Zod
- **QR Engine:** `qrcode` & Node.js `crypto`

---

## 3. API Documentation

### A. Checkpoint Management (Admin Only)
*All administrative endpoints require the `x-admin-key: <ADMIN_API_KEY>` header.*

#### 1. Create Checkpoint
- **Endpoint:** `POST /api/checkpoints`
- **Headers:** `x-admin-key: <ADMIN_API_KEY>`, `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "name": "Library Garden Checkpoint",
    "isActive": true
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Checkpoint created successfully",
    "data": {
      "id": "e3b0c442-98fc-1c14-9afb-4c8996fb9242",
      "name": "Library Garden Checkpoint",
      "isActive": true,
      "createdAt": "2026-11-26T12:00:00.000Z",
      "updatedAt": "2026-11-26T12:00:00.000Z",
      "qrToken": "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
    }
  }
  ```
  *(Note: The plaintext `qrToken` is returned **only once** upon creation. Only its SHA-256 hash and AES-256-GCM ciphertext are stored in the database.)*

#### 2. Get All Checkpoints
- **Endpoint:** `GET /api/checkpoints?page=1&limit=50`
- **Headers:** `x-admin-key: <ADMIN_API_KEY>`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "e3b0c442-98fc-1c14-9afb-4c8996fb9242",
        "name": "Library Garden Checkpoint",
        "isActive": true,
        "createdAt": "2026-11-26T12:00:00.000Z",
        "updatedAt": "2026-11-26T12:00:00.000Z"
      }
    ],
    "pagination": { "total": 1, "page": 1, "limit": 50, "totalPages": 1 }
  }
  ```
  *(Note: Token hashes and encrypted tokens are never leaked.)*

#### 3. Update Checkpoint Status
- **Endpoint:** `PATCH /api/checkpoints/:id/status`
- **Headers:** `x-admin-key: <ADMIN_API_KEY>`, `Content-Type: application/json`
- **Request Body:**
  ```json
  { "isActive": false }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Checkpoint deactivated successfully",
    "data": { "id": "...", "name": "...", "isActive": false, "updatedAt": "..." }
  }
  ```

#### 4. Download / View QR Code Image
- **Endpoint:** `GET /api/checkpoints/:id/qr`
- **Headers:** `x-admin-key: <ADMIN_API_KEY>`
- **Response (200 OK):** Binary image with `Content-Type: image/png`. Streams high-resolution PNG image directly.

---

### B. Participant Attendance & Team Registration

#### Register Participant Attendance
- **Endpoint:** `POST /api/attendance/register`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "name": "Alice Johnson",
    "externalUserId": "student_roll_101",
    "teamName": "CyberKnights"
  }
  ```
- **Response (201 Created / 200 OK):**
  ```json
  {
    "success": true,
    "message": "Participant registered successfully",
    "data": {
      "id": "part_uuid_123",
      "name": "Alice Johnson",
      "externalUserId": "student_roll_101",
      "team": {
        "id": "team_uuid_456",
        "teamName": "CyberKnights"
      }
    }
  }
  ```

---

### C. QR Scan Validation (Atomic Team Lock)

#### Scan & Claim Checkpoint Quiz
- **Endpoint:** `POST /api/qr/scan`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <TOKEN>` (or `x-participant-id: student_roll_101` in dev)
- **Request Body:**
  ```json
  {
    "qrToken": "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
  }
  ```
- **Responses:**
  - **Success (200 OK):**
    ```json
    {
      "success": true,
      "message": "Checkpoint access granted",
      "data": {
        "checkpointId": "e3b0c442-98fc-1c14-9afb-4c8996fb9242",
        "teamId": "team_uuid_456",
        "accessGranted": true
      }
    }
    ```
  - **Already Claimed by Team (409 Conflict):**
    ```json
    {
      "success": false,
      "message": "Your team has already accessed this checkpoint."
    }
    ```
  - **Inactive Checkpoint (400 Bad Request):**
    ```json
    {
      "success": false,
      "message": "This checkpoint is currently inactive."
    }
    ```
  - **Invalid QR Token (404 Not Found):**
    ```json
    {
      "success": false,
      "message": "Invalid QR code."
    }
    ```
  - **Unregistered Participant (403 Forbidden):**
    ```json
    {
      "success": false,
      "message": "Participant is not registered or has no verified team association."
    }
    ```

---

## 4. Main Website Integration Contract

When the main website's embedded scanner scans a checkpoint QR:
1. The main website sends `POST /api/qr/scan` with the scanned `qrToken`.
2. Participant identity **MUST** be supplied via trusted credentials:
   - **Production:** `Authorization: Bearer <JWT>` containing verified `externalUserId` (e.g. `sub` or `rollNumber`).
   - **Server-to-Server Proxy:** `x-participant-id: <ID>` accompanied by `x-integration-secret: <SHARED_SECRET>`.
3. The response contains `{ success: true, data: { checkpointId, teamId, accessGranted: true } }`. The main website can then unlock the corresponding quiz interface.

---

## 5. Security Measures Implemented

1. **Cryptographic Randomness:** Checkpoint tokens use Node's `crypto.randomBytes(32)` (256 bits of entropy).
2. **SHA-256 Database Hashing:** Raw tokens are never stored in plaintext in the database. Scan verification hashes the incoming token before querying PostgreSQL.
3. **AES-256-GCM Token Encryption:** Tokens are stored encrypted with authentication tags for dynamic QR image rendering without plaintext exposure.
4. **PostgreSQL Atomic Lock:** `QuizAccess` enforces `@@unique([teamId, checkpointId])`. Simultaneous scans from two teammates are atomically rejected by PostgreSQL with code `P2002`.
5. **Constant-Time Admin Key Comparison:** `crypto.timingSafeEqual` prevents timing attacks on the `x-admin-key` header.
6. **Rate Limiting:** IP-based throttles protect against token brute-forcing (40 scans / 15 min), registration spam (30 / 15 min), and admin route abuse.
7. **Strict CORS:** Origins are restricted via `FRONTEND_URL` environment whitelist.

---

## 6. Local Setup & Commands

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
4. **Generate Prisma Client:**
   ```bash
   npx prisma generate
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
