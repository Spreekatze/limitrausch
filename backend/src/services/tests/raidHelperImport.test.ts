import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "../../errors/httpError.js";
import {
  addEvent,
  getEventByRaidHelperId,
  getEvents,
  updateEventById,
} from "../../store/eventStore.js";
import type {
  RaidHelperDetailedEvent,
  RaidHelperEvent,
} from "../../types/raidhelperSchema.js";
import {
  importRaidHelperEventById,
  importRaidHelperEventsFromGuild,
} from "../raidHelperImport.js";
import { createRaidHelperEvents, validServer } from "./raidHelperTestUtils.js";

const mockStore = vi.hoisted(() => ({
  events: [] as { id: number; raidHelperId?: string; title?: string }[],
  nextId: 1,
}));

vi.mock("../../store/eventStore.js", () => ({
  getEvents: vi.fn(async () => mockStore.events),
  getEventByRaidHelperId: vi.fn(async (id: string) =>
    mockStore.events.find((event) => event.raidHelperId === id),
  ),
  addEvent: vi.fn(async (event: { raidHelperId?: string; title?: string }) => {
    const storedEvent = { ...event, id: mockStore.nextId++ };
    mockStore.events.push(storedEvent);
    return storedEvent;
  }),
  updateEventById: vi.fn(
    async (id: number, event: { raidHelperId?: string; title?: string }) => {
      const storedEvent = mockStore.events.find(
        (candidate) => candidate.id === id,
      );
      if (storedEvent) {
        Object.assign(storedEvent, event);
      }
      return storedEvent;
    },
  ),
}));

const raidHelperEvents = createRaidHelperEvents();
const buildFetchEvents =
  (postedEvents: RaidHelperEvent[] = raidHelperEvents) =>
  async () => ({
    pages: 1,
    eventsOverall: postedEvents.length,
    eventsTransmitted: postedEvents.length,
    currentPage: 1,
    postedEvents,
  });

const buildDetailedEvent = (
  overrides: Partial<RaidHelperDetailedEvent> = {},
): RaidHelperDetailedEvent => ({
  id: "event-detail-1",
  date: "2026-11-07",
  time: "18:00",
  color: "ffffff",
  title: "Detailed event",
  creator: { id: "creator-1", name: "Creator 1" },
  endTime: 2000,
  signUps: [],
  leaderId: "leader-1",
  serverId: validServer.id,
  channelId: "channel-detail-1",
  coLeaders: [],
  startTime: 1000,
  leaderName: "Leader 1",
  templateId: "template-detail-1",
  channelName: "raids",
  channelType: "text",
  closingTime: 1500,
  description: "Detailed event description",
  lastUpdated: 1000,
  advancedSettings: {
    image: "https://example.com/event.png",
    limit: 10,
    duration: 60,
  },
  ...overrides,
});

describe("importRaidHelperEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.events.length = 0;
    mockStore.nextId = 1;
  });

  it("works fine when there are no events in the import", async () => {
    const result = await importRaidHelperEventsFromGuild(
      validServer,
      buildFetchEvents([]),
    );

    expect(result).toEqual({
      imported: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
    });
    expect(await getEvents()).toHaveLength(0);
  });

  it("imports valid events and counts failed rows without stopping the batch", async () => {
    const result = await importRaidHelperEventsFromGuild(
      validServer,
      buildFetchEvents(),
    );

    expect(result).toEqual({
      imported: 2,
      updated: 0,
      skipped: 0,
      failed: 1,
    });

    const storedEvents = await getEvents();
    expect(storedEvents).toHaveLength(2);
    expect(storedEvents.map((event) => event.id)).toEqual([1, 2]);
    expect(storedEvents.map((event) => event.raidHelperId)).toEqual([
      raidHelperEvents[0].id,
      raidHelperEvents[2].id,
    ]);
  });

  it("skips events that were already imported in the store", async () => {
    await importRaidHelperEventsFromGuild(validServer, buildFetchEvents());

    const result = await importRaidHelperEventsFromGuild(
      validServer,
      buildFetchEvents(),
    );

    expect(result).toEqual({
      imported: 0,
      updated: 0,
      skipped: 2,
      failed: 1,
    });
  });

  it("counts every event as skipped when all imported IDs already exist", async () => {
    mockStore.events.push(
      ...raidHelperEvents.map((event, index) => ({
        id: index + 1,
        raidHelperId: event.id,
      })),
    );

    await expect(
      importRaidHelperEventsFromGuild(validServer, buildFetchEvents()),
    ).resolves.toEqual({
      imported: 0,
      updated: 0,
      skipped: raidHelperEvents.length,
      failed: 0,
    });
    expect(await getEvents()).toHaveLength(raidHelperEvents.length);
  });

  it("imports a duplicate event only once when it appears twice in one batch", async () => {
    const duplicateEvents = [raidHelperEvents[0], raidHelperEvents[0]];

    await expect(
      importRaidHelperEventsFromGuild(
        validServer,
        buildFetchEvents(duplicateEvents),
      ),
    ).resolves.toEqual({
      imported: 1,
      updated: 0,
      skipped: 1,
      failed: 0,
    });
    expect(await getEvents()).toHaveLength(1);
  });

  it("imports a valid detailed event for a guild the user belongs to", async () => {
    const detailedEvent = buildDetailedEvent();
    const fetchEvent = vi.fn(async () => detailedEvent);

    await expect(
      importRaidHelperEventById([validServer], detailedEvent.id, fetchEvent),
    ).resolves.toEqual({ imported: 1, updated: 0, skipped: 0, failed: 0 });

    expect(fetchEvent).toHaveBeenCalledWith(detailedEvent.id);
    expect(getEventByRaidHelperId).toHaveBeenCalledWith(detailedEvent.id);
    expect(addEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        raidHelperId: detailedEvent.id,
        title: detailedEvent.title,
        discordGuild: expect.objectContaining({ id: validServer.id }),
      }),
      validServer,
    );
    expect(await getEvents()).toHaveLength(1);
  });

  it("updates an existing event imported from RaidHelper", async () => {
    const detailedEvent = buildDetailedEvent();
    mockStore.events.push({
      id: 8,
      raidHelperId: detailedEvent.id,
      title: "Old title",
    });

    await expect(
      importRaidHelperEventById(
        [validServer],
        detailedEvent.id,
        async () => detailedEvent,
      ),
    ).resolves.toEqual({ imported: 0, updated: 1, skipped: 0, failed: 0 });

    expect(updateEventById).toHaveBeenCalledWith(
      8,
      expect.objectContaining({ title: detailedEvent.title }),
    );
    expect(mockStore.events[0].title).toBe(detailedEvent.title);
  });

  it("counts a failed detailed-event write without rejecting the import", async () => {
    const detailedEvent = buildDetailedEvent();
    vi.mocked(addEvent).mockRejectedValueOnce(
      new Error("database unavailable"),
    );

    await expect(
      importRaidHelperEventById(
        [validServer],
        detailedEvent.id,
        async () => detailedEvent,
      ),
    ).resolves.toEqual({ imported: 0, updated: 0, skipped: 0, failed: 1 });
  });

  it("counts a failed update without rejecting the import", async () => {
    const detailedEvent = buildDetailedEvent();

    mockStore.events.push({
      id: 8,
      raidHelperId: detailedEvent.id,
      title: "Old title",
    });

    vi.mocked(updateEventById).mockRejectedValueOnce(
      new Error("database unavailable"),
    );

    await expect(
      importRaidHelperEventById(
        [validServer],
        detailedEvent.id,
        async () => detailedEvent,
      ),
    ).resolves.toEqual({
      imported: 0,
      updated: 0,
      skipped: 0,
      failed: 1,
    });
  });

  it("rejects a detailed event when the user is not in its guild", async () => {
    const detailedEvent = buildDetailedEvent({ serverId: "another-guild" });

    await expect(
      importRaidHelperEventById(
        [validServer],
        detailedEvent.id,
        async () => detailedEvent,
      ),
    ).rejects.toMatchObject({ name: "HttpError", status: 401 });
    expect(addEvent).not.toHaveBeenCalled();
  });

  it("rejects invalid detailed-event payloads with the expected HttpError", async () => {
    await expect(
      importRaidHelperEventById([validServer], "event-detail-1", async () => ({
        id: "invalid",
      })),
    ).rejects.toMatchObject({
      name: "HttpError",
      status: 502,
      logContext: { eventId: "event-detail-1" },
    });
    expect(getEventByRaidHelperId).not.toHaveBeenCalled();
  });

  it("rejects invalid RaidHelper payloads with the expected HttpError", async () => {
    await expect(
      importRaidHelperEventsFromGuild(validServer, async () => ({
        hello: "hello",
      })),
    ).rejects.toMatchObject({
      name: "HttpError",
      status: 502,
      logContext: { serverId: validServer.id },
    });
  });

  it("rejects a response missing the required event collection", async () => {
    await expect(
      importRaidHelperEventsFromGuild(validServer, async () => ({
        pages: 1,
        eventsOverall: 0,
        eventsTransmitted: 0,
        currentPage: 1,
      })),
    ).rejects.toMatchObject({
      name: "HttpError",
      status: 502,
      logContext: { serverId: validServer.id },
    });
    expect(await getEvents()).toEqual([]);
  });

  it("rethrows HttpErrors from the upstream RaidHelper API", async () => {
    const fetchEvents = async () => {
      throw new HttpError(
        502,
        "Raid Helper API request failed with status 500",
      );
    };

    await expect(
      importRaidHelperEventsFromGuild(validServer, fetchEvents),
    ).rejects.toMatchObject({
      name: "HttpError",
      status: 502,
      message: "Raid Helper API request failed with status 500",
    });
  });
});
