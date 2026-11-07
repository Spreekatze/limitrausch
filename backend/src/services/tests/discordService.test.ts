import type { Request } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getValidDiscordAccessToken } from "../discordService.js";

function createRequest(session: Record<string, unknown>): Request {
  return { session } as unknown as Request;
}

describe("getValidDiscordAccessToken", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns an access token that is not near expiration", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000);
    const request = createRequest({
      discordAccessToken: "access-token",
      discordTokenExpiresAt: 120_000,
    });

    await expect(getValidDiscordAccessToken(request)).resolves.toBe(
      "access-token",
    );
  });

  it("requires authorization when the session has no access token", async () => {
    await expect(
      getValidDiscordAccessToken(createRequest({})),
    ).rejects.toMatchObject({ status: 401 });
  });

  it("requires reauthorization when an expired token has no refresh token", async () => {
    vi.spyOn(Date, "now").mockReturnValue(10_000);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      getValidDiscordAccessToken(
        createRequest({
          discordAccessToken: "expired-token",
          discordTokenExpiresAt: 10_000,
        }),
      ),
    ).rejects.toMatchObject({
      status: 401,
      message: "Discord reauthorization required.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refreshes and saves a token that is expired or inside the refresh buffer", async () => {
    vi.spyOn(Date, "now").mockReturnValue(100_000);
    vi.stubEnv("DISCORD_CLIENT_ID", "client-id");
    vi.stubEnv("DISCORD_CLIENT_SECRET", "client-secret");
    const session = {
      discordAccessToken: "old-access-token",
      discordRefreshToken: "old-refresh-token",
      discordTokenExpiresAt: 150_000,
      save: vi.fn((callback: (error?: Error) => void) => callback()),
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "new-access-token",
        refresh_token: "new-refresh-token",
        expires_in: 3600,
        token_type: "Bearer",
        scope: "identify",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getValidDiscordAccessToken(createRequest(session)),
    ).resolves.toBe("new-access-token");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://discord.com/api/oauth2/token",
      expect.objectContaining({
        method: "POST",
        body: expect.any(URLSearchParams),
      }),
    );
    expect(session.discordAccessToken).toBe("new-access-token");
    expect(session.discordRefreshToken).toBe("new-refresh-token");
    expect(session.discordTokenExpiresAt).toBe(3_700_000);
    expect(session.save).toHaveBeenCalledOnce();
  });

  it("rejects unsuccessful token refreshes with the upstream status", async () => {
    vi.spyOn(Date, "now").mockReturnValue(100_000);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 429 }),
    );

    await expect(
      getValidDiscordAccessToken(
        createRequest({
          discordAccessToken: "expired-token",
          discordRefreshToken: "refresh-token",
          discordTokenExpiresAt: 100_000,
        }),
      ),
    ).rejects.toMatchObject({
      status: 502,
      logContext: { upstreamStatus: 429 },
    });
  });

  it("rejects malformed refresh responses", async () => {
    vi.spyOn(Date, "now").mockReturnValue(100_000);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: "missing-fields" }),
      }),
    );

    await expect(
      getValidDiscordAccessToken(
        createRequest({
          discordAccessToken: "expired-token",
          discordRefreshToken: "refresh-token",
          discordTokenExpiresAt: 100_000,
        }),
      ),
    ).rejects.toMatchObject({ status: 502 });
  });

  it("updates session tokens but propagates session persistence errors", async () => {
    vi.spyOn(Date, "now").mockReturnValue(100_000);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: "new-access-token",
          refresh_token: "new-refresh-token",
          expires_in: 3600,
          token_type: "Bearer",
          scope: "identify",
        }),
      }),
    );
    const session = {
      discordAccessToken: "expired-token",
      discordRefreshToken: "refresh-token",
      discordTokenExpiresAt: 100_000,
      save: vi.fn((callback: (error?: Error) => void) =>
        callback(new Error("session store unavailable")),
      ),
    };

    await expect(
      getValidDiscordAccessToken(createRequest(session)),
    ).rejects.toThrow("session store unavailable");
    expect(session.discordAccessToken).toBe("new-access-token");
    expect(session.discordRefreshToken).toBe("new-refresh-token");
    expect(session.save).toHaveBeenCalledOnce();
  });
});
