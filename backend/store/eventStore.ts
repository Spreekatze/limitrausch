import type { EventDataDiscordUser, Event } from "../types/eventSchema.js";
import { pool } from "../database/databaseConnection.js";
import { upsertDiscordServer } from "../database/discordServer.js";
import { upsertDiscordTextChannel } from "../database/discordTextChannel.js";
import { upsertDiscordUser } from "../database/discordUser.js";
import { insertEvent } from "../database/event.js";
import { insertEventCoLeader } from "../database/eventCoLeader.js";

const events: Event[] = [];

type EventRow = {
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

type EventCoLeaderRow = {
  eventId: string;
  id: string;
  name: string;
};

export async function getEvents(): Promise<Event[]> {
  const result = await pool.query<EventRow>(`
    SELECT
      event.*,
      creator.name AS "creatorName",
      leader.name AS "leaderName"
    FROM "Event" event
    JOIN "DiscordUser" creator
      ON creator.id = event."creatorId"
    LEFT JOIN "DiscordUser" leader
      ON leader.id = event."leaderId"
  `);

  const coleaderResult = await pool.query<EventCoLeaderRow>(`
    SELECT
      eventCoLeader."eventId",
      discordUser.id,
      discordUser.name
    FROM "EventCoLeader" eventCoLeader
    JOIN "DiscordUser" discordUser
      ON discordUser.id = eventCoLeader."discordUserId"
  `);

  const coLeadersByEvent = new Map<string, EventDataDiscordUser[]>();
  for (const row of coleaderResult.rows) {
    const coLeaders = coLeadersByEvent.get(row.eventId) ?? [];
    coLeaders.push({ id: row.id, name: row.name });
    coLeadersByEvent.set(row.eventId, coLeaders);
  }

  return result.rows.map((row) => ({
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
    description: row.description ?? "",
    imageUrl: row.imageUrl ?? undefined,
    startTime: Number(row.startTime),
    endTime: Number(row.endTime),
    eventType: row.eventType,
    discordServerId: row.discordServerId ?? undefined,
    discordTextChannelId: row.discordTextChannelId ?? undefined,
    signUpCount: row.signUpCount ?? undefined,
    raidHelperId: row.raidHelperId ?? undefined,
    coLeaders: coLeadersByEvent.get(row.id) ?? [],
  }));
}

export function getEventById(id: string): Event | undefined {
  return events.find((event) => event.id === id);
}

export function getEventByRaidHelperId(id: string): Event | undefined {
  return events.find((event) => event.raidHelperId === id);
}

export async function addEvent(event: Event): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await upsertDiscordUser(event.creator.id, event.creator.name, client);
    if (event.leader) {
      await upsertDiscordUser(event.leader.id, event.leader.name, client);
    }

    for (const coLeader of event.coLeaders ?? []) {
      await upsertDiscordUser(coLeader.id, coLeader.name, client);
    }

    //TODO: add user for all signed up users

    if (event.discordServerId) {
      //TODO: add fetching discord name
      await upsertDiscordServer(event.discordServerId, "", client);
    }
    if (event.discordTextChannelId && event.discordServerId) {
      //TODO: add fetching channel name
      await upsertDiscordTextChannel(
        event.discordTextChannelId,
        "",
        event.discordServerId,
        client,
      );
    }
    //TODO: add connection for coLeads und SignUps, then upsert all users from there

    const eventResult = {
      id: event.id,
      lastUpdated: event.lastUpdated,
      creatorId: event.creator.id,
      leaderId: event.leader?.id,
      title: event.title,
      description: event.description,
      imageUrl: event.imageUrl,
      startTime: event.startTime,
      endTime: event.endTime,
      eventType: event.eventType,
      discordServerId: event.discordServerId,
      discordTextChannelId: event.discordTextChannelId,
      signUpCount: event.signUpCount,
      raidHelperId: event.raidHelperId,
    };
    await insertEvent(eventResult, client);

    for (const coLeader of event.coLeaders ?? []) {
      await insertEventCoLeader(coLeader.id, event.id, client);
    }

    //TODO: add connection fo coLeads and SignUps, add insert function to EventSignUp, then insert the connection into EventSignUp here

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export function updateEvent(
  id: string,
  update: Partial<Event>,
): Event | undefined {
  const event = events.find((event) => event.id === id);
  if (!event) {
    return undefined;
  }
  Object.assign(event, update);
  return event;
}

export function deleteEvent(id: string): boolean {
  const index = events.findIndex((event) => event.id === id);
  if (index === -1) {
    return false;
  }
  events.splice(index, 1);
  return true;
}
