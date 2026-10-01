import { readFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express from "express";
import playgroundRoutes from "./routes/playground.js";
import raidHelperRoutes from "./routes/raid-helper.js";
import statusRoutes from "./routes/status.js";
import { renderRouteRows } from "./views/route-list.js";

const app = express();
const port = process.env.PORT || 3000;
const currentDirectory = dirname(fileURLToPath(import.meta.url));
const backendDirectory =
  basename(currentDirectory) === "dist"
    ? resolve(currentDirectory, "..")
    : currentDirectory;
dotenv.config({ path: resolve(backendDirectory, ".env") });
const backendPageTemplate = await readFile(
  resolve(backendDirectory, "views", "index.html"),
  "utf8",
);

app.use(express.json());

app.use((_request, _response, next) => {
  console.log(`Request received at ${new Date().toISOString()}`);
  console.log(_request.method, _request.url);
  next();
});

app.use(
  "/assets",
  express.static(resolve(backendDirectory, "views", "assets")),
);

app.get("/", (_request, response) => {
  response
    .type("html")
    .send(
      backendPageTemplate.replace("<!-- ROUTE_ROWS -->", renderRouteRows()),
    );
});

app.use("/status", statusRoutes);
app.use("/playground", playgroundRoutes);
app.use("/raid-helper", raidHelperRoutes);

app.listen(port, () => {
  console.log(`Aetheris backend listening on port ${port}`);
});
