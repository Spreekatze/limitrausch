import { Pool, PoolClient } from "pg";
import { pool } from "./databaseConnection.js";
import { Event } from "../types/eventSchema.js";

export async function insertEvent(
  event: Event,
  client: Pool | PoolClient = pool,
): Promise<void> {
  await client.query(
    `
      INSERT INTO "Event" (
        "id",
        "lastUpdated",
        "creatorId",
        "leaderId",
        "title",
        "description",
        "imageUrl",
        "startTime",
        "endTime",
        "eventType",
        "eventDifficulty",
        "eventGoal",
        "discordServerId",
        "discordTextChannelId",
        "discordMessageId",
        "signUpCount",
        "raidHelperId",
        "isPublic"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16, $17, $18
      )
    `,
    [
      event.id,
      event.lastUpdated,
      event.creator?.id,
      event.leader?.id,
      event.title,
      event.description,
      event.imageUrl,
      event.startTime,
      event.endTime,
      event.eventType,
      event.eventDifficulty,
      event.eventGoal,
      event.discordServer?.id,
      event.discordServer?.textChannelId,
      event.discordServer?.messageId,
      event.signUpCount,
      event.raidHelperId,
      event.isPublic,
    ],
  );
}
