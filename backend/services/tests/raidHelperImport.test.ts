import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "../../errors/httpError.js";
import { getEvents } from "../../store/eventStore.js";
import type { RaidHelperEvent } from "../../types/raidhelperSchema.js";
import { importRaidHelperEvents } from "../raidHelperImport.js";
import { createRaidHelperEvents, validServer } from "./raidHelperTestUtils.js";

const mockStore = vi.hoisted(() => ({
  events: [] as { id: number; raidHelperId?: string }[],
  nextId: 1,
}));

vi.mock("../../store/eventStore.js", () => ({
  getEvents: vi.fn(async () => mockStore.events),
  addEvent: vi.fn(async (event: { raidHelperId?: string }) => {
    const storedEvent = { ...event, id: mockStore.nextId++ };
    mockStore.events.push(storedEvent);
    return storedEvent;
  }),
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

describe("importRaidHelperEvents", () => {
  // TODO: Valid test coverage checklist for this service
  // DONE - imports valid events and counts failed entries without stopping the batch
  // DONE - skips events that are already present in the store
  // DONE - invalid payload shape throws the expected HttpError
  // DONE - upstream HttpError from the fetch callback is rethrown
  // DONE - empty postedEvents should return imported/skipped/failed = 0
  // - all events already exist in store should return imported: 0, skipped: N, failed: 0
  // - invalid/missing channel mapping should count as failed without aborting batch
  // - store remains unchanged when a batch contains a failing event
  // - invalid payload shape without postedEvents should throw HttpError 502

  beforeEach(() => {
    mockStore.events.length = 0;
    mockStore.nextId = 1;
  });

  it("works fine when there are no events in the import", async () => {
    const result = await importRaidHelperEvents(
      validServer,
      buildFetchEvents([]),
    );

    expect(result).toEqual({
      success: true,
      imported: 0,
      skipped: 0,
      failed: 0,
    });
    expect(await getEvents()).toHaveLength(0);
  });

  it("imports valid events and counts failed rows without stopping the batch", async () => {
    const result = await importRaidHelperEvents(
      validServer,
      buildFetchEvents(),
    );

    expect(result).toEqual({
      success: true,
      imported: 2,
      skipped: 0,
      failed: 1,
    });

    const storedEvents = await getEvents();
    expect(storedEvents).toHaveLength(2);
    expect(storedEvents.map((event) => event.id)).toEqual([1, 2]);
    expect(storedEvents.map((event) => event.raidHelperId)).toEqual([
      raidHelperEvents[2].id,
      raidHelperEvents[0].id,
    ]);
    expect(storedEvents[0].raidHelperId).toBe(raidHelperEvents[2].id);
  });

  it("skips events that were already imported in the store", async () => {
    await importRaidHelperEvents(validServer, buildFetchEvents());

    const result = await importRaidHelperEvents(
      validServer,
      buildFetchEvents(),
    );

    expect(result).toEqual({
      success: true,
      imported: 0,
      skipped: 2,
      failed: 1,
    });
  });

  it("rejects invalid RaidHelper payloads with the expected HttpError", async () => {
    await expect(
      importRaidHelperEvents(validServer, async () => ({ hello: "hello" })),
    ).rejects.toThrow("Invalid answer from raid-helper.xyz");
  });

  it("rethrows HttpErrors from the upstream RaidHelper API", async () => {
    const fetchEvents = async () => {
      throw new HttpError(
        502,
        "Raid Helper API request failed with status 500",
      );
    };

    await expect(
      importRaidHelperEvents(validServer, fetchEvents),
    ).rejects.toMatchObject({
      name: "HttpError",
      status: 502,
      message: "Raid Helper API request failed with status 500",
    });
  });
});
