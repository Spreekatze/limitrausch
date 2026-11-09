import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import express from "express";
import type { AddressInfo } from "node:net";
import type { AuthUser } from "@limitrausch/contracts";
import errorHandler from "../../errors/errorHandler.js";
import authRoutes from "../auth.js";
import { getGuilds } from "../../discordBot/guildService.js";
import {
  attachTestSessions,
  createTestSessionCookie,
  getSessionCookie,
  httpFetch,
  readTestSession,
} from "./sessionTestUtils.js";

const authUser: AuthUser = {
  id: "user-1",
  username: "Alice",
  avatar: "avatar",
  manageableGuilds: [],
};
vi.mock("../../discordBot/guildService.js", () => ({
  getGuilds: vi.fn(),
}));

const getGuildsMock = vi.mocked(getGuilds);

const app = express();
app.use((request, _response, next) => {
  request.log = { warn: vi.fn(), error: vi.fn() } as never;
  next();
});
attachTestSessions(app);
app.use("/auth", authRoutes);
app.use(errorHandler);

let server: ReturnType<typeof app.listen>;
let baseUrl: string;

beforeAll(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/auth`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("authentication HTTP routes", () => {
  it("returns the current logged-out or logged-in status", async () => {
    const guestResponse = await httpFetch(`${baseUrl}/me`);
    expect(guestResponse.status).toBe(200);
    expect(await guestResponse.json()).toEqual({ loggedIn: false, user: null });

    const cookie = await createTestSessionCookie(baseUrl, { authUser });
    const loggedInResponse = await httpFetch(`${baseUrl}/me`, {
      headers: { cookie },
    });
    expect(await loggedInResponse.json()).toEqual({
      loggedIn: true,
      user: authUser,
    });
  });

  it("starts Discord OAuth and stores a CSRF state in the session", async () => {
    vi.stubEnv("DISCORD_CLIENT_ID", "client-id");
    vi.stubEnv("DISCORD_REDIRECT_URI", "https://example.test/callback");

    const response = await httpFetch(`${baseUrl}/discord`, {
      redirect: "manual",
    });
    const authorizationUrl = new URL(response.headers.get("location")!);
    const cookie = getSessionCookie(response);

    expect(response.status).toBe(302);
    expect(authorizationUrl.origin).toBe("https://discord.com");
    expect(authorizationUrl.searchParams.get("client_id")).toBe("client-id");
    expect(authorizationUrl.searchParams.get("redirect_uri")).toBe(
      "https://example.test/callback",
    );
    expect(authorizationUrl.searchParams.get("scope")).toBe("identify guilds");
    const sessionData = await readTestSession(baseUrl, cookie);
    expect(sessionData.discordOAuthState).toBe(
      authorizationUrl.searchParams.get("state"),
    );
    expect(sessionData.discordOAuthState).toHaveLength(64);
    vi.unstubAllEnvs();
  });

  it("redirects already authenticated users away from the OAuth flow", async () => {
    const cookie = await createTestSessionCookie(baseUrl, { authUser });

    const response = await httpFetch(`${baseUrl}/discord`, {
      headers: { cookie },
      redirect: "manual",
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/");
  });

  it("rejects missing authorization codes and invalid OAuth state without network calls", async () => {
    const cookie = await createTestSessionCookie(baseUrl, {
      discordOAuthState: "expected-state",
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const missingCode = await httpFetch(
      `${baseUrl}/discord/callback?state=expected-state`,
      { headers: { cookie } },
    );
    expect(missingCode.status).toBe(400);

    const invalidState = await httpFetch(
      `${baseUrl}/discord/callback?code=oauth-code&state=wrong-state`,
      { headers: { cookie } },
    );
    expect(invalidState.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("completes OAuth, stores validated identity and tokens, then redirects", async () => {
    vi.stubEnv("DISCORD_CLIENT_ID", "client-id");
    vi.stubEnv("DISCORD_CLIENT_SECRET", "client-secret");
    vi.stubEnv("DISCORD_REDIRECT_URI", "https://example.test/callback");
    vi.stubEnv("FRONTEND_URL", "https://app.example.test");
    const cookie = await createTestSessionCookie(baseUrl, {
      discordOAuthState: "expected-state",
    });
    getGuildsMock.mockResolvedValue([]);

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: "access-token",
          refresh_token: "refresh-token",
          expires_in: 3600,
          token_type: "Bearer",
          scope: "identify guilds",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "user-1",
          username: "alice",
          global_name: "Alice",
          avatar: "avatar",
          verified: true,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });
    vi.stubGlobal("fetch", fetchMock);

    const response = await httpFetch(
      `${baseUrl}/discord/callback?code=oauth-code&state=expected-state`,
      { headers: { cookie }, redirect: "manual" },
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://app.example.test/dashboard",
    );
    const sessionData = await readTestSession(baseUrl, cookie);
    expect(sessionData.authUser).toEqual({
      id: "user-1",
      username: "Alice",
      avatar: "avatar",
      manageableGuilds: [],
    });
    expect(sessionData.discordOAuthState).toBeUndefined();
    expect(sessionData.discordAccessToken).toBe("access-token");
    expect(sessionData.discordRefreshToken).toBe("refresh-token");
    expect(sessionData.discordTokenExpiresAt).toBeGreaterThan(Date.now());
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(getGuildsMock).toHaveBeenCalledOnce();
  });

  it("stops OAuth when Discord rejects token exchange", async () => {
    vi.stubEnv("DISCORD_CLIENT_ID", "client-id");
    vi.stubEnv("DISCORD_CLIENT_SECRET", "client-secret");
    vi.stubEnv("DISCORD_REDIRECT_URI", "https://example.test/callback");
    const cookie = await createTestSessionCookie(baseUrl, {
      discordOAuthState: "expected-state",
    });
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    vi.stubGlobal("fetch", fetchMock);

    const response = await httpFetch(
      `${baseUrl}/discord/callback?code=oauth-code&state=expected-state`,
      { headers: { cookie } },
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: { code: "UPSTREAM_ERROR" },
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(await readTestSession(baseUrl, cookie)).not.toHaveProperty(
      "authUser",
    );
  });

  it("stops OAuth when the token response is invalid", async () => {
    vi.stubEnv("DISCORD_CLIENT_ID", "client-id");
    vi.stubEnv("DISCORD_CLIENT_SECRET", "client-secret");
    vi.stubEnv("DISCORD_REDIRECT_URI", "https://example.test/callback");
    const cookie = await createTestSessionCookie(baseUrl, {
      discordOAuthState: "expected-state",
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: "access-token" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await httpFetch(
      `${baseUrl}/discord/callback?code=oauth-code&state=expected-state`,
      { headers: { cookie } },
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: { code: "UPSTREAM_ERROR" },
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(getGuildsMock).not.toHaveBeenCalled();
    expect(await readTestSession(baseUrl, cookie)).not.toHaveProperty(
      "authUser",
    );
  });

  it("stops OAuth when Discord rejects the user lookup", async () => {
    vi.stubEnv("DISCORD_CLIENT_ID", "client-id");
    vi.stubEnv("DISCORD_CLIENT_SECRET", "client-secret");
    vi.stubEnv("DISCORD_REDIRECT_URI", "https://example.test/callback");
    const cookie = await createTestSessionCookie(baseUrl, {
      discordOAuthState: "expected-state",
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: "access-token",
          refresh_token: "refresh-token",
          expires_in: 3600,
          token_type: "Bearer",
          scope: "identify guilds",
        }),
      })
      .mockResolvedValueOnce({ ok: false, status: 401 });
    vi.stubGlobal("fetch", fetchMock);

    const response = await httpFetch(
      `${baseUrl}/discord/callback?code=oauth-code&state=expected-state`,
      { headers: { cookie } },
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: { code: "UPSTREAM_ERROR" },
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getGuildsMock).not.toHaveBeenCalled();
    expect(await readTestSession(baseUrl, cookie)).not.toHaveProperty(
      "authUser",
    );
  });

  it("destroys the session and returns logged-out status on logout", async () => {
    const cookie = await createTestSessionCookie(baseUrl, {
      authUser,
      discordAccessToken: "access-token",
    });
    const headers = { cookie };
    const loggedInResponse = await httpFetch(`${baseUrl}/me`, {
      headers,
    });
    expect(await loggedInResponse.json()).toEqual({
      loggedIn: true,
      user: authUser,
    });

    const response = await httpFetch(`${baseUrl}/logout`, {
      headers,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ loggedIn: false, user: null });
    expect(response.headers.get("set-cookie")).toMatch(/connect\.sid=;/);

    const afterLogoutResponse = await httpFetch(`${baseUrl}/me`, {
      headers,
    });
    expect(await afterLogoutResponse.json()).toEqual({
      loggedIn: false,
      user: null,
    });
  });
});
