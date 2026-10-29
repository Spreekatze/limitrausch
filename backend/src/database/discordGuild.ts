import { Pool, PoolClient } from "pg";
import { pool } from "./databaseConnection.js";
import { UserGuild } from "@limitrausch/contracts";

export async function upsertDiscordGuild(
  guild: UserGuild,
  client: Pool | PoolClient = pool,
): Promise<void> {
  await client.query(
    `INSERT INTO "DiscordGuild" ("id", "name", "icon") 
    VALUES ($1, $2, $3) 
    ON CONFLICT ("id") 
    DO UPDATE SET 
      "name" = EXCLUDED."name",
      "icon" = EXCLUDED."icon"
    `,
    [guild.id, guild.name, guild.icon],
  );
}
