import { z } from "zod";

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

export const eventDataDiscordUserSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type EventDataDiscordUser = z.infer<typeof eventDataDiscordUserSchema>;

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
});
export type Event = z.infer<typeof eventSchema>;

export const createEventSchema = eventSchema
  .omit({
    id: true,
    lastUpdated: true,
    signUpCount: true,
    raidHelperId: true,
  })
  .refine((event) => !event.discordTextChannelId || !!event.discordServerId);

export const updateEventSchema = eventSchema
  .omit({
    id: true,
    lastUpdated: true,
    raidHelperId: true,
  })
  .partial();
