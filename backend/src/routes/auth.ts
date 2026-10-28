import express from "express";
import crypto from "crypto";
import {
  authStatusResponseSchema,
  authUserSchema,
  discordGuildSchema,
  discordOAuthUserSchema,
} from "@limitrausch/contracts";
import { getGuilds } from "../discord/guildService.js";
import { HttpError } from "../errors/httpError.js";

const router = express.Router();

router.get("/discord", (request, response) => {
  // User is already logged in, redirect to home page
  if (request.session.authUser) {
    response.redirect("/");
    return;
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) {
    throw new HttpError(500, "Discord OAuth is not configured.");
  }

  const state = crypto.randomBytes(32).toString("hex"); // Generate a random state parameter for CSRF protection
  request.session.discordOAuthState = state; // Store the state in the session for later verification

  // Redirect the user to Discord's OAuth2 authorization page
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: process.env.DISCORD_REDIRECT_URI!,
    response_type: "code",
    scope: "identify guilds",
    state: state,
  });
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  response.redirect(discordAuthUrl);
});

router.get("/discord/callback", async (request, response, next) => {
  // Handle the callback from Discord after user authorization
  const code = request.query.code as string;
  if (!code) {
    throw new HttpError(400, "Missing authorization code.");
  }
  // Verify the state parameter to prevent CSRF attacks
  const state = request.query.state as string;
  if (state !== request.session.discordOAuthState) {
    throw new HttpError(400, "Invalid OAuth state parameter.");
  }
  delete request.session.discordOAuthState; // Clear the state from the session after verification

  // Exchange the authorization code for an access token
  const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: process.env.DISCORD_REDIRECT_URI!,
    }),
  });
  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok) {
    throw new HttpError(502, "Discord OAuth token request failed.", {
      upstreamStatus: tokenResponse.status,
    });
  }

  // Use the access token to fetch user information
  const userResponse = await fetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });
  const discordUser = await userResponse.json();
  if (!userResponse.ok) {
    throw new HttpError(502, "Discord OAuth user request failed.", {
      upstreamStatus: userResponse.status,
    });
  }

  const discordOAuthUserResult = discordOAuthUserSchema.safeParse(discordUser);
  if (!discordOAuthUserResult.success) {
    throw new HttpError(502, "Discord returned invalid user data.");
  }
  const discordOAuthUser = discordOAuthUserResult.data;

  // Look at guilds
  const userGuildsResponse = await fetch(
    "https://discord.com/api/users/@me/guilds",
    {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    },
  );
  const discordUserGuilds = await userGuildsResponse.json();
  if (!userGuildsResponse.ok) {
    throw new HttpError(502, "Discord OAuth user guild request failed.", {
      upstreamStatus: userGuildsResponse.status,
    });
  }
  const discordUserGuildsResult = discordGuildSchema
    .array()
    .safeParse(discordUserGuilds);
  if (!discordUserGuildsResult.success) {
    throw new HttpError(502, "Discord returned invalid guild data.");
  }
  const botGuilds = await getGuilds();
  const botGuildIds = new Set(botGuilds.map((guild) => guild.id));
  const sharedGuilds = discordUserGuildsResult.data.filter((guild) =>
    botGuildIds.has(guild.id),
  );

  // Check if the user is in the whitelist of admins
  const whitelist = process.env.DISCORD_USER_ID_WHITELIST?.split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const isAdmin = Boolean(whitelist?.includes(discordOAuthUser.id));

  //TODO: fetch preferences and get them in the session.authuser

  request.session.authUser = authUserSchema.parse({
    id: discordOAuthUser.id,
    username: discordOAuthUser.global_name,
    avatar: discordOAuthUser.avatar,
    isAdmin,
    userGuilds: sharedGuilds,
  });

  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) {
    throw new HttpError(500, "Frontend URL is not configured.");
  }

  request.session.save((error) => {
    if (error) {
      next(error);
      return;
    }
    response.redirect(`${frontendUrl}/#/dashboard`);
  });
});

router.get("/me", (request, response) => {
  if (!request.session.authUser) {
    response.json(
      authStatusResponseSchema.parse({ loggedIn: false, user: null }),
    );
    return;
  }
  response.json(
    authStatusResponseSchema.parse({
      loggedIn: true,
      user: request.session.authUser,
    }),
  );
});

router.get("/logout", (request, response, next) => {
  request.session.destroy((error) => {
    if (error) {
      next(error);
      return;
    }
    response.clearCookie("connect.sid"); // Clear the session cookie
    response.json(
      authStatusResponseSchema.parse({
        loggedIn: false,
        user: null,
      }),
    );
  });
});

//TODO: think about expiration of access token, refresh and revoke token

export default router;
