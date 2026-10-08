import { z } from "zod";
import { eventSchema } from "@limitrausch/contracts";

export * from "@limitrausch/contracts";

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
