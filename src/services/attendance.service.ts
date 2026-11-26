import { prisma } from "../config/prisma";

export interface AttendanceRegistrationInput {
  name: string;
  externalUserId: string;
  teamName: string;
}

export class AttendanceService {
  /**
   * Registers a participant and associates them with a team.
   * If the team does not exist, it is created.
   * If the participant is already registered, verifies team association consistency.
   */
  static async registerParticipant(input: AttendanceRegistrationInput) {
    const { name, externalUserId, teamName } = input;

    // Check if participant is already registered
    const existingParticipant = await prisma.participant.findUnique({
      where: { externalUserId },
      include: { team: true },
    });

    if (existingParticipant) {
      if (existingParticipant.team.teamName !== teamName) {
        const error: any = new Error(
          `Participant is already registered under team "${existingParticipant.team.teamName}". Team re-assignment is not permitted.`
        );
        error.statusCode = 409;
        throw error;
      }

      return {
        isNew: false,
        participant: {
          id: existingParticipant.id,
          name: existingParticipant.name,
          externalUserId: existingParticipant.externalUserId,
          team: {
            id: existingParticipant.team.id,
            teamName: existingParticipant.team.teamName,
          },
        },
      };
    }

    // Upsert or find team
    let team = await prisma.team.findUnique({
      where: { teamName },
    });

    if (!team) {
      team = await prisma.team.create({
        data: { teamName },
      });
    }

    // Create participant mapped to team
    const participant = await prisma.participant.create({
      data: {
        name,
        externalUserId,
        teamId: team.id,
      },
      include: {
        team: true,
      },
    });

    return {
      isNew: true,
      participant: {
        id: participant.id,
        name: participant.name,
        externalUserId: participant.externalUserId,
        team: {
          id: team.id,
          teamName: team.teamName,
        },
      },
    };
  }
}
