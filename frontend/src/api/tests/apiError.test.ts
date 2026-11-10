import { describe, expect, it } from 'vitest';
import { API_ERROR_CODES } from '@limitrausch/contracts';
import { ApiError, getApiErrorMessage, handleApiError } from '../apiError';

describe('API errors', () => {
  it('uses the validated API error code and request ID from a response', async () => {
    const response = new Response(
      JSON.stringify({
        error: { code: 'INSUFFICIENT_PERMISSIONS', requestId: 'request-1' },
      }),
      { status: 403 },
    );

    await expect(handleApiError(response)).rejects.toMatchObject({
      name: 'ApiError',
      code: 'INSUFFICIENT_PERMISSIONS',
      statusCode: 403,
      requestId: 'request-1',
      message: getApiErrorMessage('INSUFFICIENT_PERMISSIONS'),
    });
  });

  it('maps malformed and invalid error responses to status-specific codes', async () => {
    await expect(handleApiError(new Response('{invalid', { status: 502 }))).rejects.toMatchObject({
      code: 'UPSTREAM_ERROR',
      statusCode: 502,
      requestId: undefined,
    });
    await expect(
      handleApiError(new Response(JSON.stringify({ error: { code: 'UNKNOWN' } }), { status: 404 })),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });
  });

  it('retains the error class and uses stable fallback messages', () => {
    const error = new ApiError('REQUEST_FAILED', 418);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ApiError');
    expect(error.message).toBe(getApiErrorMessage('REQUEST_FAILED'));
    expect(getApiErrorMessage('SERVICE_UNAVAILABLE')).toBe(getApiErrorMessage('UPSTREAM_TIMEOUT'));
  });

  it.each(Object.values(API_ERROR_CODES))('defines a user-facing message for %s', (code) => {
    expect(getApiErrorMessage(code).trim().length).toBeGreaterThan(0);
  });
});
