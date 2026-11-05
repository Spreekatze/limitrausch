import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { clientMock } = vi.hoisted(() => ({
  clientMock: {
    guilds: {
      fetch: vi.fn(),
    },
  },
}));

vi.mock("../client.js", () => ({ client: clientMock }));

import { client } from "../client.js";
import {
  getGuildMemberInfo,
  getGuildRoles,
  getGuilds,
  searchGuildMembers,
} from "../guildService.js";

const fetchGuildMock = vi.mocked(client.guilds.fetch);

function member(
  id: string,
  displayName: string,
  roleIds: string[] = [],
  admin = false,
) {
  return {
    id,
    displayName,
    roles: { cache: roleIds.map((roleId) => ({ id: roleId })) },
    permissions: { has: vi.fn(() => admin) },
  };
}

describe("Discord guild service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps Discord guild collections to the public guild shape", async () => {
    fetchGuildMock.mockResolvedValue([
      { id: "guild-1", name: "Guild One", icon: "icon-1" },
    ] as never);

    await expect(getGuilds()).resolves.toEqual([
      { id: "guild-1", name: "Guild One", icon: "icon-1" },
    ]);
  });

  it("returns owner status independently from admin status", async () => {
    const targetMember = member("user-1", "Alice", ["role-1"]);
    fetchGuildMock.mockResolvedValue({
      id: "guild-1",
      ownerId: "user-1",
      members: { fetch: vi.fn().mockResolvedValue(targetMember) },
    } as never);

    await expect(getGuildMemberInfo("guild-1", "user-1")).resolves.toEqual({
      userId: "user-1",
      guildId: "guild-1",
      roleIds: ["role-1"],
      isOwner: true,
      isAdmin: false,
    });
  });

  it("returns admin status independently from owner status", async () => {
    const targetMember = member("user-2", "Bob", ["role-2"], true);
    fetchGuildMock.mockResolvedValue({
      id: "guild-1",
      ownerId: "another-user",
      members: { fetch: vi.fn().mockResolvedValue(targetMember) },
    } as never);

    await expect(getGuildMemberInfo("guild-1", "user-2")).resolves.toEqual({
      userId: "user-2",
      guildId: "guild-1",
      roleIds: ["role-2"],
      isOwner: false,
      isAdmin: true,
    });
  });

  it("filters member suggestions by configured roles and limits the result to five", async () => {
    const matches = Array.from({ length: 12 }, (_, index) =>
      member(`user-${index}`, `Member ${index}`, [
        index % 2 === 0 ? "manager" : "member",
      ]),
    );
    const search = vi
      .fn()
      .mockResolvedValue(new Map(matches.map((item) => [item.id, item])));
    fetchGuildMock.mockResolvedValue({
      members: { search },
    } as never);

    await expect(
      searchGuildMembers("guild-1", "Alice", ["manager"]),
    ).resolves.toEqual([
      { id: "user-0", name: "Member 0" },
      { id: "user-2", name: "Member 2" },
      { id: "user-4", name: "Member 4" },
      { id: "user-6", name: "Member 6" },
      { id: "user-8", name: "Member 8" },
    ]);
    expect(search).toHaveBeenCalledWith({ query: "Alice", limit: 1000 });
  });

  it("avoids Discord requests when no suggestion roles are configured", async () => {
    await expect(searchGuildMembers("guild-1", "Alice", [])).resolves.toEqual(
      [],
    );
    expect(fetchGuildMock).not.toHaveBeenCalled();
  });

  it("reuses cached member searches for case-insensitive queries and role ordering", async () => {
    const search = vi.fn().mockResolvedValue(new Map());
    fetchGuildMock.mockResolvedValue({
      members: { search },
    } as never);

    await searchGuildMembers("guild-1", "Alice", ["manager", "lead"]);
    await searchGuildMembers("guild-1", "ALICE", ["lead", "manager"]);

    expect(search).toHaveBeenCalledOnce();
  });

  it("shares an in-flight member search for equivalent cache keys", async () => {
    let resolveSearch:
      ((members: Map<string, ReturnType<typeof member>>) => void) | undefined;
    const search = vi.fn(
      () =>
        new Promise<Map<string, ReturnType<typeof member>>>((resolve) => {
          resolveSearch = resolve;
        }),
    );
    fetchGuildMock.mockResolvedValue({
      members: { search },
    } as never);

    const firstSearch = searchGuildMembers("pending-guild", "Alex", [
      "manager",
    ]);
    const secondSearch = searchGuildMembers("pending-guild", "alex", [
      "manager",
    ]);

    await vi.waitFor(() => expect(search).toHaveBeenCalledOnce());
    resolveSearch?.(new Map<string, ReturnType<typeof member>>());
    await expect(Promise.all([firstSearch, secondSearch])).resolves.toEqual([
      [],
      [],
    ]);
  });

  it("keeps cached searches separate for different guilds, queries and roles", async () => {
    const search = vi.fn().mockResolvedValue(new Map());
    fetchGuildMock.mockResolvedValue({
      members: { search },
    } as never);

    await searchGuildMembers("guild-a", "Alex", ["manager"]);
    await searchGuildMembers("guild-b", "Alex", ["manager"]);
    await searchGuildMembers("guild-a", "Alice", ["manager"]);
    await searchGuildMembers("guild-a", "Alex", ["lead"]);

    expect(search).toHaveBeenCalledTimes(4);
  });

  it("expires cached searches exactly at the 30-second boundary", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(10_000);
    const search = vi
      .fn()
      .mockResolvedValueOnce(
        new Map([
          ["user-old", member("user-old", "Old result", ["manager"])],
        ]) as never,
      )
      .mockResolvedValueOnce(
        new Map([
          ["user-new", member("user-new", "New result", ["manager"])],
        ]) as never,
      );
    fetchGuildMock.mockResolvedValue({
      members: { search },
    } as never);

    await expect(
      searchGuildMembers("expiry-guild", "Alex", ["manager"]),
    ).resolves.toEqual([{ id: "user-old", name: "Old result" }]);
    now.mockReturnValue(40_000);
    await expect(
      searchGuildMembers("expiry-guild", "Alex", ["manager"]),
    ).resolves.toEqual([{ id: "user-new", name: "New result" }]);

    expect(search).toHaveBeenCalledTimes(2);
  });

  it("evicts failed searches so a later request can retry", async () => {
    const search = vi
      .fn()
      .mockRejectedValueOnce(new Error("Discord unavailable"))
      .mockResolvedValueOnce(new Map());
    fetchGuildMock.mockResolvedValue({
      members: { search },
    } as never);

    await expect(
      searchGuildMembers("retry-guild", "Alex", ["manager"]),
    ).rejects.toThrow("Discord unavailable");
    await expect(
      searchGuildMembers("retry-guild", "Alex", ["manager"]),
    ).resolves.toEqual([]);

    expect(search).toHaveBeenCalledTimes(2);
  });

  it("maps guild roles to the select-option shape", async () => {
    fetchGuildMock.mockResolvedValue({
      roles: {
        fetch: vi.fn().mockResolvedValue([
          { id: "role-1", name: "Manager" },
          { id: "role-2", name: "Member" },
        ]),
      },
    } as never);

    await expect(getGuildRoles("guild-1")).resolves.toEqual([
      { id: "role-1", name: "Manager" },
      { id: "role-2", name: "Member" },
    ]);
  });
});
