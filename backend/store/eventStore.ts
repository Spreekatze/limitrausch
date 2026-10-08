import type { Event } from "../types/eventSchema.js";
import { mapDatabaseEventRowToEvent } from "../mapping/eventDatabaseMapping.js";
import { pool } from "../database/databaseConnection.js";
import { upsertDiscordServer } from "../database/discordServer.js";
import { upsertDiscordTextChannel } from "../database/discordTextChannel.js";
import { ensureDiscordUser } from "../database/discordUser.js";
import { insertEvent } from "../database/event.js";
import { insertEventCoLeader } from "../database/eventCoLeader.js";
import { insertEventSignUp } from "../database/eventSignUp.js";
import {
  DatabaseEventCoLeaderRow,
  DatabaseEventRow,
  DatabaseEventSignUpRow,
} from "../types/databaseRowSchema.js";
import { ensureDiscordServerUser } from "../database/discordServerUser.js";

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

  // const coleaderResult = await pool.query<DatabaseEventCoLeaderRow>(`
  //   SELECT
  //     eventCoLeader."eventId",
  //     discordUser.id,
  //     discordUser.name
  //   FROM "EventCoLeader" eventCoLeader
  //   JOIN "DiscordUser" discordUser
  //     ON discordUser.id = eventCoLeader."discordUserId"
  // `);

  // const coLeadersByEvent = new Map<string, { id: string; name: string }[]>();
  // for (const row of coleaderResult.rows) {
  //   const coLeaders = coLeadersByEvent.get(row.eventId) ?? [];
  //   coLeaders.push({ id: row.id, name: row.name });
  //   coLeadersByEvent.set(row.eventId, coLeaders);
  // }

  return result.rows.map((row) => mapDatabaseEventRowToEvent(row));
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
      creator."usernameOnServer" AS "creatorName",
      leader."usernameOnServer" AS "leaderName"
    FROM "Event" event
    JOIN "DiscordServerUser" creator
      ON creator."discordUserId" = event."creatorId"
    LEFT JOIN "DiscordServerUser" leader
      ON leader."discordUserId" = event."leaderId"
    WHERE event.${columnName} = $1
    `,
    [value],
  );
  const row = result.rows[0];
  if (!row) {
    return undefined;
  }

  const coLeadersResult = await pool.query<DatabaseEventCoLeaderRow>(
    `
    SELECT
      eventCoLeader."eventId",
      discordServerUser."discordUserId",
      discordServerUser."usernameOnServer"
    FROM "EventCoLeader" eventCoLeader
    JOIN "DiscordServerUser" discordServerUser
      ON discordServerUser."discordUserId" = eventCoLeader."discordUserId"
    WHERE eventCoLeader."eventId" = $1
    `,
    [row.id],
  );

  const signUpsResult = await pool.query<DatabaseEventSignUpRow>(
    `
    SELECT 
      eventSignUp.*,
      discordServerUser."usernameOnServer"
    FROM "EventSignUp" eventSignUp
    JOIN "DiscordServerUser" discordServerUser
      ON eventSignUp."discordUserId" = discordServerUser."discordUserId"
    WHERE eventSignUp."eventId" = $1
    `,
    [row.id],
  );

  return mapDatabaseEventRowToEvent(
    row,
    coLeadersResult.rows,
    signUpsResult.rows,
  );
}

export const getEventById = (id: string) => getEventBy("id", id);
export const getEventByRaidHelperId = (id: string) =>
  getEventBy("raidHelperId", id);

export async function addEvent(event: Event): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    //TODO: add this upsert for server and channel to an action for the bot to register a server to the DB
    // then only check if exists here
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

    await ensureDiscordServerUser(
      event.creator.id,
      event.discordServerId,
      event.creator.name,
      client,
    );

    if (event.leader) {
      await ensureDiscordUser(event.leader.id, client);
    }

    for (const coLeader of event.coLeaders ?? []) {
      await ensureDiscordServerUser(
        coLeader.id,
        event.discordServerId,
        coLeader.name,
        client,
      );
    }

    for (const signUp of event.signUps ?? []) {
      await ensureDiscordServerUser(
        signUp.userId,
        event.discordServerId,
        signUp.name,
        client,
      );
    }

    await insertEvent(event, client);

    for (const coLeader of event.coLeaders ?? []) {
      await insertEventCoLeader(coLeader.id, event.id, client);
    }

    // On creation no sign ups exists

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
      discordServerId: string | undefined;
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

    if (update.leader) {
      await ensureDiscordServerUser(
        update.leader.id,
        existingEvent.discordServerId,
        update.leader.name,
        client,
      );
    }
    if (hasField("coLeaders")) {
      for (const coLeader of update.coLeaders ?? []) {
        await ensureDiscordServerUser(
          coLeader.id,
          existingEvent.discordServerId,
          coLeader.name,
          client,
        );
      }
    }

    if (hasField("signUps")) {
      for (const signUp of update.signUps ?? []) {
        await ensureDiscordServerUser(
          signUp.userId,
          existingEvent.discordServerId,
          signUp.name,
          client,
        );
      }
    }

    const channelId = hasField("discordTextChannelId")
      ? (update.discordTextChannelId ?? null)
      : existingEvent.discordTextChannelId;

    //TODO: move this upsert for server and channel to an action for the bot to
    // register a server to the DB, then only check for it here
    if (
      hasField("discordTextChannelId") &&
      channelId &&
      existingEvent.discordServerId
    ) {
      await upsertDiscordTextChannel(
        channelId,
        "",
        existingEvent.discordServerId,
        client,
      );
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
    if (hasField("signUps")) assign("signUpCount", update.signUps?.length);
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

    if (hasField("signUps") && existingEvent.discordServerId) {
      await client.query('DELETE FROM "EventSignUp" WHERE "eventId" = $1', [
        id,
      ]);
      for (const signUp of update.signUps ?? []) {
        await insertEventSignUp(
          signUp,
          id,
          existingEvent.discordServerId,
          client,
        );
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
