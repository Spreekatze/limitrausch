import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import express from "express";
import type { AddressInfo } from "node:net";
import { API_ERROR_CODES } from "@limitrausch/contracts";
import {
  addEvent,
  deleteEventById,
  getEventByRaidHelperId,
  updateEventById,
} from "../../store/eventStore.js";
import errorHandler from "../../errors/errorHandler.js";
import webHookRoutes from "../webhooks.js";

vi.mock("../../store/eventStore.js", () => ({
  addEvent: vi.fn(),
  deleteEventById: vi.fn(),
  getEventByRaidHelperId: vi.fn(),
  updateEventById: vi.fn(),
}));

const mocks = {
  addEvent: vi.mocked(addEvent),
  deleteEventById: vi.mocked(deleteEventById),
  getEventByRaidHelperId: vi.mocked(getEventByRaidHelperId),
  updateEventById: vi.mocked(updateEventById),
};

const payload = {
  id: "raidhelper-event-1",
  date: "2026-11-03",
  time: "20:00",
  color: "ffffff",
  title: "RaidHelper event",
  creator: { id: "creator-1", name: "Creator" },
  endTime: 1_800_003_600,
  signUps: [],
  leaderId: "leader-1",
  serverId: "12345678901234567",
  channelId: "channel-1",
  coLeaders: [],
  startTime: 1_800_000_000,
  leaderName: "Lead",
  templateId: "template-1",
  channelName: "events",
  channelType: "text",
  closingTime: 1_800_000_000,
  description: "Event description",
  lastUpdated: 1_799_999_000,
  advancedSettings: { image: "", limit: 8, duration: 60 },
};

const app = express();
app.use((request, _response, next) => {
  request.log = { warn: vi.fn(), error: vi.fn() } as never;
  next();
});
app.use(express.json());
app.use("/webhooks", webHookRoutes);
app.use(errorHandler);

let server: ReturnType<typeof app.listen>;
let baseUrl: string;

beforeAll(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/webhooks/raid-helper`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("RAIDHELPER_WEBHOOK_KEY", "webhook-secret");
  mocks.getEventByRaidHelperId.mockResolvedValue(undefined);
  mocks.addEvent.mockResolvedValue({
    id: 1,
    lastUpdated: 123,
    eventType: 998,
    startTime: payload.startTime,
    endTime: payload.endTime,
    isPublic: false,
  });
  mocks.updateEventById.mockResolvedValue(undefined);
  mocks.deleteEventById.mockResolvedValue(true);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

async function post(
  path: string,
  body: unknown = payload,
  key = "webhook-secret",
) {
  return fetch(`${baseUrl}/${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: key,
    },
    body: JSON.stringify(body),
  });
}

describe("RaidHelper webhook routes", () => {
  it("creates a valid webhook event and treats duplicate creates idempotently", async () => {
    const created = await post("event-create");
    expect(created.status).toBe(200);
    expect(mocks.addEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        title: payload.title,
        raidHelperId: payload.id,
      }),
    );

    mocks.getEventByRaidHelperId.mockResolvedValueOnce({
      id: 1,
    } as Awaited<ReturnType<typeof getEventByRaidHelperId>>);
    const duplicate = await post("event-create");
    expect(duplicate.status).toBe(200);
    expect(mocks.addEvent).toHaveBeenCalledOnce();
  });

  it("updates existing events and safely acknowledges unknown event updates", async () => {
    mocks.getEventByRaidHelperId.mockResolvedValueOnce({
      id: 7,
    } as Awaited<ReturnType<typeof getEventByRaidHelperId>>);

    const updated = await post("event-update");
    expect(updated.status).toBe(200);
    expect(mocks.updateEventById).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ raidHelperId: payload.id }),
    );

    const missing = await post("event-update");
    expect(missing.status).toBe(200);
    expect(mocks.updateEventById).toHaveBeenCalledOnce();
  });

  it("deletes existing events and safely acknowledges unknown event deletions", async () => {
    mocks.getEventByRaidHelperId.mockResolvedValueOnce({
      id: 7,
    } as Awaited<ReturnType<typeof getEventByRaidHelperId>>);

    expect((await post("event-delete")).status).toBe(200);
    expect(mocks.deleteEventById).toHaveBeenCalledWith(7);

    expect((await post("event-delete")).status).toBe(200);
    expect(mocks.deleteEventById).toHaveBeenCalledOnce();
  });

  it("rejects requests with an invalid webhook key", async () => {
    const unauthorized = await post("event-create", payload, "wrong-key");
    expect(unauthorized.status).toBe(401);
    expect(mocks.getEventByRaidHelperId).not.toHaveBeenCalled();
    expect(mocks.addEvent).not.toHaveBeenCalled();
  });

  it("rejects invalid webhook payloads", async () => {
    const invalid = await post("event-create", { id: payload.id });
    expect(invalid.status).toBe(400);
    expect(mocks.getEventByRaidHelperId).not.toHaveBeenCalled();
    expect(mocks.addEvent).not.toHaveBeenCalled();
  });

  it("rejects requests without an authorization header or configured key", async () => {
    const missingHeader = await fetch(`${baseUrl}/event-create`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    expect(missingHeader.status).toBe(401);

    vi.stubEnv("RAIDHELPER_WEBHOOK_KEY", "");
    const missingConfiguredKey = await post("event-create");
    expect(missingConfiguredKey.status).toBe(401);
    expect(mocks.getEventByRaidHelperId).not.toHaveBeenCalled();
  });

  it.each(["event-create", "event-update", "event-delete"])(
    "returns an internal error when looking up an event fails during %s",
    async (action) => {
      mocks.getEventByRaidHelperId.mockRejectedValueOnce(
        new Error("Database unavailable"),
      );

      const response = await post(action);

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        error: { code: API_ERROR_CODES.INTERNAL_SERVER_ERROR },
      });
      expect(mocks.addEvent).not.toHaveBeenCalled();
      expect(mocks.updateEventById).not.toHaveBeenCalled();
      expect(mocks.deleteEventById).not.toHaveBeenCalled();
    },
  );

  it("returns an internal error when creating an event fails", async () => {
    mocks.addEvent.mockRejectedValueOnce(new Error("Database unavailable"));

    const response = await post("event-create");

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: API_ERROR_CODES.INTERNAL_SERVER_ERROR },
    });
    expect(mocks.addEvent).toHaveBeenCalledOnce();
  });

  it("returns an internal error when updating an event fails", async () => {
    mocks.getEventByRaidHelperId.mockResolvedValueOnce({
      id: 7,
    } as Awaited<ReturnType<typeof getEventByRaidHelperId>>);
    mocks.updateEventById.mockRejectedValueOnce(
      new Error("Database unavailable"),
    );

    const response = await post("event-update");

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: API_ERROR_CODES.INTERNAL_SERVER_ERROR },
    });
    expect(mocks.updateEventById).toHaveBeenCalledOnce();
  });

  it("returns an internal error when deleting an event fails", async () => {
    mocks.getEventByRaidHelperId.mockResolvedValueOnce({
      id: 7,
    } as Awaited<ReturnType<typeof getEventByRaidHelperId>>);
    mocks.deleteEventById.mockRejectedValueOnce(
      new Error("Database unavailable"),
    );

    const response = await post("event-delete");

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: API_ERROR_CODES.INTERNAL_SERVER_ERROR },
    });
    expect(mocks.deleteEventById).toHaveBeenCalledWith(7);
    expect(mocks.deleteEventById).toHaveBeenCalledOnce();
  });

  it("rejects malformed JSON webhook bodies", async () => {
    const response = await fetch(`${baseUrl}/event-create`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "webhook-secret",
      },
      body: "{invalid",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: { code: API_ERROR_CODES.VALIDATION_ERROR },
    });
    expect(mocks.addEvent).not.toHaveBeenCalled();
  });
});
