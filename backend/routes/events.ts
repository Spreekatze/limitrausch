import express from "express";
import requireAdmin from "../middleware/auth.js";
import type { Event } from "../types/eventSchema.js";
import { randomUUID } from "crypto";
import { createEventSchema, updateEventSchema } from "../types/eventSchema.js";
import { raidHelperEventsResponseSchema } from "../types/raidhelperSchema.js";
import { mapRaidHelperEventToEvent } from "../mapping/eventTypeMapping.js";
import { importRaidHelperEvents } from "../services/raidHelperImport.js";
import { HttpError } from "../errors/httpError.js";
import {
  addEvent,
  deleteEvent,
  getEventById,
  getEvents,
  updateEvent,
} from "../store/eventStore.js";

const router = express.Router();

// Request events from raid-helper by serverId
router.get("/raid-helper/:id", requireAdmin, async (request, response) => {
  const serverId = request.params.id;
  if (typeof serverId !== "string") {
    response.status(400).json({ error: "Invalid server id" });
    return;
  }

  try {
    const result = await importRaidHelperEvents(serverId);

    response.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("Raidhelper import failed:", error);

    if (error instanceof HttpError) {
      return response.status(error.status).json({ error: error.message });
    }

    return response.status(502).json({ error: "Raidhelper import failed" });
  }
});

// Get all events
router.get("/", (request, response) => {
  response.json(getEvents());
});

// Create an event
router.post("/new", requireAdmin, (request, response) => {
  const result = createEventSchema.safeParse(request.body);
  if (!result.success) {
    response.status(400).json({
      error: "Invalid event data",
      details: result.error.issues,
    });
    return;
  }

  const event: Event = {
    ...result.data,
    id: randomUUID(),
    lastUpdated: Date.now(),
    signUpCount: "0",
  };

  addEvent(event);

  response.status(201).json({ event: event });
});

// Get (request) a single event by id
router.get("/:id", (request, response) => {
  const event = getEventById(request.params.id);
  if (!event) {
    response.status(404).json({ error: "Event not found" });
    return;
  }

  response.json(event);
});

// Edit (Update) a single event by id
router.patch("/:id", requireAdmin, (request, response) => {
  const id = request.params.id;
  if (typeof id !== "string") {
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

  const updatedEvent = updateEvent(id, {
    ...result.data,
    lastUpdated: Date.now(),
  });

  if (!updatedEvent) {
    response.status(404).json({ error: "Event not found" });
    return;
  }

  response.json(updatedEvent);
});

router.delete("/:id", requireAdmin, (request, response) => {
  const id = request.params.id;
  if (typeof id !== "string") {
    response.status(400).json({ error: "Invalid event id" });
    return;
  }
  const deleted = deleteEvent(id);
  if (!deleted) {
    response.status(404).json({ error: "Event not found" });
    return;
  }
  response.status(204).send();
});

export default router;
