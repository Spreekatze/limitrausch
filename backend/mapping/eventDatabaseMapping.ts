import type { Event, EventDataDiscordUser } from "../types/eventSchema.js";

export type DatabaseEventRow = {
  id: string;
  lastUpdated: string;
  creatorId: string;
  creatorName: string;
  leaderId: string | null;
  leaderName: string | null;
  title: string;
  description: string | null;
  imageUrl: string | null;
  startTime: string;
  endTime: string;
  eventType: Event["eventType"];
  discordServerId: string | null;
  discordTextChannelId: string | null;
  signUpCount: number | null;
  raidHelperId: string | null;
};

export type DatabaseEventCoLeaderRow = {
  eventId: string;
  id: string;
  name: string;
};

export function mapDatabaseEventRowToEvent(
  row: DatabaseEventRow,
  coLeaders: EventDataDiscordUser[] = [],
): Event {
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
  };
}
