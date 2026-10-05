import { mapRaidHelperEventToEvent } from "../mapping/eventTypeMapping.js";
import { addEvent, getEvents } from "../store/eventStore.js";
import {
  raidHelperEventsResponseSchema,
  RaidHelperImportResult,
} from "../types/raidhelperSchema.js";
import { getEventsFromRaidHelper } from "./raidHelperAPI.js";
import { HttpError } from "../errors/httpError.js";

export async function importRaidHelperEvents(
  serverId: string,
  fetchEvents = getEventsFromRaidHelper,
): Promise<RaidHelperImportResult> {
  let imported = 0;
  let skipped = 0;
  let failed = 0;

  const raidHelperData = await fetchEvents(serverId);

  const result = raidHelperEventsResponseSchema.safeParse(raidHelperData);
  if (!result.success) {
    throw new HttpError(502, "Invalid answer from raid-helper.xyz");
  }

  const existingEventIds = new Set((await getEvents()).map((event) => event.id));

  for (const raidHelperEvent of result.data.postedEvents) {
    try {
      const mappedEvent = mapRaidHelperEventToEvent(raidHelperEvent, serverId);

      if (existingEventIds.has(mappedEvent.id)) {
        skipped++;
        continue;
      }

      await addEvent(mappedEvent);
      existingEventIds.add(mappedEvent.id);
      imported++;
    } catch (error) {
      failed++;
      console.error(
        `Failed to import RaidHelper event ${raidHelperEvent.id}:`,
        error,
      );
    }
  }

  return { imported, skipped, failed };
  // return result;
}
