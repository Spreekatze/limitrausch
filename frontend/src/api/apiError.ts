export class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    public readonly requestId?: string,
  ) {
    super(code);
    this.name = 'ApiError';
  }
}

interface ApiErrorResponse {
  error?: {
    code?: string;
    requestId?: string;
  };
}

export async function handleApiError(response: Response): Promise<never> {
  const body = (await response.json().catch(() => null)) as ApiErrorResponse | null;

  throw new ApiError(
    body?.error?.code ?? 'UNKNOWN_API_ERROR',
    response.status,
    body?.error?.requestId,
  );
}
