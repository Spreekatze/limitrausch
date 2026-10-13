import { Pool, PoolClient } from "pg";
import { pool } from "./databaseConnection.js";
import { CreateEvent } from "@limitrausch/contracts";

export async function insertEvent(
  event: CreateEvent,
  client: Pool | PoolClient = pool,
): Promise<{ id: number; lastUpdated: number }> {
  const lastUpdated = Date.now();
  const signUpCount = event.signUps?.length;

  const result = await client.query<{ id: number; lastUpdated: string }>(
    `
      INSERT INTO "Event" (
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
        $10, $11, $12, $13, $14, $15, $16, $17
      )
      RETURNING "id", "lastUpdated"
    `,
    [
      lastUpdated,
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
      signUpCount,
      event.raidHelperId,
      event.isPublic,
    ],
  );

  return {
    id: result.rows[0].id,
    lastUpdated: Number(result.rows[0].lastUpdated),
  };
}
