import type { RequestHandler } from "express";
import { HttpError } from "../errors/httpError.js";
import { getDiscordServerManagerRoles } from "../store/guildStore.js";
import { getGuildMemberInfo } from "../discord/guildService.js";

const requireEventManager: RequestHandler = async (req, res, next) => {
  const authUser = req.session.authUser;
  if (!authUser) {
    return next(new HttpError(401, "User is not logged in."));
  }

  const guildId = req.params.guildId;
  if (typeof guildId !== "string" || !/^\d{17,20}$/.test(guildId)) {
    return next(new HttpError(400, "Invalid or missing guildId."));
  }

  try {
    const isManager = await isEventManager(authUser.id, guildId);

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

async function isEventManager(
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

  const allowedRoleIds = await getDiscordServerManagerRoles(guildId);
  const hasAllowedRole = allowedRoleIds.some((roleId) =>
    member.roleIds.includes(roleId),
  );

  return hasAllowedRole;
}

export default requireEventManager;
