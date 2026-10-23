import { DiscordGuild } from "@limitrausch/contracts";
import { pool } from "../database/databaseConnection.js";
import { upsertDiscordServer } from "../database/discordServer.js";
import { DatabaseGuildRow } from "../types/databaseRowSchema.js";

export async function addDiscordServer(server: DiscordGuild) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await upsertDiscordServer(server, client);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getDiscordServer(
  serverId: string,
): Promise<DiscordGuild | undefined> {
  const result = await pool.query<DatabaseGuildRow>(
    `
    SELECT
      guild.*
    FROM "DiscordServer" guild
    WHERE guild.id = $1
  `,
    [serverId],
  );
  const guild = result.rows[0];
  if (!guild) {
    return undefined;
  }
  return guild;
}

export async function getDiscordServerManagerRoles(
  serverId: string,
): Promise<string[]> {
  const result = await pool.query<Partial<DatabaseGuildRow>>(
    `
    SELECT
    guild."rolesAllowedToManageEvents"
    FROM "DiscordServer" guild
    WHERE guild.id = $1
  `,
    [serverId],
  );
  const roles = result.rows[0];
  if (!roles) {
    return [];
  }
  return roles.rolesAllowedToManageEvents ?? [];
}
