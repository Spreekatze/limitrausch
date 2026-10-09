import {
  EVENT_TYPE,
  EventType,
  Event,
  EventSignUpUser,
  StatusType,
  statusTypeSchema,
} from "../types/eventSchema.js";
import {
  RaidHelperEvent,
  RaidHelperSignUp,
  RaidHelperWebHookEvent,
} from "../types/raidhelperSchema.js";
import { jobsByRaidHelperName } from "../data/jobs.js";
import { Job } from "../types/jobSchema.js";

// const aetherisServerId = "1408172814879559721";
// const aetherisCasualChannelId = "1408186147896819822";
// const aetherisRaidChannelId = "1408186073208852700";
// const aetherisUltimateChannelId = "1408186117039067227";
// const aetherisArchivChannelId = "1410015029415251978";
// const aetherisTestingAreal = "1412345023256727603";

// const eventTypeByServerAndChannelId: Record<
//   string,
//   Record<string, EventType>
// > = {
//   [aetherisServerId]: {
//     [aetherisCasualChannelId]: EVENT_TYPE.CASUAL,
//     [aetherisRaidChannelId]: EVENT_TYPE.RAID,
//     [aetherisUltimateChannelId]: EVENT_TYPE.ULTIMATE,
//     [aetherisArchivChannelId]: EVENT_TYPE.ARCHIV,
//     [aetherisTestingAreal]: EVENT_TYPE.TEST,
//   },
// };

// function getEventType(
//   serverId: string,
//   channelId: string,
// ): EventType | undefined {
//   return eventTypeByServerAndChannelId[serverId]?.[channelId];
// }

export function mapRaidHelperGeneralEventDataToEvent(
  raidhelperEvent: RaidHelperEvent,
  serverId: string,
): Event {
  // const eventType = getEventType(serverId, raidhelperEvent.channelId);

  // if (eventType === undefined) {
  //   throw new Error(
  //     `No event type mapping found for server ${serverId} and channel ${raidhelperEvent.channelId}`,
  //   );
  // }

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
    eventType: EVENT_TYPE.UNDEFINED,
    discordServer: {
      discordServerId: serverId,
      discordTextChannelId: raidhelperEvent.channelId,
    },
    signUpCount: parseInt(raidhelperEvent.signUpCount),
    raidHelperId: raidhelperEvent.id,
    isPublic: false,
  };

  return event;
}

function getJobFromRaidHelperName(name: string): Job {
  const job = jobsByRaidHelperName.get(name);
  if (!job) {
    throw new Error(`Unknown Raidhelper job: ${name}`);
  }
  return job;
}

function mapRaidHelperClassToEventStatus(
  className: string,
): StatusType | undefined {
  const result = statusTypeSchema.safeParse(className);
  return result.success ? result.data : undefined;
}

function mapRaidHelperSignUpsToEventSignUps(
  raidHelperSignUps: RaidHelperSignUp[],
): EventSignUpUser[] {
  const signUps = raidHelperSignUps.map((signUp) => {
    const flexJobs = [signUp.spec2Name, signUp.spec3Name]
      .filter((name): name is string => name !== undefined)
      .map(getJobFromRaidHelperName);

    return {
      name: signUp.name,
      userId: signUp.userId,
      status: mapRaidHelperClassToEventStatus(signUp.className),
      entryTime: signUp.entryTime,
      position: signUp.position,
      jobFirstPrio: signUp.specName
        ? getJobFromRaidHelperName(signUp.specName)
        : undefined,
      jobFlexSecondPrio: flexJobs.length > 0 ? flexJobs : undefined,
    };
  });

  return signUps;
}

export function mapRaidHelperWebhookEventToEvent(
  raidhelperEvent: RaidHelperWebHookEvent,
  serverId: string,
): Event {
  // const eventType = getEventType(serverId, raidhelperEvent.channelId ?? "");

  // if (eventType === undefined) {
  //   throw new Error(
  //     `No event type mapping found for server ${serverId} and channel ${raidhelperEvent.channelId}`,
  //   );
  // }

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
    eventType: EVENT_TYPE.UNDEFINED,
    discordServer: {
      discordServerId: serverId,
      discordTextChannelId: raidhelperEvent.channelId,
    },
    signUpCount: raidhelperEvent.signUps.length,
    raidHelperId: raidhelperEvent.id,
    signUps: mapRaidHelperSignUpsToEventSignUps(raidhelperEvent.signUps),
    isPublic: false,
  };

  return event;
}
