import {
  createEventSchema,
  eventDiscordUserListSchema,
  eventDiscordUserSuggestionsSchema,
  updateEventSchema,
} from "@limitrausch/contracts";
import { guildMemberSearchQuerySchema } from "../../types/eventSchema.js";
import { describe, expect, it } from "vitest";

const members = Array.from({ length: 6 }, (_, index) => ({
  id: String(index),
  name: `Member ${index}`,
}));

describe("event Discord member limits", () => {
  it("normalizes and validates guild member search queries", () => {
    expect(guildMemberSearchQuerySchema.parse("  Alice  ")).toBe("Alice");
    expect(guildMemberSearchQuerySchema.safeParse(" A ").success).toBe(false);
    expect(
      guildMemberSearchQuerySchema.safeParse(" ".repeat(101)).success,
    ).toBe(false);
    expect(
      guildMemberSearchQuerySchema.safeParse("a".repeat(101)).success,
    ).toBe(false);
  });

  it("allows up to five member suggestions", () => {
    expect(
      eventDiscordUserSuggestionsSchema.safeParse(members.slice(0, 5)).success,
    ).toBe(true);
    expect(eventDiscordUserSuggestionsSchema.safeParse(members).success).toBe(
      false,
    );
  });

  it("allows more than five co-leaders when creating or updating an event", () => {
    const createEvent = {
      eventType: 1,
      startTime: 1,
      endTime: 2,
      isPublic: false,
    };

    expect(
      createEventSchema.safeParse({ ...createEvent, coLeaders: members })
        .success,
    ).toBe(true);
    expect(updateEventSchema.safeParse({ coLeaders: members }).success).toBe(
      true,
    );
    expect(eventDiscordUserListSchema.safeParse(members).success).toBe(true);
  });
});
