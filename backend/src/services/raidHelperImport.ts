import { HttpError } from "../errors/httpError.js";
import logger from "../logger.js";
import { mapRaidHelperGeneralEventDataToEvent } from "../mapping/eventRaidhelperMapping.js";
import { addEvent, getEvents } from "../store/eventStore.js";
import { raidHelperEventsResponseSchema } from "../types/raidhelperSchema.js";
import { getEventsFromRaidHelper } from "./raidHelperAPI.js";
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
    throw new HttpError(502, "Invalid answer from raid-helper.xyz", {
      serverId: server.id,
      validationIssues: result.error.issues.map(({ code, path }) => ({
        code,
        path,
      })),
    });
  }

  const existingEvents = await getEvents();
  const existingRaidHelperEventIds = new Set(
    existingEvents.map((event) => event.raidHelperId),
  );
  result.data.postedEvents.sort((a, b) => a.lastUpdated - b.lastUpdated);

  for (const raidHelperEvent of result.data.postedEvents) {
    try {
      const mappedEvent = mapRaidHelperGeneralEventDataToEvent(
        raidHelperEvent,
        server,
      );

      if (existingRaidHelperEventIds.has(mappedEvent.raidHelperId)) {
        skipped++;
        continue;
      }

      await addEvent(mappedEvent);
      existingRaidHelperEventIds.add(mappedEvent.raidHelperId);
      imported++;
    } catch (error) {
      failed++;
      logger.error(
        { err: error, serverId: server.id, eventId: raidHelperEvent.id },
        "Failed to import RaidHelper event",
      );
    }
  }

  logger.info(
    { serverId: server.id, imported, skipped, failed },
    "RaidHelper event import completed",
  );

  return { success: true, imported, skipped, failed };
}
