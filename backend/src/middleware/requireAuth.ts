import type { RequestHandler } from "express";
import { HttpError } from "../errors/httpError.js";

const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.session.authUser) {
    return next(new HttpError(401, "User is not logged in."));
  }

  next();
};

export default requireAuth;
