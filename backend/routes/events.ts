import express from "express";
import requireAdmin from "../middleware/auth.js";
import getRaidHelperEvents from "../utils/raidhelper.js";
import type { Event } from "../types/event.js";
import { randomUUID } from "crypto";

const router = express.Router();
const events: Event[] = [];

// Request events from raid-helper
//TODO: add proper authentication and authorization for this route
router.get("/raid-helper", async (request, response) => {
  const startTime = request.query.startTime as string | undefined;
  const result = await getRaidHelperEvents(startTime);
  //TODO: set up proper failsafe for the Raid Helper API route
  if (result.error) {
    response.status(result.status).json({ error: result.error });
    return;
  }
  response.json(result.data);
});

// Get all events
router.get("/", (request, response) => {
  response.json(events);
});

// Create an event
router.post("/new", requireAdmin, (request, response) => {
  console.log("New event:", request.body);
  const event = (Event = {
    ...request.body,
    id: randomUUID(),
  });

  //TODO: Replace with actual DB logic
  events.push(event);

  response.status(201).json({ message: "Event received", event: event });
});

// Get (request) a single event by id
router.get("/:id", (request, response) => {
  //TODO: Replace with actual DB logic
  const event = events.find((event) => event.id === request.params.id);
  if (!event) {
    response.status(404).json({ error: "Event not found" });
    return;
  }

  response.json(event);
});

// Edit (Update) a single event by id
router.put("/:id", requireAdmin, (request, response) => {
  //TODO: Replace with actual DB logic
  const eventIndex = events.findIndex(
    (event) => event.id === request.params.id,
  );
  if (eventIndex === -1) {
    response.status(404).json({ error: "Event not found" });
    return;
  }
  const updatedEvent: Event = {
    ...request.body,
    id: request.params.id,
  };

  //TODO: Replace with actual DB logic
  events[eventIndex] = updatedEvent;

  response.json(updatedEvent);
});

router.delete("/:id", requireAdmin, (request, response) => {
  //TODO: Replace with actual DB logic
  const eventIndex = events.findIndex(
    (event) => event.id === request.params.id,
  );
  if (eventIndex === -1) {
    response.status(404).json({ error: "Event not found" });
    return;
  }

  //TODO: Replace with actual DB logic
  events.splice(eventIndex, 1);

  response.status(204).send();
});

export default router;
