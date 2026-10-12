import { mapRaidHelperGeneralEventDataToEvent } from "../mapping/eventRaidhelperMapping.js";
import { addEvent, getEvents } from "../store/eventStore.js";
import { raidHelperEventsResponseSchema } from "../types/raidhelperSchema.js";
import { getEventsFromRaidHelper } from "./raidHelperAPI.js";
import { HttpError } from "../errors/httpError.js";
import { DiscordGuild, RaidHelperImportResponse } from "@limitrausch/contracts";

export async function importRaidHelperEvents(
  server: DiscordGuild,
  fetchEvents = getEventsFromRaidHelper,
): Promise<RaidHelperImportResponse> {
  let imported = 0;
  let skipped = 0;
  let failed = 0;

  const raidHelperData = await fetchEvents(server.id);

  const result = raidHelperEventsResponseSchema.safeParse(raidHelperData);
  if (!result.success) {
    throw new HttpError(502, "Invalid answer from raid-helper.xyz");
  }

  const existingEventIds = new Set(
    (await getEvents()).map((event) => event.id),
  );

  for (const raidHelperEvent of result.data.postedEvents) {
    try {
      const mappedEvent = mapRaidHelperGeneralEventDataToEvent(
        raidHelperEvent,
        server,
      );

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

  return { success: true, imported, skipped, failed };
}
