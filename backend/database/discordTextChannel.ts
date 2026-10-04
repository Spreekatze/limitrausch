import { Pool, PoolClient } from "pg";
import { pool } from "./databaseConnection.js";

export async function upsertDiscordTextChannel(
  id: string,
  name: string,
  discordServerId: string,
  client: Pool | PoolClient = pool,
): Promise<void> {
  await client.query(
    `insert into "DiscordTextChannel" ("id", "name", "discordServerId")
    values ($1, $2, $3)
    on conflict ("id")
    do update set "name" = excluded."name"
    `,
    [id, name, discordServerId],
  );
}
