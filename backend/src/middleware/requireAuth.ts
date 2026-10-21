import type { RequestHandler } from "express";

const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.session.authUser) {
    return res.status(401).json({
      message: "User is not logged in.",
    });
  }

  next();
};

export default requireAuth;
