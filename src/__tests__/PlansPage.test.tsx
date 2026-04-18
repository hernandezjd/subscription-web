import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { PlansPage } from '../pages/PlansPage'
import { renderWithProviders } from '../test-utils/renderWithProviders'

vi.mock('react-oidc-context', () => ({
  useAuth: vi.fn(() => ({ user: { access_token: 'test-token' } })),
}))

const mockPlans = [
  {
    id: 'plan-free',
    name: 'Free Trial',
    description: '14-day free trial',
    monthlyPrice: null,
    annualPrice: null,
    features: {},
    quotas: { maxUsers: 5, maxTransactionsPerMonth: 100, apiRateLimit: 60 },
  },
  {
    id: 'plan-starter',
    name: 'Starter',
    description: 'For small teams',
    monthlyPrice: 29,
    annualPrice: 290,
    features: {},
    quotas: { maxUsers: 10, maxTransactionsPerMonth: 1000, apiRateLimit: 120 },
  },
  {
    id: 'plan-pro',
    name: 'Professional',
    description: 'For growing teams',
    monthlyPrice: 99,
    annualPrice: 990,
    features: {},
    quotas: { maxUsers: 25, maxTransactionsPerMonth: 5000, apiRateLimit: 300 },
  },
]

const mockSubscription = {
  id: 'sub-1',
  organizationId: 'org-1',
  planId: 'plan-starter',
  plan: mockPlans[1],
  status: 'ACTIVE',
  startDate: '2026-01-01T00:00:00Z',
  expirationDate: '2027-01-01T00:00:00Z',
  autoRenew: true,
  createdAt: '2026-01-01T00:00:00Z',
  modifiedAt: '2026-01-01T00:00:00Z',
}

vi.mock('@accounts/error-handling-web', () => ({
  useApiQuery: vi.fn((key: unknown[], _fn: unknown, _opts: unknown) => {
    const keyStr = JSON.stringify(key)
    if (keyStr.includes('plans')) return { data: mockPlans, isLoading: false }
    if (keyStr.includes('subscription')) return { data: mockSubscription, isLoading: false }
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

describe('PlansPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all plans', () => {
    renderWithProviders(<PlansPage />)
    expect(screen.getByText('Free Trial')).toBeInTheDocument()
    expect(screen.getByText('Starter')).toBeInTheDocument()
    expect(screen.getByText('Professional')).toBeInTheDocument()
  })

  it('highlights the current plan with a chip', () => {
    renderWithProviders(<PlansPage />)
    expect(screen.getByText('plans.currentPlan')).toBeInTheDocument()
  })

  it('does not show select button for current plan', () => {
    renderWithProviders(<PlansPage />)
    const selectButtons = screen.getAllByRole('button', { name: /plans.selectPlan/i })
    expect(selectButtons.length).toBe(mockPlans.length - 1)
  })

  it('opens upgrade confirmation dialog on select plan click', () => {
    renderWithProviders(<PlansPage />)
    const selectButtons = screen.getAllByRole('button', { name: /plans.selectPlan/i })
    fireEvent.click(selectButtons[0])
    expect(screen.getByText('plans.confirmTitle')).toBeInTheDocument()
  })
})
