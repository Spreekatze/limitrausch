export interface RaidHelperEventsResponse {
  pages: number;
  eventsOverall: number;
  eventsTransmitted: number;
  currentPage: number;
  postedEvents: unknown[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isEventsResponse(value: unknown): value is RaidHelperEventsResponse {
  return (
    isObject(value) &&
    typeof value.pages === 'number' &&
    typeof value.eventsOverall === 'number' &&
    typeof value.eventsTransmitted === 'number' &&
    typeof value.currentPage === 'number' &&
    Array.isArray(value.postedEvents)
  );
}

export async function fetchRaidHelperEvents(): Promise<RaidHelperEventsResponse> {
  // TODO: Replace with your actual API endpoint and authorization token
  /* Authorization token can be found via '/apikey show' on the respective discord server
   * Time needs to be a unix timestamp in seconds
   */
  const response = await fetch('/api/v4/servers/1408172814879559721/events', {
    method: 'GET',
    headers: {
      Authorization: 'i2fYQRAo3ltEv7yUhlIzucIt8TDvalPz958GFR4X',
      StartTimeFilter: String(Math.floor(Date.now() / 1000)),
    },
  });

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
