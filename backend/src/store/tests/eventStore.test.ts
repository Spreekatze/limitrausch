import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const client = {
    query: vi.fn(),
    release: vi.fn(),
  };
  return {
    client,
    pool: {
      connect: vi.fn(async () => client),
      query: vi.fn(),
    },
    upsertDiscordGuild: vi.fn(),
    upsertDiscordTextChannel: vi.fn(),
    insertEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
    insertEventCoLeader: vi.fn(),
    deleteAllCoLeadersFromEvent: vi.fn(),
    insertEventSignUp: vi.fn(),
    deleteAllSignUpsFromEvent: vi.fn(),
    ensureDiscordGuildUser: vi.fn(),
    mapDatabaseEventRowToEvent: vi.fn(),
  };
});

vi.mock("../../database/databaseConnection.js", () => ({ pool: mocks.pool }));
vi.mock("../../database/discordGuild.js", () => ({
  upsertDiscordGuild: mocks.upsertDiscordGuild,
}));
vi.mock("../../database/discordTextChannel.js", () => ({
  upsertDiscordTextChannel: mocks.upsertDiscordTextChannel,
}));
vi.mock("../../database/event.js", () => ({
  insertEvent: mocks.insertEvent,
  updateEvent: mocks.updateEvent,
  deleteEvent: mocks.deleteEvent,
}));
vi.mock("../../database/eventCoLeader.js", () => ({
  insertEventCoLeader: mocks.insertEventCoLeader,
  deleteAllCoLeadersFromEvent: mocks.deleteAllCoLeadersFromEvent,
}));
vi.mock("../../database/eventSignUp.js", () => ({
  insertEventSignUp: mocks.insertEventSignUp,
  deleteAllSignUpsFromEvent: mocks.deleteAllSignUpsFromEvent,
}));
vi.mock("../../database/discordGuildUser.js", () => ({
  ensureDiscordGuildUser: mocks.ensureDiscordGuildUser,
}));
vi.mock("../../mapping/eventDatabaseMapping.js", () => ({
  mapDatabaseEventRowToEvent: mocks.mapDatabaseEventRowToEvent,
}));

import {
  addEvent,
  deleteEventById,
  getEvents,
  updateEventById,
} from "../eventStore.js";
import type { CreateEvent } from "@limitrausch/contracts";

describe("event store", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.pool.connect.mockResolvedValue(mocks.client);
    mocks.client.query.mockResolvedValue({ rows: [], rowCount: 1 });
    mocks.pool.query.mockResolvedValue({ rows: [] });
    mocks.insertEvent.mockResolvedValue({ id: 8, lastUpdated: 123 });
    mocks.insertEventSignUp.mockResolvedValue(14);
    mocks.deleteEvent.mockResolvedValue(true);
  });

  it("returns events and parameterizes the optional guild filter", async () => {
    const row = { id: 1 };
    mocks.pool.query.mockResolvedValue({ rows: [row] });
    mocks.mapDatabaseEventRowToEvent.mockReturnValue({ id: 1 });

    await expect(getEvents("guild-1")).resolves.toEqual([{ id: 1 }]);
    expect(mocks.pool.query).toHaveBeenCalledWith(
      expect.stringContaining('event."discordGuildId" = $1'),
      ["guild-1"],
    );
    expect(mocks.mapDatabaseEventRowToEvent).toHaveBeenCalledWith(row);
  });

  it("creates an event and its related records in one transaction", async () => {
    const event: CreateEvent = {
      title: "Test event",
      eventType: 1,
      startTime: 100,
      endTime: 200,
      isPublic: false,
      discordGuild: {
        id: "guild-1",
        name: "Guild",
        textChannelId: "channel-1",
      },
      creator: { id: "creator", name: "Creator" },
      coLeaders: [{ id: "co-lead", name: "Co-lead" }],
      signUps: [{ userId: "member", name: "Member" }],
    };

    const result = await addEvent(event);

    expect(result).toMatchObject({
      id: 8,
      lastUpdated: 123,
      signUpCount: 1,
      signUps: [{ id: 14, userId: "member", name: "Member" }],
    });
    expect(mocks.client.query.mock.calls.map(([sql]) => sql)).toEqual([
      "BEGIN",
      "COMMIT",
    ]);
    expect(mocks.ensureDiscordGuildUser).toHaveBeenCalledTimes(3);
    expect(mocks.insertEventCoLeader).toHaveBeenCalledWith(
      "co-lead",
      8,
      mocks.client,
    );
    expect(mocks.insertEventSignUp).toHaveBeenCalledWith(
      event.signUps?.[0],
      8,
      mocks.client,
    );
    expect(mocks.client.release).toHaveBeenCalledOnce();
  });

  it("rolls back and releases the connection when event creation fails", async () => {
    const error = new Error("database write failed");
    mocks.insertEvent.mockRejectedValue(error);

    await expect(
      addEvent({
        title: "Test event",
        eventType: 1,
        startTime: 100,
        endTime: 200,
        isPublic: false,
      }),
    ).rejects.toBe(error);

    expect(mocks.client.query.mock.calls.map(([sql]) => sql)).toEqual([
      "BEGIN",
      "ROLLBACK",
    ]);
    expect(mocks.client.release).toHaveBeenCalledOnce();
  });

  it("rolls back when inserting an event co-leader fails", async () => {
    const error = new Error("co-leader write failed");
    mocks.insertEventCoLeader.mockRejectedValue(error);

    await expect(
      addEvent({
        title: "Test event",
        eventType: 1,
        startTime: 100,
        endTime: 200,
        isPublic: false,
        coLeaders: [{ id: "co-lead", name: "Co-lead" }],
      }),
    ).rejects.toBe(error);

    expect(mocks.insertEventCoLeader).toHaveBeenCalledWith(
      "co-lead",
      8,
      mocks.client,
    );
    expect(mocks.client.query.mock.calls.map(([sql]) => sql)).toEqual([
      "BEGIN",
      "ROLLBACK",
    ]);
    expect(mocks.insertEventSignUp).not.toHaveBeenCalled();
    expect(mocks.client.release).toHaveBeenCalledOnce();
  });

  it("rolls back when inserting an event signup fails", async () => {
    const error = new Error("signup write failed");
    const signUp = { userId: "member", name: "Member" };
    mocks.insertEventSignUp.mockRejectedValue(error);

    await expect(
      addEvent({
        title: "Test event",
        eventType: 1,
        startTime: 100,
        endTime: 200,
        isPublic: false,
        discordGuild: { id: "guild-1" },
        signUps: [signUp],
      }),
    ).rejects.toBe(error);

    expect(mocks.ensureDiscordGuildUser).toHaveBeenCalledWith(
      { id: signUp.userId, name: signUp.name },
      "guild-1",
      mocks.client,
    );
    expect(mocks.insertEventSignUp).toHaveBeenCalledWith(
      signUp,
      8,
      mocks.client,
    );
    expect(mocks.client.query.mock.calls.map(([sql]) => sql)).toEqual([
      "BEGIN",
      "ROLLBACK",
    ]);
    expect(mocks.client.release).toHaveBeenCalledOnce();
  });

  it("rolls back when ensuring an event guild user fails", async () => {
    const error = new Error("guild user write failed");
    const creator = { id: "creator", name: "Creator" };
    mocks.ensureDiscordGuildUser.mockRejectedValue(error);

    await expect(
      addEvent({
        title: "Test event",
        eventType: 1,
        startTime: 100,
        endTime: 200,
        isPublic: false,
        discordGuild: { id: "guild-1" },
        creator,
      }),
    ).rejects.toBe(error);

    expect(mocks.ensureDiscordGuildUser).toHaveBeenCalledWith(
      creator,
      "guild-1",
      mocks.client,
    );
    expect(mocks.insertEvent).not.toHaveBeenCalled();
    expect(mocks.client.query.mock.calls.map(([sql]) => sql)).toEqual([
      "BEGIN",
      "ROLLBACK",
    ]);
    expect(mocks.client.release).toHaveBeenCalledOnce();
  });

  it("rolls back an update when the event does not exist", async () => {
    mocks.client.query.mockResolvedValueOnce({ rows: [] });

    await expect(
      updateEventById(404, { title: "Missing" }),
    ).resolves.toBeUndefined();
    expect(mocks.client.query.mock.calls.map(([sql]) => sql)).toEqual([
      "BEGIN",
      expect.stringContaining('SELECT "discordGuildId"'),
      "ROLLBACK",
    ]);
    expect(mocks.updateEvent).not.toHaveBeenCalled();
    expect(mocks.client.release).toHaveBeenCalledOnce();
  });

  it.each([
    ["start time equal to the existing end", { startTime: 200 }],
    ["end time equal to the existing start", { endTime: 100 }],
  ])("rejects a partial update with %s", async (_label, update) => {
    mocks.client.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({
        rows: [
          {
            discordGuildId: null,
            discordTextChannelId: null,
            startTime: "100",
            endTime: "200",
          },
        ],
        rowCount: 1,
      });

    await expect(updateEventById(8, update)).rejects.toMatchObject({
      status: 400,
    });

    expect(mocks.updateEvent).not.toHaveBeenCalled();
    expect(mocks.client.query.mock.calls.map(([sql]) => sql)).toEqual([
      "BEGIN",
      expect.stringContaining('"startTime", "endTime"'),
      "ROLLBACK",
    ]);
    expect(mocks.client.release).toHaveBeenCalledOnce();
  });

  it.each([
    [
      "start time immediately before the existing end",
      { startTime: 199 },
      '"startTime" = $2',
      199,
    ],
    [
      "end time immediately after the existing start",
      { endTime: 101 },
      '"endTime" = $2',
      101,
    ],
  ])(
    "commits a partial update with %s",
    async (_label, update, assignment, value) => {
      mocks.client.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({
          rows: [
            {
              discordGuildId: null,
              discordTextChannelId: null,
              startTime: "100",
              endTime: "200",
            },
          ],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });
      mocks.pool.query.mockResolvedValueOnce({ rows: [{ id: 8 }] });
      const updatedEvent = { id: 8, startTime: 199, endTime: 200 };
      mocks.mapDatabaseEventRowToEvent.mockReturnValue(updatedEvent);

      await expect(updateEventById(8, update)).resolves.toBe(updatedEvent);

      expect(mocks.updateEvent).toHaveBeenCalledWith(
        ['"lastUpdated" = $1', assignment],
        [expect.any(Number), value, 8],
        mocks.client,
      );
      expect(mocks.client.query.mock.calls.map(([sql]) => sql)).toEqual([
        "BEGIN",
        expect.stringContaining('"startTime", "endTime"'),
        "COMMIT",
      ]);
      expect(mocks.client.release).toHaveBeenCalledOnce();
    },
  );

  it("rejects invalid event times before acquiring a database connection", async () => {
    await expect(
      addEvent({
        title: "Invalid event",
        eventType: 1,
        startTime: 200,
        endTime: 200,
        isPublic: false,
      }),
    ).rejects.toMatchObject({ status: 400 });

    expect(mocks.pool.connect).not.toHaveBeenCalled();
    expect(mocks.insertEvent).not.toHaveBeenCalled();
  });

  it("releases the database connection after deleting an event", async () => {
    await expect(deleteEventById(8)).resolves.toBe(true);

    expect(mocks.deleteEvent).toHaveBeenCalledWith(8, mocks.client);
    expect(mocks.client.release).toHaveBeenCalledOnce();
  });
});
