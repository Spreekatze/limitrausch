import { EVENT_TYPE } from "@limitrausch/contracts";
import { describe, expect, it } from "vitest";
import {
  apiErrorCodeForStatus,
  apiErrorResponseSchema,
} from "../apiErrorSchema.js";
import {
  authStatusResponseSchema,
  authUserSchema,
  discordOAuthUserSchema,
  userPreferenceSchema,
} from "../authSchema.js";
import {
  createEventSchema,
  eventSchema,
  eventTimeRangeSchema,
  eventsResponseSchema,
  eventSignUpSchema,
  updateEventSchema,
} from "../eventSchema.js";
import {
  guildConfigResponseSchema,
  guildConfigSchema,
  userGuildSchema,
} from "../guildSchema.js";
import {
  localeSchema,
  localizedAliasesSchema,
  localizedLabelsSchema,
} from "../localizationSchema.js";
import { jobSchema } from "../jobSchema.js";

const event = {
  id: 1,
  lastUpdated: 123,
  eventType: 1,
  startTime: 100,
  endTime: 200,
  isPublic: false,
};

describe("shared API contracts", () => {
  it("accepts a valid event and rejects invalid core fields", () => {
    expect(eventSchema.parse(event)).toEqual(event);
    expect(eventSchema.safeParse({ ...event, eventType: -1 }).success).toBe(
      false,
    );
    expect(eventSchema.safeParse({ ...event, startTime: "100" }).success).toBe(
      false,
    );
  });

  it("enforces a strictly increasing event time range", () => {
    expect(
      eventTimeRangeSchema.safeParse({ startTime: 100, endTime: 101 }).success,
    ).toBe(true);

    for (const [startTime, endTime] of [
      [100, 100],
      [101, 100],
      [Number.NaN, 102],
      [100, Number.POSITIVE_INFINITY],
    ]) {
      expect(
        eventTimeRangeSchema.safeParse({ startTime, endTime }).success,
      ).toBe(false);
    }

    expect(
      eventSchema.safeParse({ ...event, endTime: event.startTime }).success,
    ).toBe(false);
    expect(
      createEventSchema.safeParse({
        eventType: 1,
        startTime: 100,
        endTime: 99,
        isPublic: false,
      }).success,
    ).toBe(false);
    expect(
      updateEventSchema.safeParse({ startTime: 100, endTime: 100 }).success,
    ).toBe(false);
    expect(updateEventSchema.safeParse({ startTime: 201 }).success).toBe(true);
    expect(updateEventSchema.safeParse({ endTime: 99 }).success).toBe(true);
  });

  it("accepts create/update payloads and excludes server-owned fields", () => {
    expect(
      createEventSchema.parse({
        eventType: 2,
        startTime: 1,
        endTime: 2,
        isPublic: false,
      }),
    ).toMatchObject({ eventType: 2 });
    const parsedCreate = createEventSchema.parse({
      ...event,
      id: 1,
      lastUpdated: 1,
    });
    expect(parsedCreate).not.toHaveProperty("id");
    expect(parsedCreate).not.toHaveProperty("lastUpdated");
    expect(
      updateEventSchema.parse({
        title: "Updated",
        raidHelperId: "external-id",
      }),
    ).not.toHaveProperty("raidHelperId");
    expect(updateEventSchema.parse({ title: "Updated" })).toEqual({
      title: "Updated",
    });
  });

  it("accepts an update with at least one field", () => {
    expect(updateEventSchema.safeParse({ title: "New title" }).success).toBe(
      true,
    );
  });

  it("rejects an empty update", () => {
    expect(updateEventSchema.safeParse({}).success).toBe(false);
  });

  it("validates signups and event response envelopes", () => {
    const signup = { id: 7, name: "Player", raidHelperId: "signup-7" };
    expect(eventSignUpSchema.parse(signup)).toEqual(signup);
    expect(eventSignUpSchema.safeParse({ id: "7" }).success).toBe(false);
    expect(
      eventSignUpSchema.safeParse({
        id: 7,
        jobFlexSecondPrio: [null],
      }).success,
    ).toBe(false);
    expect(
      eventsResponseSchema.parse({ postedEvents: [event] }).postedEvents,
    ).toHaveLength(1);
    expect(eventsResponseSchema.safeParse({ events: [] }).success).toBe(false);
  });

  it("validates authenticated and unauthenticated status responses", () => {
    const guest = { loggedIn: false, user: null };
    const user = {
      id: "user-1",
      username: "Alice",
      avatar: "avatar",
      manageableGuilds: [],
    };

    expect(authStatusResponseSchema.parse(guest)).toEqual(guest);
    expect(
      authStatusResponseSchema.parse({ loggedIn: true, user }),
    ).toMatchObject({
      loggedIn: true,
      user: { id: "user-1" },
    });
    expect(
      authStatusResponseSchema.safeParse({ loggedIn: false, user }).success,
    ).toBe(false);
    expect(
      authStatusResponseSchema.safeParse({ loggedIn: true, user: null })
        .success,
    ).toBe(false);
    expect(
      authUserSchema.safeParse({
        ...user,
        manageableGuilds: [{ id: "g", name: "G" }],
      }).success,
    ).toBe(false);
  });

  it("validates OAuth user", () => {
    const oauthUser = {
      id: "user-1",
      username: "alice",
      global_name: "Alice",
      avatar: "avatar",
      verified: true,
    };
    expect(discordOAuthUserSchema.safeParse(oauthUser).success).toBe(true);
    expect(
      discordOAuthUserSchema.safeParse({ ...oauthUser, verified: "yes" })
        .success,
    ).toBe(false);
  });

  it("validates user preferences", () => {
    expect(
      userPreferenceSchema.parse({
        theme: "dark",
        dashboard: { showUpcomingEvents: true },
      }),
    ).toMatchObject({ theme: "dark" });
    expect(userPreferenceSchema.safeParse({ theme: "sepia" }).success).toBe(
      false,
    );
    expect(
      userPreferenceSchema.safeParse({
        calendar: { filterEventTypes: ["1"] },
      }).success,
    ).toBe(false);
    expect(
      userPreferenceSchema.safeParse({
        calendar: { filterEventTypes: [EVENT_TYPE.RAID] },
      }).success,
    ).toBe(true);
  });

  it("validates guild payloads", () => {
    const guild = {
      id: "guild-1",
      name: "Guild",
      icon: null,
      hasEventManagingRights: true,
      isAdminOrOwner: false,
      botIsPresent: true,
    };
    expect(userGuildSchema.safeParse(guild).success).toBe(true);
    expect(
      guildConfigSchema.parse({
        id: "guild-1",
        name: "Guild",
        roleIDsAllowedToManageEvents: null,
      }),
    ).toMatchObject({ roleIDsAllowedToManageEvents: null });
    expect(
      guildConfigResponseSchema.safeParse({ guildConfig: null, guildRoles: [] })
        .success,
    ).toBe(true);
    expect(
      guildConfigResponseSchema.safeParse({
        guildConfig: null,
        guildRoles: [null],
      }).success,
    ).toBe(false);
  });

  it("validates localization", () => {
    expect(localeSchema.parse("de")).toBe("de");
    expect(localeSchema.safeParse("fr").success).toBe(false);
    expect(localizedLabelsSchema.parse({ de: "Gilde", en: "Guild" }).en).toBe(
      "Guild",
    );
    expect(
      localizedAliasesSchema.safeParse({ de: ["G"], en: ["Guild"] }).success,
    ).toBe(true);
    expect(
      localizedAliasesSchema.safeParse({ de: "G", en: ["Guild"] }).success,
    ).toBe(false);
  });

  it("validates job schemas", () => {
    expect(
      jobSchema.safeParse({
        id: 2,
        role: "Tank",
        name: { de: "Krieger", en: "Warrior" },
        raidHelperName: "WarriorFF",
      }).success,
    ).toBe(true);
    expect(
      jobSchema.safeParse({
        id: "invalid",
        role: "TANK",
        name: { de: "x", en: "x" },
      }).success,
    ).toBe(false);
  });

  it("maps HTTP statuses to stable API error codes", () => {
    expect(apiErrorCodeForStatus(400)).toBe("VALIDATION_ERROR");
    expect(apiErrorCodeForStatus(401)).toBe("UNAUTHORIZED");
    expect(apiErrorCodeForStatus(403)).toBe("INSUFFICIENT_PERMISSIONS");
    expect(apiErrorCodeForStatus(404)).toBe("NOT_FOUND");
    expect(apiErrorCodeForStatus(409)).toBe("CONFLICT");
    expect(apiErrorCodeForStatus(502)).toBe("UPSTREAM_ERROR");
    expect(apiErrorCodeForStatus(503)).toBe("SERVICE_UNAVAILABLE");
    expect(apiErrorCodeForStatus(504)).toBe("UPSTREAM_TIMEOUT");
    expect(apiErrorCodeForStatus(418)).toBe("REQUEST_FAILED");
    expect(apiErrorCodeForStatus(500)).toBe("INTERNAL_SERVER_ERROR");
    expect(apiErrorCodeForStatus(501)).toBe("INTERNAL_SERVER_ERROR");
    expect(
      apiErrorResponseSchema.safeParse({ error: { code: "NOT_FOUND" } })
        .success,
    ).toBe(true);
    expect(
      apiErrorResponseSchema.safeParse({ error: { code: "UNKNOWN" } }).success,
    ).toBe(false);
  });
});
