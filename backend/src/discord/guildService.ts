import { client } from "./client";

export interface GuildMemberInfo {
  userId: string;
  guildId: string;
  roleIds: string[];
}

/**
 * Ruft die Mitgliedschaft und Rollen eines Nutzers
 * auf einem Discord-Server ab.
 *
 * Gibt null zurück, wenn der Nutzer kein Mitglied ist.
 */
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
