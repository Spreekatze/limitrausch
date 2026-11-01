import { ApiError } from '../api/apiError';

export function getUserErrorMessage(error: unknown): string {
  console.log('Error:', error);
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return 'Bitte überprüfe deine Eingaben.';

      case 'UNAUTHORIZED':
        return 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.';

      case 'INSUFFICIENT_PERMISSIONS':
        return 'Du hast keine Berechtigung für diese Aktion.';

      case 'EVENT_NOT_FOUND':
        return 'Das Event wurde nicht gefunden.';

      case 'EVENT_CONFLICT':
        return 'Das Event wurde zwischenzeitlich geändert. Bitte lade es neu.';

      case 'INVALID_API_RESPONSE':
        return 'Der Server hat eine unerwartete Antwort geliefert.';

      default:
        return 'Die Anfrage konnte leider nicht verarbeitet werden.';
    }
  }

  return 'Es ist ein unerwarteter Fehler aufgetreten. Bitte versuche es erneut.';
}
