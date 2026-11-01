import type { ErrorRequestHandler } from "express";
import { API_ERROR_CODES, apiErrorCodeForStatus } from "@limitrausch/contracts";
import { HttpError } from "./httpError.js";

function isInvalidJsonError(
  error: unknown,
): error is Error & { type: "entity.parse.failed" } {
  return (
    error instanceof Error &&
    "type" in error &&
    error.type === "entity.parse.failed"
  );
}

const errorHandler: ErrorRequestHandler = (error, request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  const context = {
    method: request.method,
    path: request.path,
  };

  if (isInvalidJsonError(error)) {
    const status = 400;
    request.log.warn({ ...context, status }, "Invalid JSON request body");
    response.status(status).json({
      error: {
        code: apiErrorCodeForStatus(status),
      },
    });
    return;
  }

  if (error instanceof HttpError) {
    const logContext = {
      ...context,
      ...error.logContext,
      status: error.status,
    };

    if (error.status >= 500) {
      request.log.error({ ...logContext, err: error }, "Request failed");
    } else {
      request.log.warn(logContext, error.message);
    }

    response.status(error.status).json({
      error: {
        code: error.code,
      },
    });
    return;
  }

  request.log.error({ ...context, err: error }, "Unhandled request error");
  response.status(500).json({
    error: {
      code: API_ERROR_CODES.INTERNAL_SERVER_ERROR,
    },
  });
};

export default errorHandler;
