import { Pool, PoolClient } from "pg";
import { pool } from "./databaseConnection.js";
import { ensureDiscordUser } from "./discordUser.js";
import { EventDiscordUser } from "@limitrausch/contracts";

export async function ensureDiscordGuildUser(
  user: EventDiscordUser,
  discordGuildId: string | undefined,
  client: Pool | PoolClient = pool,
): Promise<void> {
  await ensureDiscordUser(user, client);

  if (discordGuildId) {
    await upsertDiscordGuildUser(user.id, discordGuildId, user.name, client);
  }
}

async function upsertDiscordGuildUser(
  discordUserId: string,
  discordGuildId: string,
  usernameOnGuild: string,
  client: Pool | PoolClient = pool,
): Promise<void> {
  await client.query(
    `INSERT INTO "DiscordGuildUser" (
        "discordUserId",
        "discordGuildId",
        "usernameOnGuild"
    )
    VALUES ($1, $2, $3)
    ON CONFLICT ("discordUserId", "discordGuildId")
    DO UPDATE SET 
      "usernameOnGuild" = EXCLUDED."usernameOnGuild"
    `,
    [discordUserId, discordGuildId, usernameOnGuild],
  );
}

// async function updateDiscordGuildUser(
//   discordUserId: string,
//   username: string,
//   eventsAttended: number,
//   client: Pool | PoolClient = pool,
// ): Promise<void> {
//   await client.query(
//     `UPDATE "DiscordGuildUser"
//     SET VALUES ($1, $2)
//    WHERE "id" = ${discordUserId}`,
//     [username, eventsAttended],
//   );
// }
