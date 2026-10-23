import { pinoHttp } from "pino-http";
import logger from "../logger.js";

const requestLogger = pinoHttp({
  logger,

  // Keine vollständigen Request-/Response-Objekte loggen
  serializers: {
    req(request) {
      return {
        method: request.method,
        url: request.url?.split("?")[0],
      };
    },
    res(response) {
      return {
        statusCode: response.statusCode,
      };
    },
  },

  customLogLevel(_request, response, error) {
    if (error || response.statusCode >= 500) return "error";
    if (response.statusCode >= 400) return "warn";
    return "info";
  },
});

export default requestLogger;
