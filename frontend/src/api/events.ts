export interface RaidHelperEvent {
  channelId: string;
  closeTime: number;
  coLeaders: DiscordUser[];
  color: string;
  creator: DiscordUser;
  description: string;
  endTime: number;
  id: string;
  imageUrl: string;
  lastUpdated: number;
  leaderId: string;
  leaderName: string;
  signUpCount: string;
  startTime: number;
  templateId: string;
  title: string;
}

export interface DiscordUser {
  id: string;
  name: string;
}
export interface RaidHelperEventsResponse {
  pages: number;
  eventsOverall: number;
  eventsTransmitted: number;
  currentPage: number;
  postedEvents: RaidHelperEvent[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isDiscordUser(value: unknown): value is DiscordUser {
  return isObject(value) && typeof value.id === 'string' && typeof value.name === 'string';
}

function isRaidHelperEvent(value: unknown): value is RaidHelperEvent {
  return (
    isObject(value) &&
    typeof value.channelId === 'string' &&
    typeof value.closeTime === 'number' &&
    Array.isArray(value.coLeaders) &&
    value.coLeaders.every(isDiscordUser) &&
    typeof value.color === 'string' &&
    isDiscordUser(value.creator) &&
    typeof value.endTime === 'number' &&
    typeof value.id === 'string' &&
    typeof value.lastUpdated === 'number' &&
    typeof value.leaderId === 'string' &&
    typeof value.leaderName === 'string' &&
    typeof value.signUpCount === 'string' &&
    typeof value.startTime === 'number' &&
    typeof value.templateId === 'string'
  );
}

function isEventsResponse(value: unknown): value is RaidHelperEventsResponse {
  return (
    isObject(value) &&
    typeof value.pages === 'number' &&
    typeof value.eventsOverall === 'number' &&
    typeof value.eventsTransmitted === 'number' &&
    typeof value.currentPage === 'number' &&
    Array.isArray(value.postedEvents) &&
    value.postedEvents.every(isRaidHelperEvent)
  );
}

export async function getEvents(date: Date): Promise<RaidHelperEventsResponse> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const startTime = Math.floor(date.getTime() / 1000);
  const response = await fetch(`${apiBaseUrl}/events/raid-helper?startTime=${startTime}`);

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
