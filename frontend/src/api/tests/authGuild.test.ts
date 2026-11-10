import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getLoginStatus, logout } from '../auth';
import { getGuildConfigById, saveGuildConfig } from '../guild';
import { API_ERROR_CODES } from '@limitrausch/contracts';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('auth and guild API clients', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('requests login status using cookie credentials', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ loggedIn: false, user: null }));
    await expect(getLoginStatus()).resolves.toEqual({ loggedIn: false, user: null });
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/me', {
      credentials: 'include',
    });
  });

  it('logs out using cookie credentials', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ loggedIn: false, user: null }));
    await expect(logout()).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', {
      credentials: 'include',
    });
  });

  it('rejects invalid login status responses', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ loggedIn: 'yes' }));
    await expect(getLoginStatus()).rejects.toMatchObject({
      code: 'INVALID_API_RESPONSE',
      statusCode: 502,
    });
  });

  it('surfaces login status HTTP errors', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: { code: 'UNAUTHORIZED' } }, 401));

    await expect(getLoginStatus()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      statusCode: 401,
    });
  });

  it('rejects invalid logout responses', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ loggedIn: 'yes' }));
    await expect(logout()).rejects.toMatchObject({
      code: 'INVALID_API_RESPONSE',
      statusCode: 502,
    });
  });

  it('surfaces logout HTTP errors', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: { code: 'REQUEST_FAILED' } }, 500));
    await expect(logout()).rejects.toMatchObject({
      code: 'REQUEST_FAILED',
      statusCode: 500,
    });
  });

  it('validates guild responses and encodes guild IDs', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ guildConfig: null, guildRoles: [] }));
    await expect(getGuildConfigById('guild/1')).resolves.toEqual({
      guildConfig: null,
      guildRoles: [],
    });
    expect(fetchMock).toHaveBeenLastCalledWith('/api/guild/guild%2F1');

    fetchMock.mockResolvedValueOnce(jsonResponse({ guildConfig: {}, guildRoles: [] }));
    await expect(getGuildConfigById('guild-1')).rejects.toMatchObject({
      code: 'INVALID_API_RESPONSE',
      statusCode: 502,
    });
  });

  it('surfaces guild config lookup errors', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: { code: 'NOT_FOUND' } }, 404));

    await expect(getGuildConfigById('missing-guild')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      statusCode: 404,
    });
  });

  it('saves guild config through a JSON PATCH request', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const config = {
      id: 'guild-1',
      name: 'Guild',
      roleIDsAllowedToManageEvents: ['role-1'],
      roleIDsBannedFromParticipating: [],
    };

    await expect(saveGuildConfig('guild-1', config)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/guild/guild-1',
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      }),
    );
  });

  it('surfaces guild config save errors', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: { code: 'INTERNAL_SERVER_ERROR' } }, 500),
    );

    await expect(
      saveGuildConfig('guild-1', {
        id: 'guild-1',
        name: 'Guild',
        roleIDsAllowedToManageEvents: ['role-1'],
        roleIDsBannedFromParticipating: [],
      }),
    ).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: 500,
    });
  });

  it('handles malformed JSON responses', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{invalid', { status: 200 }));

    await expect(getLoginStatus()).rejects.toMatchObject({
      code: API_ERROR_CODES.INVALID_API_RESPONSE,
      statusCode: 502,
    });
  });
});
