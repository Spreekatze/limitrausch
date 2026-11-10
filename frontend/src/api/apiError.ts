import {
  API_ERROR_CODES,
  apiErrorCodeForStatus,
  apiErrorResponseSchema,
  type ApiErrorCode,
} from '@limitrausch/contracts';

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    public readonly statusCode: number,
    public readonly requestId?: string,
  ) {
    super(getApiErrorMessage(code));
    this.name = 'ApiError';
  }
}

const apiErrorMessages: Record<ApiErrorCode, string> = {
  [API_ERROR_CODES.VALIDATION_ERROR]: 'Bitte überprüfe deine Eingaben.',
  [API_ERROR_CODES.UNAUTHORIZED]: 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',
  [API_ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'Du hast keine Berechtigung für diese Aktion.',
  [API_ERROR_CODES.NOT_FOUND]: 'Die angeforderte Ressource wurde nicht gefunden.',
  [API_ERROR_CODES.CONFLICT]: 'Die Daten wurden zwischenzeitlich geändert. Bitte lade sie neu.',
  [API_ERROR_CODES.UPSTREAM_ERROR]:
    'Ein verbundener Dienst ist momentan nicht erreichbar. Bitte versuche es später erneut.',
  [API_ERROR_CODES.UPSTREAM_TIMEOUT]:
    'Ein verbundener Dienst ist momentan nicht erreichbar. Bitte versuche es später erneut.',
  [API_ERROR_CODES.SERVICE_UNAVAILABLE]:
    'Ein verbundener Dienst ist momentan nicht erreichbar. Bitte versuche es später erneut.',
  [API_ERROR_CODES.INTERNAL_SERVER_ERROR]:
    'Auf dem Server ist ein Fehler aufgetreten. Bitte versuche es später erneut.',
  [API_ERROR_CODES.REQUEST_FAILED]: 'Die Anfrage konnte leider nicht verarbeitet werden.',
  [API_ERROR_CODES.INVALID_API_RESPONSE]: 'Der Server hat eine unerwartete Antwort geliefert.',
};

export function getApiErrorMessage(code: ApiErrorCode): string {
  return apiErrorMessages[code];
}

export async function readApiResponseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new ApiError(API_ERROR_CODES.INVALID_API_RESPONSE, 502);
  }
}

export async function handleApiError(response: Response): Promise<never> {
  const body: unknown = await response.json().catch(() => null);
  const parsed = apiErrorResponseSchema.safeParse(body);
  const code = parsed.success ? parsed.data.error.code : apiErrorCodeForStatus(response.status);
  const requestId = parsed.success ? parsed.data.error.requestId : undefined;

  throw new ApiError(code, response.status, requestId);
}
