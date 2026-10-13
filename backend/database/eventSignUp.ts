import { Pool, PoolClient } from "pg";
import { pool } from "./databaseConnection.js";
import { EventSignUpUser } from "../types/eventSchema.js";

export async function insertEventSignUp(
  signUp: EventSignUpUser,
  eventId: string,
  client: Pool | PoolClient = pool,
): Promise<void> {
  await client.query(
    `INSERT INTO "EventSignUp" (
      "id",
      "eventId",
      "discordUserId",
      "raidHelperId",
      "status",
      "entryTime",
      "position",
      "jobFirstPrio",
      "jobFlexSecondPrio"
    )
    VALUES (
    $1, $2, $3, $4, $5, 
    $6, $7, $8, $9
    )`,
    [
      signUp.id,
      eventId,
      signUp.userId,
      signUp.raidHelperId,
      signUp.status,
      signUp.entryTime,
      signUp.position,
      signUp.jobFirstPrio?.id,
      signUp.jobFlexSecondPrio?.map((job) => job.id),
    ],
  );
}
