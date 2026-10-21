export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly logContext: Record<string, unknown> = {},
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
