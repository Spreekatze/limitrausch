import { GuildConfig, UserGuild } from "@limitrausch/contracts";
import { pool } from "../database/databaseConnection.js";
import { upsertDiscordGuild } from "../database/discordGuild.js";
import { DatabaseGuildRow } from "../types/databaseRowSchema.js";

export async function addDiscordGuild(guild: UserGuild) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await upsertDiscordGuild(guild, client);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getDiscordGuild(
  guildId: string,
): Promise<GuildConfig | undefined> {
  const result = await pool.query<DatabaseGuildRow>(
    `
    SELECT
      guild.*
    FROM "DiscordGuild" guild
    WHERE guild.id = $1
  `,
    [guildId],
  );
  const guild = result.rows[0];
  if (!guild) {
    return undefined;
  }
  return guild;
}

export async function getDiscordGuildManagerRoles(
  guildId: string,
): Promise<string[]> {
  const result = await pool.query<Partial<DatabaseGuildRow>>(
    `
    SELECT
    guild."rolesAllowedToManageEvents"
    FROM "DiscordGuild" guild
    WHERE guild.id = $1
  `,
    [guildId],
  );
  const roles = result.rows[0];
  if (!roles) {
    return [];
  }
  return roles.rolesAllowedToManageEvents ?? [];
}
