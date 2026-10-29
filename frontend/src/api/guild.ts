import { type GuildConfigResponse, guildConfigResponseSchema } from '@limitrausch/contracts';

export async function getGuildConfigById(guildId: string): Promise<GuildConfigResponse> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const response = await fetch(`${apiBaseUrl}/guild/${guildId}`);

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
