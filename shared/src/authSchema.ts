import { z } from "zod";

export const discordOAuthUserSchema = z.object({
  id: z.string(),
  username: z.string(),
});
export type DiscordOAuthUser = z.infer<typeof discordOAuthUserSchema>;

export const authUserSchema = z.object({
  discordInfo: discordOAuthUserSchema,
  isAdmin: z.boolean(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const authStatusResponseSchema = z.discriminatedUnion("loggedIn", [
  z.object({
    loggedIn: z.literal(false),
    user: z.null(),
  }),
  z.object({
    loggedIn: z.literal(true),
    user: authUserSchema,
  }),
]);
export type AuthStatusResponse = z.infer<typeof authStatusResponseSchema>;