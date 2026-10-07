import { Pool, PoolClient } from "pg";
import { pool } from "./databaseConnection.js";
import { EventSignUpUser } from "../types/eventSchema.js";

export async function insertEventSignUp(
  signUp: EventSignUpUser,
  eventId: string,
  discordServerId: string,
  client: Pool | PoolClient = pool,
): Promise<void> {
  await client.query(
    `INSERT INTO "EventSignUp" (
      "eventId",
      "discordUserId",
      "discordServerId",
      "status",
      "entryTime",
      "position",
      "jobFirstPrio",
      "jobFlexSecondPrio"
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      eventId,
      signUp.userId,
      discordServerId,
      signUp.status,
      signUp.entryTime,
      signUp.position,
      signUp.jobFirstPrio?.id,
      signUp.jobFlexSecondPrio?.map((job) => job.id),
    ],
  );
}
