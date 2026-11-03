import { z } from "zod";
import { jobSchema } from "./jobSchema.js";
import { EVENT_TYPE } from "../data/eventType.js";
import { EVENT_DIFFICULTY } from "../data/eventDifficulty.js";
import { STATUS_TYPE } from "../data/signUpStatus.js";

export const eventTypeSchema = z.enum(EVENT_TYPE);
export type EventType = z.infer<typeof eventTypeSchema>;

export const eventDifficultySchema = z.enum(EVENT_DIFFICULTY);
export type EventDifficulty = z.infer<typeof eventDifficultySchema>;

export const statusTypeSchema = z.enum(STATUS_TYPE);
export type StatusType = z.infer<typeof statusTypeSchema>;

export const eventDataDiscordUserSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type EventDiscordUser = z.infer<typeof eventDataDiscordUserSchema>;

export const eventDiscordUserListSchema = z.array(eventDataDiscordUserSchema);
export const eventDiscordUserSuggestionsSchema =
  eventDiscordUserListSchema.max(5);

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
  eventType: eventTypeSchema,
  eventContent: z.string().optional(),
  eventGoal: z.string().optional(),
  eventDifficulty: eventDifficultySchema.optional(),
  startTime: z.number(),
  endTime: z.number(),
  leader: eventDataDiscordUserSchema.optional(),
  coLeaders: eventDiscordUserListSchema.optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  raidHelperId: z.string().optional(),
  isPublic: z.boolean(),
  signUpCount: z.number().optional(),
  signUps: z.array(eventSignUpSchema).optional(),
  discordGuild: eventDiscordDataSchema.optional(),
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
  imported: z.number(),
  updated: z.number(),
  skipped: z.number(),
  failed: z.number(),
});
export type RaidHelperImportResponse = z.infer<
  typeof raidHelperImportResponseSchema
>;
