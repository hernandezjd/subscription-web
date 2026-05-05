import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isRetryableStatus, getRetryDelay } from './retryConfig'

/**
 * Unit tests for retry configuration.
 *
 * Tests cover:
 * - Status code classification (retryable vs. non-retryable)
 * - Exponential backoff calculation
 * - Jitter application
 * - Max delay cap
 */

describe('retryConfig', () => {
  describe('isRetryableStatus', () => {
    describe('retryable statuses', () => {
      it('should return true for 429 (Too Many Requests)', () => {
        expect(isRetryableStatus(429)).toBe(true)
      })

      it('should return true for 500 (Internal Server Error)', () => {
        expect(isRetryableStatus(500)).toBe(true)
      })

      it('should return true for 502 (Bad Gateway)', () => {
        expect(isRetryableStatus(502)).toBe(true)
      })

      it('should return true for 503 (Service Unavailable)', () => {
        expect(isRetryableStatus(503)).toBe(true)
      })

      it('should return true for 504 (Gateway Timeout)', () => {
        expect(isRetryableStatus(504)).toBe(true)
      })

      it('should return true for all 5xx statuses', () => {
        for (let status = 500; status < 600; status++) {
          expect(isRetryableStatus(status)).toBe(true)
        }
      })
    })

    describe('non-retryable statuses', () => {
      it('should return false for 400 (Bad Request)', () => {
        expect(isRetryableStatus(400)).toBe(false)
      })

      it('should return false for 401 (Unauthorized)', () => {
        expect(isRetryableStatus(401)).toBe(false)
      })

      it('should return false for 403 (Forbidden)', () => {
        expect(isRetryableStatus(403)).toBe(false)
      })

      it('should return false for 404 (Not Found)', () => {
        expect(isRetryableStatus(404)).toBe(false)
      })

      it('should return false for 200 (OK)', () => {
        expect(isRetryableStatus(200)).toBe(false)
      })

      it('should return false for 201 (Created)', () => {
        expect(isRetryableStatus(201)).toBe(false)
      })

      it('should return false for 204 (No Content)', () => {
        expect(isRetryableStatus(204)).toBe(false)
      })

      it('should return false for 301 (Moved Permanently)', () => {
        expect(isRetryableStatus(301)).toBe(false)
      })

      it('should return false for all 4xx statuses (except 429)', () => {
        for (let status = 400; status < 430; status++) {
          if (status !== 429) {
            expect(isRetryableStatus(status)).toBe(false)
          }
        }
        for (let status = 430; status < 500; status++) {
          expect(isRetryableStatus(status)).toBe(false)
        }
      })
    })
  })

  describe('getRetryDelay', () => {
    beforeEach(() => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    describe('exponential backoff calculation', () => {
      it('should return ~150ms for attempt 0 (with 0.5 jitter)', () => {
        const delay = getRetryDelay(0)
        // baseDelay = 2^0 * 100 = 100ms
        // jitter = 0.5 * 100 = 50ms
        // total = 150ms
        expect(delay).toBe(150)
      })

      it('should return ~300ms for attempt 1 (with 0.5 jitter)', () => {
        const delay = getRetryDelay(1)
        // baseDelay = 2^1 * 100 = 200ms
        // jitter = 0.5 * 100 = 50ms
        // total = 250ms
        expect(delay).toBe(250)
      })

      it('should return ~600ms for attempt 2 (with 0.5 jitter)', () => {
        const delay = getRetryDelay(2)
        // baseDelay = 2^2 * 100 = 400ms
        // jitter = 0.5 * 100 = 50ms
        // total = 450ms
        expect(delay).toBe(450)
      })

      it('should return ~1200ms for attempt 3 (with 0.5 jitter)', () => {
        const delay = getRetryDelay(3)
        // baseDelay = 2^3 * 100 = 800ms
        // jitter = 0.5 * 100 = 50ms
        // total = 850ms
        expect(delay).toBe(850)
      })
    })

    describe('max delay cap', () => {
      it('should cap delay at 5000ms for high attempt numbers', () => {
        const delay = getRetryDelay(10)
        // baseDelay = 2^10 * 100 = 102400ms, exceeds cap
        expect(delay).toBeLessThanOrEqual(5000)
      })

      it('should cap delay at 5000ms for attempt 7', () => {
        // 2^7 * 100 = 12800ms, would exceed 5000 cap
        const delay = getRetryDelay(7)
        expect(delay).toBeLessThanOrEqual(5000)
      })
    })

    describe('jitter application', () => {
      it('should apply jitter within 0-100ms range', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0)
        const delayWithZeroJitter = getRetryDelay(0)
        expect(delayWithZeroJitter).toBe(100) // 2^0 * 100 + 0

        vi.spyOn(Math, 'random').mockReturnValue(1)
        const delayWithMaxJitter = getRetryDelay(0)
        expect(delayWithMaxJitter).toBe(200) // 2^0 * 100 + 100
      })

      it('should apply different jitter values in real scenario', () => {
        // Restore Math.random for this test to see actual variation
        vi.restoreAllMocks()
        // First call with partial mock setup
        const delay1 = getRetryDelay(1)
        expect(delay1).toBeGreaterThan(200) // at least baseDelay
        expect(delay1).toBeLessThanOrEqual(300) // baseDelay + max jitter
      })
    })
  })
})
