import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getEventFromRaidHelperById,
  getEventsFromRaidHelperByUser,
  getEventsFromRaidHelperByServer,
} from "../raidHelperAPI.js";
import { validServer } from "./raidHelperTestUtils.js";

const responseBody = { pages: 1, postedEvents: [] };

describe("RaidHelper API request variants", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses a trimmed server whitelist and sends the expected request options", async () => {
    vi.stubEnv(
      "RAIDHELPER_DISCORDSERVER_ID_WHITELIST",
      "other-server,  " + validServer.id + " ",
    );
    vi.stubEnv("RAIDHELPER_API_KEY", "test-api-key");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({
        "content-type": "application/json; charset=utf-8",
      }),
      json: async () => responseBody,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getEventsFromRaidHelperByServer(validServer.id),
    ).resolves.toEqual(responseBody);

    expect(fetchMock).toHaveBeenCalledWith(
      `https://raid-helper.xyz/api/v4/servers/${validServer.id}/events`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "test-api-key",
          IncludeSignUps: "true",
        }),
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it.each([
    {
      label: "a RaidHelper event ID",
      request: () => getEventFromRaidHelperById("event-123"),
      url: "https://raid-helper.xyz/api/v4/events/event-123",
    },
    {
      label: "a RaidHelper user key",
      request: () => getEventsFromRaidHelperByUser({ apiKey: "user-key" }),
      url: "https://raid-helper.xyz/api/v4/users/user-key/events",
    },
  ])("fetches events for $label", async ({ request, url }) => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => responseBody,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(request()).resolves.toEqual(responseBody);

    expect(fetchMock).toHaveBeenCalledWith(
      url,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it.each([
    {
      label: "event ID",
      request: () => getEventFromRaidHelperById("event-123"),
    },
    {
      label: "user key",
      request: () => getEventsFromRaidHelperByUser({ apiKey: "user-key" }),
    },
  ])(
    "preserves upstream HTTP errors for the $label API",
    async ({ request }) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 429,
        }),
      );

      await expect(request()).rejects.toMatchObject({
        status: 429,
        message: "Raid Helper API request failed with status 429",
      });
    },
  );
});
