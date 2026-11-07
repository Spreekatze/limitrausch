import { HttpError } from "../errors/httpError.js";
import logger from "../logger.js";
import {
  mapRaidHelperDetailledEventDataToEvent,
  mapRaidHelperGeneralEventDataToEvent,
} from "../mapping/eventRaidhelperMapping.js";
import {
  addEvent,
  getEventByRaidHelperId,
  getEvents,
  updateEventById,
} from "../store/eventStore.js";
import {
  raidHelperDetailedEventSchema,
  raidHelperEventsResponseSchema,
} from "../types/raidhelperSchema.js";
import {
  getEventFromRaidHelperById,
  getEventsFromRaidHelperByServer,
} from "./raidHelperAPI.js";
import { RaidHelperImportResponse, UserGuild } from "@limitrausch/contracts";

export async function importRaidHelperEventsFromGuild(
  guild: UserGuild,
  fetchEvents = getEventsFromRaidHelperByServer,
): Promise<RaidHelperImportResponse> {
  let imported = 0;
  let skipped = 0;
  let failed = 0;

  const raidHelperData = await fetchEvents(guild.id);

  const result = raidHelperEventsResponseSchema.safeParse(raidHelperData);
  if (!result.success) {
    throw new HttpError(502, "Invalid answer from raid-helper.xyz", {
      serverId: guild.id,
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
      if (existingRaidHelperEventIds.has(raidHelperEvent.id)) {
        skipped++;
        continue;
      }

      const mappedEvent = mapRaidHelperGeneralEventDataToEvent(
        raidHelperEvent,
        guild,
      );

      //TODO: add updating
      await addEvent(mappedEvent);
      existingRaidHelperEventIds.add(mappedEvent.raidHelperId);
      imported++;
    } catch (error) {
      failed++;
      logger.error(
        { err: error, serverId: guild.id, eventId: raidHelperEvent.id },
        "Failed to import RaidHelper event",
      );
    }
  }

  logger.info(
    { serverId: guild.id, imported, skipped, failed },
    "RaidHelper event import completed",
  );

  return { imported, updated: 0, skipped, failed };
}

export async function importRaidHelperEventById(
  guilds: UserGuild[],
  eventId: string,
  fetchEvents = getEventFromRaidHelperById,
): Promise<RaidHelperImportResponse> {
  let imported = 0;
  let updated = 0;
  let failed = 0;

  const raidHelperData = await fetchEvents(eventId);
  const result = raidHelperDetailedEventSchema.safeParse(raidHelperData);
  if (!result.success) {
    throw new HttpError(502, "Invalid answer from raid-helper.xyz", {
      eventId: eventId,
      validationIssues: result.error.issues.map(({ code, path }) => ({
        code,
        path,
      })),
    });
  }

  const existingEvent = await getEventByRaidHelperId(eventId);
  const guild = guilds.find((guild) => guild.id === result.data.serverId);
  if (!guild) {
    throw new HttpError(401, "User is not part of event guild");
  }

  try {
    const mappedEvent = mapRaidHelperDetailledEventDataToEvent(result.data);

    //TODO: add check for skip?
    if (existingEvent) {
      await updateEventById(existingEvent.id, mappedEvent);
      updated++;
    } else {
      await addEvent(mappedEvent, guild);
      imported++;
    }
  } catch (error) {
    failed++;
    logger.error(
      { err: error, eventId: eventId },
      "Failed to import RaidHelper event",
    );
  }

  logger.info(
    { eventId: eventId, imported, updated, skipped: 0, failed },
    "RaidHelper event import completed",
  );

  return { imported, updated, skipped: 0, failed };
}

export async function importRaidHelperEventsFromUser() {}
