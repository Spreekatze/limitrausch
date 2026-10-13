import express from "express";
import validateRaidHelperWebhook from "../middleware/webhook_raidhelper.js";
import {
  addEvent,
  deleteEvent,
  getEventByRaidHelperId,
  updateEvent,
} from "../store/eventStore.js";
import { mapRaidHelperWebhookEventToEvent } from "../mapping/eventRaidhelperMapping.js";

const router = express.Router();

router.post(
  "/raid-helper/event-create",
  validateRaidHelperWebhook,
  async (request, response) => {
    const existingEvent = await getEventByRaidHelperId(request.body.id);
    if (existingEvent) {
      response.sendStatus(200);
      return;
    }

    const event = mapRaidHelperWebhookEventToEvent(
      request.body,
      request.body.serverId,
    );
    await addEvent(event);

    response.sendStatus(200);
  },
);

router.post(
  "/raid-helper/event-update",
  validateRaidHelperWebhook,
  async (request, response) => {
    const existingEvent = await getEventByRaidHelperId(request.body.id);
    if (!existingEvent) {
      response.sendStatus(200);
      return;
    }

    const event = mapRaidHelperWebhookEventToEvent(
      request.body,
      existingEvent.discordServer?.id ?? request.body.serverId,
    );
    await updateEvent(existingEvent.id, event);

    console.log("Updated");
    response.sendStatus(200);
  },
);

router.post(
  "/raid-helper/event-delete",
  validateRaidHelperWebhook,
  async (request, response) => {
    const existingEvent = await getEventByRaidHelperId(request.body.id);
    if (!existingEvent) {
      response.sendStatus(200);
      return;
    }

    deleteEvent(existingEvent.id);
    response.sendStatus(200);
  },
);

export default router;
