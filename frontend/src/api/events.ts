export interface Event {
  id: string;
  lastUpdated: number;
  creator: DiscordUser;
  leader?: DiscordUser;
  coLeaders?: DiscordUser[];
  title: string;
  description?: string;
  imageUrl?: string;
  startTime: number;
  endTime: number;
  eventType: EventType;
  discordServerId?: string;
  discordTextChannelId?: string;
  signUpCount?: number;
  raidHelperId?: string;
}

export const EVENT_TYPE = {
  CASUAL: 0,
  RAID: 1,
  ULTIMATE: 2,
  ARCHIV: 3,
  SQENIX_EVENT: 4,
  FIELD: 5,
} as const;
export type EventType = typeof EVENT_TYPE;
const eventTypeValues = new Set<number>(Object.values(EVENT_TYPE));

export interface DiscordUser {
  id: string;
  name: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isDiscordUser(value: unknown): value is DiscordUser {
  return isObject(value) && typeof value.id === 'string' && typeof value.name === 'string';
}

function isEventType(value: unknown): value is EventType {
  return typeof value === 'number' && eventTypeValues.has(value);
}

function isEvent(value: unknown): value is Event {
  return (
    isObject(value) &&
    typeof value.id === 'string' &&
    typeof value.lastUpdated === 'number' &&
    isDiscordUser(value.creator) &&
    (value.leader === undefined || isDiscordUser(value.leader)) &&
    (value.coLeaders === undefined ||
      (Array.isArray(value.coLeaders) && value.coLeaders.every(isDiscordUser))) &&
    typeof value.title === 'string' &&
    typeof value.startTime === 'number' &&
    typeof value.endTime === 'number' &&
    isEventType(value.eventType) &&
    (value.description === undefined || typeof value.description === 'string') &&
    (value.imageUrl === undefined || typeof value.imageUrl === 'string') &&
    (value.discordServerId === undefined || typeof value.discordServerId === 'string') &&
    (value.discordTextChannelId === undefined || typeof value.discordTextChannelId === 'string') &&
    (value.signUpCount === undefined || typeof value.signUpCount === 'number') &&
    (value.raidHelperId === undefined || typeof value.raidHelperId === 'string')
  );
}

export interface ApiEventsResponse {
  // pages: number;
  // eventsOverall: number;
  // eventsTransmitted: number;
  // currentPage: number;
  postedEvents: Event[];
}

function isEventsResponse(value: unknown): value is ApiEventsResponse {
  return isObject(value) && Array.isArray(value.postedEvents) && value.postedEvents.every(isEvent);
}

export async function getEvents(date: Date): Promise<ApiEventsResponse> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const startTime = Math.floor(date.getTime() / 1000);
  const response = await fetch(`${apiBaseUrl}/events?startTime=${startTime}`);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API failed: ${response.status} ${text}`);
  }

  const data: unknown = await response.json();
  if (!isEventsResponse(data)) {
    throw new Error('The events API returned an unexpected response format.');
  }

  return data;
}
