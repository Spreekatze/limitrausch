import { Pool, PoolClient } from "pg";
import { pool } from "./databaseConnection.js";

export async function upsertDiscordServer(
  id: string,
  name: string,
  client: Pool | PoolClient = pool,
): Promise<void> {
  await client.query(
    `insert into "DiscordServer" ("id", "name") 
    values ($1, $2) 
    on conflict ("id") 
    do update set "name" = excluded."name"
    `,
    [id, name],
  );
}
