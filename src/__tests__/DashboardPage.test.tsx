import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { DashboardPage } from '../pages/DashboardPage'
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

const mockQuota = {
  organizationId: 'org-1',
  planId: 'plan-pro',
  activeUsers: 12,
  maxUsers: 25,
  usersPercentage: 48,
  transactionsThisMonth: 1200,
  maxTransactionsPerMonth: 5000,
  transactionsPercentage: 24,
  apiCallsThisMonth: 150,
  apiRateLimit: 300,
  apiCallsPercentage: 50,
  lastResetDate: '2026-04-01T00:00:00Z',
}

vi.mock('@accounts/error-handling-web', () => ({
  useApiQuery: vi.fn((key: unknown[], _fn: unknown, _opts: unknown) => {
    const keyStr = JSON.stringify(key)
    if (keyStr.includes('subscription')) return { data: mockSubscription, isLoading: false }
    if (keyStr.includes('quotas')) return { data: mockQuota, isLoading: false }
    return { data: undefined, isLoading: false }
  }),
  useApiMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  isTransientError: vi.fn(),
  formatError: vi.fn(),
}))

vi.stubEnv('VITE_ORG_ID', 'org-1')

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the plan name', () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getByText('Professional')).toBeInTheDocument()
  })

  it('renders subscription status chip', () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
  })

  it('renders quota gauges with correct usage values', () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getByText('12 / 25')).toBeInTheDocument()
    expect(screen.getByText('1200 / 5000')).toBeInTheDocument()
    expect(screen.getByText('150 / 300')).toBeInTheDocument()
  })

  it('renders upgrade CTA button', () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getByRole('button', { name: /upgrade/i })).toBeInTheDocument()
  })

  it('shows unlimited label when maxUsers is null', async () => {
    const { useApiQuery } = await import('@accounts/error-handling-web')
    const quotaUnlimited = { ...mockQuota, maxUsers: null, usersPercentage: 0 }
    vi.mocked(useApiQuery).mockImplementation((key: unknown[], _fn: unknown, _opts: unknown) => {
      const keyStr = JSON.stringify(key)
      if (keyStr.includes('subscription')) return { data: mockSubscription, isLoading: false } as ReturnType<typeof useApiQuery>
      if (keyStr.includes('quotas')) return { data: quotaUnlimited, isLoading: false } as ReturnType<typeof useApiQuery>
      return { data: undefined, isLoading: false } as ReturnType<typeof useApiQuery>
    })
    renderWithProviders(<DashboardPage />)
    expect(screen.getAllByText('dashboard.unlimited').length).toBeGreaterThan(0)
  })
})
