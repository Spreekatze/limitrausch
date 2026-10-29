import type { RequestHandler } from "express";
import { HttpError } from "../errors/httpError.js";
import { authGuildSchema } from "../types/guildSchema.js";
import { getValidDiscordAccessToken } from "../services/discordService.js";

const requireGuildManager: RequestHandler = async (req, res, next) => {
  const authUser = req.session.authUser;
  if (!authUser) {
    return next(new HttpError(401, "User is not logged in."));
  }

  const accessToken = await getValidDiscordAccessToken(req);
  if (!accessToken) {
    throw new HttpError(401, "Discord authorization required.");
  }

  const guildId = req.params.guildId;
  if (typeof guildId !== "string" || !/^\d{17,20}$/.test(guildId)) {
    return next(new HttpError(400, "Invalid or missing guildId."));
  }

  try {
    const isManager = await isGuildOwnerOrAdmin(accessToken, guildId);

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

async function isGuildOwnerOrAdmin(
  accessToken: string,
  guildId: string,
): Promise<boolean> {
  const response = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new HttpError(502, "Discord OAuth user guild request failed.", {
      upstreamStatus: response.status,
    });
  }

  const userGuild = await response.json();
  const discordUserGuildsResult = authGuildSchema.array().safeParse(userGuild);
  if (!discordUserGuildsResult.success) {
    throw new HttpError(502, "Discord returned invalid guild data.");
  }

  const guild = discordUserGuildsResult.data.find(
    (entry) => entry.id === guildId,
  );

  if (!guild) {
    return false;
  }

  return guild.owner || guild.permissions.has("Administrator");
}

export default requireGuildManager;
