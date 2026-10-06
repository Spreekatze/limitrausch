import express from "express";
import validateRaidHelperWebhook from "../middleware/webhook_raidhelper.js";
import { addEvent, getEventByRaidHelperId } from "../store/eventStore.js";
import { mapRaidHelperWebhookEventToEvent } from "../mapping/eventTypeMapping.js";

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

    console.log(event);
    response.sendStatus(200);
  },
);

router.post(
  "/raid-helper/event-edit",
  validateRaidHelperWebhook,
  (request, response) => {
    // später: Event aktualisieren
    response.sendStatus(200);
  },
);

router.post(
  "/raid-helper/event-delete",
  validateRaidHelperWebhook,
  (request, response) => {
    // später: Event löschen
    response.sendStatus(200);
  },
);

export default router;
