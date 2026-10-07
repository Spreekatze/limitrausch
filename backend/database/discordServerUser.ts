import { Pool, PoolClient } from "pg";
import { pool } from "./databaseConnection.js";
import { ensureDiscordUser } from "./discordUser.js";

export async function ensureDiscordServerUser(
  userId: string,
  discordServerId: string | undefined,
  userNameOnServer: string,
  client: Pool | PoolClient = pool,
): Promise<void> {
  await ensureDiscordUser(userId, client);

  if (discordServerId) {
    await upsertDiscordServerUser(
      userId,
      discordServerId,
      userNameOnServer,
      client,
    );
  }
}

async function upsertDiscordServerUser(
  discordUserId: string,
  discordServerId: string,
  userNameOnServer: string,
  client: Pool | PoolClient = pool,
): Promise<void> {
  await client.query(
    `INSERT INTO "DiscordServerUser" (
        "discordUserId",
        "discordServerId",
        "userNameOnServer"
    )
    VALUES ($1, $2, $3)
    ON CONFLICT ("discordUserId", "discordServerId")
    DO UPDATE SET "userNameOnServer" = excluded."userNameOnServer"
    `,
    [discordUserId, discordServerId, userNameOnServer],
  );
}
