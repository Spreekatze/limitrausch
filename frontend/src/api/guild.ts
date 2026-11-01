import {
  type GuildConfig,
  type GuildConfigResponse,
  guildConfigResponseSchema,
} from '@limitrausch/contracts';
import { ApiError, handleApiError } from './apiError';

export async function getGuildConfigById(guildId: string): Promise<GuildConfigResponse> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const response = await fetch(`${apiBaseUrl}/guild/${encodeURIComponent(guildId)}`);

  if (!response.ok) {
    await handleApiError(response);
  }

  const result = guildConfigResponseSchema.safeParse(await response.json());
  if (!result.success) {
    throw new ApiError('INVALID_API_RESPONSE', 502);
  }

  return result.data;
}

export async function saveGuildConfig(guildId: string, guildConfig: GuildConfig): Promise<void> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const response = await fetch(`${apiBaseUrl}/guild/${encodeURIComponent(guildId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(guildConfig),
  });
  if (!response.ok) {
    await handleApiError(response);
  }
}
