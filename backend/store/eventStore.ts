import { pool } from "../database/databaseConnection.js";
import { upsertDiscordServer } from "../database/discordServer.js";
import { upsertDiscordTextChannel } from "../database/discordTextChannel.js";
import { upsertDiscordUser } from "../database/discordUser.js";
import { insertEvent } from "../database/event.js";
import { insertEventCoLeader } from "../database/eventCoLeader.js";
import { Event } from "../types/eventSchema.js";

const events: Event[] = [];

export function getEvents(): Event[] {
  return events;
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
    await upsertDiscordUser(event.leader.id, event.leader.name, client);

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
      leaderId: event.leader.id,
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
      await insertEventCoLeader(coLeader.id, coLeader.name, client);
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
