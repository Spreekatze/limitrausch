import type { ErrorRequestHandler } from "express";
import logger from "../logger.js";
import { HttpError } from "./httpError.js";

const errorHandler: ErrorRequestHandler = (
  error,
  request,
  response,
  next,
) => {
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
      logger.error({ ...logContext, err: error }, "Request failed");
    } else {
      logger.warn(logContext, error.message);
    }

    response.status(error.status).json({ error: error.message });
    return;
  }

  logger.error({ ...context, err: error }, "Unhandled request error");
  response.status(500).json({ error: "Internal server error" });
};

export default errorHandler;