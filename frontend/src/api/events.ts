import {
  EVENT_TYPE,
  eventsResponseSchema,
  type Event,
  type EventDiscordUser,
  type EventType,
  type EventsResponse,
} from '@limitrausch/contracts';

export { EVENT_TYPE };
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
