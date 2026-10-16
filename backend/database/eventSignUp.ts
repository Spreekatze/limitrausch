import { Pool, PoolClient } from "pg";
import { pool } from "./databaseConnection.js";
import { CreateSignUp } from "@limitrausch/contracts";

export async function insertEventSignUp(
  signUp: CreateSignUp,
  eventId: number,
  client: Pool | PoolClient = pool,
): Promise<number> {
  const result = await client.query<{ id: number }>(
    `INSERT INTO "EventSignUp" (
      "eventId",
      "discordUserId",
      "raidHelperId",
      "status",
      "jobFirstPrio",
      "jobFlexSecondPrio"
    )
    VALUES (
    $1, $2, $3, $4, $5, 
    $6
    )
    RETURNING "id"
    `,
    [
      eventId,
      signUp.userId,
      signUp.raidHelperId,
      signUp.status,
      signUp.jobFirstPrio?.id,
      signUp.jobFlexSecondPrio?.map((job) => job.id),
    ],
  );
  return result.rows[0].id;
}
