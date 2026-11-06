import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import errorHandler from "../errorHandler.js";
import { HttpError } from "../httpError.js";

function createResponse(headersSent = false): Response {
  return {
    headersSent,
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;
}

type TestRequest = Request & {
  log: {
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };
};

function createRequest(method: string, path: string): TestRequest {
  return {
    method,
    path,
    log: {
      warn: vi.fn(),
      error: vi.fn(),
    },
  } as unknown as TestRequest;
}

describe("errorHandler", () => {
  it("returns a stable error code without exposing the internal message", () => {
    const response = createResponse();
    const request = createRequest("GET", "/events/unknown");

    errorHandler(
      new HttpError(404, "Database query failed"),
      request,
      response,
      vi.fn() as NextFunction,
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      error: { code: "NOT_FOUND" },
    });
    expect(request.log.warn).toHaveBeenCalledWith(
      { method: "GET", path: "/events/unknown", status: 404 },
      "Database query failed",
    );
  });

  it("does not expose validation details in the response", () => {
    const response = createResponse();
    const details = [{ path: ["title"], message: "Required" }];

    errorHandler(
      new HttpError(400, "Invalid event data", {}, details),
      createRequest("POST", "/events"),
      response,
      vi.fn() as NextFunction,
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      error: { code: "VALIDATION_ERROR" },
    });
    expect(response.json).not.toHaveBeenCalledWith({ details });
  });

  it("hides unknown error details behind a generic 500 response", () => {
    const response = createResponse();
    const request = createRequest("GET", "/events");
    const error = new Error("Database password leaked");

    errorHandler(error, request, response, vi.fn() as NextFunction);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      error: { code: "INTERNAL_SERVER_ERROR" },
    });
    expect(request.log.error).toHaveBeenCalledWith(
      { method: "GET", path: "/events", err: error },
      "Unhandled request error",
    );
  });

  it("logs server-side HttpErrors with their context", () => {
    const response = createResponse();
    const request = createRequest("GET", "/guilds");
    const error = new HttpError(502, "Discord unavailable", {
      service: "Discord",
    });

    errorHandler(error, request, response, vi.fn() as NextFunction);

    expect(response.status).toHaveBeenCalledWith(502);
    expect(response.json).toHaveBeenCalledWith({
      error: { code: "UPSTREAM_ERROR" },
    });
    expect(request.log.error).toHaveBeenCalledWith(
      {
        method: "GET",
        path: "/guilds",
        service: "Discord",
        status: 502,
        err: error,
      },
      "Request failed",
    );
  });

  it("returns a validation error for malformed JSON without exposing parser details", () => {
    const response = createResponse();
    const request = createRequest("POST", "/events");
    const error = Object.assign(new SyntaxError("Unexpected token"), {
      type: "entity.parse.failed",
    });

    errorHandler(error, request, response, vi.fn() as NextFunction);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      error: { code: "VALIDATION_ERROR" },
    });
    expect(request.log.warn).toHaveBeenCalledWith(
      { method: "POST", path: "/events", status: 400 },
      "Invalid JSON request body",
    );
  });

  it("forwards errors when response headers have already been sent", () => {
    const response = createResponse(true);
    const next = vi.fn() as NextFunction;
    const error = new Error("Stream failed");

    errorHandler(error, createRequest("GET", "/events"), response, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(response.status).not.toHaveBeenCalled();
  });
});
