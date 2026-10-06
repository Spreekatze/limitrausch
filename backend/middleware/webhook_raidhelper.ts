import type { RequestHandler } from "express";
import { raidHelperWebhookEventSchema } from "../types/raidhelperSchema.js";

const validateRaidHelperWebhook: RequestHandler = (request, response, next) => {
  const webhookKey = request.header("Authorization");
  if (webhookKey !== process.env.RAIDHELPER_WEBHOOK_KEY) {
    response.sendStatus(401);
    return;
  }
  console.log(request.body);

  const result = raidHelperWebhookEventSchema.safeParse(request.body);
  if (!result.success) {
    response.status(400).json({
      error: "Invalid Raid-Helper webhook data",
      details: result.error.issues,
    });
    return;
  }
  request.body = result.data;
  next();
};

export default validateRaidHelperWebhook;
