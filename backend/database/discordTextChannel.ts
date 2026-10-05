import { Pool, PoolClient } from "pg";
import { pool } from "./databaseConnection.js";

export async function upsertDiscordTextChannel(
  id: string,
  name: string,
  discordServerId: string,
  client: Pool | PoolClient = pool,
): Promise<void> {
  await client.query(
    `INSERT INTO "DiscordTextChannel" ("id", "name", "discordServerId")
    VALUES ($1, $2, $3)
    ON CONFLICT ("id")
    DO UPDATE SET "name" = excluded."name"
    `,
    [id, name, discordServerId],
  );
}
