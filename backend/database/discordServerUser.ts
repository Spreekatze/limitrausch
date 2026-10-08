import { Pool, PoolClient } from "pg";
import { pool } from "./databaseConnection.js";
import { ensureDiscordUser } from "./discordUser.js";

export async function ensureDiscordServerUser(
  userId: string,
  discordServerId: string | undefined,
  usernameOnServer: string,
  client: Pool | PoolClient = pool,
): Promise<void> {
  await ensureDiscordUser(userId, client);

  if (discordServerId) {
    await upsertDiscordServerUser(
      userId,
      discordServerId,
      usernameOnServer,
      client,
    );
  }
}

async function upsertDiscordServerUser(
  discordUserId: string,
  discordServerId: string,
  usernameOnServer: string,
  client: Pool | PoolClient = pool,
): Promise<void> {
  await client.query(
    `INSERT INTO "DiscordServerUser" (
        "discordUserId",
        "discordServerId",
        "usernameOnServer"
    )
    VALUES ($1, $2, $3)
    ON CONFLICT ("discordUserId", "discordServerId")
    DO UPDATE SET "usernameOnServer" = excluded."usernameOnServer"
    `,
    [discordUserId, discordServerId, usernameOnServer],
  );
}
