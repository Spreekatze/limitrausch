import { mapDatabaseEventRowToEvent } from "../mapping/eventDatabaseMapping.js";
import { pool } from "../database/databaseConnection.js";
import { upsertDiscordTextChannel } from "../database/discordTextChannel.js";
import { deleteEvent, insertEvent, updateEvent } from "../database/event.js";
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
import { ensureDiscordGuildUser } from "../database/discordGuildUser.js";
import {
  CreateEvent,
  UpdateEvent,
  Event,
  UserGuild,
} from "@limitrausch/contracts";
import { upsertDiscordGuild } from "../database/discordGuild.js";

export async function getEvents(guildId?: string): Promise<Event[]> {
  const conditions: string[] = [];
  const values: (number | string)[] = [];

  if (guildId !== undefined) {
    values.push(guildId);
    conditions.push(`event."discordGuildId" = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const result = await pool.query<DatabaseEventRow>(
    `
    SELECT
      event.*,
      creator."usernameOnGuild" AS "creatorName",
      leader."usernameOnGuild" AS "leaderName",
      guild."icon" AS "discordGuildIcon",
      guild."name" AS "discordGuildName",
      channel."name" AS "discordTextChannelName"
    FROM "Event" event
    LEFT JOIN "DiscordGuildUser" creator
      ON creator."discordUserId" = event."creatorId"
      AND creator."discordGuildId" = event."discordGuildId"
    LEFT JOIN "DiscordGuildUser" leader
      ON leader."discordUserId" = event."leaderId"
      AND leader."discordGuildId" = event."discordGuildId"
    LEFT JOIN "DiscordGuild" guild
      ON guild.id = event."discordGuildId"
    LEFT JOIN "DiscordTextChannel" channel
      ON channel.id = event."discordTextChannelId"
      AND channel."discordGuildId" = event."discordGuildId"
    ${whereClause}
    `,
    values,
  );

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
      creator."usernameOnGuild" AS "creatorName",
      leader."usernameOnGuild" AS "leaderName",
      guild."icon" AS "discordGuildIcon",
      guild."name" AS "discordGuildName",
      channel."name" AS "discordTextChannelName"
    FROM "Event" event
    LEFT JOIN "DiscordGuildUser" creator
      ON creator."discordUserId" = event."creatorId"
      AND creator."discordGuildId" = event."discordGuildId"
    LEFT JOIN "DiscordGuildUser" leader
      ON leader."discordUserId" = event."leaderId"
      AND leader."discordGuildId" = event."discordGuildId"
    LEFT JOIN "DiscordGuild" guild
      ON guild.id = event."discordGuildId"
    LEFT JOIN "DiscordTextChannel" channel
      ON channel.id = event."discordTextChannelId"
      AND channel."discordGuildId" = event."discordGuildId"
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
      discordGuildUser."usernameOnGuild" AS "name"
    FROM "EventCoLeader" eventCoLeader
    JOIN "Event" event
      ON event.id = eventCoLeader."eventId"
    JOIN "DiscordGuildUser" discordGuildUser
      ON discordGuildUser."discordUserId" = eventCoLeader."discordUserId"
      AND discordGuildUser."discordGuildId" = event."discordGuildId"
    WHERE eventCoLeader."eventId" = $1
    `,
    [row.id],
  );

  const signUpsResult = await pool.query<DatabaseEventSignUpRow>(
    `
    SELECT 
      eventSignUp.*,
      discordGuildUser."usernameOnGuild"
    FROM "EventSignUp" eventSignUp
    JOIN "Event" signupEvent
      ON signupEvent.id = eventSignUp."eventId"
    LEFT JOIN "DiscordGuildUser" discordGuildUser
      ON eventSignUp."discordUserId" = discordGuildUser."discordUserId"
      AND discordGuildUser."discordGuildId" = signupEvent."discordGuildId"
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

export async function addEvent(
  event: CreateEvent,
  guild?: UserGuild,
): Promise<Event> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (guild) {
      await upsertDiscordGuild(guild);
    }

    if (event.discordGuild?.textChannelId && event.discordGuild?.id) {
      //TODO: add fetching channel name
      await upsertDiscordTextChannel(
        event.discordGuild?.textChannelId,
        "",
        event.discordGuild?.id,
        client,
      );
    }

    if (event.creator) {
      await ensureDiscordGuildUser(
        event.creator,
        event.discordGuild?.id,
        client,
      );
    }

    if (event.leader) {
      await ensureDiscordGuildUser(
        event.leader,
        event.discordGuild?.id,
        client,
      );
    }

    for (const coLeader of event.coLeaders ?? []) {
      await ensureDiscordGuildUser(coLeader, event.discordGuild?.id, client);
    }

    for (const signUp of event.signUps ?? []) {
      if (signUp.userId && signUp.name) {
        await ensureDiscordGuildUser(
          { id: signUp.userId, name: signUp.name },
          event.discordGuild?.id,
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

    // Fetch current pair of discord guild and textchannel for the event
    const existingResult = await client.query<{
      discordGuildId: string | null;
      discordTextChannelId: string | null;
    }>(
      `
      SELECT "discordGuildId", "discordTextChannelId"
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

    if (existingEvent.discordGuildId) {
      if (update.leader) {
        await ensureDiscordGuildUser(
          update.leader,
          existingEvent.discordGuildId,
          client,
        );
      }
      if (hasField("coLeaders")) {
        for (const coLeader of update.coLeaders ?? []) {
          await ensureDiscordGuildUser(
            coLeader,
            existingEvent.discordGuildId,
            client,
          );
        }
      }

      if (hasField("signUps")) {
        for (const signUp of update.signUps ?? []) {
          if (signUp.userId && signUp.name) {
            await ensureDiscordGuildUser(
              { id: signUp.userId, name: signUp.name },
              existingEvent.discordGuildId,
              client,
            );
          }
        }
      }
    }

    // TODO: irgendwie macht das hier nicht so sinn
    const channelId = hasField("discordGuild")
      ? (update.discordGuild?.textChannelId ?? null)
      : existingEvent.discordTextChannelId;

    //TODO: move this upsert for guild and channel to an action for the bot to
    // register a guild to the DB, then only check for it here
    if (hasField("discordGuild") && channelId && existingEvent.discordGuildId) {
      await upsertDiscordTextChannel(
        channelId,
        "",
        existingEvent.discordGuildId,
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
    if (hasField("eventContent")) assign("eventContent", update.eventContent);
    if (hasField("eventDifficulty")) {
      assign("eventDifficulty", update.eventDifficulty);
    }
    if (hasField("eventGoal")) assign("eventGoal", update.eventGoal);
    if (hasField("isPublic")) assign("isPublic", update.isPublic);
    if (hasField("discordGuild")) {
      assign("discordGuildId", update.discordGuild?.id);
    }
    if (hasField("discordGuild")) {
      assign("discordTextChannelId", update.discordGuild?.textChannelId);
    }
    if (hasField("discordGuild")) {
      assign("discordMessageId", update.discordGuild?.messageId);
    }

    values.push(id);
    await updateEvent(assignments, values, client);

    if (hasField("coLeaders")) {
      await deleteAllCoLeadersFromEvent(id, client);
      for (const coLeader of update.coLeaders ?? []) {
        await insertEventCoLeader(coLeader.id, id, client);
      }
    }

    if (hasField("signUps") && existingEvent.discordGuildId) {
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

export async function deleteEventById(id: number): Promise<boolean> {
  const client = await pool.connect();
  return await deleteEvent(id, client);
}
