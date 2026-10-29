import { DiscordRoleOption, Guild } from "@limitrausch/contracts";
import { client } from "./client.js";
import { DiscordAPIError } from "discord.js";

export interface GuildMemberInfo {
  userId: string;
  guildId: string;
  roleIds: string[];
  isOwner: boolean;
  isAdmin: boolean;
}

export async function getGuilds(): Promise<Guild[]> {
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
  let guild;

  try {
    guild = await client.guilds.fetch(guildId);
  } catch (error: unknown) {
    // Discord-API-Error 10004: Unknown Guild
    if (error instanceof DiscordAPIError && error.code === 10004) {
      return null;
    }

    throw error;
  }

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
    if (error instanceof DiscordAPIError && error.code === 10007) {
      return null;
    }

    throw error;
  }
}

export async function getGuildRoles(
  guildId: string,
): Promise<DiscordRoleOption[]> {
  const guild = await client.guilds.fetch(guildId);
  const roles = await guild.roles.fetch();

  return roles.map((role) => ({
    id: role.id,
    name: role.name,
  }));
}
