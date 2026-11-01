import { z } from "zod";
import { API_ERROR_CODES } from "../data/apiErrorCodes.js";

export const apiErrorCodeSchema = z.enum(API_ERROR_CODES);
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    requestId: z.string().optional(),
  }),
});
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;

export function apiErrorCodeForStatus(status: number): ApiErrorCode {
  switch (status) {
    case 400:
    case 422:
      return API_ERROR_CODES.VALIDATION_ERROR;
    case 401:
      return API_ERROR_CODES.UNAUTHORIZED;
    case 403:
      return API_ERROR_CODES.INSUFFICIENT_PERMISSIONS;
    case 404:
      return API_ERROR_CODES.NOT_FOUND;
    case 409:
      return API_ERROR_CODES.CONFLICT;
    case 502:
      return API_ERROR_CODES.UPSTREAM_ERROR;
    case 503:
      return API_ERROR_CODES.SERVICE_UNAVAILABLE;
    case 504:
      return API_ERROR_CODES.UPSTREAM_TIMEOUT;
    default:
      return status >= 500
        ? API_ERROR_CODES.INTERNAL_SERVER_ERROR
        : API_ERROR_CODES.REQUEST_FAILED;
  }
}
