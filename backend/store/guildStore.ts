import { DiscordGuild } from "@limitrausch/contracts";
import { pool } from "../database/databaseConnection.js";
import { upsertDiscordServer } from "../database/discordServer.js";

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
