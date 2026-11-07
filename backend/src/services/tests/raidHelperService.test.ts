import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getEventsFromRaidHelperByServer } from "../raidHelperAPI.js";
import {
  createSuccessfulFetchResponse,
  validServer,
} from "./raidHelperTestUtils.js";

const mockSuccessfulFetch = () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(createSuccessfulFetchResponse()),
  );
};

describe("getRaidHelperEvents", () => {
  beforeEach(() => {
    vi.stubEnv("RAIDHELPER_DISCORDSERVER_ID_WHITELIST", validServer.id);
    vi.stubEnv("RAIDHELPER_API_KEY", "test-api-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("allows a whitelisted server id to fetch events", async () => {
    mockSuccessfulFetch();

    await expect(
      getEventsFromRaidHelperByServer(validServer.id),
    ).resolves.toMatchObject({
      pages: 1,
    });
  });

  it("allows multiple whitelisted server ids", async () => {
    vi.stubEnv(
      "RAIDHELPER_DISCORDSERVER_ID_WHITELIST",
      "12345678901234567,98765432109876543",
    );

    const fetchMock = vi
      .fn()
      .mockResolvedValue(createSuccessfulFetchResponse());

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getEventsFromRaidHelperByServer("98765432109876543"),
    ).resolves.toMatchObject({ pages: 1 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not call RaidHelper for server ids that are not on the whitelist", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(createSuccessfulFetchResponse());
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      getEventsFromRaidHelperByServer("not-whitelisted"),
    ).rejects.toMatchObject({
      name: "HttpError",
      status: 403,
      message:
        "Server not-whitelisted is not allowed to fetch Raid Helper events",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects all servers when no whitelist is configured", async () => {
    vi.stubEnv("RAIDHELPER_DISCORDSERVER_ID_WHITELIST", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getEventsFromRaidHelperByServer(validServer.id),
    ).rejects.toMatchObject({ status: 403 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preserves upstream HTTP status errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 429 }),
    );

    await expect(
      getEventsFromRaidHelperByServer(validServer.id),
    ).rejects.toMatchObject({
      status: 429,
      message: "Raid Helper API request failed with status 429",
    });
  });

  it("rejects non-JSON content types", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "text/plain" }),
        json: async () => ({ pages: 1 }),
      }),
    );

    await expect(
      getEventsFromRaidHelperByServer(validServer.id),
    ).rejects.toMatchObject({
      name: "HttpError",
      status: 502,
      message: "Raid Helper API response is not JSON",
    });
  });

  it("rejects invalid JSON bodies even when the content type is JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => {
          throw new Error("Unexpected token");
        },
      }),
    );

    await expect(
      getEventsFromRaidHelperByServer(validServer.id),
    ).rejects.toMatchObject({
      name: "HttpError",
      status: 502,
      message: "Raid Helper API returned invalid JSON",
    });
  });

  it("allows JSON-compatible content types", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/vnd.api+json" }),
        json: async () => ({
          pages: 1,
          eventsOverall: 0,
          eventsTransmitted: 0,
          currentPage: 1,
          postedEvents: [],
        }),
      }),
    );

    await expect(
      getEventsFromRaidHelperByServer(validServer.id),
    ).resolves.toMatchObject({
      pages: 1,
    });
  });

  it("rejects timeout/network errors with 504", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(
        Object.assign(new Error("The operation was aborted"), {
          name: "TimeoutError",
        }),
      ),
    );

    await expect(
      getEventsFromRaidHelperByServer(validServer.id),
    ).rejects.toMatchObject({
      name: "HttpError",
      status: 504,
      message: "Raid Helper API request timed out",
    });
  });

  it("rejects generic unexpected fetch errors with 502", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockRejectedValue(
          Object.assign(new Error("Error"), { name: "error" }),
        ),
    );

    await expect(
      getEventsFromRaidHelperByServer(validServer.id),
    ).rejects.toMatchObject({
      name: "HttpError",
      status: 502,
      message: "Raid Helper API request failed",
    });
  });

  it("sends the expected RaidHelper request headers", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(createSuccessfulFetchResponse());
    vi.stubGlobal("fetch", fetchMock);

    await getEventsFromRaidHelperByServer(validServer.id);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `https://raid-helper.xyz/api/v4/servers/${validServer.id}/events`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "test-api-key",
        }),
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("rejects with missing API-KEY with 503", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("RAIDHELPER_DISCORDSERVER_ID_WHITELIST", validServer.id);

    mockSuccessfulFetch();
    await expect(
      getEventsFromRaidHelperByServer(validServer.id),
    ).rejects.toMatchObject({
      name: "HttpError",
      status: 503,
      message: "Raid Helper API key is not configured",
    });
  });
});
