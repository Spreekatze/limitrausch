import type { RequestHandler } from "express";
import { HttpError } from "../errors/httpError.js";
import { isEventManager } from "../services/managerService.js";

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

export default requireEventManager;
