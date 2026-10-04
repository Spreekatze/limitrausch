import { Pool, PoolClient } from "pg";
import { pool } from "./databaseConnection.js";

export async function insertEvent(
  event: {
    id: string;
    lastUpdated: number;
    creatorId: string;
    leaderId: string;
    title: string;
    description?: string;
    imageUrl?: string;
    startTime: number;
    endTime: number;
    eventType: number;
    discordServerId?: string;
    discordTextChannelId?: string;
    signUpCount: number;
    raidHelperId?: string;
  },
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
        "discordServerId",
        "discordTextChannelId",
        "signUpCount",
        "raidHelperId"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13, $14
      )
    `,
    [
      event.id,
      event.lastUpdated,
      event.creatorId,
      event.leaderId,
      event.title,
      event.description,
      event.imageUrl,
      event.startTime,
      event.endTime,
      event.eventType,
      event.discordServerId,
      event.discordTextChannelId,
      event.signUpCount,
      event.raidHelperId,
    ],
  );
}
