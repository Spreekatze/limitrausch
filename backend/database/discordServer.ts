import { Pool, PoolClient } from "pg";
import { pool } from "./databaseConnection.js";

export async function upsertDiscordServer(
  id: string,
  name: string,
  client: Pool | PoolClient = pool,
): Promise<void> {
  await client.query(
    `INSERT INTO "DiscordServer" ("id", "name") 
    VALUES ($1, $2) 
    ON CONFLICT ("id") 
    DO UPDATE SET "name" = excluded."name"
    `,
    [id, name],
  );
}
