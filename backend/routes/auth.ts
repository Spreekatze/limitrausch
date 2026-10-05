import express from "express";
import crypto from "crypto";

const router = express.Router();

router.get("/discord", (request, response) => {
  // User is already logged in, redirect to home page
  if (request.session.discordUser) {
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
    scope: "identify email",
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

  // Check if the user is in the whitelist of admins
  const whitelist = process.env.DISCORD_USER_ID_WHITELIST?.split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const isAdmin = whitelist && whitelist.includes(discordUser.id); // Check if the user is an admin

  request.session.discordUser = { discordInfo: discordUser, isAdmin: isAdmin }; // Store the user info in the session

  // User is authorized, proceed with your application logic
  // response.json({
  //   message: "Discord OAuth successful",
  //   loggedIn: true,
  //   discordInfo: discordUser,
  //   isAdmin: isAdmin,
  // });

  response.redirect("/"); // Redirect to the home page or any other page after successful login
});

router.get("/me", (request, response) => {
  if (!request.session.discordUser) {
    response
      .status(401)
      .json({ loggedIn: false, message: "User is not logged in." });
    return;
  }
  response.json({ loggedIn: true, user: request.session.discordUser });
});

router.get("/logout", (request, response) => {
  request.session.destroy((err) => {
    if (err) {
      console.error("Error occurred while destroying session:", err);
      response.status(500).json({ message: "Failed to logout." });
      return;
    }
    response.clearCookie("connect.sid"); // Clear the session cookie
    response.json({ loggedOut: true, message: "Successfully logged out." });
  });
});

//TODO: think about expiration of access token, refresh and revoke token

export default router;
