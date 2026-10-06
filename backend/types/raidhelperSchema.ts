import { z } from "zod";
import { eventDataDiscordUserSchema } from "./eventSchema.js";

// This interface represents an event in the form of the answer from Raidhelper-API.
export const raidHelperEventSchema = z.object({
  id: z.string(),
  channelId: z.string(),
  leaderId: z.string(),
  leaderName: z.string(),
  coLeaders: z.array(eventDataDiscordUserSchema),
  title: z.string(),
  description: z.string(),
  startTime: z.number(),
  endTime: z.number(),
  closeTime: z.number(),
  templateId: z.string(),
  color: z.string(),
  imageUrl: z.string().optional(),
  lastUpdated: z.number(),
  creator: eventDataDiscordUserSchema,
  signUpCount: z.string(),
});
export type RaidHelperEvent = z.infer<typeof raidHelperEventSchema>;

// This interface represents the answer from Raidhelper API.
export const raidHelperEventsResponseSchema = z.object({
  pages: z.number(),
  eventsOverall: z.number(),
  eventsTransmitted: z.number(),
  currentPage: z.number(),
  postedEvents: z.array(raidHelperEventSchema),
});
export type RaidHelperEventsResponse = z.infer<
  typeof raidHelperEventsResponseSchema
>;

export const raidHelperImportResultSchema = z.object({
  imported: z.number(),
  skipped: z.number(),
  failed: z.number(),
});
export type RaidHelperImportResult = z.infer<
  typeof raidHelperImportResultSchema
>;

const raidHelperAdvancedSettingsSchema = z.object({
  image: z.string(),
  limit: z.number(),
  // mentions: z.string(),
  // duration: z.number(),
  // reminder: z.string(),
  // forum_tags: z.string,
});

export const raidHelperWebhookEventSchema = z.object({
  id: z.string(),
  date: z.string(),
  time: z.string(),
  color: z.string(),
  // roles:  [ {name: string, cName: string, limit: number, emoteId: string}]
  title: z.string(),
  // classes: [ {name: string, type: string, cName: string, limit: number, specs: Array, emoteId: string}]
  creator: eventDataDiscordUserSchema,
  endTime: z.number(),
  // signups: [],
  leaderId: z.string(),
  serverId: z.string(),
  channelId: z.string(),
  coLeaders: z.array(eventDataDiscordUserSchema),
  startTime: z.number(),
  leaderName: z.string(),
  templateId: z.string(),
  channelName: z.string(),
  channelType: z.string(),
  closingTime: z.number(),
  description: z.string(),
  lastUpdated: z.number(),
  displayTitle: z.string(),
  // announcements: Array
  advancedSettings: raidHelperAdvancedSettingsSchema,
});
export type RaidHelperWebHookEvent = z.infer<
  typeof raidHelperWebhookEventSchema
>;
