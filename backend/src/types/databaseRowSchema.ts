import {
  eventTypeSchema,
  eventDifficultySchema,
  statusTypeSchema,
  jobIdSchema,
} from "@limitrausch/contracts";
import { z } from "zod";

export const databaseEventRowSchema = z.object({
  id: z.number(),
  lastUpdated: z.string(),
  creatorId: z.string().nullable(),
  creatorName: z.string().nullable(),
  leaderId: z.string().nullable(),
  leaderName: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  startTime: z.string(),
  endTime: z.string(),
  eventType: eventTypeSchema,
  eventDifficulty: eventDifficultySchema.nullable(),
  eventGoal: z.string().nullable(),
  discordServerId: z.string().nullable(),
  discordServerName: z.string().nullable(),
  discordServerIcon: z.string().nullable(),
  discordTextChannelId: z.string().nullable(),
  discordTextChannelName: z.string().nullable(),
  discordMessageId: z.string().nullable(),
  raidHelperId: z.string().nullable(),
  isPublic: z.boolean(),
});
export type DatabaseEventRow = z.infer<typeof databaseEventRowSchema>;

export const databaseEventCoLeaderRowSchema = z.object({
  eventId: z.number(),
  id: z.string(),
  name: z.string(),
});
export type DatabaseEventCoLeaderRow = z.infer<
  typeof databaseEventCoLeaderRowSchema
>;

export const databaseEventSignUpRowSchema = z.object({
  id: z.number(),
  eventId: z.number(),
  discordUserId: z.string().nullable(),
  raidHelperId: z.string().nullable(),
  status: statusTypeSchema.nullable(),
  jobFirstPrio: jobIdSchema.nullable(),
  jobFlexSecondPrio: z.array(jobIdSchema).nullable(),
  usernameOnServer: z.string().nullable(),
});
export type DatabaseEventSignUpRow = z.infer<
  typeof databaseEventSignUpRowSchema
>;

export const databaseGuildRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
  rolesAllowedToManageEvents: z.array(z.string()).nullable(),
  rolesBannedFromParticipating: z.array(z.string()).nullable(),
});
export type DatabaseGuildRow = z.infer<typeof databaseGuildRowSchema>;
