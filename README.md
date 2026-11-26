# CipherX — Treasure Hunt QR Backend

Independent backend system for a college Treasure Hunt event, responsible for checkpoint management, cryptographic QR token generation, participant-to-team resolution, and team-level access control.

---

## 1. System Responsibilities

| Responsibility Area | Handled By |
|---|---|
| QR Code Generation & Checkpoint Management | **QR Backend (This Service)** |
| QR Validation & Scan Processing | **QR Backend (This Service)** |
| Team-Level Checkpoint Access Control (1 per team) | **QR Backend (This Service)** |
| Quiz Access Records | **QR Backend (This Service)** |
| Participant Registration & Login | Main Website Team |
| Embedded QR Scanner Frontend | Main Website Team |
| Quiz UI, Questions & Answer Evaluation | Main Website Team |
| Answer Locking & Immutability | Main Website Team |
| Leaderboard & Scoring | Main Website Team |

---

## 2. Tech Stack

- **Runtime:** Node.js (v20+)
- **Framework:** Express.js 5
- **Language:** TypeScript 7 (CommonJS, strict)
- **Database:** Supabase-hosted PostgreSQL (Mumbai region `ap-south-1`) / Local PostgreSQL
- **ORM:** Prisma 6.12.0
- **Validation:** Zod
- **QR Engine:** `qrcode` & Node.js `crypto` (cryptographically secure tokens)

---

## 3. Getting Started (For Team Members)

### Prerequisites
- Node.js (v20 or higher)
- Git

### Installation

1. **Clone repository and checkout the `backend` branch:**
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
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in the `DATABASE_URL` (Transaction pooler, port `6543`) and `DIRECT_URL` (Session pooler, port `5432`) from your Supabase project dashboard.
   > **Note:** Never commit `.env` to Git. It is automatically ignored.

4. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

5. **Start Development Server:**
   ```bash
   npm run dev
   ```
   The server will start on port `5000` (or `PORT` specified in `.env`).

---

## 4. Database Models & Core Constraints

- **`Checkpoint`**: Stores checkpoint details with a unique, unpredictable 64-character hex `qrToken`.
- **`Team`**: Participating teams (`teamName` unique).
- **`Participant`**: Maps `externalUserId` (from main website) to `teamId` along with participant `name`.
- **`QuizAccess`**: Tracks quiz access per team and checkpoint.
  - **Constraint:** `@@unique([teamId, checkpointId])` enforces at the database level that **only one member per team** can ever claim a given checkpoint's quiz.

---

## 5. Branching Strategy

- **`main`**: Production-ready code.
- **`backend`**: Primary development branch for backend engineers. Always create feature branches or submit PRs against `backend`.
