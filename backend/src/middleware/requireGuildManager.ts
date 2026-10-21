import type { RequestHandler } from "express";
import { client } from "../discord/client.js";
import { HttpError } from "../errors/httpError.js";
import { getDiscordServerManagerRoles } from "../store/guildStore.js";

const requireGuildManager: RequestHandler = async (req, res, next) => {
  const authUser = req.session.authUser;
  if (!authUser) {
    return next(new HttpError(401, "User is not logged in."));
  }

  const guildId: unknown = req.body?.guildId;
  if (typeof guildId !== "string" || !/^\d{17,20}$/.test(guildId)) {
    return next(new HttpError(400, "Invalid or missing guildId."));
  }

  try {
    const isManager = await isGuildManager(authUser.id, guildId);

    if (!isManager) {
      return next(
        new HttpError(
          403,
          "User is not authorized to manage events on this server.",
        ),
      );
    }

    next();
  } catch (error: unknown) {
    next(error);
  }
};

async function isGuildManager(
  userId: string,
  guildId: string,
): Promise<boolean> {
  const allowedRoleIds = await getDiscordServerManagerRoles(guildId);

  if (allowedRoleIds.length === 0) {
    return false;
  }

  const guild = await client.guilds.fetch(guildId);

  let member;
  try {
    member = await guild.members.fetch(userId);
  } catch (error: unknown) {
    // Discord-Error 10007: Unknown Member
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 10007
    ) {
      return false;
    }

    throw error;
  }

  return allowedRoleIds.some((roleId) => member.roles.cache.has(roleId));
}

export default requireGuildManager;
