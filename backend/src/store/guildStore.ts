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
  const row = result.rows[0];
  if (!row) {
    return undefined;
  }
  return { id: row.id, name: row.name, icon: row.icon };
}
