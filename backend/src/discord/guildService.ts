import { DiscordGuild } from "@limitrausch/contracts";
import { client } from "./client.js";

export interface GuildMemberInfo {
  userId: string;
  guildId: string;
  roleIds: string[];
  isOwner: boolean;
  isAdmin: boolean;
}

export async function getGuilds(): Promise<DiscordGuild[]> {
  const guilds = await client.guilds.fetch();
  return guilds.map((guild) => ({
    id: guild.id,
    name: guild.name,
    icon: guild.icon,
  }));
}

export async function getGuildMemberInfo(
  guildId: string,
  userId: string,
): Promise<GuildMemberInfo | null> {
  const guild = await client.guilds.fetch(guildId);

  try {
    const member = await guild.members.fetch(userId);

    return {
      userId: member.id,
      guildId: guild.id,
      roleIds: member.roles.cache.map((role) => role.id),
      isOwner: guild.ownerId === member.id,
      isAdmin: member.permissions.has("Administrator"),
    };
  } catch (error: unknown) {
    // Discord-API-Error 10007: Unknown Member
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 10007
    ) {
      return null;
    }

    throw error;
  }
}
