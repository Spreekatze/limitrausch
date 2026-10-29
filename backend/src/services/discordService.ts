import type { Request } from "express";
import { HttpError } from "../errors/httpError.js";
import { discordTokenResponseSchema } from "../types/discordSchema.js";

const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";
const TOKEN_REFRESH_BUFFER_MS = 60_000; // in milliseconds

export async function getValidDiscordAccessToken(
  request: Request,
): Promise<string> {
  const session = request.session;

  if (!session.discordAccessToken || !session.discordTokenExpiresAt) {
    throw new HttpError(401, "Discord authorization required.");
  }

  if (Date.now() < session.discordTokenExpiresAt - TOKEN_REFRESH_BUFFER_MS) {
    return session.discordAccessToken;
  }

  if (!session.discordRefreshToken) {
    throw new HttpError(401, "Discord reauthorization required.");
  }

  const response = await fetch(DISCORD_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: session.discordRefreshToken,
    }),
  });

  if (!response.ok) {
    throw new HttpError(502, "Discord token refresh failed.", {
      upstreamStatus: response.status,
    });
  }

  const data = await response.json();
  const parsed = discordTokenResponseSchema.safeParse(data);

  if (!parsed.success) {
    throw new HttpError(502, "Discord returned an invalid token.");
  }

  const tokenData = parsed.data;

  session.discordAccessToken = tokenData.access_token;
  session.discordRefreshToken = tokenData.refresh_token;
  session.discordTokenExpiresAt = Date.now() + tokenData.expires_in * 1000;

  await new Promise<void>((resolve, reject) => {
    session.save((error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  return tokenData.access_token;
}
