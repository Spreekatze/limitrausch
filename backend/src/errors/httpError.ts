import {
  apiErrorCodeForStatus,
  type ApiErrorCode,
} from "@limitrausch/contracts";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly logContext: Record<string, unknown> = {},
    public readonly details?: unknown,
    public readonly code: ApiErrorCode = apiErrorCodeForStatus(status),
  ) {
    super(message);
    this.name = "HttpError";
  }
}
