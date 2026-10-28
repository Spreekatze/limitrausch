import express from "express";
import {
  importRaidHelperEventById,
  importRaidHelperEventsFromGuild,
} from "../services/raidHelperImport.js";
import { addDiscordServer } from "../store/guildStore.js";

import requireGuildManager from "../middleware/requireGuildManager.js";
import { HttpError } from "../errors/httpError.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

// Request events from raid-helper by serverId
router.get(
  "/server/:id",
  requireGuildManager,
  async (request, response, next) => {
    const serverId = request.params.id;
    if (typeof serverId !== "string") {
      return next(new HttpError(400, "Invalid server id"));
    }

    const server = request.session.authUser?.userGuilds.find(
      (guild) => guild.id === serverId,
    );
    if (!server) {
      return next(
        new HttpError(
          404,
          "Import failed due to user not being member of requested guild",
        ),
      );
    }

    //TODO: move server adding to its own route
    await addDiscordServer(server);

    const result = await importRaidHelperEventsFromGuild(server);

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
router.get("/:id", requireAuth, async (request, response, next) => {
  const eventId = request.params.id;
  if (typeof eventId !== "string") {
    return next(new HttpError(400, "Invalid event id"));
  }
  const userGuilds = request.session.authUser?.userGuilds;
  if (!userGuilds) {
    return next(
      new HttpError(404, "Import failed due to missing guild information"),
    );
  }
  const result = await importRaidHelperEventById(userGuilds, eventId);
  if (result.failed) {
    return next(new HttpError(500, "Import failed due to server error"));
  }

  response.status(200).json(result);
});

export default router;
