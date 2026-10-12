import express from "express";
import crypto from "crypto";
import {
  authStatusResponseSchema,
  authUserSchema,
  discordOAuthUserSchema,
} from "@limitrausch/contracts";

const router = express.Router();

router.get("/discord", (request, response) => {
  // User is already logged in, redirect to home page
  if (request.session.authUser) {
    response.redirect("/");
    return;
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) {
    response.status(500).send("Discord OAuth is not configured.");
    return;
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

router.get("/discord/callback", async (request, response) => {
  // Handle the callback from Discord after user authorization
  const code = request.query.code as string;
  if (!code) {
    response.status(400).send("Missing authorization code.");
    return;
  }
  // Verify the state parameter to prevent CSRF attacks
  const state = request.query.state as string;
  if (state !== request.session.discordOAuthState) {
    response.status(400).send("Invalid OAuth state parameter.");
    return;
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
    console.error("Discord OAuth token request failed:", tokenData);
    response
      .status(tokenResponse.status)
      .send("Discord OAuth token request failed.");
    return;
  }

  // Use the access token to fetch user information
  const userResponse = await fetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });
  const discordUser = await userResponse.json();
  if (!userResponse.ok) {
    console.error("Discord OAuth user request failed:", discordUser);
    response
      .status(userResponse.status)
      .send("Discord OAuth user request failed.");
    return;
  }

  const discordOAuthUserResult = discordOAuthUserSchema.safeParse(discordUser);
  if (!discordOAuthUserResult.success) {
    response.status(502).send("Discord returned invalid user data.");
    return;
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
    console.error(
      "Discord OAuth user guild request failed:",
      discordUserGuilds,
    );
    response
      .status(userGuildsResponse.status)
      .send("Discord OAuth user guild request failed.");
    return;
  }
  // console.log("Guilds:", discordUserGuilds);
  //TODO: do something with the list of guilds

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
  });

  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) {
    response.status(500).send("Frontend URL is not configured.");
    return;
  }

  request.session.save((error) => {
    if (error) {
      console.error("Failed to save OAuth session:", error);
      response.status(500).send("Failed to create login session.");
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

router.get("/logout", (request, response) => {
  request.session.destroy((err) => {
    if (err) {
      console.error("Error occurred while destroying session:", err);
      response.status(500).json({ message: "Failed to logout." });
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
