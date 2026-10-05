import dotenv from "dotenv";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const backendDirectory =
  basename(dirname(currentDirectory)) === "dist"
    ? resolve(currentDirectory, "../..")
    : resolve(currentDirectory, "..");
const rootDirectory = resolve(backendDirectory, "..");

dotenv.config({
  path: [resolve(rootDirectory, ".env"), resolve(backendDirectory, ".env")],
});
