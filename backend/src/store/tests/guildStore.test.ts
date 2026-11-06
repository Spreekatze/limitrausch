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
    upsertDiscordGuildWithConfig: vi.fn(),
  };
});

vi.mock("../../database/databaseConnection.js", () => ({ pool: mocks.pool }));
vi.mock("../../database/discordGuild.js", () => ({
  upsertDiscordGuild: mocks.upsertDiscordGuild,
  upsertDiscordGuildWithConfig: mocks.upsertDiscordGuildWithConfig,
}));

import {
  addDiscordGuild,
  getDiscordGuild,
  getDiscordGuildManagerRoles,
  upsertGuildConfig,
} from "../guildStore.js";

describe("guild store", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.pool.connect.mockResolvedValue(mocks.client);
    mocks.pool.query.mockResolvedValue({ rows: [] });
    mocks.client.query.mockResolvedValue({ rows: [], rowCount: 1 });
  });

  it("adds a guild in a transaction and releases the client", async () => {
    const guild = {
      id: "guild-1",
      name: "Guild",
      icon: null,
      hasEventManagingRights: true,
      isAdminOrOwner: false,
      botIsPresent: true,
    };

    await addDiscordGuild(guild);

    expect(mocks.client.query.mock.calls.map(([sql]) => sql)).toEqual([
      "BEGIN",
      "COMMIT",
    ]);
    expect(mocks.upsertDiscordGuild).toHaveBeenCalledWith(guild, mocks.client);
    expect(mocks.client.release).toHaveBeenCalledOnce();
  });

  it("rolls back failed guild writes", async () => {
    const error = new Error("write failed");
    mocks.upsertDiscordGuild.mockRejectedValue(error);

    await expect(
      addDiscordGuild({
        id: "guild-1",
        name: "Guild",
        icon: null,
        hasEventManagingRights: true,
        isAdminOrOwner: false,
        botIsPresent: true,
      }),
    ).rejects.toBe(error);
    expect(mocks.client.query.mock.calls.map(([sql]) => sql)).toEqual([
      "BEGIN",
      "ROLLBACK",
    ]);
    expect(mocks.client.release).toHaveBeenCalledOnce();
  });

  it("returns guild config rows or null when no guild exists", async () => {
    const config = {
      id: "guild-1",
      name: "Guild",
      icon: null,
      rolesAllowedToManageEvents: ["role-1"],
      rolesBannedFromParticipating: [],
    };
    mocks.pool.query.mockResolvedValueOnce({ rows: [config] });
    await expect(getDiscordGuild("guild-1")).resolves.toEqual(config);

    mocks.pool.query.mockResolvedValueOnce({ rows: [] });
    await expect(getDiscordGuild("missing")).resolves.toBeNull();
  });

  it("propagates database errors when reading a guild config", async () => {
    const error = new Error("guild query failed");
    mocks.pool.query.mockRejectedValueOnce(error);

    await expect(getDiscordGuild("guild-1")).rejects.toBe(error);
  });

  it("returns configured manager roles and an empty list for missing or null config", async () => {
    mocks.pool.query.mockResolvedValueOnce({
      rows: [{ rolesAllowedToManageEvents: ["role-1"] }],
    });
    await expect(getDiscordGuildManagerRoles("guild-1")).resolves.toEqual([
      "role-1",
    ]);

    mocks.pool.query.mockResolvedValueOnce({ rows: [] });
    await expect(getDiscordGuildManagerRoles("missing")).resolves.toEqual([]);

    mocks.pool.query.mockResolvedValueOnce({
      rows: [{ rolesAllowedToManageEvents: null }],
    });
    await expect(getDiscordGuildManagerRoles("guild-1")).resolves.toEqual([]);
  });

  it("propagates database errors when reading manager roles", async () => {
    const error = new Error("manager roles query failed");
    mocks.pool.query.mockRejectedValueOnce(error);

    await expect(getDiscordGuildManagerRoles("guild-1")).rejects.toBe(error);
  });

  it("upserts guild config in a transaction", async () => {
    const config = {
      id: "guild-1",
      name: "Guild",
      roleIDsAllowedToManageEvents: ["manager"],
      roleIDsBannedFromParticipating: [],
    };

    await upsertGuildConfig("guild-1", config);

    expect(mocks.client.query.mock.calls.map(([sql]) => sql)).toEqual([
      "BEGIN",
      "COMMIT",
    ]);
    expect(mocks.upsertDiscordGuildWithConfig).toHaveBeenCalledWith(
      "guild-1",
      config,
      mocks.client,
    );
    expect(mocks.client.release).toHaveBeenCalledOnce();
  });

  it("rolls back and releases the client when a guild config write fails", async () => {
    const error = new Error("guild config write failed");
    const config = {
      id: "guild-1",
      name: "Guild",
      roleIDsAllowedToManageEvents: ["manager"],
      roleIDsBannedFromParticipating: [],
    };
    mocks.upsertDiscordGuildWithConfig.mockRejectedValue(error);

    await expect(upsertGuildConfig("guild-1", config)).rejects.toBe(error);

    expect(mocks.client.query.mock.calls.map(([sql]) => sql)).toEqual([
      "BEGIN",
      "ROLLBACK",
    ]);
    expect(mocks.client.release).toHaveBeenCalledOnce();
  });
});
