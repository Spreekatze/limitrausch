import type { PoolClient } from "pg";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ensureDiscordGuildUser } from "../discordGuildUser.js";
import {
  upsertDiscordGuild,
  upsertDiscordGuildWithConfig,
} from "../discordGuild.js";
import { upsertDiscordTextChannel } from "../discordTextChannel.js";
import { ensureDiscordUser } from "../discordUser.js";
import { deleteEvent, insertEvent, updateEvent } from "../event.js";
import {
  deleteAllCoLeadersFromEvent,
  insertEventCoLeader,
} from "../eventCoLeader.js";
import {
  deleteAllSignUpsFromEvent,
  insertEventSignUp,
} from "../eventSignUp.js";
import { upsertWebsiteUser } from "../websiteUser.js";
import type { CreateEvent } from "@limitrausch/contracts";

type MockQueryResult = {
  rows: Record<string, unknown>[];
  rowCount: number | null;
};
type MockQueryArguments = [sql: string, values?: unknown[]];
const queryMock = vi.fn(
  async (..._args: MockQueryArguments): Promise<MockQueryResult> => ({
    rows: [],
    rowCount: 1,
  }),
);
const client = { query: queryMock } as unknown as PoolClient;

describe("database query adapters", () => {
  beforeEach(() => {
    queryMock.mockReset();
    queryMock.mockResolvedValue({ rows: [], rowCount: 1 });
  });

  it("uses parameterized upserts for guild and channel data", async () => {
    const guild = {
      id: "guild-1",
      name: "Guild",
      icon: null,
      botIsPresent: true,
      hasEventManagingRights: true,
      isAdminOrOwner: false,
    };

    await upsertDiscordGuild(guild, client);
    expect(queryMock.mock.calls[0][0]).toContain('ON CONFLICT ("id")');
    expect(queryMock.mock.calls[0][1]).toEqual(["guild-1", "Guild", null]);

    await upsertDiscordGuildWithConfig(
      "guild-1",
      {
        id: "guild-1",
        name: "Guild",
        roleIDsAllowedToManageEvents: ["role-1"],
        roleIDsBannedFromParticipating: [],
      },
      client,
    );
    expect(queryMock.mock.calls[1][1]).toEqual([
      "guild-1",
      "Guild",
      null,
      ["role-1"],
      [],
    ]);

    await upsertDiscordTextChannel("channel-1", "Events", "guild-1", client);
    expect(queryMock.mock.calls[2][1]).toEqual([
      "channel-1",
      "Events",
      "guild-1",
    ]);
  });

  it("inserts Discord users and refreshes their guild display names", async () => {
    await ensureDiscordUser({ id: "user-1", name: "Alice" }, client);
    await ensureDiscordGuildUser(
      { id: "user-1", name: "Alice Aetheris" },
      "guild-1",
      client,
    );

    expect(queryMock).toHaveBeenCalledTimes(3);
    expect(queryMock.mock.calls.map((call) => call[1])).toEqual([
      ["user-1"],
      ["user-1"],
      ["user-1", "guild-1", "Alice Aetheris"],
    ]);
    expect(queryMock.mock.calls[2][0]).toContain(
      'ON CONFLICT ("discordUserId", "discordGuildId")',
    );
  });

  it("upserts user preferences without replacing stored preferences with null", async () => {
    await upsertWebsiteUser(
      {
        id: "user-1",
        username: "Alice",
        avatar: "avatar",
        manageableGuilds: [],
      },
      client,
    );

    expect(queryMock.mock.calls[0][0]).toContain(
      '"userPreferences" = COALESCE(',
    );
    expect(queryMock.mock.calls[0][1]).toEqual(["user-1", undefined]);
  });

  it("passes persisted event fields as query parameters without interpolating values", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 7, lastUpdated: "123" }],
      rowCount: 1,
    });

    const event: CreateEvent = {
      creator: { id: "creator-id-';--", name: "creator-name-';--" },
      leader: { id: "leader-id-';--", name: "leader-name-';--" },
      title: "title-';--",
      description: "description-';--",
      imageUrl: "https://example.com/image-';--.png",
      startTime: 100,
      endTime: 200,
      eventType: 1,
      eventDifficulty: 2,
      eventContent: "content-';--",
      eventGoal: "goal-';--",
      discordGuild: {
        id: "guild-id-';--",
        textChannelId: "channel-id-';--",
        messageId: "message-id-';--",
      },
      raidHelperId: "raidhelper-id-';--",
      isPublic: false,
    };

    const result = await insertEvent(event, client);

    expect(result).toEqual({ id: 7, lastUpdated: 123 });
    expect(queryMock).toHaveBeenCalledOnce();

    const [sql, values] = queryMock.mock.calls[0];
    const normalizedSql = sql.replace(/\s+/g, " ").trim();

    const expectedInsertSql = `
      INSERT INTO "Event" (
        "lastUpdated", "creatorId", "leaderId", "title", "description",
        "imageUrl", "startTime", "endTime", "eventType", "eventDifficulty",
        "eventContent", "eventGoal", "discordGuildId", "discordTextChannelId",
        "discordMessageId", "raidHelperId", "isPublic"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16, $17
      )
    `
      .replace(/\s+/g, " ")
      .trim();

    expect(normalizedSql).toContain(expectedInsertSql);
    expect(normalizedSql).toContain('RETURNING "id", "lastUpdated"');
    for (const value of [
      event.creator?.id,
      event.creator?.name,
      event.leader?.id,
      event.leader?.name,
      event.title,
      event.description,
      event.imageUrl,
      event.eventContent,
      event.eventGoal,
      event.discordGuild?.id,
      event.discordGuild?.textChannelId,
      event.discordGuild?.messageId,
      event.raidHelperId,
    ]) {
      expect(sql).not.toContain(value);
    }

    expect(values).toEqual([
      expect.any(Number), // lastUpdated
      event.creator?.id,
      event.leader?.id,
      event.title,
      event.description,
      event.imageUrl,
      event.startTime,
      event.endTime,
      event.eventType,
      event.eventDifficulty,
      event.eventContent,
      event.eventGoal,
      event.discordGuild?.id,
      event.discordGuild?.textChannelId,
      event.discordGuild?.messageId,
      event.raidHelperId,
      event.isPublic,
    ]);
  });

  it("updates and deletes events with parameterized IDs", async () => {
    await updateEvent(['"title" = $1'], ["New title", 7], client);
    expect(queryMock.mock.calls[0][0]).toContain('WHERE "id" = $2');
    expect(queryMock.mock.calls[0][1]).toEqual(["New title", 7]);

    queryMock.mockResolvedValueOnce({ rows: [{ id: 7 }], rowCount: 1 });
    await expect(deleteEvent(7, client)).resolves.toBe(true);
    expect(queryMock.mock.calls[1][1]).toEqual([7]);

    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    await expect(deleteEvent(8, client)).resolves.toBe(false);
  });

  it("should update multiple event fields with correct parameters", async () => {
    const assignments = [
      '"title" = $1',
      '"description" = $2',
      '"isPublic" = $3',
    ];
    const values = ["Updated Event", "New Description", true, 7];

    await updateEvent(assignments, values, client);

    expect(queryMock).toHaveBeenCalledWith(
      `UPDATE "Event" SET "title" = $1, "description" = $2, "isPublic" = $3 WHERE "id" = $4`,
      values,
    );
  });

  it("inserts and replaces event signup and co-leader relations", async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: 12 }], rowCount: 1 });
    await expect(
      insertEventSignUp(
        {
          raidHelperId: "signup-1",
          userId: "user-1",
          status: "Late",
        },
        7,
        client,
      ),
    ).resolves.toBe(12);
    expect(queryMock.mock.calls[0][1]).toEqual([
      7,
      "user-1",
      "signup-1",
      "Late",
      undefined,
      undefined,
    ]);

    await insertEventCoLeader("user-2", 7, client);
    await deleteAllCoLeadersFromEvent(7, client);
    await deleteAllSignUpsFromEvent(7, client);
    expect(queryMock.mock.calls[1][1]).toEqual(["user-2", 7]);
    expect(queryMock.mock.calls[2][1]).toEqual([7]);
    expect(queryMock.mock.calls[3][1]).toEqual([7]);
  });

  it("propagates database errors when inserting events", async () => {
    const error = new Error("Database connection failed");
    queryMock.mockRejectedValueOnce(error);

    await expect(
      insertEvent(
        {
          title: "Test",
          description: "Description",
          startTime: 100,
          endTime: 200,
          eventType: 1,
          isPublic: false,
        },
        client,
      ),
    ).rejects.toThrow("Database connection failed");
  });
});
