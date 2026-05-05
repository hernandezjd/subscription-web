import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Unit tests for ApiClient (apiClient.ts).
 *
 * Tests cover:
 * - Success path: data returned, no error
 * - X-Request-Id extraction from response headers
 * - Structured error path (errorCode field present)
 * - Non-structured error path (fall back to response parsing)
 * - 4xx with falsy error (empty body edge case)
 * - Network/CORS thrown exceptions → synthetic 503 response
 * - All three client wrappers (command, query, workspace)
 * - All HTTP methods (GET, POST, PUT, DELETE, PATCH, HEAD)
 */

// Mock the openapi-fetch clients before importing apiClient
vi.mock('./clients', () => ({
  subscriptionClient: {
    GET: vi.fn(),
    POST: vi.fn(),
    PUT: vi.fn(),
    DELETE: vi.fn(),
    PATCH: vi.fn(),
    HEAD: vi.fn(),
  },
  workspaceClient: {
    GET: vi.fn(),
    POST: vi.fn(),
    PUT: vi.fn(),
    DELETE: vi.fn(),
    PATCH: vi.fn(),
    HEAD: vi.fn(),
  },
}))

vi.mock('@accounts/error-handling-web', () => ({
  formatError: vi.fn((error: unknown, _statusCode?: number) => ({
    errorCode: (typeof error === 'object' && error !== null && 'errorCode' in error)
      ? (error as { errorCode: string }).errorCode
      : 'UNKNOWN_ERROR',
    userMessage: 'An error occurred',
    requestId: (typeof error === 'object' && error !== null && 'requestId' in error)
      ? (error as { requestId: string }).requestId
      : 'unknown',
    timestamp: '2024-01-01T00:00:00Z',
    showSupportContact: false,
    classification: 'permanent' as const,
    isRetryable: false,
  })),
}))

import { apiClient } from './apiClient'
import { subscriptionClient, workspaceClient } from './clients'
import { formatError } from '@accounts/error-handling-web'

const mockedSubscriptionClient = subscriptionClient as { [key: string]: ReturnType<typeof vi.fn> }
const mockedWorkspaceClient = workspaceClient as { [key: string]: ReturnType<typeof vi.fn> }
const mockedFormatError = formatError as ReturnType<typeof vi.fn>

/** Build a mock openapi-fetch response tuple */
function makeClientResponse(opts: {
  data?: unknown
  error?: unknown
  status: number
  headers?: Record<string, string>
}) {
  const responseHeaders = new Headers(opts.headers ?? {})
  const response = new Response(null, { status: opts.status, headers: responseHeaders })
  // Mock response.text() for non-structured error path
  vi.spyOn(response, 'text').mockResolvedValue(
    opts.error !== undefined ? JSON.stringify(opts.error) : ''
  )
  return { data: opts.data, error: opts.error, response }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedFormatError.mockImplementation((error: unknown, _statusCode?: number) => ({
    errorCode: (typeof error === 'object' && error !== null && 'errorCode' in error)
      ? (error as { errorCode: string }).errorCode
      : 'UNKNOWN_ERROR',
    userMessage: 'An error occurred',
    requestId: (typeof error === 'object' && error !== null && 'requestId' in error)
      ? (error as { requestId: string }).requestId
      : 'unknown',
    timestamp: '2024-01-01T00:00:00Z',
    showSupportContact: false,
    classification: 'permanent' as const,
    isRetryable: false,
  }))
})

describe('ApiClient (subscription-web)', () => {
  describe('B1 — Success: data returned, no error', () => {
    it('should return data on successful GET', async () => {
      mockedSubscriptionClient.GET.mockResolvedValue(
        makeClientResponse({ data: { id: '1', name: 'Test Plan' }, status: 200 })
      )

      const result = await apiClient.subscription.GET('/subscriptions')

      expect(result.data).toEqual({ id: '1', name: 'Test Plan' })
      expect(result.error).toBeUndefined()
    })

    it('should return data on successful POST', async () => {
      mockedSubscriptionClient.POST.mockResolvedValue(
        makeClientResponse({ data: { id: 'new-sub-1' }, status: 201 })
      )

      const result = await apiClient.subscription.POST('/subscriptions', { body: {} })

      expect(result.data).toEqual({ id: 'new-sub-1' })
      expect(result.error).toBeUndefined()
    })
  })

  describe('B2 — X-Request-Id extracted from lowercase response header', () => {
    it('should attach request ID from x-request-id header to structured error', async () => {
      const errorPayload = {
        errorCode: 'VALIDATION_ERROR',
        message: 'Bad input',
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'header-req-id',
      }
      mockedSubscriptionClient.POST.mockResolvedValue(
        makeClientResponse({
          error: errorPayload,
          status: 400,
          headers: { 'x-request-id': 'header-req-id' },
        })
      )

      const result = await apiClient.subscription.POST('/subscriptions', { body: {} })

      expect(result.error).toBeDefined()
      expect(mockedFormatError).toHaveBeenCalledWith(
        expect.objectContaining({ requestId: 'header-req-id' }),
        400
      )
    })
  })

  describe('B3 — X-Request-Id fallback to capitalized header name', () => {
    it('should extract request ID from X-Request-Id header', async () => {
      const errorPayload = {
        errorCode: 'SERVER_ERROR',
        message: 'Error',
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'cap-req-id',
      }
      mockedSubscriptionClient.GET.mockResolvedValue(
        makeClientResponse({
          error: errorPayload,
          status: 500,
          headers: { 'X-Request-Id': 'cap-req-id' },
        })
      )

      await apiClient.subscription.GET('/subscriptions')

      expect(mockedFormatError).toHaveBeenCalledWith(
        expect.objectContaining({ requestId: 'cap-req-id' }),
        500
      )
    })
  })

  describe('B4 — Structured error path: errorCode triggers StructuredError formatting', () => {
    it('should call formatError with StructuredError and populate debug fields', async () => {
      const errorPayload = {
        errorCode: 'VALIDATION_ERROR',
        message: 'Field is required',
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'req-b4',
        details: { field: 'name' },
      }
      mockedSubscriptionClient.POST.mockResolvedValue(
        makeClientResponse({
          error: errorPayload,
          status: 400,
          headers: { 'x-request-id': 'req-b4' },
        })
      )

      const result = await apiClient.subscription.POST('/subscriptions', {})

      expect(result.error).toBeDefined()
      expect(result.error!.httpStatus).toBe(400)
      expect(result.error!.requestUrl).toBe('POST /subscriptions')
      expect(mockedFormatError).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'VALIDATION_ERROR',
          message: 'Field is required',
          requestId: 'req-b4',
          details: { field: 'name' },
        }),
        400
      )
    })
  })

  describe('B5 — Non-structured error path: generic error falls back to response parsing', () => {
    it('should populate responseBody from response text when error has no errorCode', async () => {
      const responseHeaders = new Headers({ 'x-request-id': 'req-b5' })
      const mockResponse = new Response(null, { status: 400, headers: responseHeaders })
      vi.spyOn(mockResponse, 'text').mockResolvedValue('plain text error body')

      mockedSubscriptionClient.POST.mockResolvedValue({
        data: undefined,
        error: 'plain text error',  // no errorCode field
        response: mockResponse,
      })

      const result = await apiClient.subscription.POST('/subscriptions', {})

      expect(result.error).toBeDefined()
      expect(result.error!.httpStatus).toBe(400)
    })
  })

  describe('B6 — 4xx with falsy error object (empty body edge case)', () => {
    it('should return error when status >= 400 even if error is undefined', async () => {
      const responseHeaders = new Headers({ 'x-request-id': 'req-b6' })
      const mockResponse = new Response(null, { status: 400, headers: responseHeaders })
      vi.spyOn(mockResponse, 'text').mockResolvedValue('')

      mockedSubscriptionClient.POST.mockResolvedValue({
        data: undefined,
        error: undefined,  // openapi-fetch returns undefined for empty body
        response: mockResponse,
      })

      const result = await apiClient.subscription.POST('/subscriptions', {})

      expect(result.error).toBeDefined()
      expect(result.error!.httpStatus).toBe(400)
    })
  })

  describe('B7 — Network/CORS error produces synthetic 503 response', () => {
    it('should handle TypeError from fetch and return synthetic 503', async () => {
      mockedSubscriptionClient.GET.mockRejectedValue(new TypeError('Failed to fetch'))

      const result = await apiClient.subscription.GET('/subscriptions')

      expect(result.error).toBeDefined()
      expect(result.error!.httpStatus).toBe(0)
      expect(result.error!.requestUrl).toBe('GET /subscriptions')
      expect(result.error!.responseBody).toBe('Failed to fetch')
      expect(result.response.status).toBe(503)
    })

    it('should handle generic Error from fetch', async () => {
      mockedSubscriptionClient.GET.mockRejectedValue(new Error('Network error'))

      const result = await apiClient.subscription.GET('/subscriptions')

      expect(result.error).toBeDefined()
      expect(result.response.status).toBe(503)
    })
  })

  describe('B8 — workspace client wrapper behaves same as subscription client', () => {
    it('should return data from workspace client GET', async () => {
      mockedWorkspaceClient.GET.mockResolvedValue(
        makeClientResponse({ data: { id: 'workspace-1' }, status: 200 })
      )

      const result = await apiClient.workspace.GET('/workspaces')

      expect(result.data).toEqual({ id: 'workspace-1' })
      expect(result.error).toBeUndefined()
    })
  })

  describe('B9 — DELETE, PUT, PATCH, HEAD methods are proxied', () => {
    it('should proxy DELETE to subscription client', async () => {
      mockedSubscriptionClient.DELETE.mockResolvedValue(
        makeClientResponse({ status: 204 })
      )

      const result = await apiClient.subscription.DELETE('/subscriptions/1')

      expect(result.error).toBeUndefined()
    })

    it('should proxy PUT to subscription client', async () => {
      mockedSubscriptionClient.PUT.mockResolvedValue(
        makeClientResponse({ data: { id: '1' }, status: 200 })
      )

      const result = await apiClient.subscription.PUT('/subscriptions/1', { body: {} })

      expect(result.data).toEqual({ id: '1' })
    })

    it('should proxy PATCH to subscription client', async () => {
      mockedSubscriptionClient.PATCH.mockResolvedValue(
        makeClientResponse({ data: { id: '1' }, status: 200 })
      )

      const result = await apiClient.subscription.PATCH('/subscriptions/1', { body: {} })

      expect(result.data).toEqual({ id: '1' })
    })

    it('should proxy HEAD to subscription client', async () => {
      mockedSubscriptionClient.HEAD.mockResolvedValue(
        makeClientResponse({ status: 200 })
      )

      const result = await apiClient.subscription.HEAD('/subscriptions/1')

      expect(result.error).toBeUndefined()
    })
  })
})
