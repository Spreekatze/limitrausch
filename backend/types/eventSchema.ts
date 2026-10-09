import { eventSchema } from "@limitrausch/contracts";

export * from "@limitrausch/contracts";

export const createEventSchema = eventSchema
  .omit({
    id: true,
    lastUpdated: true,
    signUpCount: true,
    raidHelperId: true,
  });

export const updateEventSchema = eventSchema
  .omit({
    id: true,
    lastUpdated: true,
    raidHelperId: true,
  })
  .partial();
