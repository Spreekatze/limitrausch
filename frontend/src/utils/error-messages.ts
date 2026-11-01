import { ApiError, getApiErrorMessage } from '../api/apiError';

export function getUserErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return getApiErrorMessage(error.code);
  }

  return 'Es ist ein unerwarteter Fehler aufgetreten. Bitte versuche es erneut.';
}
