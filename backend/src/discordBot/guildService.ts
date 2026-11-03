import {
  DiscordRoleOption,
  EventDiscordUser,
  Guild,
} from "@limitrausch/contracts";
import { client } from "./client.js";
import { DiscordAPIError } from "discord.js";

export interface GuildMemberInfo {
  userId: string;
  guildId: string;
  roleIds: string[];
  isOwner: boolean;
  isAdmin: boolean;
}

const memberSearchCache = new Map<
  string,
  { expiresAt: number; result: Promise<EventDiscordUser[]> }
>();

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

// Searches for guild members based on a query and filters them by allowed role IDs. Caches results for 30 seconds to reduce API calls.
export async function searchGuildMembers(
  guildId: string,
  query: string,
  allowedRoleIds: string[],
): Promise<EventDiscordUser[]> {
  if (allowedRoleIds.length === 0) {
    return [];
  }

  const cacheKey = `${guildId}:${[...allowedRoleIds].sort().join(",")}:${query.toLocaleLowerCase()}`;
  const cached = memberSearchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }
  if (cached) {
    memberSearchCache.delete(cacheKey);
  }

  const result = (async () => {
    const guild = await client.guilds.fetch(guildId);
    const members = await guild.members.search({
      query,
      limit: 1000,
    });

    return Array.from(members.values())
      .filter((member) =>
        member.roles.cache.some((role) => allowedRoleIds.includes(role.id)),
      )
      .slice(0, 5)
      .map((member) => ({
        id: member.id,
        name: member.displayName,
      }));
  })();

  memberSearchCache.set(cacheKey, {
    expiresAt: Number.POSITIVE_INFINITY,
    result,
  });

  try {
    const members = await result;

    const entry = memberSearchCache.get(cacheKey);
    if (entry?.result === result) {
      entry.expiresAt = Date.now() + 30_000;
    }

    for (const [key, entry] of memberSearchCache) {
      if (entry.expiresAt <= Date.now()) {
        memberSearchCache.delete(key);
      }
    }
    if (memberSearchCache.size > 500) {
      const oldestKey = memberSearchCache.keys().next().value;
      if (oldestKey !== undefined) {
        memberSearchCache.delete(oldestKey);
      }
    }
    return members;
  } catch (error) {
    if (memberSearchCache.get(cacheKey)?.result === result) {
      memberSearchCache.delete(cacheKey);
    }
    throw error;
  }
}

export async function getGuildRoles(
  guildId: string,
): Promise<DiscordRoleOption[]> {
  //TODO: add feedback if bot is not on guild and add at frontend options for adding roles via ids
  try {
    const guild = await client.guilds.fetch(guildId);
    const roles = await guild.roles.fetch();

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
    }));
  } catch (error: unknown) {
    // Discord-API-Error 10004: Unknown Guild
    if (error instanceof DiscordAPIError && error.code === 10004) {
      return [];
    }

    throw error;
  }
}
