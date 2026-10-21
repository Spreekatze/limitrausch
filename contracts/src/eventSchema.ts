import { z } from "zod";
import { jobSchema } from "./jobSchema.js";

export const EVENT_TYPE = {
  TEST: 999,
  UNDEFINED: 998,
  SQENIX_EVENT: 997,
  TRIAL: 1,
  RAID: 2,
  ULTIMATE: 3,
  FIELD_OPERATION: 4,
  DEEP_DUNGEON: 5,
  TREASUE_HUNT: 6,
  V_C_Dungeon: 7,
  LIMITED_JOB: 8,
  UNSYNC: 9,
  FATE: 10,
  MINE: 11,
  PVP: 12,
  SERVER: 13,
  CHAOS: 14,
  UNREAL: 15,
} as const;

export const eventTypeSchema = z.enum(EVENT_TYPE);
export type EventType = z.infer<typeof eventTypeSchema>;

export const EVENT_DIFFICULTY = {
  EASY: 1,
  NORMAL: 2,
  HARD: 3,
  ULTIMATIV: 4,
} as const;

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

export const eventSignUpSchema = z.object({
  id: z.number(),
  raidHelperId: z.string().optional(),
  name: z.string().optional(),
  userId: z.string().optional(),
  status: statusTypeSchema.optional(),
  jobFirstPrio: jobSchema.optional(),
  jobFlexSecondPrio: z.array(jobSchema).optional(),
});
export type EventSignUp = z.infer<typeof eventSignUpSchema>;

export const createEventSignUpSchema = eventSignUpSchema.omit({
  id: true,
});
export type CreateSignUp = z.infer<typeof createEventSignUpSchema>;

export const discordChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type DiscordChannel = z.infer<typeof discordChannelSchema>;

export const eventDiscordDataSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  icon: z.string().optional(),
  textChannelId: z.string().optional(),
  textChannelName: z.string().optional(),
  messageId: z.string().optional(),
});
export type EventDiscordData = z.infer<typeof eventDiscordDataSchema>;

export const eventSchema = z.object({
  id: z.number(),
  lastUpdated: z.number(),
  creator: eventDataDiscordUserSchema.optional(),
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
  signUps: z.array(eventSignUpSchema).optional(),
  isPublic: z.boolean(),
  discordServer: eventDiscordDataSchema.optional(),
});
export type Event = z.infer<typeof eventSchema>;

export const createEventSchema = eventSchema
  .omit({
    id: true,
    lastUpdated: true,
    signUpCount: true,
  })
  .extend({
    signUps: z.array(createEventSignUpSchema).optional(),
  });
export type CreateEvent = z.infer<typeof createEventSchema>;

export const updateEventSchema = eventSchema
  .omit({
    id: true,
    lastUpdated: true,
    signUpCount: true,
    raidHelperId: true,
  })
  .extend({
    signUps: z
      .union([z.array(eventSignUpSchema), z.array(createEventSignUpSchema)])
      .optional(),
  })
  .partial();

export type UpdateEvent = z.infer<typeof updateEventSchema>;

export const eventsResponseSchema = z.object({
  postedEvents: z.array(eventSchema),
});
export type EventsResponse = z.infer<typeof eventsResponseSchema>;

export const raidHelperImportResponseSchema = z.object({
  success: z.boolean(),
  imported: z.number(),
  skipped: z.number(),
  failed: z.number(),
});
export type RaidHelperImportResponse = z.infer<
  typeof raidHelperImportResponseSchema
>;
