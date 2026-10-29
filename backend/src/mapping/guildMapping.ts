import { UserGuild } from "@limitrausch/contracts";
import { isEventManager } from "../services/managerService.js";
import { getGuilds } from "../discord/guildService.js";
import { AuthGuild } from "../types/guildSchema.js";

export async function mapGuildDataToUserGuild(
  userId: string,
  guild: AuthGuild,
): Promise<UserGuild> {
  const botGuilds = await getGuilds();
  const botGuildIds = new Set(botGuilds.map((guild) => guild.id));
  const botIsPresent = botGuildIds.has(guild.id);
  const hasEventManagingRights = botIsPresent
    ? await isEventManager(userId, guild.id)
    : false;

  return {
    id: guild.id,
    name: guild.name,
    icon: guild.icon ?? undefined,

    hasEventManagingRights,
    isAdminOrOwner: guild.permissions.has("Administrator") || guild.owner,

    botIsPresent,
  };
}
