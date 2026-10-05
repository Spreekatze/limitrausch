import type { RequestHandler } from "express";

const requireAdmin: RequestHandler = (req, res, next) => {
  const discordUser = req.session.discordUser;
  if (!discordUser) {
    return res.status(401).json({ message: "User is not logged in." });
  }
  const adminWhitelist = process.env.DISCORD_USER_ID_WHITELIST?.split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (!adminWhitelist || !adminWhitelist.includes(discordUser.discordInfo.id)) {
    return res.status(403).json({ message: "User is not authorized." });
  }
  next();
};

export default requireAdmin;
