import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { HistoryPage } from '../pages/HistoryPage'
import { renderWithProviders } from '../test-utils/renderWithProviders'

vi.mock('react-oidc-context', () => ({
  useAuth: vi.fn(() => ({ user: { access_token: 'test-token' } })),
}))

const mockSubscription = {
  id: 'sub-1',
  organizationId: 'org-1',
  planId: 'plan-pro',
  plan: {
    id: 'plan-pro',
    name: 'Professional',
    description: 'For growing teams',
    monthlyPrice: 99,
    annualPrice: 990,
    features: {},
    quotas: { maxUsers: 25, maxTransactionsPerMonth: 5000, apiRateLimit: 300 },
  },
  status: 'ACTIVE',
  startDate: '2026-01-01T00:00:00Z',
  expirationDate: '2027-01-01T00:00:00Z',
  autoRenew: true,
  createdAt: '2026-01-01T00:00:00Z',
  modifiedAt: '2026-01-01T00:00:00Z',
}

vi.mock('@accounts/error-handling-web', () => ({
  useApiQuery: vi.fn(() => ({ data: mockSubscription, isLoading: false })),
  useApiMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  isTransientError: vi.fn(),
  formatError: vi.fn(),
}))

vi.stubEnv('VITE_ORG_ID', 'org-1')

describe('HistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page title', () => {
    renderWithProviders(<HistoryPage />)
    expect(screen.getByText('history.title')).toBeInTheDocument()
  })

  it('renders current plan name', () => {
    renderWithProviders(<HistoryPage />)
    expect(screen.getByText('Professional')).toBeInTheDocument()
  })

  it('renders subscription status', () => {
    renderWithProviders(<HistoryPage />)
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
  })

  it('renders start and expiration dates', () => {
    renderWithProviders(<HistoryPage />)
    expect(screen.getByText('history.startDate')).toBeInTheDocument()
    expect(screen.getByText('history.expirationDate')).toBeInTheDocument()
  })
})
