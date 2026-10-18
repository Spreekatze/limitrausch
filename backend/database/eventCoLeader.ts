import { Pool, PoolClient } from "pg";
import { pool } from "./databaseConnection.js";

export async function insertEventCoLeader(
  discordUserId: string,
  eventId: number,
  client: Pool | PoolClient = pool,
): Promise<void> {
  await client.query(
    `INSERT INTO "EventCoLeader" (
        "discordUserId",
        "eventId"
    )
    VALUES ($1, $2)
    `,
    [discordUserId, eventId],
  );
}

export async function deleteAllCoLeadersFromEvent(
  eventId: number,
  client: Pool | PoolClient = pool,
): Promise<void> {
  await client.query('DELETE FROM "EventCoLeader" WHERE "eventId" = $1', [
    eventId,
  ]);
}
