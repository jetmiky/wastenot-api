/**
 * Error object wrapper to send as response.
 *
 * @param {unknown} error
 * @return {string}
 */
export function getAsyncErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
