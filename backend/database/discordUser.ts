import { Pool, PoolClient } from "pg";
import { pool } from "./databaseConnection.js";
import { AuthUser, EventDiscordUser } from "@limitrausch/contracts";

export async function ensureDiscordUser(
  user: AuthUser | EventDiscordUser,
  client: Pool | PoolClient = pool,
): Promise<void> {
  const tempUser =
    "isAdmin" in user
      ? {
          id: user.id,
          name: user.username,
          preferences:
            user.preferences == null ? null : JSON.stringify(user.preferences),
        }
      : {
          id: user.id,
          name: user.name,
          preferences: null,
        };
  await client.query(
    `INSERT INTO "DiscordUser" ("id", "name", "userPreferences")
    VALUES ($1, $2, $3)
    ON CONFLICT ("id")
    DO UPDATE SET
      "name" = EXCLUDED."name",
      "userPreferences" = COALESCE(
        EXCLUDED."userPreferences", 
        "DiscordUser"."userPreferences")
    `,
    [tempUser.id, tempUser.name, tempUser.preferences],
  );
}
