import express from "express";
const router = express.Router();

router.get("/health", (request, response) => {
  response.json({ msg: "Limitrausch Backend is reachable" });
});

export default router;
