/**
 * Retry configuration for openapi-fetch clients.
 *
 * Defines which HTTP status codes and error types are retryable,
 * and provides exponential backoff timing.
 */

/**
 * HTTP status codes that should trigger an automatic retry.
 *
 * Retryable errors:
 * - 429: Too Many Requests (rate limit, wait and retry)
 * - 500-599: Server errors (transient, may recover)
 *
 * Non-retryable:
 * - 4xx (except 429): Client errors, bad request, auth failure, permission error, etc.
 * - Anything else: Could indicate a real problem that won't be fixed by retry
 */
export function isRetryableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600)
}

/**
 * Calculate exponential backoff delay with jitter.
 *
 * @param attemptNumber - Zero-indexed attempt number (0 for first retry, 1 for second, etc.)
 * @returns Delay in milliseconds
 *
 * Formula: 2^attemptNumber * 100ms + random(0-100ms)
 * Examples:
 * - Attempt 0 (first retry): 100-200ms
 * - Attempt 1 (second retry): 200-400ms
 * - Attempt 2 (third retry): 400-800ms
 * - Attempt 3+: capped at ~5 seconds
 */
export function getRetryDelay(attemptNumber: number): number {
  const baseDelay = Math.pow(2, attemptNumber) * 100
  const jitter = Math.random() * 100
  const maxDelay = 5000
  return Math.min(baseDelay + jitter, maxDelay)
}
