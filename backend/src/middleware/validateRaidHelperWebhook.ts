import type { RequestHandler } from "express";
import { HttpError } from "../errors/httpError.js";
import { raidHelperDetailledEventSchema } from "../types/raidhelperSchema.js";

const validateRaidHelperWebhook: RequestHandler = (request, response, next) => {
  const webhookKey = request.header("Authorization");
  if (webhookKey !== process.env.RAIDHELPER_WEBHOOK_KEY) {
    return next(new HttpError(401, "Unauthorized webhook request."));
  }

  const result = raidHelperDetailledEventSchema.safeParse(request.body);

  if (!result.success) {
    return next(
      new HttpError(
        400,
        "Invalid Raid-Helper webhook data",
        {},
        result.error.issues,
      ),
    );
  }
  request.body = result.data;
  next();
};

export default validateRaidHelperWebhook;
