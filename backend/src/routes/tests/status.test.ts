import express from "express";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import statusRoutes from "../status.js";

const app = express();
app.use("/status", statusRoutes);

let server: ReturnType<typeof app.listen>;
let baseUrl: string;

beforeAll(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/status`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

describe("status route", () => {
  it("reports that the backend is reachable", async () => {
    const response = await fetch(`${baseUrl}/health`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      msg: "Limitrausch Backend is reachable",
    });
  });
});
