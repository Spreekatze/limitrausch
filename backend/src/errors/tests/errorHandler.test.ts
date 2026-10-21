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

describe("errorHandler", () => {
  it("returns the status and message from an HttpError", () => {
    const response = createResponse();

    errorHandler(
      new HttpError(404, "Event not found"),
      { method: "GET", path: "/events/unknown" } as Request,
      response,
      vi.fn() as NextFunction,
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({ error: "Event not found" });
  });

  it("hides unknown error details behind a generic 500 response", () => {
    const response = createResponse();

    errorHandler(
      new Error("Database password leaked"),
      { method: "GET", path: "/events" } as Request,
      response,
      vi.fn() as NextFunction,
    );

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      error: "Internal server error",
    });
  });

  it("forwards errors when response headers have already been sent", () => {
    const response = createResponse(true);
    const next = vi.fn() as NextFunction;
    const error = new Error("Stream failed");

    errorHandler(
      error,
      { method: "GET", path: "/events" } as Request,
      response,
      next,
    );

    expect(next).toHaveBeenCalledWith(error);
    expect(response.status).not.toHaveBeenCalled();
  });
});
