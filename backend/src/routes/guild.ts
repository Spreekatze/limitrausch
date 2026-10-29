import express from "express";
import requireGuildManager from "../middleware/requireGuildManager.js";
import { guildIdSchema } from "../types/guildSchema.js";
import { HttpError } from "../errors/httpError.js";
import { getDiscordGuildById } from "../database/discordGuild.js";
import { getGuildRoles } from "../discord/guildService.js";

const router = express.Router();

// Get current config and data for guild by Id
router.get(
  "/:guildId",
  requireGuildManager,
  async (request, response, next) => {
    try {
      const parsedGuildId = guildIdSchema.safeParse(request.params.guildId);
      if (!parsedGuildId.success) {
        return next(
          new HttpError(
            400,
            "Invalid guild id",
            {},
            parsedGuildId.error.issues,
          ),
        );
      }
      const guildId = parsedGuildId.data;
      const guildConfig = getDiscordGuildById(guildId);
      const guildRoles = getGuildRoles(guildId);

      response.json({ guildConfig, guildRoles });
    } catch (error) {
      next(error);
    }
  },
);

// Update config for guild by Id
router.patch("/:id", requireGuildManager, (_request, _response) => {});

export default router;
