import express from "express";
import type { AddressInfo } from "node:net";
import { API_ERROR_CODES, type AuthUser } from "@limitrausch/contracts";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { getGuildRoles } from "../../discordBot/guildService.js";
import { getDiscordGuild, upsertGuildConfig } from "../../store/guildStore.js";
import errorHandler from "../../errors/errorHandler.js";
import guildRoutes from "../guild.js";
import {
  attachTestSessions,
  createAuthenticatedFetch,
  createTestSessionCookie,
  httpFetch,
} from "./sessionTestUtils.js";

vi.mock("../../discordBot/guildService.js", () => ({
  getGuildRoles: vi.fn(),
}));
vi.mock("../../store/guildStore.js", () => ({
  getDiscordGuild: vi.fn(),
  upsertGuildConfig: vi.fn(),
}));

const mocks = {
  getGuildRoles: vi.mocked(getGuildRoles),
  getDiscordGuild: vi.mocked(getDiscordGuild),
  upsertGuildConfig: vi.mocked(upsertGuildConfig),
};

const guildId = "12345678901234567";
const authUser: AuthUser = {
  id: "user-1",
  username: "Alice",
  avatar: "avatar",
  manageableGuilds: [],
};
const config = {
  id: guildId,
  name: "Test guild",
  icon: null,
  roleIDsAllowedToManageEvents: ["manager-role"],
  roleIDsBannedFromParticipating: null,
};
const roles = [{ id: "manager-role", name: "Manager" }];
const discordFetchMock = vi.fn();

const app = express();
app.use((request, _response, next) => {
  request.log = { warn: vi.fn(), error: vi.fn() } as never;
  next();
});
attachTestSessions(app);
app.use("/guild", guildRoutes);
app.use(errorHandler);

let server: ReturnType<typeof app.listen>;
let baseUrl: string;
let sessionCookie: string;
let authenticatedFetch: ReturnType<typeof createAuthenticatedFetch>;

beforeAll(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/guild`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

beforeEach(async () => {
  vi.resetAllMocks();
  mocks.getDiscordGuild.mockResolvedValue(config);
  mocks.getGuildRoles.mockResolvedValue(roles);
  mocks.upsertGuildConfig.mockResolvedValue(undefined);
  discordFetchMock.mockResolvedValue({
    ok: true,
    json: async () => [
      {
        id: guildId,
        name: "Test guild",
        icon: null,
        owner: true,
        permissions: 0,
      },
    ],
  });
  vi.stubGlobal("fetch", discordFetchMock);
  sessionCookie = await createTestSessionCookie(baseUrl, {
    authUser,
    discordAccessToken: "access-token",
    discordTokenExpiresAt: Date.now() + 3_600_000,
  });
  authenticatedFetch = createAuthenticatedFetch(sessionCookie);
});

describe("guild configuration HTTP routes", () => {
  it("returns saved configuration and the current Discord roles", async () => {
    const response = await authenticatedFetch(`${baseUrl}/${guildId}`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      guildConfig: config,
      guildRoles: roles,
    });
    expect(mocks.getDiscordGuild).toHaveBeenCalledWith(guildId);
    expect(mocks.getGuildRoles).toHaveBeenCalledWith(guildId);
  });

  it.each(["1234567890123456", "123456789012345678901"])(
    "rejects a guild ID outside Discord's 17-20 digit range (%s)",
    async (invalidId) => {
      const response = await authenticatedFetch(`${baseUrl}/${invalidId}`);

      expect(response.status).toBe(400);
      expect(mocks.getDiscordGuild).not.toHaveBeenCalled();
      expect(mocks.getGuildRoles).not.toHaveBeenCalled();
      expect(discordFetchMock).not.toHaveBeenCalled();
    },
  );

  it("persists a valid config update and returns no content", async () => {
    const response = await authenticatedFetch(`${baseUrl}/${guildId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(config),
    });

    expect(response.status).toBe(204);
    expect(mocks.upsertGuildConfig).toHaveBeenCalledWith(guildId, config);
  });

  it("rejects malformed configuration without writing", async () => {
    const response = await authenticatedFetch(`${baseUrl}/${guildId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...config,
        roleIDsAllowedToManageEvents: "manager-role",
      }),
    });

    expect(response.status).toBe(400);
    expect(mocks.upsertGuildConfig).not.toHaveBeenCalled();
  });

  it("returns an internal error when Discord role lookup fails", async () => {
    mocks.getGuildRoles.mockRejectedValueOnce(
      new Error("Discord API unavailable"),
    );

    const response = await authenticatedFetch(`${baseUrl}/${guildId}`);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: API_ERROR_CODES.INTERNAL_SERVER_ERROR },
    });
    expect(mocks.getDiscordGuild).toHaveBeenCalledWith(guildId);
  });

  it("denies a logged-in user who is neither owner nor administrator", async () => {
    discordFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: guildId,
          name: "Test guild",
          icon: null,
          owner: false,
          permissions: 0,
        },
      ],
    });

    const response = await authenticatedFetch(`${baseUrl}/${guildId}`);

    expect(response.status).toBe(403);
    expect(mocks.getDiscordGuild).not.toHaveBeenCalled();
    expect(mocks.getGuildRoles).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    const response = await httpFetch(`${baseUrl}/${guildId}`);

    expect(response.status).toBe(401);
    expect(mocks.getDiscordGuild).not.toHaveBeenCalled();
    expect(mocks.getGuildRoles).not.toHaveBeenCalled();
    expect(discordFetchMock).not.toHaveBeenCalled();
  });
});
