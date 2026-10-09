import { authStatusResponseSchema, type AuthStatusResponse } from '@limitrausch/contracts';

export function beginDiscordLogin(): void {
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
  window.location.assign(`${apiBaseUrl}/auth/discord`);
}

export async function getLoginStatus(): Promise<AuthStatusResponse> {
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
  const response = await fetch(`${apiBaseUrl}/auth/me`, {
    credentials: 'include', // TODO: take proper care of CORS later
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API failed: ${response.status} ${text}`);
  }

  const result = authStatusResponseSchema.safeParse(await response.json());
  if (!result.success) {
    throw new Error('The authentication API returned an unexpected response format.');
  }

  return result.data;
}

export async function logout(): Promise<void> {
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
  const response = await fetch(`${apiBaseUrl}/auth/logout`, {
    credentials: 'include', // TODO: take proper care of CORS later
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API failed: ${response.status} ${text}`);
  }

  const result = authStatusResponseSchema.safeParse(await response.json());
  if (!result.success) {
    throw new Error('The authentication API returned an unexpected response format.');
  }

  return;
}
