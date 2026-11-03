import { GuildConfig, UserGuild } from "@limitrausch/contracts";
import { pool } from "../database/databaseConnection.js";
import {
  upsertDiscordGuild,
  upsertDiscordGuildWithConfig,
} from "../database/discordGuild.js";
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
): Promise<GuildConfig | null> {
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
    return null;
  }
  return guild;
}

export async function getDiscordGuildManagerRoles(
  guildId: string,
): Promise<string[]> {
  const result = await pool.query<Partial<DatabaseGuildRow>>(
    `
    SELECT
    guild."roleIDsAllowedToManageEvents" AS "rolesAllowedToManageEvents"
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

// export async function updateDiscordGuildById(
//   guildId: string,
//   update: GuildConfig,
// ): Promise<boolean> {
//   const result = await pool.query(
//     `
//       UPDATE "DiscordGuild"
//       SET
//         "roleIDsAllowedToManageEvents" = $2,
//         "roleIDsBannedFromParticipating" = $3
//       WHERE id = $1
//     `,
//     [
//       guildId,
//       update.roleIDsAllowedToManageEvents,
//       update.roleIDsBannedFromParticipating,
//     ],
//   );

//   return (result.rowCount ?? 0) > 0;
// }

export async function upsertGuildConfig(guildId: string, update: GuildConfig) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await upsertDiscordGuildWithConfig(guildId, update, client);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
