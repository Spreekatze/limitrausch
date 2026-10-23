import type { RequestHandler } from "express";
import { HttpError } from "../errors/httpError.js";

const requireWebsiteAdmin: RequestHandler = (req, res, next) => {
  const authUser = req.session.authUser;
  if (!authUser) {
    return next(new HttpError(401, "User is not logged in."));
  }
  const adminWhitelist = process.env.DISCORD_USER_ID_WHITELIST?.split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (!adminWhitelist || !adminWhitelist.includes(authUser.id)) {
    return next(new HttpError(403, "User is not authorized."));
  }
  next();
};

export default requireWebsiteAdmin;
