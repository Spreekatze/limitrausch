import express from "express";
import requireAdmin from "../middleware/auth.js";
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

const router = express.Router();

// Request events from raid-helper by serverId
router.get("/raid-helper/:id", requireAdmin, async (request, response) => {
  const serverId = request.params.id;
  if (typeof serverId !== "string") {
    response.status(400).json({ error: "Invalid server id" });
    return;
  }

  const server = request.session.authUser?.userGuilds.find(
    (guild) => guild.id === serverId,
  );
  if (!server) {
    return response.status(404).json({
      error: "Import failed due to user not being member of requested guild",
    });
  }

  //TODO: move server adding to its own route
  await addDiscordServer(server);

  const result = await importRaidHelperEvents(server);

  response.status(200).json(result);
});

// Get all events
router.get("/", async (request, response) => {
  const events = await getEvents();
  response.json({ postedEvents: events });
});

// Create an event
router.post("/new", requireAdmin, async (request, response) => {
  const result = createEventSchema.safeParse(request.body);
  if (!result.success) {
    response.status(400).json({
      error: "Invalid event data",
      details: result.error.issues,
    });
    return;
  }

  const event: CreateEvent = {
    ...result.data,
  };

  const createdEvent = await addEvent(event);

  // TODO: probably this should be a redirect
  response.status(201).json({ event: createdEvent });
});

// Get (request) a single event by id
router.get("/:id", async (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    response.status(400).json({ error: "Invalid event id" });
    return;
  }

  const event = await getEventById(id);
  if (!event) {
    response.status(404).json({ error: "Event not found" });
    return;
  }

  response.json(event);
});

// Edit (Update) a single event by id
router.patch("/:id", requireAdmin, async (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    response.status(400).json({ error: "Invalid event id" });
    return;
  }

  const result = updateEventSchema.safeParse({
    ...request.body,
  });

  if (!result.success) {
    response
      .status(400)
      .json({ error: "Invalid event data", details: result.error.issues });
    return;
  }

  const updatedEvent = await updateEventById(id, {
    ...result.data,
  });

  if (!updatedEvent) {
    response.status(404).json({ error: "Event not found" });
    return;
  }

  response.json(updatedEvent);
});

// Delete a single event by id
router.delete("/:id", requireAdmin, async (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    response.status(400).json({ error: "Invalid event id" });
    return;
  }
  const deleted = await deleteEventById(id);
  if (!deleted) {
    response.status(404).json({ error: "Event not found" });
    return;
  }
  response.status(204).send();
});

//TODO: delete by server id
export default router;
