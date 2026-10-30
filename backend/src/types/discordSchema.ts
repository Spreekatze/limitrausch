import z from "zod";

export const discordTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
  token_type: z.string(),
  scope: z.string(),
});
export type DiscordTokenResponse = z.infer<typeof discordTokenResponseSchema>;
