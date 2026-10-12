import { z } from "zod";
import {
  eventTypeSchema,
  statusTypeSchema,
  eventDifficultySchema,
} from "./eventSchema.js";

export const databaseEventRowSchema = z.object({
  id: z.string(),
  lastUpdated: z.string(),
  creatorId: z.string(),
  creatorName: z.string(),
  leaderId: z.string().optional(),
  leaderName: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  eventType: eventTypeSchema,
  eventDifficulty: eventDifficultySchema,
  eventGoal: z.string().optional(),
  discordServerId: z.string().optional(),
  discordServerName: z.string().optional(),
  discordServerIcon: z.string().optional(),
  discordTextChannelId: z.string().optional(),
  discordTextChannelName: z.string().optional(),
  discordMessageId: z.string().optional(),
  signUpCount: z.number().optional(),
  raidHelperId: z.string().optional(),
  isPublic: z.boolean(),
});
export type DatabaseEventRow = z.infer<typeof databaseEventRowSchema>;

export const databaseEventCoLeaderRowSchema = z.object({
  eventId: z.string(),
  id: z.string(),
  name: z.string(),
});
export type DatabaseEventCoLeaderRow = z.infer<
  typeof databaseEventCoLeaderRowSchema
>;

export const databaseEventSignUpRowSchema = z.object({
  id: z.string(),
  usernameOnServer: z.string(),
  eventId: z.string(),
  discordUserId: z.string(),
  discordServerId: z.string(),
  status: statusTypeSchema,
  entryTime: z.number(),
  position: z.number(),
  jobFirstPrio: z.number(),
  jobFlexSecondPrio: z.array(z.number()).optional(),
});
export type DatabaseEventSignUpRow = z.infer<
  typeof databaseEventSignUpRowSchema
>;
