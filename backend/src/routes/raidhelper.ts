import express from "express";
import {
  importRaidHelperEventById,
  importRaidHelperEventsFromGuild,
} from "../services/raidHelperImport.js";
import { addDiscordGuild } from "../store/guildStore.js";

import requireEventManager from "../middleware/requireGuildManager.js";
import { HttpError } from "../errors/httpError.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

// Request events from raid-helper by guildId
router.get(
  "/guild/:guildId",
  requireEventManager,
  async (request, response, next) => {
    const guildId = request.params.guildId;
    if (typeof guildId !== "string") {
      return next(new HttpError(400, "Import failed due to invalid guild id"));
    }

    const guild = request.session.authUser?.manageableGuilds.find(
      (guild) => guild.id === guildId,
    );
    if (!guild) {
      return next(
        new HttpError(
          404,
          "Import failed due to user not being member of requested guild",
        ),
      );
    }

    //TODO: move guild adding to its own route
    await addDiscordGuild(guild);

    const result = await importRaidHelperEventsFromGuild(guild);

    response.status(200).json(result);
  },
);

// Request events from raid-helper by user
router.get("/user", requireAuth, async (request, response, next) => {
  const user = request.session.authUser?.id;

  if (!user) {
    return next(
      new HttpError(404, "Import failed due to user not being logged in"),
    );
  }
  //TODO: add support for individual user import
  //   const result = await importRaidHelperEventsFromUser(user);

  //   response.status(200).json(result);
});

// Request event from raid-helper by eventId
router.get("/:eventId", requireAuth, async (request, response, next) => {
  const eventId = request.params.id;
  if (typeof eventId !== "string") {
    return next(new HttpError(400, "Import failed due to invalid event id"));
  }
  const userGuilds = request.session.authUser?.manageableGuilds;
  if (!userGuilds) {
    return next(
      new HttpError(404, "Import failed due to missing guild information"),
    );
  }
  const result = await importRaidHelperEventById(userGuilds, eventId);
  if (result.failed) {
    return next(new HttpError(500, "Import failed due to guild error"));
  }

  response.status(200).json(result);
});

export default router;
