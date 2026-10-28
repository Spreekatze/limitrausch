import type { RequestHandler } from "express";
import { HttpError } from "../errors/httpError.js";
import { getGuildMemberInfo } from "../discord/guildService.js";

const requireGuildManager: RequestHandler = async (req, res, next) => {
  const authUser = req.session.authUser;
  if (!authUser) {
    return next(new HttpError(401, "User is not logged in."));
  }

  const guildId = req.params.serverId;
  if (typeof guildId !== "string" || !/^\d{17,20}$/.test(guildId)) {
    return next(new HttpError(400, "Invalid or missing guildId."));
  }

  try {
    const isManager = await isGuildManager(authUser.id, guildId);

    if (!isManager) {
      return next(
        new HttpError(
          403,
          "User is not authorized to manage the settings of this server.",
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
  const member = await getGuildMemberInfo(guildId, userId);

  if (member?.isAdmin || member?.isOwner) {
    return true;
  }
  return false;
}

export default requireGuildManager;
