import { Client, Events, GatewayIntentBits } from "discord.js";

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  throw new Error("DISCORD_BOT_TOKEN is not configured.");
}

export const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

export async function connectDiscord(): Promise<void> {
  if (client.isReady()) {
    return;
  }

  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Discord bot connected as ${readyClient.user.tag}`);
  });

  await client.login(token);
}
