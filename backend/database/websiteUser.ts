import { Pool, PoolClient } from "pg";
import { pool } from "./databaseConnection.js";
import { AuthUser } from "@limitrausch/contracts";

export async function upsertWebsiteUser(
  user: AuthUser,
  client: Pool | PoolClient = pool,
): Promise<void> {
  await client.query(
    `INSERT INTO "WebsiteUser" ("id", "userPreferences")
    VALUES ($1, $2)
    ON CONFLICT ("id")
    DO UPDATE SET
      "userPreferences" = COALESCE(
        EXCLUDED."userPreferences", 
        "WebsiteUser"."userPreferences")
    `,
    [user.id, user.preferences],
  );
}
