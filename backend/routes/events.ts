import express from "express";
import requireAdmin from "../middleware/auth.js";
import getRaidHelperEvents from "../utils/raidhelper.js";

const router = express.Router();

//TODO: add proper authentication and authorization for this route
router.get("/raid-helper", async (request, response) => {
  const startTime = request.query.startTime as string | undefined;
  const result = await getRaidHelperEvents(startTime);
  //TODO: set up proper failsafe for the Raid Helper API route
  if (result.error) {
    response.status(result.status).json({ error: result.error });
    return;
  }
  response.json(result.data);
});

export default router;
