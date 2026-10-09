import { z } from "zod";
import { jobSchema } from "./jobSchema.js";

export const EVENT_TYPE = {
  TEST: 999,
  UNDEFINED: 9998,
  TRIAL: 1,
  RAID: 2,
  ULTIMATE: 3,
  SQENIX_EVENT: 4,
  FIELD_OPERATION: 5,
  DEEP_DUNGEON: 6,
  TREASUE_HUNT: 7,
  V_C_Dungeon: 8,
  LIMITED_JOB: 9,
  UNSYNC: 10,
  FATE: 11,
  MINE: 12,
  PVP: 13,
  SERVER: 14,
} as const;

export const eventTypeSchema = z.enum(EVENT_TYPE);
export type EventType = z.infer<typeof eventTypeSchema>;

export const EVENT_DIFFICULTY = {
  EASY: 1,
  NORMAL: 2,
  HARD: 3,
  ULTIMATIV: 4,
};

export const eventDifficultySchema = z.enum(EVENT_DIFFICULTY);
export type EventDifficulty = z.infer<typeof eventDifficultySchema>;

export const STATUS_TYPE = {
  BENCH: "Bench",
  LATE: "Late",
  TENTATIVE: "Tentative",
  ABSENCE: "Absence",
} as const;

export const statusTypeSchema = z.enum(STATUS_TYPE);
export type StatusType = z.infer<typeof statusTypeSchema>;

export const eventDataDiscordUserSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type EventDiscordUser = z.infer<typeof eventDataDiscordUserSchema>;

export const eventSignUpUserSchema = z.object({
  name: z.string(),
  userId: z.string(),
  status: statusTypeSchema.optional(),
  entryTime: z.number(),
  position: z.number(),
  jobFirstPrio: jobSchema.optional(),
  jobFlexSecondPrio: z.array(jobSchema).optional(),
});
export type EventSignUpUser = z.infer<typeof eventSignUpUserSchema>;

export const eventDiscordSchema = z.object({
  discordServerId: z.string(),
  discordServerName: z.string().optional(),
  discordTextChannelId: z.string().optional(),
  discordTextChannelName: z.string().optional(),
  discordMessageId: z.string().optional(),
});
export type EventDiscord = z.infer<typeof eventDiscordSchema>;

export const eventSchema = z.object({
  id: z.string(),
  lastUpdated: z.number(),
  creator: eventDataDiscordUserSchema,
  leader: eventDataDiscordUserSchema.optional(),
  coLeaders: z.array(eventDataDiscordUserSchema).optional(),
  title: z.string(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  startTime: z.number(),
  endTime: z.number(),
  eventType: eventTypeSchema,
  eventDifficulty: eventDifficultySchema.optional(),
  eventGoal: z.string().optional(),
  signUpCount: z.number().optional(),
  raidHelperId: z.string().optional(),
  signUps: z.array(eventSignUpUserSchema).optional(),
  isPublic: z.boolean(),
  discordServer: eventDiscordSchema.optional(),
});
export type Event = z.infer<typeof eventSchema>;

export const eventsResponseSchema = z.object({
  postedEvents: z.array(eventSchema),
});
export type EventsResponse = z.infer<typeof eventsResponseSchema>;
