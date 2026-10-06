import type { Event } from "../types/eventSchema.js";
import {
  mapDatabaseEventRowToEvent,
  type DatabaseEventCoLeaderRow,
  type DatabaseEventRow,
} from "../mapping/eventDatabaseMapping.js";
import { pool } from "../database/databaseConnection.js";
import { upsertDiscordServer } from "../database/discordServer.js";
import { upsertDiscordTextChannel } from "../database/discordTextChannel.js";
import { upsertDiscordUser } from "../database/discordUser.js";
import { insertEvent } from "../database/event.js";
import { insertEventCoLeader } from "../database/eventCoLeader.js";

export async function getEvents(): Promise<Event[]> {
  const result = await pool.query<DatabaseEventRow>(`
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

  const coleaderResult = await pool.query<DatabaseEventCoLeaderRow>(`
    SELECT
      eventCoLeader."eventId",
      discordUser.id,
      discordUser.name
    FROM "EventCoLeader" eventCoLeader
    JOIN "DiscordUser" discordUser
      ON discordUser.id = eventCoLeader."discordUserId"
  `);

  const coLeadersByEvent = new Map<string, { id: string; name: string }[]>();
  for (const row of coleaderResult.rows) {
    const coLeaders = coLeadersByEvent.get(row.eventId) ?? [];
    coLeaders.push({ id: row.id, name: row.name });
    coLeadersByEvent.set(row.eventId, coLeaders);
  }

  return result.rows.map((row) =>
    mapDatabaseEventRowToEvent(row, coLeadersByEvent.get(row.id) ?? []),
  );
}

type EventLookupColumn = "id" | "raidHelperId";

async function getEventBy(
  column: EventLookupColumn,
  value: string,
): Promise<Event | undefined> {
  const columnName = column === "id" ? '"id"' : '"raidHelperId"';
  const result = await pool.query<DatabaseEventRow>(
    `
    SELECT
      event.*,
      creator.name AS "creatorName",
      leader.name AS "leaderName"
    FROM "Event" event
    JOIN "DiscordUser" creator
      ON creator.id = event."creatorId"
    LEFT JOIN "DiscordUser" leader
      ON leader.id = event."leaderId"
    WHERE event.${columnName} = $1
    `,
    [value],
  );
  const row = result.rows[0];
  if (!row) {
    return undefined;
  }

  const coleaderResult = await pool.query<DatabaseEventCoLeaderRow>(
    `
    SELECT
      eventCoLeader."eventId",
      discordUser.id,
      discordUser.name
    FROM "EventCoLeader" eventCoLeader
    JOIN "DiscordUser" discordUser
      ON discordUser.id = eventCoLeader."discordUserId"
    WHERE eventCoLeader."eventId" = $1
    `,
    [row.id],
  );

  const coLeaders = coleaderResult.rows.map(({ id, name }) => ({ id, name }));
  return mapDatabaseEventRowToEvent(row, coLeaders);
}

export const getEventById = (id: string) => getEventBy("id", id);
export const getEventByRaidHelperId = (id: string) =>
  getEventBy("raidHelperId", id);

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

    //TODO: remove this upsert for server and channel and move this to an action for the bot to register a server to the DB
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

    await insertEvent(event, client);

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

export async function updateEvent(
  id: string,
  update: Partial<Event>,
): Promise<Event | undefined> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Fetch current pair of discord server and textchannel for the event
    const existingResult = await client.query<{
      discordServerId: string | null;
      discordTextChannelId: string;
    }>(
      `
      SELECT "discordServerId", "discordTextChannelId"
      FROM "Event"
      WHERE "id" = $1
      FOR UPDATE
      `,
      [id],
    );
    const existingEvent = existingResult.rows[0];

    // If event is not found rollback
    if (!existingEvent) {
      await client.query("ROLLBACK");
      return undefined;
    }

    const hasField = (field: keyof Event) =>
      Object.prototype.hasOwnProperty.call(update, field);

    if (update.creator) {
      await upsertDiscordUser(update.creator.id, update.creator.name, client);
    }
    if (update.leader) {
      await upsertDiscordUser(update.leader.id, update.leader.name, client);
    }
    if (hasField("coLeaders")) {
      for (const coLeader of update.coLeaders ?? []) {
        await upsertDiscordUser(coLeader.id, coLeader.name, client);
      }
    }

    const serverId = hasField("discordServerId")
      ? (update.discordServerId ?? null)
      : existingEvent.discordServerId;
    const channelId = hasField("discordTextChannelId")
      ? (update.discordTextChannelId ?? null)
      : existingEvent.discordTextChannelId;

    //TODO: remove this upsert for server and channel and move this to an action for the bot to register a server to the DB
    if (hasField("discordServerId") && serverId) {
      await upsertDiscordServer(serverId, "", client);
    }
    if (hasField("discordTextChannelId") && channelId && serverId) {
      await upsertDiscordTextChannel(channelId, "", serverId, client);
    }

    const values: (string | number | null)[] = [];
    const assignments: string[] = [];
    const assign = (column: string, value: string | number | undefined) => {
      values.push(value ?? null);
      assignments.push(`"${column}" = $${values.length}`);
    };

    assign("lastUpdated", update.lastUpdated ?? Date.now());
    if (hasField("creator")) assign("creatorId", update.creator?.id);
    if (hasField("leader")) assign("leaderId", update.leader?.id);
    if (hasField("title")) assign("title", update.title);
    if (hasField("description")) assign("description", update.description);
    if (hasField("imageUrl")) assign("imageUrl", update.imageUrl);
    if (hasField("startTime")) assign("startTime", update.startTime);
    if (hasField("endTime")) assign("endTime", update.endTime);
    if (hasField("eventType")) assign("eventType", update.eventType);
    if (hasField("discordServerId")) {
      assign("discordServerId", update.discordServerId);
    }
    if (hasField("discordTextChannelId")) {
      assign("discordTextChannelId", update.discordTextChannelId);
    }
    if (hasField("signUpCount")) assign("signUpCount", update.signUpCount);
    if (hasField("raidHelperId")) assign("raidHelperId", update.raidHelperId);

    values.push(id);
    await client.query(
      `UPDATE "Event" SET ${assignments.join(", ")} WHERE "id" = $${values.length}`,
      values,
    );

    if (hasField("coLeaders")) {
      await client.query('DELETE FROM "EventCoLeader" WHERE "eventId" = $1', [
        id,
      ]);
      for (const coLeader of update.coLeaders ?? []) {
        await insertEventCoLeader(coLeader.id, id, client);
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return getEventById(id);
}

export async function deleteEvent(id: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM "Event" WHERE "id" = $1 RETURNING "id"',
    [id],
  );

  return result.rowCount === 1;
}
