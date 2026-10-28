import express from "express";
import {
  addEvent,
  deleteEventById,
  getEventById,
  getEvents,
  updateEventById,
} from "../store/eventStore.js";
import {
  CreateEvent,
  createEventSchema,
  updateEventSchema,
} from "@limitrausch/contracts";
import requireEventManager from "../middleware/requireEventManager.js";
import { HttpError } from "../errors/httpError.js";
import raidhelperRoutes from "./raidhelper.js";

const router = express.Router();

router.use("/raid-helper", raidhelperRoutes);

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

// Get all events
router.get("/", async (request, response) => {
  const events = await getEvents();
  response.json({ postedEvents: events });
});

// Create an event
router.post(
  "/:guildId/new",
  requireEventManager,
  async (request, response, next) => {
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
  },
);

// Edit (Update) a single event by id
router.patch("/:id", requireEventManager, async (request, response, next) => {
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
router.delete("/:id", requireEventManager, async (request, response, next) => {
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
