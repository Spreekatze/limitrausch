import express from "express";
import requireGuildManager from "../middleware/requireGuildManager.js";

const router = express.Router();

//TODO: set up guild config page and routes

// Get current config and data for guild by Id
router.get("/:id", requireGuildManager, (_request, _response) => {});

// Update config for guild by Id
router.patch("/:id", requireGuildManager, (_request, _response) => {});
