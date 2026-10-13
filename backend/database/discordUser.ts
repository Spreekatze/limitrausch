import { Pool, PoolClient } from "pg";
import { pool } from "./databaseConnection.js";
import { AuthUser, EventDiscordUser } from "@limitrausch/contracts";

export async function ensureDiscordUser(
  user: AuthUser | EventDiscordUser,
  client: Pool | PoolClient = pool,
): Promise<void> {
  await client.query(
    `INSERT INTO "DiscordUser" ("id")
    VALUES ($1)
    ON CONFLICT ("id")
    DO NOTHING`,
    [user.id],
  );
}
