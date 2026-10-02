import { z } from "zod";

export const EVENT_TYPE = {
  CASUAL: 0,
  RAID: 1,
  ULTIMATE: 2,
  ARCHIV: 3,
  SQENIX_EVENT: 4,
  FIELD: 5,
} as const;

export const eventTypeSchema = z.enum(EVENT_TYPE);
export type EventType = z.infer<typeof eventTypeSchema>;

export const eventDataDiscordUserSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type EventDataDiscordUser = z.infer<typeof eventDataDiscordUserSchema>;

export const eventSchema = z.object({
  id: z.string(),
  lastUpdated: z.number(),
  creator: eventDataDiscordUserSchema,
  leader: eventDataDiscordUserSchema,
  coLeaders: z.array(eventDataDiscordUserSchema),
  title: z.string(),
  description: z.string(),
  imageUrl: z.string().optional(),
  startTime: z.number(),
  endTime: z.number(),
  eventType: eventTypeSchema,
  eventServerId: z.string(), //TODO: check what type it actually is you get from discord
  channelId: z.string(),
  signUpCount: z.string(),
});
export type Event = z.infer<typeof eventSchema>;

export const createEventSchema = eventSchema.omit({
  id: true,
  lastUpdated: true,
  signUpCount: true,
});

export const updateEventSchema = eventSchema
  .omit({
    id: true,
    lastUpdated: true,
  })
  .partial();
