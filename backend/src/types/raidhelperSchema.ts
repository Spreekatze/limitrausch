import { eventDataDiscordUserSchema } from "@limitrausch/contracts";
import { z } from "zod";

const raidHelperAdvancedSettingsSchema = z.object({
  image: z.string(),
  limit: z.number(),
  duration: z.number(),
  // mentions: z.string(),
  // reminder: z.string(),
  // forum_tags: z.string(),
  // allowed_roles: z.string(),
});

export const raidHelperSignUpSchema = z.object({
  id: z.number(),
  name: z.string(),
  userId: z.string(),
  position: z.number().optional(),
  className: z.string(),
  entryTime: z.number(),
  specName: z.string().optional(),
  spec2Name: z.string().optional(),
  spec3Name: z.string().optional(),
});
export type RaidHelperSignUp = z.infer<typeof raidHelperSignUpSchema>;

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
  signUps: z.array(raidHelperSignUpSchema),
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
  signUps: z.array(raidHelperSignUpSchema),
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
