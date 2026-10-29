import express from "express";
import requireGuildManager from "../middleware/requireGuildManager.js";
import { guildIdSchema } from "../types/guildSchema.js";
import { HttpError } from "../errors/httpError.js";
import { getGuildRoles } from "../discordBot/guildService.js";
import { getDiscordGuild, upsertGuildConfig } from "../store/guildStore.js";
import { guildConfigSchema } from "@limitrausch/contracts";

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
      const [guildConfig, guildRoles] = await Promise.all([
        getDiscordGuild(guildId),
        await getGuildRoles(guildId),
      ]);

      response.json({ guildConfig, guildRoles });
    } catch (error) {
      next(error);
    }
  },
);

// Update config for guild by Id
router.patch(
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
      const parsedUpdate = guildConfigSchema.safeParse(request.body);

      if (!parsedUpdate.success) {
        return next(
          new HttpError(
            400,
            "Invalid update data",
            {},
            parsedUpdate.error.issues,
          ),
        );
      }

      await upsertGuildConfig(guildId, parsedUpdate.data);

      response.status(204).send();
    } catch (error: unknown) {
      next(error);
    }
  },
);

export default router;
