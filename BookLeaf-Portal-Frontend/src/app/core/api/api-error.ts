import { HttpErrorResponse } from '@angular/common/http';

/**
 * Turns any error into a message safe to show an author.
 * The backend always responds with { error: { code, message, details? } }.
 */
export function apiErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Cannot reach the server. Check your connection and try again.';
    const body = err.error?.error;
    const detail = body?.details?.[0]?.message;
    if (body?.message) return detail ? `${body.message}: ${detail}` : body.message;
    return fallback;
  }
  return err instanceof Error ? err.message : fallback;
}
