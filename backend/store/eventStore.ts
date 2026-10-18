import { mapDatabaseEventRowToEvent } from "../mapping/eventDatabaseMapping.js";
import { pool } from "../database/databaseConnection.js";
import { upsertDiscordTextChannel } from "../database/discordTextChannel.js";
import {
  deleteEventById,
  insertEvent,
  updateEvent,
} from "../database/event.js";
import {
  deleteAllCoLeadersFromEvent,
  insertEventCoLeader,
} from "../database/eventCoLeader.js";
import {
  deleteAllSignUpsFromEvent,
  insertEventSignUp,
} from "../database/eventSignUp.js";
import {
  DatabaseEventCoLeaderRow,
  DatabaseEventRow,
  DatabaseEventSignUpRow,
} from "../types/databaseRowSchema.js";
import { ensureDiscordServerUser } from "../database/discordServerUser.js";
import { CreateEvent, UpdateEvent, Event } from "@limitrausch/contracts";

export async function getEvents(): Promise<Event[]> {
  const result = await pool.query<DatabaseEventRow>(`
    SELECT
      event.*,
      creator."usernameOnServer" AS "creatorName",
      leader."usernameOnServer" AS "leaderName",
      server."icon" AS "discordServerIcon",
      server."name" AS "discordServerName",
      channel."name" AS "discordTextChannelName"
    FROM "Event" event
    LEFT JOIN "DiscordServerUser" creator
      ON creator."discordUserId" = event."creatorId"
      AND creator."discordServerId" = event."discordServerId"
    LEFT JOIN "DiscordServerUser" leader
      ON leader."discordUserId" = event."leaderId"
      AND leader."discordServerId" = event."discordServerId"
    LEFT JOIN "DiscordServer" server
      ON server.id = event."discordServerId"
    LEFT JOIN "DiscordTextChannel" channel
      ON channel.id = event."discordTextChannelId"
      AND channel."discordServerId" = event."discordServerId"
  `);

  return result.rows.map((row) => mapDatabaseEventRowToEvent(row));
}

type EventLookupColumn = "id" | "raidHelperId";

async function getEventBy(
  column: EventLookupColumn,
  value: string | number,
): Promise<Event | undefined> {
  const columnName = column === "id" ? '"id"' : '"raidHelperId"';
  const result = await pool.query<DatabaseEventRow>(
    `
    SELECT
      event.*,
      creator."usernameOnServer" AS "creatorName",
      leader."usernameOnServer" AS "leaderName",
      server."icon" AS "discordServerIcon",
      server."name" AS "discordServerName",
      channel."name" AS "discordTextChannelName"
    FROM "Event" event
    LEFT JOIN "DiscordServerUser" creator
      ON creator."discordUserId" = event."creatorId"
      AND creator."discordServerId" = event."discordServerId"
    LEFT JOIN "DiscordServerUser" leader
      ON leader."discordUserId" = event."leaderId"
      AND leader."discordServerId" = event."discordServerId"
    LEFT JOIN "DiscordServer" server
      ON server.id = event."discordServerId"
    LEFT JOIN "DiscordTextChannel" channel
      ON channel.id = event."discordTextChannelId"
      AND channel."discordServerId" = event."discordServerId"
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
      eventCoLeader."discordUserId" AS "id",
      discordServerUser."usernameOnServer" AS "name"
    FROM "EventCoLeader" eventCoLeader
    JOIN "Event" event
      ON event.id = eventCoLeader."eventId"
    JOIN "DiscordServerUser" discordServerUser
      ON discordServerUser."discordUserId" = eventCoLeader."discordUserId"
      AND discordServerUser."discordServerId" = event."discordServerId"
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
    JOIN "Event" signupEvent
      ON signupEvent.id = eventSignUp."eventId"
    LEFT JOIN "DiscordServerUser" discordServerUser
      ON eventSignUp."discordUserId" = discordServerUser."discordUserId"
      AND discordServerUser."discordServerId" = signupEvent."discordServerId"
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

export const getEventById = (id: number) => getEventBy("id", id);
export const getEventByRaidHelperId = (id: string) =>
  getEventBy("raidHelperId", id);

export async function addEvent(event: CreateEvent): Promise<Event> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (event.discordServer?.textChannelId && event.discordServer?.id) {
      //TODO: add fetching channel name
      await upsertDiscordTextChannel(
        event.discordServer?.textChannelId,
        "",
        event.discordServer?.id,
        client,
      );
    }

    if (event.creator) {
      await ensureDiscordServerUser(
        event.creator,
        event.discordServer?.id,
        client,
      );
    }

    if (event.leader) {
      await ensureDiscordServerUser(
        event.leader,
        event.discordServer?.id,
        client,
      );
    }

    for (const coLeader of event.coLeaders ?? []) {
      await ensureDiscordServerUser(coLeader, event.discordServer?.id, client);
    }

    for (const signUp of event.signUps ?? []) {
      if (signUp.userId && signUp.name) {
        await ensureDiscordServerUser(
          { id: signUp.userId, name: signUp.name },
          event.discordServer?.id,
          client,
        );
      }
    }

    const insertedEvent = await insertEvent(event, client);

    for (const coLeader of event.coLeaders ?? []) {
      await insertEventCoLeader(coLeader.id, insertedEvent.id, client);
    }

    const signUps: NonNullable<Event["signUps"]> = [];
    for (const signUp of event.signUps ?? []) {
      const signUpId = await insertEventSignUp(
        signUp,
        insertedEvent.id,
        client,
      );
      signUps.push({ ...signUp, id: signUpId });
    }

    await client.query("COMMIT");
    return {
      ...event,
      id: insertedEvent.id,
      lastUpdated: insertedEvent.lastUpdated,
      signUpCount: signUps.length,
      signUps,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateEventById(
  id: number,
  update: Partial<UpdateEvent>,
): Promise<Event | undefined> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Fetch current pair of discord server and textchannel for the event
    const existingResult = await client.query<{
      discordServerId: string | null;
      discordTextChannelId: string | null;
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

    if (existingEvent.discordServerId) {
      if (update.leader) {
        await ensureDiscordServerUser(
          update.leader,
          existingEvent.discordServerId,
          client,
        );
      }
      if (hasField("coLeaders")) {
        for (const coLeader of update.coLeaders ?? []) {
          await ensureDiscordServerUser(
            coLeader,
            existingEvent.discordServerId,
            client,
          );
        }
      }

      if (hasField("signUps")) {
        for (const signUp of update.signUps ?? []) {
          if (signUp.userId && signUp.name) {
            await ensureDiscordServerUser(
              { id: signUp.userId, name: signUp.name },
              existingEvent.discordServerId,
              client,
            );
          }
        }
      }
    }

    // TODO: irgendwie macht das hier nicht so sinn
    const channelId = hasField("discordServer")
      ? (update.discordServer?.textChannelId ?? null)
      : existingEvent.discordTextChannelId;

    //TODO: move this upsert for server and channel to an action for the bot to
    // register a server to the DB, then only check for it here
    if (
      hasField("discordServer") &&
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

    const values: (string | number | boolean | null)[] = [];
    const assignments: string[] = [];
    const assign = (
      column: string,
      value: string | number | boolean | undefined,
    ) => {
      values.push(value ?? null);
      assignments.push(`"${column}" = $${values.length}`);
    };

    assign("lastUpdated", Date.now());
    if (hasField("creator")) assign("creatorId", update.creator?.id);
    if (hasField("leader")) assign("leaderId", update.leader?.id);
    if (hasField("title")) assign("title", update.title);
    if (hasField("description")) assign("description", update.description);
    if (hasField("imageUrl")) assign("imageUrl", update.imageUrl);
    if (hasField("startTime")) assign("startTime", update.startTime);
    if (hasField("endTime")) assign("endTime", update.endTime);
    if (hasField("eventType")) assign("eventType", update.eventType);
    if (hasField("eventDifficulty")) {
      assign("eventDifficulty", update.eventDifficulty);
    }
    if (hasField("eventGoal")) assign("eventGoal", update.eventGoal);
    if (hasField("isPublic")) assign("isPublic", update.isPublic);
    if (hasField("discordServer")) {
      assign("discordServerId", update.discordServer?.id);
    }
    if (hasField("discordServer")) {
      assign("discordTextChannelId", update.discordServer?.textChannelId);
    }
    if (hasField("discordServer")) {
      assign("discordMessageId", update.discordServer?.messageId);
    }

    values.push(id);
    await updateEvent(assignments, values, client);

    if (hasField("coLeaders")) {
      await deleteAllCoLeadersFromEvent(id, client);
      for (const coLeader of update.coLeaders ?? []) {
        await insertEventCoLeader(coLeader.id, id, client);
      }
    }

    if (hasField("signUps") && existingEvent.discordServerId) {
      await deleteAllSignUpsFromEvent(id, client);
      for (const signUp of update.signUps ?? []) {
        await insertEventSignUp(signUp, id, client);
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

export async function deleteEvent(id: number): Promise<boolean> {
  const client = await pool.connect();
  return await deleteEventById(id, client);
}
