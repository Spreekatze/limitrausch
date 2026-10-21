import type { ErrorRequestHandler } from "express";
import { HttpError } from "./httpError.js";

const errorHandler: ErrorRequestHandler = (error, request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  const context = {
    method: request.method,
    path: request.path,
  };

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
      error: error.message,
      ...(error.details === undefined ? {} : { details: error.details }),
    });
    return;
  }

  request.log.error({ ...context, err: error }, "Unhandled request error");
  response.status(500).json({ error: "Internal server error" });
};

export default errorHandler;
