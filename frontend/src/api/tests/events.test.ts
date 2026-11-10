import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createEventOnGuild,
  deleteEventById,
  getEventById,
  getEvents,
  importRaidHelperEvent,
  importRaidHelperEventsByGuild,
  importRaidHelperEventsByUser,
  searchGuildMembers,
  updateEventById,
} from '../events';
import { API_ERROR_CODES, type CreateEvent } from '@limitrausch/contracts';

const event = {
  id: 1,
  lastUpdated: 123,
  title: 'Test',
  eventType: 1,
  startTime: 100,
  endTime: 200,
  isPublic: false,
};
const importResult = { imported: 1, updated: 0, skipped: 0, failed: 0 };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('event API client', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('builds event-list query parameters and forwards abort signals', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ postedEvents: [event] }));
    const controller = new AbortController();

    await expect(getEvents(new Date(100_000), 'guild & one', controller.signal)).resolves.toEqual({
      postedEvents: [event],
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/events?startTime=100&guildId=guild+%26+one', {
      signal: controller.signal,
    });
  });

  it('surfaces event-list HTTP and malformed JSON errors', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: { code: API_ERROR_CODES.INTERNAL_SERVER_ERROR } }, 500),
    );
    await expect(getEvents()).rejects.toMatchObject({
      code: API_ERROR_CODES.INTERNAL_SERVER_ERROR,
      statusCode: 500,
    });

    fetchMock.mockResolvedValueOnce(new Response('{invalid', { status: 200 }));
    await expect(getEvents()).rejects.toMatchObject({
      code: API_ERROR_CODES.INVALID_API_RESPONSE,
      statusCode: 502,
    });
  });

  it('encodes event IDs and validates event responses', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(event));

    await expect(getEventById('event/1')).resolves.toEqual(event);
    expect(fetchMock).toHaveBeenCalledWith('/api/events/event%2F1');

    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 'invalid' }));
    await expect(getEventById('bad')).rejects.toMatchObject({
      code: API_ERROR_CODES.INVALID_API_RESPONSE,
      statusCode: 502,
    });
  });

  it('creates events with a JSON request body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ postedEvents: [event] }));
    const createPayload: CreateEvent = {
      title: 'Test',
      eventType: 1,
      startTime: 100,
      endTime: 200,
      isPublic: false,
    };

    await createEventOnGuild(createPayload, 'guild/1');
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/events/guild%2F1/new',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createPayload),
      }),
    );
  });

  it('updates events with a JSON request body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(event));
    await updateEventById(1, { title: 'Updated' });
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/events/1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ title: 'Updated' }),
      }),
    );
  });

  it('deletes events successfully without requiring a response body', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(deleteEventById(1)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith('/api/events/1', { method: 'DELETE' });
  });

  it('surfaces API errors when deleting an event fails', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: { code: API_ERROR_CODES.NOT_FOUND } }, 404),
    );

    await expect(deleteEventById(1)).rejects.toMatchObject({
      code: API_ERROR_CODES.NOT_FOUND,
      statusCode: 404,
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/events/1', { method: 'DELETE' });
  });

  it('surfaces API errors when event creation fails', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: { code: API_ERROR_CODES.INSUFFICIENT_PERMISSIONS } }, 403),
    );

    await expect(
      createEventOnGuild(
        {
          title: 'Test',
          eventType: 1,
          startTime: 100,
          endTime: 200,
          isPublic: false,
        },
        'guild-1',
      ),
    ).rejects.toMatchObject({
      code: API_ERROR_CODES.INSUFFICIENT_PERMISSIONS,
      statusCode: 403,
    });
  });

  it('surfaces API errors when event update fails', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: { code: API_ERROR_CODES.CONFLICT } }, 409),
    );

    await expect(updateEventById(1, { title: 'Updated' })).rejects.toMatchObject({
      code: API_ERROR_CODES.CONFLICT,
      statusCode: 409,
    });
  });

  it('normalizes and validates guild member search requests', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([{ id: 'member-1', name: 'Member' }]));
    const controller = new AbortController();

    await expect(searchGuildMembers('guild/1', '  Alice  ', controller.signal)).resolves.toEqual([
      { id: 'member-1', name: 'Member' },
    ]);
    expect(fetchMock).toHaveBeenCalledWith('/api/events/guild%2F1/members?query=Alice', {
      signal: controller.signal,
    });

    fetchMock.mockResolvedValueOnce(jsonResponse(Array(6).fill({ id: 'x', name: 'x' })));
    await expect(searchGuildMembers('guild', 'Alice')).rejects.toMatchObject({
      code: API_ERROR_CODES.INVALID_API_RESPONSE,
    });
  });

  it('surfaces guild member search errors', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: { code: API_ERROR_CODES.INSUFFICIENT_PERMISSIONS } }, 403),
    );

    await expect(searchGuildMembers('guild-1', 'Alice')).rejects.toMatchObject({
      code: API_ERROR_CODES.INSUFFICIENT_PERMISSIONS,
      statusCode: 403,
    });
  });

  it.each([
    [
      'guild import',
      () => importRaidHelperEventsByGuild('guild/1'),
      '/api/events/raid-helper/guild/guild%2F1',
    ],
    ['user import', () => importRaidHelperEventsByUser(), '/api/events/raid-helper/user'],
    [
      'single event import',
      () => importRaidHelperEvent('event/1'),
      '/api/events/raid-helper/event%2F1',
    ],
  ])('handles the %s endpoint', async (_label, request, url) => {
    fetchMock.mockResolvedValue(jsonResponse(importResult));

    await expect(request()).resolves.toEqual(importResult);
    expect(fetchMock).toHaveBeenCalledWith(url);
  });

  it.each([
    ['guild import', () => importRaidHelperEventsByGuild('guild-1')],
    ['user import', () => importRaidHelperEventsByUser()],
    ['single event import', () => importRaidHelperEvent('event-1')],
  ])('surfaces HTTP errors from the %s endpoint', async (_label, request) => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: { code: API_ERROR_CODES.SERVICE_UNAVAILABLE } }, 503),
    );

    await expect(request()).rejects.toMatchObject({
      code: API_ERROR_CODES.SERVICE_UNAVAILABLE,
      statusCode: 503,
    });
  });

  it('rejects invalid RaidHelper import responses', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ imported: 'one' }));

    await expect(importRaidHelperEventsByGuild('guild-1')).rejects.toMatchObject({
      code: API_ERROR_CODES.INVALID_API_RESPONSE,
      statusCode: 502,
    });
  });
});
