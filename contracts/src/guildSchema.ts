import { z } from "zod";

export const discordGuildSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullish(),
  roleIDsAllowedToManageEvents: z.array(z.string()).nullish(),
  roleIDsBannedFromParticipating: z.array(z.string()).nullish(),
});
export type DiscordGuild = z.infer<typeof discordGuildSchema>;
