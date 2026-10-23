import express from "express";
import { jobs } from "../data/jobs.js";
const router = express.Router();

// Get all job data
router.get("/", (request, response) => {
  response.json(jobs);
});

export default router;
