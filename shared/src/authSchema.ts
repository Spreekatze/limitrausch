import { z } from "zod";
import { discordGuildSchema } from "./guildSchema.js";

export const discordOAuthUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  global_name: z.string(),
  avatar: z.string(),
  bot: z.boolean().optional(),
  verified: z.boolean(),
});
export type DiscordOAuthUser = z.infer<typeof discordOAuthUserSchema>;

export const userPreferenceSchema = z.object({
  theme: z.enum(["light", "dark"]).optional(),
  dashboard: z
    .object({
      showUpcomingEvents: z.boolean().optional(),
    })
    .optional(),
  calendar: z
    .object({
      filterEventTypes: z.array(z.number()).optional(),
    })
    .optional(),
});

export const authUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatar: z.string(),
  preferences: userPreferenceSchema.optional(),
  isAdmin: z.boolean(),
  userGuilds: z.array(discordGuildSchema),
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
