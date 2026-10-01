import express from "express";

const router = express.Router();
const serverId = "1408172814879559721";

router.get("/events", async (request, response) => {
  const apiKey = process.env.RAID_HELPER_API_KEY;
  if (!apiKey) {
    return response
      .status(503)
      .json({ error: "Raid Helper API key is not configured" });
  }

  const startTime = request.query.startTime;
  if (typeof startTime !== "string" || !/^\d+$/.test(startTime)) {
    return response
      .status(400)
      .json({ error: "A valid startTime is required" });
  }

  try {
    const upstreamResponse = await fetch(
      `https://raid-helper.xyz/api/v4/servers/${serverId}/events`,
      {
        headers: {
          Authorization: apiKey,
          StartTimeFilter: startTime,
        },
      },
    );
    const responseBody = await upstreamResponse.text();
    const contentType = upstreamResponse.headers.get("content-type");

    response.status(upstreamResponse.status);
    if (contentType) {
      response.set("Content-Type", contentType);
    }
    return response.send(responseBody);
  } catch {
    return response
      .status(502)
      .json({ error: "Raid Helper API is unavailable" });
  }
});

export default router;
