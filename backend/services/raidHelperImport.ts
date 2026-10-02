import { mapRaidHelperEventToEvent } from "../mapping/eventTypeMapping.js";
import { addEvent, getEvents } from "../store/eventStore.js";
import {
  raidHelperEventsResponseSchema,
  RaidHelperImportResult,
} from "../types/raidhelperSchema.js";
import { getRaidHelperEvents } from "./raidHelperService.js";
import { HttpError } from "../errors/httpError.js";

export async function importRaidHelperEvents(
  serverId: string,
): Promise<RaidHelperImportResult> {
  let imported = 0;
  let skipped = 0;
  let failed = 0;

  const raidHelperData = await getRaidHelperEvents(serverId);

  const result = raidHelperEventsResponseSchema.safeParse(raidHelperData);
  if (!result.success) {
    throw new HttpError(502, "Invalid answer from raid-helper.xyz");
  }

  for (const raidHelperEvent of result.data.postedEvents) {
    try {
      const mappedEvent = mapRaidHelperEventToEvent(raidHelperEvent, serverId);

      const existingEvent = getEvents().find(
        (event) => event.id === mappedEvent.id,
      );

      if (existingEvent) {
        skipped++;
        continue;
      }

      addEvent(mappedEvent);
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
}
