import { describe, expect, it } from "vitest";
import { discordTokenResponseSchema } from "../discordSchema.js";
import {
  databaseEventCoLeaderRowSchema,
  databaseEventRowSchema,
  databaseEventSignUpRowSchema,
  databaseGuildRowSchema,
} from "../databaseRowSchema.js";
import { guildIdSchema, authGuildSchema } from "../guildSchema.js";
import { guildMemberSearchQuerySchema } from "../eventSchema.js";
import {
  apiKeySchema,
  raidHelperDetailedEventSchema,
  raidHelperEventSchema,
  raidHelperEventsResponseSchema,
  raidHelperSignUpSchema,
} from "../raidhelperSchema.js";

describe("backend boundary schemas", () => {
  it("validates Discord token responses", () => {
    const token = {
      access_token: "access",
      refresh_token: "refresh",
      expires_in: 3600,
      token_type: "Bearer",
      scope: "identify",
    };

    expect(discordTokenResponseSchema.parse(token)).toEqual(token);
    expect(
      discordTokenResponseSchema.safeParse({ ...token, expires_in: "3600" })
        .success,
    ).toBe(false);
    for (const field of Object.keys(token) as (keyof typeof token)[]) {
      const tokenWithoutField = { ...token };
      delete tokenWithoutField[field];

      expect(
        discordTokenResponseSchema.safeParse(tokenWithoutField).success,
      ).toBe(false);
    }
  });

  it("validates database event rows", () => {
    const row = {
      id: 1,
      lastUpdated: "123",
      creatorId: null,
      creatorName: null,
      leaderId: null,
      leaderName: null,
      title: "Test event",
      description: null,
      imageUrl: null,
      startTime: "100",
      endTime: "200",
      eventType: 1,
      eventDifficulty: null,
      eventContent: null,
      eventGoal: null,
      discordGuildId: null,
      discordGuildName: null,
      discordGuildIcon: null,
      discordTextChannelId: null,
      discordTextChannelName: null,
      discordMessageId: null,
      raidHelperId: null,
      isPublic: false,
    };
    expect(databaseEventRowSchema.parse(row)).toEqual(row);
    expect(databaseEventRowSchema.safeParse({ ...row, id: "1" }).success).toBe(
      false,
    );
    for (const field of Object.keys(row) as (keyof typeof row)[]) {
      const rowWithoutField = { ...row };
      delete rowWithoutField[field];

      expect(databaseEventRowSchema.safeParse(rowWithoutField).success).toBe(
        false,
      );
    }
    expect(
      databaseEventRowSchema.safeParse({ ...row, isPublic: "false" }).success,
    ).toBe(false);
    expect(
      databaseEventRowSchema.safeParse({ ...row, eventType: 100 }).success,
    ).toBe(false);
  });

  it("validates database guild rows", () => {
    const guildRow = {
      id: "guild-1",
      name: "Guild",
      icon: null,
      rolesAllowedToManageEvents: ["role-1"],
      rolesBannedFromParticipating: null,
    };
    expect(databaseGuildRowSchema.parse(guildRow)).toEqual(guildRow);
    expect(
      databaseGuildRowSchema.safeParse({
        ...guildRow,
        rolesAllowedToManageEvents: "role-1",
      }).success,
    ).toBe(false);
  });

  it("validates Discord guild IDs and transforms permissions into a bitfield", () => {
    expect(guildIdSchema.safeParse("12345678901234567").success).toBe(true);
    expect(guildIdSchema.safeParse("12345678901234567890").success).toBe(true);
    expect(guildIdSchema.safeParse("1234567890123456").success).toBe(false);
    expect(guildIdSchema.safeParse("123456789012345678901").success).toBe(
      false,
    );
    expect(guildIdSchema.safeParse("").success).toBe(false);
    expect(guildIdSchema.safeParse("12345678901234abc").success).toBe(false);

    const guild = authGuildSchema.parse({
      id: "12345678901234567",
      name: "Guild",
      icon: null,
      owner: false,
      permissions: 8,
    });

    expect(guild.permissions.has("Administrator")).toBe(true);
    expect(
      authGuildSchema.safeParse({
        id: "12345678901234567",
        name: "Guild",
        icon: null,
        owner: false,
        permissions: "8",
      }).success,
    ).toBe(false);
  });

  it("validates nullable database child-row fields and enum IDs", () => {
    expect(
      databaseEventCoLeaderRowSchema.parse({
        eventId: 7,
        id: "user-1",
        name: "Alice",
      }),
    ).toEqual({ eventId: 7, id: "user-1", name: "Alice" });
    expect(
      databaseEventCoLeaderRowSchema.safeParse({
        eventId: "7",
        id: "user-1",
        name: "Alice",
      }).success,
    ).toBe(false);

    const signUp = {
      id: 12,
      eventId: 7,
      discordUserId: null,
      raidHelperId: null,
      status: "Late",
      jobFirstPrio: 2,
      jobFlexSecondPrio: [2, 5],
      usernameOnGuild: "Alice",
    };
    expect(databaseEventSignUpRowSchema.parse(signUp)).toEqual(signUp);
    expect(
      databaseEventSignUpRowSchema.safeParse({ ...signUp, status: "Joined" })
        .success,
    ).toBe(false);
    expect(
      databaseEventSignUpRowSchema.safeParse({ ...signUp, jobFirstPrio: 1000 })
        .success,
    ).toBe(false);
    expect(
      databaseEventSignUpRowSchema.safeParse({
        ...signUp,
        jobFlexSecondPrio: [2, 1000],
      }).success,
    ).toBe(false);
  });

  it("trims and enforces the member-search query length", () => {
    expect(guildMemberSearchQuerySchema.parse("  Alice  ")).toBe("Alice");
    expect(guildMemberSearchQuerySchema.safeParse(" A ").success).toBe(false);
    expect(
      guildMemberSearchQuerySchema.safeParse("a".repeat(101)).success,
    ).toBe(false);
  });

  it("validates RaidHelper keys, event collections and detailed payloads", () => {
    expect(apiKeySchema.parse({ apiKey: "  user-key  " })).toEqual({
      apiKey: "user-key",
    });
    expect(apiKeySchema.safeParse({ apiKey: " " }).success).toBe(false);
    expect(
      raidHelperEventsResponseSchema.safeParse({
        pages: 1,
        eventsOverall: 0,
        eventsTransmitted: 0,
        currentPage: 1,
        postedEvents: [],
      }).success,
    ).toBe(true);
    expect(
      raidHelperEventsResponseSchema.safeParse({ postedEvents: [] }).success,
    ).toBe(false);
    expect(
      raidHelperDetailedEventSchema.safeParse({ id: "incomplete" }).success,
    ).toBe(false);
    expect(apiKeySchema.safeParse({ apiKey: "x".repeat(501) }).success).toBe(
      false,
    );
    expect(
      apiKeySchema.safeParse({ apiKey: "valid", unexpected: true }).success,
    ).toBe(false);
  });

  it("validates RaidHelper event and signup fields, including nested payloads", () => {
    const signUp = {
      id: 1,
      name: "Alice",
      userId: "user-1",
      position: 0,
      className: "Warrior",
      entryTime: 1_800_000_000,
      specName: "Warrior",
    };
    expect(raidHelperSignUpSchema.parse(signUp)).toEqual(signUp);
    expect(
      raidHelperSignUpSchema.safeParse({ ...signUp, entryTime: "later" })
        .success,
    ).toBe(false);

    const event = {
      id: "rh-event-1",
      channelId: "channel-1",
      leaderId: "user-1",
      leaderName: "Alice",
      coLeaders: [{ id: "user-2", name: "Bob" }],
      title: "Raid",
      description: "Weekly raid",
      startTime: 1_800_000_000,
      endTime: 1_800_003_600,
      closeTime: 1_799_999_000,
      templateId: "template-1",
      color: "ffffff",
      imageUrl: "https://example.test/raid.png",
      lastUpdated: 1_799_998_000,
      creator: { id: "user-1", name: "Alice" },
      signUpCount: "1/8",
      signUps: [signUp],
    };
    expect(raidHelperEventSchema.parse(event)).toEqual(event);
    const eventsResponse = {
      pages: 1,
      eventsOverall: 1,
      eventsTransmitted: 1,
      currentPage: 1,
      postedEvents: [event],
    };
    expect(raidHelperEventsResponseSchema.parse(eventsResponse)).toEqual(
      eventsResponse,
    );
    expect(
      raidHelperEventSchema.safeParse({
        ...event,
        signUps: [{ ...signUp, id: "1" }],
      }).success,
    ).toBe(false);

    const detailedEvent = {
      id: "rh-event-1",
      date: "2026-11-06",
      time: "20:00",
      color: "ffffff",
      title: "Raid",
      creator: { id: "user-1", name: "Alice" },
      endTime: 1_800_003_600,
      signUps: [signUp],
      leaderId: "user-1",
      serverId: "guild-1",
      channelId: "channel-1",
      coLeaders: [{ id: "user-2", name: "Bob" }],
      startTime: 1_800_000_000,
      leaderName: "Alice",
      templateId: "template-1",
      channelName: "events",
      channelType: "text",
      closingTime: 1_799_999_000,
      description: "Weekly raid",
      lastUpdated: 1_799_998_000,
      advancedSettings: { image: "", limit: 8, duration: 60 },
    };
    expect(raidHelperDetailedEventSchema.parse(detailedEvent)).toEqual(
      detailedEvent,
    );
    expect(
      raidHelperDetailedEventSchema.safeParse({
        ...detailedEvent,
        advancedSettings: { ...detailedEvent.advancedSettings, limit: "8" },
      }).success,
    ).toBe(false);
  });
});
