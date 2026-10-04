import { Pool, PoolClient } from "pg";
import { pool } from "./databaseConnection.js";

export async function insertEventCoLeader(
  discordUserId: string,
  eventId: string,
  client: Pool | PoolClient = pool,
): Promise<void> {
  await client.query(
    `
      INSERT INTO "EventCoLeader" (
        "discordUserId",
        "eventId"
      )
      VALUES ($1, $2)
    `,
    [discordUserId, eventId],
  );
}
