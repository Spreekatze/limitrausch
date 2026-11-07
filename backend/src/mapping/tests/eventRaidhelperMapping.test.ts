import { EVENT_TYPE, JOBS, STATUS_TYPE } from "@limitrausch/contracts";
import { describe, expect, it } from "vitest";
import {
  mapRaidHelperDetailledEventDataToEvent,
  mapRaidHelperGeneralEventDataToEvent,
} from "../eventRaidhelperMapping.js";
import {
  createRaidHelperEvents,
  validServer,
} from "../../services/tests/raidHelperTestUtils.js";
import type {
  RaidHelperDetailedEvent,
  RaidHelperEvent,
  RaidHelperSignUp,
} from "../../types/raidhelperSchema.js";

function createGeneralEvent(
  overrides: Partial<RaidHelperEvent> = {},
): RaidHelperEvent {
  const [event] = createRaidHelperEvents();
  if (!event) {
    throw new Error("Expected a RaidHelper event fixture");
  }
  return { ...event, ...overrides };
}

function createDetailedEvent(
  overrides: Partial<RaidHelperDetailedEvent> = {},
): RaidHelperDetailedEvent {
  return {
    id: "detail-1",
    date: "2025-01-01",
    time: "12:00",
    color: "ffffff",
    title: "Detailed event",
    creator: { id: "creator-1", name: "Creator" },
    endTime: 200,
    signUps: [],
    leaderId: "leader-1",
    serverId: validServer.id,
    channelId: "channel-1",
    coLeaders: [{ id: "coleader-1", name: "Co-leader" }],
    startTime: 100,
    leaderName: "Leader",
    templateId: "template-1",
    channelName: "events",
    channelType: "text",
    closingTime: 50,
    description: "Description",
    lastUpdated: 75,
    advancedSettings: { image: "image.png", limit: 8, duration: 60 },
    ...overrides,
  };
}

function getJob(raidHelperName: string) {
  const job = JOBS.find((item) => item.raidHelperName === raidHelperName);
  if (!job) {
    throw new Error(`Missing test job fixture: ${raidHelperName}`);
  }
  return job;
}

describe("mapRaidHelperGeneralEventDataToEvent", () => {
  it("maps event metadata and guild data while applying application defaults", () => {
    const raidHelperEvent = createGeneralEvent({
      imageUrl: "https://example.com/event.png",
      coLeaders: [{ id: "coleader-1", name: "Co-leader" }],
      signUps: [],
    });

    expect(
      mapRaidHelperGeneralEventDataToEvent(raidHelperEvent, validServer),
    ).toEqual({
      creator: raidHelperEvent.creator,
      leader: {
        id: raidHelperEvent.leaderId,
        name: raidHelperEvent.leaderName,
      },
      coLeaders: raidHelperEvent.coLeaders,
      title: raidHelperEvent.title,
      description: raidHelperEvent.description,
      imageUrl: raidHelperEvent.imageUrl,
      startTime: raidHelperEvent.startTime,
      endTime: raidHelperEvent.endTime,
      eventType: EVENT_TYPE.UNDEFINED,
      discordGuild: {
        id: validServer.id,
        name: validServer.name,
        icon: undefined,
        textChannelId: raidHelperEvent.channelId,
      },
      raidHelperId: raidHelperEvent.id,
      isPublic: false,
      signUps: [],
    });
  });

  it("maps primary and flex job priorities, signup identity, and status", () => {
    const signUps: RaidHelperSignUp[] = [
      {
        id: 17,
        name: "Player One",
        userId: "discord-user-1",
        position: 2,
        className: "Tank",
        entryTime: 123,
        specName: "WarriorFF",
        spec2Name: "PaladinFF",
        spec3Name: "Darkknight",
      },
      {
        id: 18,
        name: "Player Two",
        userId: "discord-user-2",
        className: "Scholar",
        entryTime: 456,
      },
      {
        id: 19,
        name: "Player Three",
        userId: "discord-user-3",
        className: STATUS_TYPE.LATE,
        entryTime: 789,
        specName: STATUS_TYPE.BENCH,
        spec2Name: STATUS_TYPE.TENTATIVE,
        spec3Name: STATUS_TYPE.ABSENCE,
      },
    ];

    const event = mapRaidHelperGeneralEventDataToEvent(
      createGeneralEvent({ signUps }),
      validServer,
    );

    expect(event.signUps).toEqual([
      {
        raidHelperId: "17",
        name: "Player One",
        userId: "discord-user-1",
        status: undefined,
        jobFirstPrio: getJob("WarriorFF"),
        jobFlexSecondPrio: [getJob("PaladinFF"), getJob("Darkknight")],
      },
      {
        raidHelperId: "18",
        name: "Player Two",
        userId: "discord-user-2",
        status: undefined,
        jobFirstPrio: getJob("Scholar"),
        jobFlexSecondPrio: undefined,
      },
      {
        raidHelperId: "19",
        name: "Player Three",
        userId: "discord-user-3",
        status: STATUS_TYPE.LATE,
        jobFirstPrio: undefined,
        jobFlexSecondPrio: undefined,
      },
    ]);
  });

  it("uses a supplied spec name instead of the class name as primary job", () => {
    const signUp: RaidHelperSignUp = {
      id: 20,
      name: "Player",
      userId: "discord-user",
      className: "Scholar",
      entryTime: 1,
      specName: "WarriorFF",
    };

    const event = mapRaidHelperGeneralEventDataToEvent(
      createGeneralEvent({ signUps: [signUp] }),
      validServer,
    );

    expect(event.signUps?.[0].jobFirstPrio).toEqual(getJob("WarriorFF"));
  });

  it.each([
    ["primary", { specName: "UnknownJob" }],
    ["first flex", { spec2Name: "UnknownJob" }],
    ["second flex", { spec3Name: "UnknownJob" }],
  ] as const)("rejects an unknown %s job name", (_priority, jobFields) => {
    const [existingSignUp] = createGeneralEvent().signUps;
    if (!existingSignUp) {
      throw new Error("Expected a signup fixture");
    }

    const signUp = {
      ...existingSignUp,
      ...jobFields,
    };

    expect(() =>
      mapRaidHelperGeneralEventDataToEvent(
        createGeneralEvent({ signUps: [signUp] }),
        validServer,
      ),
    ).toThrow("Unknown Raidhelper job: UnknownJob");
  });

  it("preserves the error for an unknown primary job when no spec is provided", () => {
    const signUp: RaidHelperSignUp = {
      id: 21,
      name: "Player",
      userId: "discord-user",
      className: "UnknownJob",
      entryTime: 1,
    };

    expect(() =>
      mapRaidHelperGeneralEventDataToEvent(
        createGeneralEvent({ signUps: [signUp] }),
        validServer,
      ),
    ).toThrow("Unknown Raidhelper job: UnknownJob");
  });
});

describe("mapRaidHelperDetailledEventDataToEvent", () => {
  it("maps detailed event fields, image, leaders, and Discord channel metadata", () => {
    const raidHelperEvent = createDetailedEvent();

    expect(mapRaidHelperDetailledEventDataToEvent(raidHelperEvent)).toEqual({
      creator: raidHelperEvent.creator,
      leader: {
        id: raidHelperEvent.leaderId,
        name: raidHelperEvent.leaderName,
      },
      coLeaders: raidHelperEvent.coLeaders,
      title: raidHelperEvent.title,
      description: raidHelperEvent.description,
      imageUrl: raidHelperEvent.advancedSettings.image,
      startTime: raidHelperEvent.startTime,
      endTime: raidHelperEvent.endTime,
      eventType: EVENT_TYPE.UNDEFINED,
      discordGuild: {
        id: raidHelperEvent.serverId,
        textChannelId: raidHelperEvent.channelId,
        textChannelName: raidHelperEvent.channelName,
      },
      raidHelperId: raidHelperEvent.id,
      signUps: [],
      isPublic: false,
    });
  });

  it.each([
    ["missing leader ID", { leaderId: "" }],
    ["missing leader name", { leaderName: "" }],
    ["both leader fields missing", { leaderId: "", leaderName: "" }],
  ] as const)("omits leader data when there is %s", (_condition, fields) => {
    const event = mapRaidHelperDetailledEventDataToEvent(
      createDetailedEvent(fields),
    );

    expect(event.leader).toBeUndefined();
  });

  it("maps detailed-event signups with the same priority and status rules", () => {
    const detailedEvent = createDetailedEvent({
      signUps: [
        {
          id: 22,
          name: "Player",
          userId: "discord-user",
          className: STATUS_TYPE.BENCH,
          entryTime: 1,
          specName: "Whitemage",
          spec2Name: "Scholar",
        },
      ],
    });

    const event = mapRaidHelperDetailledEventDataToEvent(detailedEvent);

    expect(event.signUps).toEqual([
      {
        raidHelperId: "22",
        name: "Player",
        userId: "discord-user",
        status: STATUS_TYPE.BENCH,
        jobFirstPrio: getJob("Whitemage"),
        jobFlexSecondPrio: [getJob("Scholar")],
      },
    ]);
  });
});
