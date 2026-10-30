import { getGuildMemberInfo } from "../discordBot/guildService.js";
import { getDiscordGuildManagerRoles } from "../store/guildStore.js";

export async function isEventManager(
  userId: string,
  guildId: string,
): Promise<boolean> {
  const member = await getGuildMemberInfo(guildId, userId);

  if (!member) {
    return false;
  }

  if (member.isAdmin || member.isOwner) {
    return true;
  }

  const allowedRoleIds = await getDiscordGuildManagerRoles(guildId);
  const hasAllowedRole = allowedRoleIds.some((roleId) =>
    member.roleIds.includes(roleId),
  );

  return hasAllowedRole;
}
