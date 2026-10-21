import type { RequestHandler } from "express";

const requireWebsiteAdmin: RequestHandler = (req, res, next) => {
  // Double check login status for safety
  const authUser = req.session.authUser;
  if (!authUser) {
    return res.status(401).json({ message: "User is not logged in." });
  }
  const adminWhitelist = process.env.DISCORD_USER_ID_WHITELIST?.split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (!adminWhitelist || !adminWhitelist.includes(authUser.id)) {
    return res.status(403).json({ message: "User is not authorized." });
  }
  next();
};

export default requireWebsiteAdmin;
