import type { CreateEvent, RaidHelperImportResponse } from '@limitrausch/contracts';
import {
  eventSchema,
  eventsResponseSchema,
  raidHelperImportResponseSchema,
  type Event,
  type EventDiscordUser,
  type EventType,
  type EventsResponse,
} from '@limitrausch/contracts';

export type { Event, EventType };
export type DiscordUser = EventDiscordUser;
export type ApiEventsResponse = EventsResponse;

export async function getEvents(date: Date): Promise<ApiEventsResponse> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const startTime = Math.floor(date.getTime() / 1000);
  const response = await fetch(`${apiBaseUrl}/events?startTime=${startTime}`);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API failed: ${response.status} ${text}`);
  }

  const result = eventsResponseSchema.safeParse(await response.json());
  if (!result.success) {
    throw new Error('The events API returned an unexpected response format.');
  }

  return result.data;
}

export async function importRaidHelperEventsByServer(
  serverId: string,
): Promise<RaidHelperImportResponse> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const response = await fetch(`${apiBaseUrl}/events/raid-helper/server/${serverId}`);

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const body: unknown = await response.json();

      if (
        typeof body === 'object' &&
        body !== null &&
        'message' in body &&
        typeof body.message === 'string'
      ) {
        message = body.message;
      } else if (
        typeof body === 'object' &&
        body !== null &&
        'error' in body &&
        typeof body.error === 'string'
      ) {
        message = body.error;
      }
    } catch {
      // Response wasnt valid JSON
    }
    throw new Error(message || `Import failed: ${response.status}`);
  }

  const result = raidHelperImportResponseSchema.safeParse(await response.json());
  if (!result.success) {
    throw new Error('The import API call returned an unexpected response format.');
  }

  return result.data;
}

export async function importRaidHelperEventsByUser(): Promise<RaidHelperImportResponse> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const response = await fetch(`${apiBaseUrl}/events/raid-helper/user`);

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const body: unknown = await response.json();

      if (
        typeof body === 'object' &&
        body !== null &&
        'message' in body &&
        typeof body.message === 'string'
      ) {
        message = body.message;
      } else if (
        typeof body === 'object' &&
        body !== null &&
        'error' in body &&
        typeof body.error === 'string'
      ) {
        message = body.error;
      }
    } catch {
      // Response wasnt valid JSON
    }
    throw new Error(message || `Import failed: ${response.status}`);
  }

  const result = raidHelperImportResponseSchema.safeParse(await response.json());
  if (!result.success) {
    throw new Error('The import API call returned an unexpected response format.');
  }

  return result.data;
}

export async function importRaidHelperEvent(eventId: string): Promise<RaidHelperImportResponse> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const response = await fetch(`${apiBaseUrl}/events/raid-helper/${eventId}`);

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const body: unknown = await response.json();

      if (
        typeof body === 'object' &&
        body !== null &&
        'message' in body &&
        typeof body.message === 'string'
      ) {
        message = body.message;
      } else if (
        typeof body === 'object' &&
        body !== null &&
        'error' in body &&
        typeof body.error === 'string'
      ) {
        message = body.error;
      }
    } catch {
      // Response wasnt valid JSON
    }
    throw new Error(message || `Import failed: ${response.status}`);
  }

  const result = raidHelperImportResponseSchema.safeParse(await response.json());
  if (!result.success) {
    throw new Error('The import API call returned an unexpected response format.');
  }

  return result.data;
}

export async function createEventOnServer(
  event: CreateEvent,
  serverId: string,
): Promise<ApiEventsResponse> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const response = await fetch(`${apiBaseUrl}/events/${encodeURIComponent(serverId)}/new`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API failed: ${response.status} ${text}`);
  }

  const result = eventsResponseSchema.safeParse(await response.json());
  if (!result.success) {
    throw new Error(result.error.message);
  }

  return result.data;
}

export async function getEventById(id: string): Promise<Event> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const response = await fetch(`${apiBaseUrl}/events/${id}`);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API failed: ${response.status} ${text}`);
  }

  const result = eventSchema.safeParse(await response.json());
  if (!result.success) {
    throw new Error('The events API returned an unexpected response format.');
  }

  return result.data;
}
