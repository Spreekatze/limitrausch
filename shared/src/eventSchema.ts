import { z } from "zod";
import { jobSchema } from "./jobSchema.js";

export const EVENT_TYPE = {
  TEST: 999,
  CASUAL: 0,
  RAID: 1,
  ULTIMATE: 2,
  ARCHIV: 3,
  SQENIX_EVENT: 4,
  FIELD: 5,
} as const;

export const eventTypeSchema = z.enum(EVENT_TYPE);
export type EventType = z.infer<typeof eventTypeSchema>;

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
  discordServerId: z.string().optional(),
  discordTextChannelId: z.string().optional(),
  signUpCount: z.number().optional(),
  raidHelperId: z.string().optional(),
  signUps: z.array(eventSignUpUserSchema).optional(),
  messageId: z.string().optional(),
});
export type Event = z.infer<typeof eventSchema>;

export const eventsResponseSchema = z.object({
  postedEvents: z.array(eventSchema),
});
export type EventsResponse = z.infer<typeof eventsResponseSchema>;
