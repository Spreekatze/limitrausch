import { Pool, PoolClient } from "pg";
import { pool } from "./databaseConnection.js";
import { ensureDiscordUser } from "./discordUser.js";
import { EventDiscordUser } from "@limitrausch/contracts";

export async function ensureDiscordServerUser(
  user: EventDiscordUser,
  discordServerId: string | undefined,
  client: Pool | PoolClient = pool,
): Promise<void> {
  await ensureDiscordUser(user, client);

  if (discordServerId) {
    await upsertDiscordServerUser(user.id, discordServerId, user.name, client);
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
    DO UPDATE SET 
      "usernameOnServer" = EXCLUDED."usernameOnServer"
    `,
    [discordUserId, discordServerId, usernameOnServer],
  );
}

// async function updateDiscordServerUser(
//   discordUserId: string,
//   username: string,
//   eventsAttended: number,
//   client: Pool | PoolClient = pool,
// ): Promise<void> {
//   await client.query(
//     `UPDATE "DiscordServerUser"
//     SET VALUES ($1, $2)
//    WHERE "id" = ${discordUserId}`,
//     [username, eventsAttended],
//   );
// }
