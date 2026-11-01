import "../config/loadEnv.js";
import { readFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import session from "express-session";
import eventRoutes from "./routes/events.js";
import guildRoutes from "./routes/guild.js";
import statusRoutes from "./routes/status.js";
import authRoutes from "./routes/auth.js";
import webHookRoutes from "./routes/webhooks.js";
import { renderRouteRows } from "./views/route-list.js";
import { testDatabaseConnection } from "./database/databaseConnection.js";
import errorHandler from "./errors/errorHandler.js";
import requestLogger from "./middleware/requestLogger.js";
import { connectDiscord } from "./discordBot/client.js";

// Initialize Express app and configure environment variables
const app = express();
const port = process.env.PORT || 3000;
const currentDirectory = dirname(fileURLToPath(import.meta.url));
const backendDirectory =
  basename(currentDirectory) === "dist"
    ? resolve(currentDirectory, "..")
    : currentDirectory;
const backendPageTemplate = await readFile(
  resolve(backendDirectory, "views", "index.html"),
  "utf8",
);

// Middleware to log incoming requests before parsing or session handling can fail
app.use(requestLogger);

// Middleware to parse JSON request bodies
app.use(express.json());

// Middleware to parse URL-encoded request bodies
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
      maxAge: 24 * 60 * 60 * 1000, // Cookie expiration time (1 day)
    },
  }),
);

// Serve static assets from the "views/assets" directory
app.use(
  "/assets",
  express.static(resolve(backendDirectory, "views", "assets")),
);

// Define the root route to serve the main HTML page
app.get("/", (request, response) => {
  response
    .type("html")
    .send(
      backendPageTemplate.replace("<!-- ROUTE_ROWS -->", renderRouteRows()),
    );
});

// Define routes for the application
app.use("/status", statusRoutes);
app.use("/auth", authRoutes);
app.use("/events", eventRoutes);
app.use("/guild", guildRoutes);
app.use("/webhooks", webHookRoutes);

// Handle errors
app.use(errorHandler);

testDatabaseConnection()
  .then(() => {
    connectDiscord();
  })
  .then(() => {
    app.listen(port, () => {
      console.log(`Limitrausch backend listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
