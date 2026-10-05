import type { RaidHelperEvent } from "../../types/raidhelperSchema.js";

export const validServerId = "1408172814879559721";

export const validChannelIds = {
  casual: "1408186147896819822",
  raid: "1408186073208852700",
} as const;

export const createRaidHelperEvents = (): RaidHelperEvent[] => [
  {
    channelId: validChannelIds.casual,
    closeTime: 2000,
    coLeaders: [],
    color: "ffffff",
    creator: { id: "creator-1", name: "Creator 1" },
    description: "Event 1",
    endTime: 2000,
    id: "event-1",
    lastUpdated: 1000,
    leaderId: "leader-1",
    leaderName: "Leader 1",
    signUpCount: "0",
    startTime: 1000,
    templateId: "template-1",
    title: "Event 1",
  },
  {
    channelId: "unknown-channel",
    closeTime: 3000,
    coLeaders: [],
    color: "ffffff",
    creator: { id: "creator-2", name: "Creator 2" },
    description: "Event 2",
    endTime: 3000,
    id: "event-2",
    lastUpdated: 2000,
    leaderId: "leader-2",
    leaderName: "Leader 2",
    signUpCount: "0",
    startTime: 2000,
    templateId: "template-2",
    title: "Event 2",
  },
  {
    channelId: validChannelIds.raid,
    closeTime: 4000,
    coLeaders: [],
    color: "ffffff",
    creator: { id: "creator-3", name: "Creator 3" },
    description: "Event 3",
    endTime: 4000,
    id: "event-3",
    lastUpdated: 3000,
    leaderId: "leader-3",
    leaderName: "Leader 3",
    signUpCount: "0",
    startTime: 3000,
    templateId: "template-3",
    title: "Event 3",
  },
];

export const createSuccessfulFetchResponse = () => ({
  ok: true,
  headers: new Headers({ "content-type": "application/json" }),
  json: async () => ({
    pages: 1,
    eventsOverall: 0,
    eventsTransmitted: 0,
    currentPage: 1,
    postedEvents: [],
  }),
});
