import { EVENT_TYPE, EventType, Event } from "../types/eventSchema.js";
import {
  RaidHelperEvent,
  RaidHelperWebHookEvent,
} from "../types/raidhelperSchema.js";

const aetherisServerId = "1408172814879559721";
const aetherisCasualChannelId = "1408186147896819822";
const aetherisRaidChannelId = "1408186073208852700";
const aetherisUltimateChannelId = "1408186117039067227";
const aetherisArchivChannelId = "1410015029415251978";
const aetherisTestingAreal = "1412345023256727603";

const eventTypeByServerAndChannelId: Record<
  string,
  Record<string, EventType>
> = {
  [aetherisServerId]: {
    [aetherisCasualChannelId]: EVENT_TYPE.CASUAL,
    [aetherisRaidChannelId]: EVENT_TYPE.RAID,
    [aetherisUltimateChannelId]: EVENT_TYPE.ULTIMATE,
    [aetherisArchivChannelId]: EVENT_TYPE.ARCHIV,
    [aetherisTestingAreal]: EVENT_TYPE.TEST,
  },
};

function getEventType(
  serverId: string,
  channelId: string,
): EventType | undefined {
  return eventTypeByServerAndChannelId[serverId]?.[channelId];
}

export function mapRaidHelperEventToEvent(
  raidhelperEvent: RaidHelperEvent,
  serverId: string,
): Event {
  const eventType = getEventType(serverId, raidhelperEvent.channelId);

  if (eventType === undefined) {
    throw new Error(
      `No event type mapping found for server ${serverId} and channel ${raidhelperEvent.channelId}`,
    );
  }

  const event: Event = {
    id: raidhelperEvent.id,
    lastUpdated: raidhelperEvent.lastUpdated,
    creator: raidhelperEvent.creator,
    leader: { id: raidhelperEvent.leaderId, name: raidhelperEvent.leaderName },
    coLeaders: raidhelperEvent.coLeaders,
    title: raidhelperEvent.title,
    description: raidhelperEvent.description,
    imageUrl: raidhelperEvent.imageUrl,
    startTime: raidhelperEvent.startTime,
    endTime: raidhelperEvent.endTime,
    eventType: eventType,
    discordServerId: serverId,
    discordTextChannelId: raidhelperEvent.channelId,
    signUpCount: parseInt(raidhelperEvent.signUpCount),
    raidHelperId: raidhelperEvent.id,
  };

  return event;
}

export function mapRaidHelperWebhookEventToEvent(
  raidhelperEvent: RaidHelperWebHookEvent,
  serverId: string,
): Event {
  const eventType = getEventType(serverId, raidhelperEvent.channelId ?? "");

  if (eventType === undefined) {
    throw new Error(
      `No event type mapping found for server ${serverId} and channel ${raidhelperEvent.channelId}`,
    );
  }

  const event: Event = {
    id: raidhelperEvent.id,
    lastUpdated: raidhelperEvent.lastUpdated,
    creator: raidhelperEvent.creator,
    leader:
      raidhelperEvent.leaderId && raidhelperEvent.leaderName
        ? {
            id: raidhelperEvent.leaderId,
            name: raidhelperEvent.leaderName,
          }
        : undefined,
    coLeaders: raidhelperEvent.coLeaders,
    title: raidhelperEvent.title,
    description: raidhelperEvent.description,
    imageUrl: raidhelperEvent.advancedSettings.image,
    startTime: raidhelperEvent.startTime,
    endTime: raidhelperEvent.endTime,
    eventType: eventType,
    discordServerId: serverId,
    discordTextChannelId: raidhelperEvent.channelId,
    signUpCount: 0,
    raidHelperId: raidhelperEvent.id,
  };

  return event;
}
