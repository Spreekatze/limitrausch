import { mapDatabaseEventRowToEvent } from "../eventDatabaseMapping.js";
import type { DatabaseEventRow } from "../../types/databaseRowSchema.js";
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
});
