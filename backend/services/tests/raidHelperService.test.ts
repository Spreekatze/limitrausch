import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getEventsFromRaidHelper } from "../raidHelperAPI.js";
import {
  createSuccessfulFetchResponse,
  validServerId,
} from "./raidHelperTestUtils.js";

const mockSuccessfulFetch = () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(createSuccessfulFetchResponse()),
  );
};

describe("getRaidHelperEvents", () => {
  // TODO: Valid test coverage checklist for this service
  // DONE - allows a whitelisted server id to fetch events
  // DONE - rejects server ids that are not on the whitelist
  // - no whitelist env var configured should reject with 403
  // DONE - missing RAID_HELPER_API_KEY should reject with 503
  // - response.ok === false should reject with the upstream HTTP status
  // DONE - non-JSON content type should reject with 502 "Raid Helper API response is not JSON"
  // DONE - invalid JSON from response.json() should reject with 502 "Raid Helper API returned invalid JSON"
  // DONE - timeout/network error should reject with 504 "Raid Helper API request timed out"
  // - whitelist parsing should allow comma-separated values with spaces, e.g. "id1, id2, id3"
  // DONE - generic unexpected fetch errors should reject with 502 "Raid Helper API request failed"

  beforeEach(() => {
    vi.stubEnv("RAIDHELPER_DISCORDSERVER_ID_WHITELIST", validServerId);
    vi.stubEnv("RAID_HELPER_API_KEY", "test-api-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("allows a whitelisted server id to fetch events", async () => {
    mockSuccessfulFetch();

    await expect(getEventsFromRaidHelper(validServerId)).resolves.toMatchObject(
      {
        pages: 1,
      },
    );
  });

  it("does not call RaidHelper for server ids that are not on the whitelist", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(createSuccessfulFetchResponse());
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      getEventsFromRaidHelper("not-whitelisted"),
    ).rejects.toMatchObject({
      name: "HttpError",
      status: 403,
      message:
        "Server not-whitelisted is not allowed to fetch Raid Helper events",
    });
    expect(fetchMock).not.toHaveBeenCalled();
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

    await expect(getEventsFromRaidHelper(validServerId)).rejects.toMatchObject({
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

    await expect(getEventsFromRaidHelper(validServerId)).rejects.toMatchObject({
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

    await expect(getEventsFromRaidHelper(validServerId)).resolves.toMatchObject(
      {
        pages: 1,
      },
    );
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

    await expect(getEventsFromRaidHelper(validServerId)).rejects.toMatchObject({
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

    await expect(getEventsFromRaidHelper(validServerId)).rejects.toMatchObject({
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

    await getEventsFromRaidHelper(validServerId);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `https://raid-helper.xyz/api/v4/servers/${validServerId}/events`,
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
    vi.stubEnv("RAIDHELPER_DISCORDSERVER_ID_WHITELIST", validServerId);

    mockSuccessfulFetch();
    await expect(getEventsFromRaidHelper(validServerId)).rejects.toMatchObject({
      name: "HttpError",
      status: 503,
      message: "Raid Helper API key is not configured",
    });
  });
});
