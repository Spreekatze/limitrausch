import { Event } from "../types/eventSchema.js";

const events: Event[] = [];

export function getEvents(): Event[] {
  return events;
}

export function getEventById(id: string): Event | undefined {
  return events.find((event) => event.id === id);
}

export function getEventByRaidHelperId(id: string): Event | undefined {
  return events.find((event) => event.raidHelperId === id);
}

export function addEvent(event: Event): void {
  events.push(event);
}

export function updateEvent(
  id: string,
  update: Partial<Event>,
): Event | undefined {
  const event = events.find((event) => event.id === id);
  if (!event) {
    return undefined;
  }
  Object.assign(event, update);
  return event;
}

export function deleteEvent(id: string): boolean {
  const index = events.findIndex((event) => event.id === id);
  if (index === -1) {
    return false;
  }
  events.splice(index, 1);
  return true;
}
