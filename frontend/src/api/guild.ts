import {
  type GuildConfig,
  type GuildConfigResponse,
  guildConfigResponseSchema,
} from '@limitrausch/contracts';

export async function getGuildConfigById(guildId: string): Promise<GuildConfigResponse> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const response = await fetch(`${apiBaseUrl}/guild/${encodeURIComponent(guildId)}`);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API failed: ${response.status} ${text}`);
  }

  const result = guildConfigResponseSchema.safeParse(await response.json());
  if (!result.success) {
    throw new Error('The guilds API returned an unexpected response format.');
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
    const text = await response.text();
    throw new Error(`Configuration couldnt be saved (${response.status}): ${text}`);
  }
}
