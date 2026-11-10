import express from "express";
import type { AddressInfo } from "node:net";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  API_ERROR_CODES,
  type AuthUser,
  type RaidHelperImportResponse,
} from "@limitrausch/contracts";
import { addDiscordGuild } from "../../store/guildStore.js";
import {
  importRaidHelperEventById,
  importRaidHelperEventsFromGuild,
} from "../../services/raidHelperImport.js";
import errorHandler from "../../errors/errorHandler.js";
import raidHelperRoutes from "../raidhelper.js";
import {
  attachTestSessions,
  createAuthenticatedFetch,
  createTestSessionCookie,
  httpFetch,
} from "./sessionTestUtils.js";

vi.mock("../../store/guildStore.js", () => ({
  addDiscordGuild: vi.fn(),
}));
vi.mock("../../services/raidHelperImport.js", () => ({
  importRaidHelperEventById: vi.fn(),
  importRaidHelperEventsFromGuild: vi.fn(),
}));

const mocks = {
  addDiscordGuild: vi.mocked(addDiscordGuild),
  importRaidHelperEventById: vi.mocked(importRaidHelperEventById),
  importRaidHelperEventsFromGuild: vi.mocked(importRaidHelperEventsFromGuild),
};

const guild = {
  id: "12345678901234567",
  name: "Test guild",
  icon: null,
  hasEventManagingRights: true,
  isAdminOrOwner: false,
  botIsPresent: true,
};
const authUser: AuthUser = {
  id: "user-1",
  username: "Alice",
  avatar: "avatar",
  manageableGuilds: [guild],
};
const discordFetchMock = vi.fn();
const result: RaidHelperImportResponse = {
  imported: 0,
  updated: 1,
  skipped: 0,
  failed: 0,
};

const app = express();
app.use((request, _response, next) => {
  request.log = { warn: vi.fn(), error: vi.fn() } as never;
  next();
});
attachTestSessions(app);
app.use("/events/raid-helper", raidHelperRoutes);
app.use(errorHandler);

let server: ReturnType<typeof app.listen>;
let baseUrl: string;
let sessionCookie: string;
let authenticatedFetch: ReturnType<typeof createAuthenticatedFetch>;

beforeAll(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/events/raid-helper`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  vi.unstubAllGlobals();
});

beforeEach(async () => {
  vi.resetAllMocks();
  mocks.importRaidHelperEventById.mockResolvedValue(result);
  mocks.importRaidHelperEventsFromGuild.mockResolvedValue(result);
  discordFetchMock.mockResolvedValue({
    ok: true,
    json: async () => [
      {
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
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

describe("RaidHelper import routes", () => {
  it("imports a requested event by the route event ID", async () => {
    const response = await authenticatedFetch(`${baseUrl}/event-123`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(result);
    expect(mocks.importRaidHelperEventById).toHaveBeenCalledWith(
      authUser.manageableGuilds,
      "event-123",
    );
  });

  it("returns an internal error when an event import by id reports failures", async () => {
    mocks.importRaidHelperEventById.mockResolvedValueOnce({
      ...result,
      failed: 1,
    });

    const response = await authenticatedFetch(`${baseUrl}/event-123`);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: API_ERROR_CODES.INTERNAL_SERVER_ERROR },
    });
  });

  it("returns an internal error when the event import service throws", async () => {
    mocks.importRaidHelperEventById.mockRejectedValueOnce(
      new Error("Import service unavailable"),
    );

    const response = await authenticatedFetch(`${baseUrl}/event-123`);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: API_ERROR_CODES.INTERNAL_SERVER_ERROR },
    });
  });

  it("rejects imports for guilds the user does not manage", async () => {
    discordFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        ...[guild.id, "98765432109876543"].map((id) => ({
          id,
          name: "Test guild",
          icon: null,
          owner: true,
          permissions: 0,
        })),
      ],
    });

    const response = await authenticatedFetch(
      `${baseUrl}/guild/98765432109876543`,
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: { code: API_ERROR_CODES.NOT_FOUND },
    });
    expect(mocks.addDiscordGuild).not.toHaveBeenCalled();
    expect(mocks.importRaidHelperEventsFromGuild).not.toHaveBeenCalled();
  });

  it("stores the authorized guild before importing its events", async () => {
    const callOrder: string[] = [];
    mocks.addDiscordGuild.mockImplementationOnce(async () => {
      callOrder.push("store-guild");
    });
    mocks.importRaidHelperEventsFromGuild.mockImplementationOnce(async () => {
      callOrder.push("import-events");
      return result;
    });

    const response = await authenticatedFetch(`${baseUrl}/guild/${guild.id}`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(result);
    expect(mocks.addDiscordGuild).toHaveBeenCalledWith(guild);
    expect(mocks.importRaidHelperEventsFromGuild).toHaveBeenCalledWith(guild);
    expect(callOrder).toEqual(["store-guild", "import-events"]);
    expect(discordFetchMock).toHaveBeenCalledWith(
      "https://discord.com/api/users/@me/guilds",
      expect.objectContaining({
        headers: { Authorization: "Bearer access-token" },
      }),
    );
  });

  it("does not import events when storing the guild fails", async () => {
    mocks.addDiscordGuild.mockRejectedValueOnce(
      new Error("Database unavailable"),
    );

    const response = await authenticatedFetch(`${baseUrl}/guild/${guild.id}`);

    expect(response.status).toBe(500);
    expect(mocks.addDiscordGuild).toHaveBeenCalledOnce();
    expect(mocks.importRaidHelperEventsFromGuild).not.toHaveBeenCalled();
  });

  it("returns an internal error when guild event import fails", async () => {
    mocks.importRaidHelperEventsFromGuild.mockRejectedValueOnce(
      new Error("Import service unavailable"),
    );

    const response = await authenticatedFetch(`${baseUrl}/guild/${guild.id}`);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: API_ERROR_CODES.INTERNAL_SERVER_ERROR },
    });
  });

  it("rejects unauthenticated event imports before calling the import service", async () => {
    const response = await httpFetch(`${baseUrl}/event-123`);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: { code: API_ERROR_CODES.UNAUTHORIZED },
    });
    expect(mocks.importRaidHelperEventById).not.toHaveBeenCalled();
  });

  it("denies guild imports when Discord does not grant owner or admin access", async () => {
    discordFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: guild.id,
          name: guild.name,
          icon: guild.icon,
          owner: false,
          permissions: 0,
        },
      ],
    });

    const response = await authenticatedFetch(`${baseUrl}/guild/${guild.id}`);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: { code: API_ERROR_CODES.INSUFFICIENT_PERMISSIONS },
    });
    expect(mocks.addDiscordGuild).not.toHaveBeenCalled();
    expect(mocks.importRaidHelperEventsFromGuild).not.toHaveBeenCalled();
  });

  it("requires a Discord access token before checking guild permissions", async () => {
    const cookieWithoutDiscordToken = await createTestSessionCookie(baseUrl, {
      authUser,
    });

    const response = await authenticatedFetch(
      `${baseUrl}/guild/${guild.id}`,
      {},
      cookieWithoutDiscordToken,
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: { code: API_ERROR_CODES.UNAUTHORIZED },
    });
    expect(discordFetchMock).not.toHaveBeenCalled();
    expect(mocks.addDiscordGuild).not.toHaveBeenCalled();
  });

  it("returns an upstream error when Discord guild lookup fails", async () => {
    discordFetchMock.mockResolvedValueOnce({ ok: false, status: 503 });

    const response = await authenticatedFetch(`${baseUrl}/guild/${guild.id}`);

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: { code: API_ERROR_CODES.UPSTREAM_ERROR },
    });
    expect(mocks.addDiscordGuild).not.toHaveBeenCalled();
    expect(mocks.importRaidHelperEventsFromGuild).not.toHaveBeenCalled();
    expect(discordFetchMock).toHaveBeenCalledOnce();
  });

  it("rejects malformed guild IDs before calling Discord", async () => {
    const response = await authenticatedFetch(
      `${baseUrl}/guild/not-a-guild-id`,
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: { code: API_ERROR_CODES.VALIDATION_ERROR },
    });
    expect(discordFetchMock).not.toHaveBeenCalled();
    expect(mocks.addDiscordGuild).not.toHaveBeenCalled();
  });
});
