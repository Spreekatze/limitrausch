import {
  DatabaseEventCoLeaderRow,
  DatabaseEventRow,
  DatabaseEventSignUpRow,
} from "../types/databaseRowSchema.js";
import { Event } from "../types/eventSchema.js";
import { Job } from "../types/jobSchema.js";
import { jobsById } from "../data/jobs.js";

function getJobFromId(id: number): Job {
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
      name: signUp.userNameOnServer,
      userId: signUp.discordUserId,
      status: signUp.status,
      entryTime: signUp.entryTime,
      position: signUp.position,
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
    creator: {
      id: row.creatorId,
      name: row.creatorName,
    },
    leader: row.leaderId
      ? {
          id: row.leaderId,
          name: row.leaderName ?? "",
        }
      : undefined,
    title: row.title,
    description: row.description ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
    startTime: Number(row.startTime),
    endTime: Number(row.endTime),
    eventType: row.eventType,
    discordServerId: row.discordServerId ?? undefined,
    discordTextChannelId: row.discordTextChannelId ?? undefined,
    signUpCount: row.signUpCount ?? undefined,
    raidHelperId: row.raidHelperId ?? undefined,
    coLeaders,
    signUps,
  };
}
