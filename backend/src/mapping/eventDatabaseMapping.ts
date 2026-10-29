import { Event, Job, JobId } from "@limitrausch/contracts";
import {
  DatabaseEventRow,
  DatabaseEventCoLeaderRow,
  DatabaseEventSignUpRow,
} from "../types/databaseRowSchema.js";
import { jobsById } from "../services/jobService.js";

function getJobFromId(id: JobId): Job {
  const job = jobsById.get(id);
  if (!job) {
    throw new Error(`Unknown job: ${id}`);
  }
  return job;
}

export function mapDatabaseEventRowToEvent(
  row: DatabaseEventRow,
  coLeadersRow?: DatabaseEventCoLeaderRow[],
  signUpsRow?: DatabaseEventSignUpRow[],
): Event {
  const coLeaders = coLeadersRow?.map(({ id, name }) => ({
    id: id,
    name: name,
  }));

  const signUps = signUpsRow?.map((signUp) => {
    return {
      id: signUp.id,
      raidHelperId: signUp.raidHelperId ?? undefined,
      userId: signUp.discordUserId ?? undefined,
      name: signUp.usernameOnGuild ?? undefined,
      status: signUp.status ?? undefined,
      jobFirstPrio: signUp.jobFirstPrio
        ? getJobFromId(signUp.jobFirstPrio)
        : undefined,
      jobFlexSecondPrio: signUp.jobFlexSecondPrio
        ? signUp.jobFlexSecondPrio.map((id) => getJobFromId(id))
        : undefined,
    };
  });

  return {
    id: row.id,
    lastUpdated: Number(row.lastUpdated),
    creator:
      row.creatorId && row.creatorName
        ? {
            id: row.creatorId,
            name: row.creatorName,
          }
        : undefined,
    leader:
      row.leaderId && row.leaderName
        ? {
            id: row.leaderId,
            name: row.leaderName,
          }
        : undefined,
    title: row.title,
    description: row.description ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
    startTime: Number(row.startTime),
    endTime: Number(row.endTime),
    eventType: row.eventType,
    eventDifficulty: row.eventDifficulty ?? undefined,
    eventGoal: row.eventGoal ?? undefined,
    discordGuild: row.discordGuildId
      ? {
          id: row.discordGuildId,
          name: row.discordGuildName ?? undefined,
          icon: row.discordGuildIcon ?? undefined,
          textChannelId: row.discordTextChannelId ?? undefined,
          textChannelName: row.discordTextChannelName ?? undefined,
          messageId: row.discordMessageId ?? undefined,
        }
      : undefined,
    signUpCount: signUps?.length,
    raidHelperId: row.raidHelperId ?? undefined,
    isPublic: row.isPublic,
    coLeaders,
    signUps,
  };
}
