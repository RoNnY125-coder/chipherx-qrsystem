import { prisma } from "../config/prisma";

export interface CsvParticipantRow {
  name: string;
  teamName: string;
  email?: string;
  externalUserId?: string;
}

export interface ImportResult {
  totalRecords: number;
  successfulImports: number;
  failedImports: number;
  errors: Array<{ row: number; reason: string }>;
}

export class ParticipantService {
  /**
   * Parses and imports participants in bulk from CSV content.
   * Format: name,teamName,[email],[externalUserId]
   */
  static async importParticipants(csvContent: string): Promise<ImportResult> {
    const lines = csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      return {
        totalRecords: 0,
        successfulImports: 0,
        failedImports: 0,
        errors: [{ row: 0, reason: "CSV file is empty" }],
      };
    }

    // Determine header row
    const headerLine = lines[0].toLowerCase();
    const hasHeader =
      headerLine.includes("name") ||
      headerLine.includes("team") ||
      headerLine.includes("email");

    const dataLines = hasHeader ? lines.slice(1) : lines;
    const headerCols = hasHeader
      ? headerLine.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""))
      : ["name", "teamname", "email", "externaluserid"];

    const nameIdx = headerCols.findIndex((c) => c.includes("name") && !c.includes("team"));
    const teamIdx = headerCols.findIndex((c) => c.includes("team"));
    const emailIdx = headerCols.findIndex((c) => c.includes("email"));
    const userIdIdx = headerCols.findIndex((c) => c.includes("user") || c.includes("id") || c.includes("roll"));

    const errors: Array<{ row: number; reason: string }> = [];
    const validRows: CsvParticipantRow[] = [];

    // Track duplicates inside the file
    const seenEmails = new Set<string>();
    const seenExternalIds = new Set<string>();

    dataLines.forEach((line, idx) => {
      const rowNumber = idx + (hasHeader ? 2 : 1);
      const cols = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));

      const name = nameIdx !== -1 ? cols[nameIdx] : cols[0];
      const teamName = teamIdx !== -1 ? cols[teamIdx] : cols[1];
      const email = emailIdx !== -1 ? cols[emailIdx] : cols[2] || undefined;
      const externalUserId = userIdIdx !== -1 ? cols[userIdIdx] : cols[3] || undefined;

      if (!name || name.length === 0) {
        errors.push({ row: rowNumber, reason: "Missing participant name" });
        return;
      }
      if (!teamName || teamName.length === 0) {
        errors.push({ row: rowNumber, reason: "Missing team name" });
        return;
      }

      if (email) {
        if (seenEmails.has(email.toLowerCase())) {
          errors.push({ row: rowNumber, reason: `Duplicate email "${email}" in upload file` });
          return;
        }
        seenEmails.add(email.toLowerCase());
      }

      if (externalUserId) {
        if (seenExternalIds.has(externalUserId.toLowerCase())) {
          errors.push({ row: rowNumber, reason: `Duplicate externalUserId "${externalUserId}" in upload file` });
          return;
        }
        seenExternalIds.add(externalUserId.toLowerCase());
      }

      validRows.push({
        name,
        teamName,
        email: email || undefined,
        externalUserId: externalUserId || undefined,
      });
    });

    let successfulCount = 0;

    // Process valid rows
    for (const row of validRows) {
      try {
        await prisma.$transaction(async (tx) => {
          // Check for existing email or externalUserId in DB
          if (row.email) {
            const existingEmail = await tx.participant.findUnique({
              where: { email: row.email },
            });
            if (existingEmail) {
              throw new Error(`Email "${row.email}" is already registered`);
            }
          }

          if (row.externalUserId) {
            const existingUser = await tx.participant.findUnique({
              where: { externalUserId: row.externalUserId },
            });
            if (existingUser) {
              throw new Error(`External ID "${row.externalUserId}" is already registered`);
            }
          }

          // Upsert or find team
          let team = await tx.team.findUnique({
            where: { teamName: row.teamName },
          });

          if (!team) {
            team = await tx.team.create({
              data: { teamName: row.teamName },
            });
          }

          // Create participant
          await tx.participant.create({
            data: {
              name: row.name,
              email: row.email,
              externalUserId: row.externalUserId,
              teamId: team.id,
            },
          });
        });

        successfulCount++;
      } catch (err: any) {
        errors.push({
          row: validRows.indexOf(row) + (hasHeader ? 2 : 1),
          reason: err.message || "Database insert error",
        });
      }
    }

    return {
      totalRecords: dataLines.length,
      successfulImports: successfulCount,
      failedImports: errors.length,
      errors,
    };
  }

  /**
   * Retrieves participant details with attendance and team information.
   * Excludes QR token hashes and encrypted tokens.
   */
  static async getParticipantById(id: string) {
    const participant = await prisma.participant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        externalUserId: true,
        createdAt: true,
        updatedAt: true,
        team: {
          select: {
            id: true,
            teamName: true,
          },
        },
        attendance: {
          select: {
            id: true,
            scannedAt: true,
            scannedBy: true,
          },
        },
      },
    });

    if (!participant) {
      const error: any = new Error(`Participant with ID "${id}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    return {
      ...participant,
      attendanceStatus: participant.attendance ? "PRESENT" : "ABSENT",
    };
  }
}
