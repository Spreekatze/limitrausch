import { Pool, PoolClient } from "pg";
import { pool } from "./databaseConnection.js";

export async function ensureDiscordUser(
  id: string,
  client: Pool | PoolClient = pool,
): Promise<void> {
  await client.query(
    `INSERT INTO "DiscordUser" ("id")
    VALUES ($1)
    ON CONFLICT ("id")
    DO NOTHING
    `,
    [id],
  );
}
