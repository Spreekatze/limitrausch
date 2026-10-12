import { z } from "zod";

export const discordGuildSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
});
export type DiscordGuild = z.infer<typeof discordGuildSchema>;
