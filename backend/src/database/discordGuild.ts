import { Pool, PoolClient } from "pg";
import { pool } from "./databaseConnection.js";
import { GuildConfig, UserGuild } from "@limitrausch/contracts";
import { DatabaseGuildRow } from "../types/databaseRowSchema.js";

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

export async function getDiscordGuildById(
  guildId: string,
  client: Pool | PoolClient = pool,
): Promise<GuildConfig> {
  const guildResult = await client.query<DatabaseGuildRow>(
    `
      SELECT 
        "discordGuild".*,
      WHERE "discordGuild".id = $1
      `,
    [guildId],
  );

  return guildResult.rows[0];
}
