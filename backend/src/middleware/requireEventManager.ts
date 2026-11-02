import type { RequestHandler } from "express";
import { HttpError } from "../errors/httpError.js";
import { isEventManager } from "../services/managerService.js";
import { getEventById } from "../store/eventStore.js";

const requireEventManager: RequestHandler = async (req, res, next) => {
  const authUser = req.session.authUser;
  if (!authUser) {
    return next(new HttpError(401, "User is not logged in."));
  }

  try {
    const guildIdParam = req.params.guildId;
    let guildId: string | undefined =
      typeof guildIdParam === "string" ? guildIdParam : undefined;

    // Wenn keine guildId angegeben wurde, über die eventId ermitteln
    if (guildId === undefined) {
      const eventId = Number(req.params.eventId);

      if (!Number.isSafeInteger(eventId) || eventId <= 0) {
        return next(
          new HttpError(400, "Invalid or missing eventId  at authorization."),
        );
      }

      const result = await getEventById(eventId);

      if (!result) {
        return next(new HttpError(404, "Event not found."));
      }

      guildId = result.discordGuild?.id;

      if (guildId === undefined) {
        return next(
          new HttpError(403, "Event is not associated with a Discord guild."),
        );
      }
    }

    if (!/^\d{17,20}$/.test(guildId)) {
      return next(
        new HttpError(400, "Invalid guildId of event on authorization."),
      );
    }

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
