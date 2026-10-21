import express from "express";
import { importRaidHelperEvents } from "../services/raidHelperImport.js";
import {
  addEvent,
  deleteEventById,
  getEventById,
  getEvents,
  updateEventById,
} from "../store/eventStore.js";
import { addDiscordServer } from "../store/guildStore.js";
import {
  CreateEvent,
  createEventSchema,
  updateEventSchema,
} from "@limitrausch/contracts";
import requireGuildManager from "../middleware/requireGuildManager.js";
import { HttpError } from "../errors/httpError.js";

const router = express.Router();

// Request events from raid-helper by serverId
router.get(
  "/raid-helper/:id",
  requireGuildManager,
  async (request, response, next) => {
    const serverId = request.params.id;
    if (typeof serverId !== "string") {
      return next(new HttpError(400, "Invalid server id"));
    }

    const server = request.session.authUser?.userGuilds.find(
      (guild) => guild.id === serverId,
    );
    if (!server) {
      return next(
        new HttpError(
          404,
          "Import failed due to user not being member of requested guild",
        ),
      );
    }

    //TODO: move server adding to its own route
    await addDiscordServer(server);

    const result = await importRaidHelperEvents(server);

    response.status(200).json(result);
  },
);

// Get all events
router.get("/", async (request, response) => {
  const events = await getEvents();
  response.json({ postedEvents: events });
});

// Create an event
router.post("/new", requireGuildManager, async (request, response, next) => {
  const result = createEventSchema.safeParse(request.body);
  if (!result.success) {
    return next(
      new HttpError(400, "Invalid event data", {}, result.error.issues),
    );
  }

  const event: CreateEvent = {
    ...result.data,
  };

  const guild = request.session.authUser?.userGuilds.find(
    (item) => item.id === event.discordServer?.id,
  );

  const createdEvent = await addEvent(event, guild);

  // TODO: probably this should be a redirect
  response.status(201).json({ postedEvents: [createdEvent] });
});

// Get (request) a single event by id
router.get("/:id", async (request, response, next) => {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return next(new HttpError(400, "Invalid event id"));
  }

  const event = await getEventById(id);
  if (!event) {
    return next(new HttpError(404, "Event not found"));
  }

  response.json(event);
});

// Edit (Update) a single event by id
router.patch("/:id", requireGuildManager, async (request, response, next) => {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return next(new HttpError(400, "Invalid event id"));
  }

  const result = updateEventSchema.safeParse({
    ...request.body,
  });

  if (!result.success) {
    return next(
      new HttpError(400, "Invalid event data", {}, result.error.issues),
    );
  }

  const updatedEvent = await updateEventById(id, {
    ...result.data,
  });

  if (!updatedEvent) {
    return next(new HttpError(404, "Event not found"));
  }

  response.json(updatedEvent);
});

// Delete a single event by id
router.delete("/:id", requireGuildManager, async (request, response, next) => {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return next(new HttpError(400, "Invalid event id"));
  }
  const deleted = await deleteEventById(id);
  if (!deleted) {
    return next(new HttpError(404, "Event not found"));
  }
  response.status(204).send();
});

//TODO: delete by server id
export default router;
