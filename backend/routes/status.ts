import express from "express";
const router = express.Router();

router.use((_request, _response, next) => {
  console.log(`Request received at ${new Date().toISOString()}`);
  next();
});

router.get("/health", (_request, response) => {
  response.json({ status: "Ætheris Backend is reachable" });
});

export default router;
