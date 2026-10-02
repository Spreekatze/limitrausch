import { z } from "zod";
import { eventDataDiscordUserSchema } from "./eventSchema.js";

// This interface represents an event in the form of the answer from Raidhelper-API.
export const raidHelperEventSchema = z.object({
  channelId: z.string(),
  closeTime: z.number(),
  coLeaders: z.array(eventDataDiscordUserSchema),
  color: z.string(),
  creator: eventDataDiscordUserSchema,
  description: z.string(),
  endTime: z.number(),
  id: z.string(),
  imageUrl: z.string().optional(),
  lastUpdated: z.number(),
  leaderId: z.string(),
  leaderName: z.string(),
  signUpCount: z.string(),
  startTime: z.number(),
  templateId: z.string(),
  title: z.string(),
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
