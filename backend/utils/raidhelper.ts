const serverId = "1408172814879559721";

type RaidHelperResult = { status: number; data?: unknown; error?: string };

async function getRaidHelperEvents(
  startTime?: string,
): Promise<RaidHelperResult> {
  const apiKey = process.env.RAID_HELPER_API_KEY;
  if (!apiKey) {
    return { status: 503, error: "Raid Helper API key is not configured" };
  }

  if (!startTime || !/^\d+$/.test(startTime)) {
    return { status: 400, error: "A valid startTime is required" };
  }

  try {
    const response = await fetch(
      `https://raid-helper.xyz/api/v4/servers/${serverId}/events`,
      {
        headers: {
          Authorization: apiKey,
          StartTimeFilter: startTime,
        },
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) {
      return {
        status: response.status,
        error: `Raid Helper API request failed with status ${response.status}`,
      };
    }

    const contentType = response.headers.get("content-type")?.split(";")[0];
    if (
      !contentType ||
      (contentType !== "application/json" && !contentType.endsWith("+json"))
    ) {
      return { status: 502, error: "Raid Helper API response is not JSON" };
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      return { status: 502, error: "Raid Helper API returned invalid JSON" };
    }

    return { status: response.status, data };
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return { status: 504, error: "Raid Helper API request timed out" };
    }

    return { status: 502, error: "Raid Helper API request failed" };
  }
}

export default getRaidHelperEvents;
