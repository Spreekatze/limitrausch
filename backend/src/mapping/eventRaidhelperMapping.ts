import {
  RaidHelperEvent,
  RaidHelperSignUp,
  RaidHelperWebHookEvent,
} from "../src/types/raidhelperSchema.js";
import { jobsByRaidHelperName } from "../data/jobs.js";
import { Job } from "../src/types/jobSchema.js";
import {
  DiscordGuild,
  EVENT_TYPE,
  STATUS_TYPE,
  StatusType,
  statusTypeSchema,
  CreateEvent,
  CreateSignUp,
} from "@limitrausch/contracts";

export function mapRaidHelperGeneralEventDataToEvent(
  raidhelperEvent: RaidHelperEvent,
  server: DiscordGuild,
): CreateEvent {
  const event: CreateEvent = {
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
      id: server.id,
      name: server.name,
      icon: server.icon ?? undefined,
      textChannelId: raidhelperEvent.channelId,
    },
    raidHelperId: raidhelperEvent.id,
    isPublic: false,
    signUps: mapRaidHelperSignUpsToEventSignUps(raidhelperEvent.signUps),
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

function getJobName(name: string | undefined): string | undefined {
  if (Object.values(STATUS_TYPE).some((status) => status === name)) {
    return;
  }
  return name;
}

function mapRaidHelperClassToEventStatus(
  className: string,
): StatusType | undefined {
  const result = statusTypeSchema.safeParse(className);
  return result.success ? result.data : undefined;
}

function mapRaidHelperSignUpsToEventSignUps(
  raidHelperSignUps: RaidHelperSignUp[],
): CreateSignUp[] {
  const signUps = raidHelperSignUps.map((signUp) => {
    const flexJobs = [signUp.spec2Name, signUp.spec3Name]
      .filter((name): name is string => getJobName(name) !== undefined)
      .map(getJobFromRaidHelperName);
    const firstPrioJob = getJobName(signUp.specName);

    return {
      raidHelperId: String(signUp.id),
      name: signUp.name,
      userId: signUp.userId,
      status: mapRaidHelperClassToEventStatus(signUp.className),
      jobFirstPrio: firstPrioJob
        ? getJobFromRaidHelperName(firstPrioJob)
        : undefined,
      jobFlexSecondPrio: flexJobs.length > 0 ? flexJobs : undefined,
    };
  });

  return signUps;
}

export function mapRaidHelperWebhookEventToEvent(
  raidhelperEvent: RaidHelperWebHookEvent,
  serverId: string,
): CreateEvent {
  const event: CreateEvent = {
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
      id: serverId,
      textChannelId: raidhelperEvent.channelId,
    },
    raidHelperId: raidhelperEvent.id,
    signUps: mapRaidHelperSignUpsToEventSignUps(raidhelperEvent.signUps),
    isPublic: false,
  };

  return event;
}
