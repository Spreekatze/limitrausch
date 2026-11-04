import { mapDatabaseEventRowToEvent } from "../eventDatabaseMapping.js";
import type { DatabaseEventRow } from "../../types/databaseRowSchema.js";
import { JOBS } from "@limitrausch/contracts";
import { describe, expect, it } from "vitest";

const row: DatabaseEventRow = {
  id: 1,
  lastUpdated: "1",
  creatorId: null,
  creatorName: null,
  leaderId: null,
  leaderName: null,
  title: "Test event",
  description: null,
  imageUrl: null,
  startTime: "1",
  endTime: "2",
  eventType: 1,
  eventDifficulty: null,
  eventContent: "Enuo",
  eventGoal: null,
  discordGuildId: null,
  discordGuildName: null,
  discordGuildIcon: null,
  discordTextChannelId: null,
  discordTextChannelName: null,
  discordMessageId: null,
  raidHelperId: null,
  isPublic: false,
};

describe("mapDatabaseEventRowToEvent", () => {
  it("preserves event content from the database row", () => {
    expect(mapDatabaseEventRowToEvent(row).eventContent).toBe("Enuo");
  });

  it("maps related leaders and signup data, including job ids", () => {
    const job = JOBS.find((item) => item.raidHelperName === "WarriorFF");
    expect(job).toBeDefined();

    const event = mapDatabaseEventRowToEvent(
      { ...row, discordGuildId: "guild-1", creatorId: "creator-1" },
      [{ eventId: row.id, id: "coleader-1", name: "Co-leader" }],
      [
        {
          id: 12,
          eventId: row.id,
          discordUserId: "user-1",
          raidHelperId: "signup-1",
          status: null,
          jobFirstPrio: job!.id,
          jobFlexSecondPrio: [job!.id],
          usernameOnGuild: "Player",
        },
      ],
    );

    expect(event.creator).toBeUndefined();
    expect(event.coLeaders).toEqual([{ id: "coleader-1", name: "Co-leader" }]);
    expect(event.signUpCount).toBe(1);
    expect(event.signUps?.[0]).toMatchObject({
      id: 12,
      raidHelperId: "signup-1",
      userId: "user-1",
      name: "Player",
      jobFirstPrio: { id: job?.id },
      jobFlexSecondPrio: [{ id: job?.id }],
    });
  });
});
