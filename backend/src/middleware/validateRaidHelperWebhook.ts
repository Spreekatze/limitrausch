import type { RequestHandler } from "express";
import { HttpError } from "../errors/httpError.js";
import { raidHelperWebhookEventSchema } from "../types/raidhelperSchema.js";

const validateRaidHelperWebhook: RequestHandler = (request, response, next) => {
  const webhookKey = request.header("Authorization");
  if (webhookKey !== process.env.RAIDHELPER_WEBHOOK_KEY) {
    return next(new HttpError(401, "Unauthorized webhook request."));
  }
  console.log("Full body:", request.body);
  const result = raidHelperWebhookEventSchema.safeParse(request.body);

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
