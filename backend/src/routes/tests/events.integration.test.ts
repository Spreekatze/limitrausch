import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import express from "express";
import type { AddressInfo } from "node:net";
import {
  API_ERROR_CODES,
  EVENT_TYPE,
  type Event,
} from "@limitrausch/contracts";
import {
  addEvent,
  deleteEventById,
  getEventById,
  getEvents,
  updateEventById,
} from "../../store/eventStore.js";
import { getDiscordGuildManagerRoles } from "../../store/guildStore.js";
import {
  getGuildMemberInfo,
  searchGuildMembers,
} from "../../discordBot/guildService.js";
import errorHandler from "../../errors/errorHandler.js";
import eventRoutes from "../events.js";
import {
  attachTestSessions,
  createAuthenticatedFetch,
  createTestSessionCookie,
  httpFetch,
} from "./sessionTestUtils.js";

vi.mock("../../store/eventStore.js", () => ({
  addEvent: vi.fn(),
  deleteEventById: vi.fn(),
  getEventById: vi.fn(),
  getEvents: vi.fn(),
  updateEventById: vi.fn(),
}));
vi.mock("../../store/guildStore.js", () => ({
  addDiscordGuild: vi.fn(),
  getDiscordGuildManagerRoles: vi.fn(),
}));
vi.mock("../../discordBot/guildService.js", () => ({
  getGuildMemberInfo: vi.fn(),
  searchGuildMembers: vi.fn(),
}));

const mocks = {
  addEvent: vi.mocked(addEvent),
  deleteEventById: vi.mocked(deleteEventById),
  getEventById: vi.mocked(getEventById),
  getEvents: vi.mocked(getEvents),
  getDiscordGuildManagerRoles: vi.mocked(getDiscordGuildManagerRoles),
  getGuildMemberInfo: vi.mocked(getGuildMemberInfo),
  searchGuildMembers: vi.mocked(searchGuildMembers),
  updateEventById: vi.mocked(updateEventById),
};

const guild = {
  id: "12345678901234567",
  name: "Test guild",
  icon: null,
  hasEventManagingRights: true,
  isAdminOrOwner: false,
  botIsPresent: true,
};
const guildB = {
  ...guild,
  id: "22345678901234567",
  name: "Other guild",
};
const authUser = {
  id: "user-1",
  username: "Alice",
  avatar: "avatar",
  manageableGuilds: [guild],
};
const event = {
  id: 1,
  lastUpdated: 123,
  title: "Test event",
  eventType: EVENT_TYPE.TRIAL,
  startTime: 100,
  endTime: 200,
  isPublic: false,
  discordGuild: { id: guild.id, name: guild.name },
} satisfies Event;

const app = express();
app.use((request, _response, next) => {
  request.log = { warn: vi.fn(), error: vi.fn() } as never;
  next();
});
attachTestSessions(app);
app.use("/events", eventRoutes);
app.use(errorHandler);

let server: ReturnType<typeof app.listen>;
let baseUrl: string;
let sessionCookie: string;
let authenticatedFetch: ReturnType<typeof createAuthenticatedFetch>;

beforeAll(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/events`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

beforeEach(async () => {
  vi.resetAllMocks();
  mocks.getGuildMemberInfo.mockResolvedValue({
    userId: authUser.id,
    guildId: guild.id,
    roleIds: ["manager-role"],
    isOwner: false,
    isAdmin: false,
  });
  mocks.getEventById.mockResolvedValue(event);
  mocks.getEvents.mockResolvedValue([event]);
  mocks.addEvent.mockImplementation(async (createEvent) => ({
    ...event,
    id: 2,
    lastUpdated: 200,
    title: createEvent.title,
    signUps: [],
  }));
  mocks.updateEventById.mockResolvedValue(event);
  mocks.deleteEventById.mockResolvedValue(true);
  mocks.getDiscordGuildManagerRoles.mockResolvedValue(["manager-role"]);
  mocks.searchGuildMembers.mockResolvedValue([
    { id: "member-1", name: "Member" },
  ]);
  sessionCookie = await createTestSessionCookie(baseUrl, { authUser });
  authenticatedFetch = createAuthenticatedFetch(sessionCookie);
});

describe("events HTTP routes", () => {
  it("returns events for the requested guild", async () => {
    const response = await authenticatedFetch(`${baseUrl}?guildId=${guild.id}`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ postedEvents: [event] });
    expect(mocks.getEvents).toHaveBeenCalledWith(guild.id);
  });

  it("returns a single event and rejects invalid or missing IDs", async () => {
    const found = await authenticatedFetch(`${baseUrl}/1`);
    expect(found.status).toBe(200);
    expect(await found.json()).toEqual(event);

    const invalid = await authenticatedFetch(`${baseUrl}/0`);
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toEqual({
      error: { code: "VALIDATION_ERROR" },
    });

    mocks.getEventById.mockResolvedValueOnce(undefined);
    const missing = await authenticatedFetch(`${baseUrl}/999`);
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({
      error: { code: "NOT_FOUND" },
    });
  });

  it("creates a valid event after authorization and rejects invalid payloads", async () => {
    const created = await authenticatedFetch(`${baseUrl}/${guild.id}/new`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "New event",
        eventType: 1,
        startTime: 300,
        endTime: 400,
        isPublic: false,
        discordGuild: { id: guild.id, name: guild.name },
      }),
    });

    expect(created.status).toBe(201);
    expect((await created.json()).postedEvents[0]).toMatchObject({
      id: 2,
      title: "New event",
    });
    expect(mocks.addEvent).toHaveBeenCalledWith(
      expect.objectContaining({ title: "New event" }),
      guild,
    );

    const invalid = await authenticatedFetch(`${baseUrl}/${guild.id}/new`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Missing required fields" }),
    });
    expect(invalid.status).toBe(400);
    expect(mocks.addEvent).toHaveBeenCalledOnce();

    const invalidTimeRange = await authenticatedFetch(
      `${baseUrl}/${guild.id}/new`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "Invalid time range",
          eventType: 1,
          startTime: 400,
          endTime: 400,
          isPublic: false,
          discordGuild: { id: guild.id, name: guild.name },
        }),
      },
    );
    expect(invalidTimeRange.status).toBe(400);
    expect(mocks.addEvent).toHaveBeenCalledOnce();
  });

  it("does not allow users without event-manager rights to create events", async () => {
    mocks.getGuildMemberInfo.mockResolvedValueOnce({
      userId: authUser.id,
      guildId: guild.id,
      roleIds: [],
      isOwner: false,
      isAdmin: false,
    });

    const response = await authenticatedFetch(`${baseUrl}/${guild.id}/new`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "New event",
        eventType: 1,
        startTime: 300,
        endTime: 400,
        isPublic: false,
        discordGuild: { id: guild.id, name: guild.name },
      }),
    });

    expect(response.status).toBe(403);
    expect(mocks.addEvent).not.toHaveBeenCalled();
  });

  it("does not let a Guild B manager edit or delete a Guild A event", async () => {
    const guildBCookie = await createTestSessionCookie(baseUrl, {
      authUser: { ...authUser, manageableGuilds: [guildB] },
    });
    const guildAManagerRole = "guild-a-manager";
    const guildBManagerRole = "guild-b-manager";
    mocks.getGuildMemberInfo.mockImplementation(async (guildId, userId) => ({
      userId,
      guildId,
      roleIds: guildId === guildB.id ? [guildBManagerRole] : [],
      isOwner: false,
      isAdmin: false,
    }));
    mocks.getDiscordGuildManagerRoles.mockImplementation(async (guildId) =>
      guildId === guildB.id ? [guildBManagerRole] : [guildAManagerRole],
    );

    const createdInGuildB = await authenticatedFetch(
      `${baseUrl}/${guildB.id}/new`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "Guild B event",
          eventType: 1,
          startTime: 300,
          endTime: 400,
          isPublic: false,
          discordGuild: { id: guildB.id, name: guildB.name },
        }),
      },
      guildBCookie,
    );
    expect(createdInGuildB.status).toBe(201);
    expect(mocks.getGuildMemberInfo).toHaveBeenCalledWith(
      guildB.id,
      authUser.id,
    );

    mocks.getGuildMemberInfo.mockClear();
    mocks.getDiscordGuildManagerRoles.mockClear();
    mocks.addEvent.mockClear();

    const update = await authenticatedFetch(
      `${baseUrl}/1`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "Unauthorized update" }),
      },
      guildBCookie,
    );
    const remove = await authenticatedFetch(
      `${baseUrl}/1`,
      { method: "DELETE" },
      guildBCookie,
    );

    expect(update.status).toBe(403);
    expect(await update.json()).toEqual({
      error: { code: API_ERROR_CODES.INSUFFICIENT_PERMISSIONS },
    });
    expect(remove.status).toBe(403);
    expect(await remove.json()).toEqual({
      error: { code: API_ERROR_CODES.INSUFFICIENT_PERMISSIONS },
    });
    expect(mocks.getGuildMemberInfo).toHaveBeenCalledWith(
      guild.id,
      authUser.id,
    );
    expect(mocks.getDiscordGuildManagerRoles).toHaveBeenCalledWith(guild.id);
    expect(mocks.addEvent).not.toHaveBeenCalled();
    expect(mocks.updateEventById).not.toHaveBeenCalled();
    expect(mocks.deleteEventById).not.toHaveBeenCalled();
  });

  it("does not let a user without manager rights edit or delete an event", async () => {
    mocks.getGuildMemberInfo.mockResolvedValue({
      userId: authUser.id,
      guildId: guild.id,
      roleIds: [],
      isOwner: false,
      isAdmin: false,
    });
    const nonManagerCookie = await createTestSessionCookie(baseUrl, {
      authUser: {
        ...authUser,
        manageableGuilds: [{ ...guild, hasEventManagingRights: false }],
      },
    });

    const update = await authenticatedFetch(
      `${baseUrl}/1`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "Unauthorized update" }),
      },
      nonManagerCookie,
    );
    const remove = await authenticatedFetch(
      `${baseUrl}/1`,
      { method: "DELETE" },
      nonManagerCookie,
    );

    expect(update.status).toBe(403);
    expect(remove.status).toBe(403);
    expect(mocks.updateEventById).not.toHaveBeenCalled();
    expect(mocks.deleteEventById).not.toHaveBeenCalled();
  });

  it("returns an internal error when fetching the user's guild membership fails", async () => {
    mocks.getGuildMemberInfo.mockRejectedValueOnce(
      new Error("Discord API unavailable"),
    );

    const response = await authenticatedFetch(`${baseUrl}/1`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Updated title" }),
    });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: API_ERROR_CODES.INTERNAL_SERVER_ERROR },
    });
    expect(mocks.updateEventById).not.toHaveBeenCalled();
  });

  it("returns an internal error when the event store cannot load an event for authorization", async () => {
    mocks.getEventById.mockRejectedValueOnce(new Error("Database unavailable"));

    const response = await authenticatedFetch(`${baseUrl}/1`, {
      method: "DELETE",
    });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: API_ERROR_CODES.INTERNAL_SERVER_ERROR },
    });
    expect(mocks.deleteEventById).not.toHaveBeenCalled();
  });

  it("returns an internal error when saving an event update fails", async () => {
    mocks.updateEventById.mockRejectedValueOnce(
      new Error("Database unavailable"),
    );

    const response = await authenticatedFetch(`${baseUrl}/1`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Updated title" }),
    });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: API_ERROR_CODES.INTERNAL_SERVER_ERROR },
    });
    expect(mocks.updateEventById).toHaveBeenCalledOnce();
  });

  it("returns an internal error when deleting an event fails", async () => {
    mocks.deleteEventById.mockRejectedValueOnce(
      new Error("Database unavailable"),
    );

    const response = await authenticatedFetch(`${baseUrl}/1`, {
      method: "DELETE",
    });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: API_ERROR_CODES.INTERNAL_SERVER_ERROR },
    });
    expect(mocks.deleteEventById).toHaveBeenCalledWith(event.id);
  });

  it("rejects unauthenticated event creation before checking guild roles", async () => {
    const response = await httpFetch(`${baseUrl}/${guild.id}/new`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "New event",
        eventType: 1,
        startTime: 300,
        endTime: 400,
        isPublic: false,
        discordGuild: { id: guild.id, name: guild.name },
      }),
    });

    expect(response.status).toBe(401);
    expect(mocks.getGuildMemberInfo).not.toHaveBeenCalled();
    expect(mocks.addEvent).not.toHaveBeenCalled();
  });

  it("updates existing events and handles invalid or missing updates", async () => {
    const updated = await authenticatedFetch(`${baseUrl}/1`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Updated title" }),
    });
    expect(updated.status).toBe(200);
    expect(await updated.json()).toEqual(event);
    expect(mocks.updateEventById).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ title: "Updated title" }),
    );

    const invalidRange = await authenticatedFetch(`${baseUrl}/1`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ startTime: 201, endTime: 201 }),
    });
    expect(invalidRange.status).toBe(400);
    expect(mocks.updateEventById).toHaveBeenCalledOnce();

    mocks.updateEventById.mockResolvedValueOnce(undefined);
    const missingUpdate = await authenticatedFetch(`${baseUrl}/1`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Missing" }),
    });
    expect(missingUpdate.status).toBe(404);
  });

  it("deletes existing events and handles missing events", async () => {
    const deleted = await authenticatedFetch(`${baseUrl}/1`, {
      method: "DELETE",
    });
    expect(deleted.status).toBe(204);
    expect(mocks.deleteEventById).toHaveBeenCalledWith(1);
    mocks.deleteEventById.mockResolvedValueOnce(false);
    const missingDelete = await authenticatedFetch(`${baseUrl}/1`, {
      method: "DELETE",
    });
    expect(missingDelete.status).toBe(404);
  });

  it("validates and authorizes guild member searches", async () => {
    const result = await authenticatedFetch(
      `${baseUrl}/${guild.id}/members?query=%20Alice%20`,
    );

    expect(result.status).toBe(200);
    expect(await result.json()).toEqual([{ id: "member-1", name: "Member" }]);
    expect(mocks.getDiscordGuildManagerRoles).toHaveBeenCalledWith(guild.id);
    expect(mocks.searchGuildMembers).toHaveBeenCalledWith(guild.id, "Alice", [
      "manager-role",
    ]);

    const invalid = await authenticatedFetch(
      `${baseUrl}/${guild.id}/members?query=a`,
    );
    expect(invalid.status).toBe(400);
  });

  it("rejects unauthenticated member searches before checking guild roles", async () => {
    const response = await httpFetch(
      `${baseUrl}/${guild.id}/members?query=Alice`,
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: { code: API_ERROR_CODES.UNAUTHORIZED },
    });
    expect(mocks.getGuildMemberInfo).not.toHaveBeenCalled();
    expect(mocks.getDiscordGuildManagerRoles).not.toHaveBeenCalled();
    expect(mocks.searchGuildMembers).not.toHaveBeenCalled();
  });

  it("converts malformed JSON request bodies into a validation response", async () => {
    const response = await authenticatedFetch(`${baseUrl}/${guild.id}/new`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{invalid",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: { code: "VALIDATION_ERROR" },
    });
  });
});
