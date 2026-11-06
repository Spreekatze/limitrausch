import type { NextFunction, Request, Response } from "express";
import { EVENT_TYPE } from "@limitrausch/contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getValidDiscordAccessToken } from "../../services/discordService.js";
import { isEventManager } from "../../services/managerService.js";
import { getEventById } from "../../store/eventStore.js";
import requireAuth from "../requireAuth.js";
import requireEventManager from "../requireEventManager.js";
import requireGuildManager from "../requireGuildManager.js";
import requireWebsiteAdmin from "../requireWebsiteAdmin.js";
import validateRaidHelperWebhook from "../validateRaidHelperWebhook.js";

vi.mock("../../services/discordService.js", () => ({
  getValidDiscordAccessToken: vi.fn(),
}));

vi.mock("../../services/managerService.js", () => ({
  isEventManager: vi.fn(),
}));

vi.mock("../../store/eventStore.js", () => ({
  getEventById: vi.fn(),
}));

const isEventManagerMock = vi.mocked(isEventManager);
const getEventByIdMock = vi.mocked(getEventById);
const getValidDiscordAccessTokenMock = vi.mocked(getValidDiscordAccessToken);

function request(
  options: {
    authUser?: { id: string };
    params?: Record<string, string>;
    headers?: Record<string, string>;
    body?: unknown;
  } = {},
): Request {
  return {
    params: options.params ?? {},
    body: options.body,
    header: (name: string) =>
      Object.entries(options.headers ?? {}).find(
        ([headerName]) => headerName.toLowerCase() === name.toLowerCase(),
      )?.[1],
    session: { authUser: options.authUser },
  } as unknown as Request;
}

function response(): Response {
  return {} as Response;
}

describe("authorization middleware", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("requires a logged-in user", () => {
    const next = vi.fn();

    requireAuth(request(), response(), next as NextFunction);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it("continues when a user is logged in", () => {
    const next = vi.fn();

    requireAuth(request({ authUser: { id: "user-1" } }), response(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it("requires login before granting website-admin privileges", () => {
    const next = vi.fn();

    requireWebsiteAdmin(request(), response(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it("grants website-admin access only to configured user IDs", () => {
    vi.stubEnv("DISCORD_USER_ID_WHITELIST", "other-user, user-1 ");
    const next = vi.fn();

    requireWebsiteAdmin(
      request({ authUser: { id: "user-1" } }),
      response(),
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });

  it("denies logged-in users who are absent from the website-admin whitelist", () => {
    vi.stubEnv("DISCORD_USER_ID_WHITELIST", "other-user");
    const next = vi.fn();

    requireWebsiteAdmin(
      request({ authUser: { id: "user-1" } }),
      response(),
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
  });

  it("denies website-admin access when the whitelist is not configured", () => {
    vi.stubEnv("DISCORD_USER_ID_WHITELIST", undefined);
    const next = vi.fn();

    requireWebsiteAdmin(
      request({ authUser: { id: "user-1" } }),
      response(),
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
  });

  it.each(["", " , , "])(
    "denies website-admin access when the whitelist has no IDs (%j)",
    (whitelist) => {
      vi.stubEnv("DISCORD_USER_ID_WHITELIST", whitelist);
      const next = vi.fn();

      requireWebsiteAdmin(
        request({ authUser: { id: "user-1" } }),
        response(),
        next,
      );

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ status: 403 }),
      );
    },
  );

  it("denies event management when the user has no guild rights", async () => {
    isEventManagerMock.mockResolvedValue(false);
    const next = vi.fn();

    await requireEventManager(
      request({
        authUser: { id: "user-1" },
        params: { guildId: "12345678901234567" },
      }),
      response(),
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
  });

  it("authorizes event managers for their guild", async () => {
    isEventManagerMock.mockResolvedValue(true);
    const next = vi.fn();

    await requireEventManager(
      request({
        authUser: { id: "user-1" },
        params: { guildId: "12345678901234567" },
      }),
      response(),
      next,
    );

    expect(isEventManagerMock).toHaveBeenCalledWith(
      "user-1",
      "12345678901234567",
    );
    expect(next).toHaveBeenCalledWith();
  });

  it.each(["not-an-id", "0", "1.5", "9007199254740992"])(
    "rejects invalid event IDs before loading an event (%s)",
    async (eventId) => {
      const next = vi.fn();

      await requireEventManager(
        request({
          authUser: { id: "user-1" },
          params: { eventId },
        }),
        response(),
        next,
      );

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ status: 400 }),
      );
      expect(getEventByIdMock).not.toHaveBeenCalled();
      expect(isEventManagerMock).not.toHaveBeenCalled();
    },
  );

  it("returns not found when an event ID does not exist", async () => {
    getEventByIdMock.mockResolvedValue(undefined);
    const next = vi.fn();

    await requireEventManager(
      request({
        authUser: { id: "user-1" },
        params: { eventId: "4" },
      }),
      response(),
      next,
    );

    expect(getEventByIdMock).toHaveBeenCalledWith(4);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 404 }));
    expect(isEventManagerMock).not.toHaveBeenCalled();
  });

  it("forwards errors thrown while loading an event", async () => {
    const error = new Error("Database unavailable");
    getEventByIdMock.mockRejectedValue(error);
    const next = vi.fn();

    await requireEventManager(
      request({
        authUser: { id: "user-1" },
        params: { eventId: "4" },
      }),
      response(),
      next,
    );

    expect(next).toHaveBeenCalledWith(error);
    expect(isEventManagerMock).not.toHaveBeenCalled();
  });

  it("resolves the guild from an event ID and denies unassociated events", async () => {
    getEventByIdMock.mockResolvedValue({
      id: 4,
      lastUpdated: 0,
      eventType: EVENT_TYPE.UNDEFINED,
      startTime: 0,
      endTime: 0,
      isPublic: false,
      discordGuild: undefined,
    });
    const next = vi.fn();

    await requireEventManager(
      request({
        authUser: { id: "user-1" },
        params: { eventId: "4" },
      }),
      response(),
      next,
    );

    expect(getEventByIdMock).toHaveBeenCalledWith(4);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
  });

  it("validates guild IDs before calling Discord for guild-manager checks", async () => {
    getValidDiscordAccessTokenMock.mockResolvedValue("access-token");
    const next = vi.fn();

    await requireGuildManager(
      request({
        authUser: { id: "user-1" },
        params: { guildId: "invalid" },
      }),
      response(),
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });

  it("requires login before checking guild ownership or administrator permissions", async () => {
    const next = vi.fn();

    await requireGuildManager(request(), response(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
    expect(getValidDiscordAccessTokenMock).not.toHaveBeenCalled();
  });

  it.each([
    ["the guild owner", true, 0],
    ["a guild administrator", false, 8],
  ])("authorizes %s", async (_label, owner, permissions) => {
    getValidDiscordAccessTokenMock.mockResolvedValue("access-token");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: "12345678901234567",
            name: "Guild",
            icon: null,
            owner,
            permissions,
          },
        ],
      }),
    );
    const next = vi.fn();

    await requireGuildManager(
      request({
        authUser: { id: "user-1" },
        params: { guildId: "12345678901234567" },
      }),
      response(),
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });

  it("denies a guild manager check when the user does not own the guild", async () => {
    getValidDiscordAccessTokenMock.mockResolvedValue("access-token");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: "12345678901234567",
            name: "Guild",
            icon: null,
            owner: false,
            permissions: 0,
          },
        ],
      }),
    );
    const next = vi.fn();

    await requireGuildManager(
      request({
        authUser: { id: "user-1" },
        params: { guildId: "12345678901234567" },
      }),
      response(),
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
  });

  it("rejects webhook requests with an incorrect authorization key", () => {
    vi.stubEnv("RAIDHELPER_WEBHOOK_KEY", "expected-key");
    const next = vi.fn();

    validateRaidHelperWebhook(
      request({ headers: { Authorization: "wrong-key" } }),
      response(),
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it("continues when a webhook key and payload are valid", () => {
    vi.stubEnv("RAIDHELPER_WEBHOOK_KEY", "expected-key");
    const body = {
      id: "event-1",
      date: "2026-11-06",
      time: "20:00",
      color: "ffffff",
      title: "RaidHelper event",
      creator: { id: "creator-1", name: "Creator" },
      endTime: 1_793_995_200,
      signUps: [],
      leaderId: "leader-1",
      serverId: "12345678901234567",
      channelId: "channel-1",
      coLeaders: [],
      startTime: 1_793_991_600,
      leaderName: "Lead",
      templateId: "template-1",
      channelName: "events",
      channelType: "text",
      closingTime: 1_793_995_200,
      description: "Event description",
      lastUpdated: 1_793_990_600,
      advancedSettings: { image: "", limit: 8, duration: 60 },
    };
    const webhookRequest = request({
      headers: { Authorization: "expected-key" },
      body,
    });
    const next = vi.fn();

    validateRaidHelperWebhook(webhookRequest, response(), next);

    expect(next).toHaveBeenCalledWith();
    expect(webhookRequest.body).toEqual(body);
  });

  it("rejects webhook requests when the shared secret is not configured", () => {
    vi.stubEnv("RAIDHELPER_WEBHOOK_KEY", "");
    const next = vi.fn();

    validateRaidHelperWebhook(
      request({ body: {}, headers: {} }),
      response(),
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it("rejects malformed webhook payloads", () => {
    vi.stubEnv("RAIDHELPER_WEBHOOK_KEY", "expected-key");
    const next = vi.fn();

    validateRaidHelperWebhook(
      request({
        headers: { Authorization: "expected-key" },
        body: { id: "not-a-complete-event" },
      }),
      response(),
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });
});
