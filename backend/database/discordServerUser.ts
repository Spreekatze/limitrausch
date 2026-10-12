import { Pool, PoolClient } from "pg";
import { pool } from "./databaseConnection.js";
import { ensureDiscordUser } from "./discordUser.js";
import { EventDiscordUser } from "@limitrausch/contracts";

export async function ensureDiscordServerUser(
  user: EventDiscordUser,
  discordServerId: string | undefined,
  usernameOnServer: string,
  client: Pool | PoolClient = pool,
): Promise<void> {
  await ensureDiscordUser(user, client);

  if (discordServerId) {
    await upsertDiscordServerUser(
      user.id,
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
