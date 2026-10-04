import { HttpError } from "../errors/httpError.js";
import { Event } from "../types/eventSchema.js";

export async function getEventsFromRaidHelper(
  serverId: string,
): Promise<unknown> {
  const allowedServerIds = new Set(
    (process.env.RAIDHELPER_DISCORDSERVER_ID_WHITELIST ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
  if (!allowedServerIds.has(serverId)) {
    throw new HttpError(
      403,
      `Server ${serverId} is not allowed to fetch Raid Helper events`,
    );
  }

  const apiKey = process.env.RAID_HELPER_API_KEY;
  if (!apiKey) {
    throw new HttpError(503, "Raid Helper API key is not configured");
  }

  try {
    const response = await fetch(
      `https://raid-helper.xyz/api/v4/servers/${serverId}/events`,
      {
        headers: {
          Authorization: apiKey,
          IncludeSignUps: "true", //TODO: why isnt this working?
        },
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) {
      throw new HttpError(
        response.status,
        `Raid Helper API request failed with status ${response.status}`,
      );
    }

    const contentType = response.headers.get("content-type")?.split(";")[0];
    if (
      !contentType ||
      (contentType !== "application/json" && !contentType.endsWith("+json"))
    ) {
      throw new HttpError(502, "Raid Helper API response is not JSON");
    }

    try {
      return await response.json();
    } catch {
      throw new HttpError(502, "Raid Helper API returned invalid JSON");
    }
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    if (error instanceof Error && error.name === "TimeoutError") {
      throw new HttpError(504, "Raid Helper API request timed out");
    }

    throw new HttpError(502, "Raid Helper API request failed");
  }
}

//TODO: implement create, update, delete
export async function createEventAtRaidHelper(event: Event): Promise<void> {}

export async function updateEventAtRaidHelper(event: Event): Promise<void> {}

export async function deleteEventAtRaidHelper(event: Event): Promise<void> {}
