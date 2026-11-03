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

function createRequest(method: string, path: string): Request {
  return {
    method,
    path,
    log: {
      warn: vi.fn(),
      error: vi.fn(),
    },
  } as unknown as Request;
}

describe("errorHandler", () => {
  it("returns a stable error code without exposing the internal message", () => {
    const response = createResponse();

    errorHandler(
      new HttpError(404, "Database query failed"),
      createRequest("GET", "/events/unknown"),
      response,
      vi.fn() as NextFunction,
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      error: { code: "NOT_FOUND" },
    });
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
    expect(response.json).not.toHaveBeenCalledWith(
      expect.objectContaining({ details }),
    );
  });

  it("hides unknown error details behind a generic 500 response", () => {
    const response = createResponse();

    errorHandler(
      new Error("Database password leaked"),
      createRequest("GET", "/events"),
      response,
      vi.fn() as NextFunction,
    );

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      error: { code: "INTERNAL_SERVER_ERROR" },
    });
  });

  it("returns a validation error for malformed JSON without exposing parser details", () => {
    const response = createResponse();
    const error = Object.assign(new SyntaxError("Unexpected token"), {
      type: "entity.parse.failed",
    });

    errorHandler(
      error,
      createRequest("POST", "/events"),
      response,
      vi.fn() as NextFunction,
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      error: { code: "VALIDATION_ERROR" },
    });
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
