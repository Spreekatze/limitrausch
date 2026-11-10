import type { CreateEvent, RaidHelperImportResponse, UpdateEvent } from '@limitrausch/contracts';
import {
  eventSchema,
  eventDiscordUserSuggestionsSchema,
  eventsResponseSchema,
  raidHelperImportResponseSchema,
  type Event,
  type EventDiscordUser,
  type EventType,
  type EventsResponse,
} from '@limitrausch/contracts';
import { ApiError, handleApiError, readApiResponseJson } from './apiError';

export type { Event, EventType };
export type DiscordUser = EventDiscordUser;
export type ApiEventsResponse = EventsResponse;

export async function getEvents(
  date?: Date,
  guildId?: string,
  signal?: AbortSignal,
): Promise<ApiEventsResponse> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const params = new URLSearchParams({});

  if (date) {
    params.set('startTime', String(Math.floor(date.getTime() / 1000)));
  }

  if (guildId) {
    params.set('guildId', guildId);
  }

  const response = await fetch(`${apiBaseUrl}/events?${params}`, {
    ...(signal ? { signal } : {}),
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  const result = eventsResponseSchema.safeParse(await readApiResponseJson(response));
  if (!result.success) {
    throw new ApiError('INVALID_API_RESPONSE', 502);
  }

  return result.data;
}

export async function importRaidHelperEventsByGuild(
  guildId: string,
): Promise<RaidHelperImportResponse> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const response = await fetch(
    `${apiBaseUrl}/events/raid-helper/guild/${encodeURIComponent(guildId)}`,
  );

  if (!response.ok) {
    await handleApiError(response);
  }

  const result = raidHelperImportResponseSchema.safeParse(await readApiResponseJson(response));
  if (!result.success) {
    throw new ApiError('INVALID_API_RESPONSE', 502);
  }

  return result.data;
}

export async function importRaidHelperEventsByUser(): Promise<RaidHelperImportResponse> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const response = await fetch(`${apiBaseUrl}/events/raid-helper/user`);

  if (!response.ok) {
    await handleApiError(response);
  }

  const result = raidHelperImportResponseSchema.safeParse(await readApiResponseJson(response));
  if (!result.success) {
    throw new ApiError('INVALID_API_RESPONSE', 502);
  }

  return result.data;
}

export async function importRaidHelperEvent(eventId: string): Promise<RaidHelperImportResponse> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const response = await fetch(`${apiBaseUrl}/events/raid-helper/${encodeURIComponent(eventId)}`);

  if (!response.ok) {
    await handleApiError(response);
  }

  const result = raidHelperImportResponseSchema.safeParse(await readApiResponseJson(response));
  if (!result.success) {
    throw new ApiError('INVALID_API_RESPONSE', 502);
  }

  return result.data;
}

export async function createEventOnGuild(
  event: CreateEvent,
  guildId: string,
): Promise<ApiEventsResponse> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const response = await fetch(`${apiBaseUrl}/events/${encodeURIComponent(guildId)}/new`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });
  if (!response.ok) {
    await handleApiError(response);
  }

  const result = eventsResponseSchema.safeParse(await readApiResponseJson(response));
  if (!result.success) {
    throw new ApiError('INVALID_API_RESPONSE', 502);
  }

  return result.data;
}

export async function getEventById(eventId: string): Promise<Event> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const response = await fetch(`${apiBaseUrl}/events/${encodeURIComponent(eventId)}`);

  if (!response.ok) {
    await handleApiError(response);
  }

  const result = eventSchema.safeParse(await readApiResponseJson(response));
  if (!result.success) {
    throw new ApiError('INVALID_API_RESPONSE', 502);
  }

  return result.data;
}

export async function updateEventById(eventId: number, update: UpdateEvent): Promise<Event> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const response = await fetch(`${apiBaseUrl}/events/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(update),
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  const result = eventSchema.safeParse(await readApiResponseJson(response));
  if (!result.success) {
    throw new ApiError('INVALID_API_RESPONSE', 502);
  }

  return result.data;
}

export async function deleteEventById(eventId: number) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const response = await fetch(`${apiBaseUrl}/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    await handleApiError(response);
  }
}

export async function searchGuildMembers(
  guildId: string,
  query: string,
  signal?: AbortSignal,
): Promise<EventDiscordUser[]> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const normalizedQuery = query.trim();

  const params = new URLSearchParams({ query: normalizedQuery });
  const response = await fetch(
    `${apiBaseUrl}/events/${encodeURIComponent(guildId)}/members?${params}`,
    signal ? { signal } : undefined,
  );

  if (!response.ok) {
    await handleApiError(response);
  }

  const result = eventDiscordUserSuggestionsSchema.safeParse(await readApiResponseJson(response));
  if (!result.success) {
    throw new ApiError('INVALID_API_RESPONSE', 502);
  }

  return result.data;
}
