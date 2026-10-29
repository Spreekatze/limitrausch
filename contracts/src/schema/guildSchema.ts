import { z } from "zod";

export const guildSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullish(),
});
export type Guild = z.infer<typeof guildSchema>;

export const userGuildSchema = guildSchema.extend({
  hasEventManagingRights: z.boolean(),
  isAdminOrOwner: z.boolean(),
  botIsPresent: z.boolean(),
});
export type UserGuild = z.infer<typeof userGuildSchema>;

export const guildConfigSchema = guildSchema.extend({
  roleIDsAllowedToManageEvents: z.array(z.string()).nullish(),
  roleIDsBannedFromParticipating: z.array(z.string()).nullish(),
});
export type GuildConfig = z.infer<typeof guildConfigSchema>;

const discordRoleOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type DiscordRoleOption = z.infer<typeof discordRoleOptionSchema>;

export const guildConfigResponseSchema = z.object({
  guildConfig: guildConfigSchema,
  roles: z.array(discordRoleOptionSchema),
});
export type GuildConfigResponse = z.infer<typeof guildConfigResponseSchema>;
