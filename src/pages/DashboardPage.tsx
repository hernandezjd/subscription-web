import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from 'react-oidc-context'
import { useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import CircularProgress from '@mui/material/CircularProgress'
import { useApiQuery, useApiMutation } from '@accounts/error-handling-web'
import { createAuthClient } from '../api/client'
import type { components } from '../api/types'

type Subscription = components['schemas']['Subscription']
type QuotaUsage = {
  organizationId: string
  planId: string
  activeUsers: number
  maxUsers: number | null
  usersPercentage: number
  transactionsThisMonth: number
  maxTransactionsPerMonth: number | null
  transactionsPercentage: number
  apiCallsThisMonth: number
  apiRateLimit: number | null
  apiCallsPercentage: number
  lastResetDate: string
}

function daysUntil(dateStr: string): number {
  const now = new Date()
  const target = new Date(dateStr)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function statusColor(status: string): 'success' | 'error' | 'warning' | 'default' {
  if (status === 'ACTIVE') return 'success'
  if (status === 'EXPIRED') return 'error'
  if (status === 'SUSPENDED') return 'warning'
  return 'default'
}

function QuotaGauge({ label, used, max, unlimited }: { label: string; used: number; max: number | null; unlimited: string }) {
  const pct = max == null ? 0 : Math.min(100, Math.round((used / max) * 100))
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" color="text.secondary">
          {max == null ? unlimited : `${used} / ${max}`}
        </Typography>
      </Box>
      <LinearProgress variant="determinate" value={pct} color={pct >= 90 ? 'error' : pct >= 75 ? 'warning' : 'primary'} />
    </Box>
  )
}

export function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const auth = useAuth()
  const queryClient = useQueryClient()

  // TODO (step 11.5.15): replace VITE_ORG_ID with org ID from multi-org selection flow
  const orgId = import.meta.env.VITE_ORG_ID as string | undefined

  const { data: subscription, isLoading: subLoading } = useApiQuery(
    ['subscription', orgId],
    async () => {
      if (!orgId) return { data: undefined, error: null }
      const client = createAuthClient(auth.user!.access_token)
      const response = await client.GET('/subscriptions/organization/{orgId}', {
        params: { path: { orgId } },
      })
      return { data: response.error ? undefined : response.data as Subscription, error: response.error }
    },
    { enabled: !!orgId && !!auth.user },
  )

  const { data: quotaUsage, isLoading: quotaLoading } = useApiQuery(
    ['quotas', orgId],
    async () => {
      if (!orgId) return { data: undefined, error: null }
      const client = createAuthClient(auth.user!.access_token)
      const response = await client.GET('/quotas/organization/{orgId}', {
        params: { path: { orgId } },
      })
      return { data: response.error ? undefined : response.data as QuotaUsage, error: response.error }
    },
    { enabled: !!orgId && !!auth.user },
  )

  const { mutateAsync: updateSubscription, isPending: updating } = useApiMutation(
    async (autoRenew: boolean) => {
      if (!subscription) return { data: undefined, error: null }
      const client = createAuthClient(auth.user!.access_token)
      const response = await client.PUT('/subscriptions/{id}', {
        params: { path: { id: subscription.id } },
        body: { autoRenew },
      })
      return { data: response.data, error: response.error }
    },
    {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['subscription', orgId] })
      },
    },
  )

  if (!orgId) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        No organization configured. Set VITE_ORG_ID in your environment.
      </Alert>
    )
  }

  if (subLoading || quotaLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    )
  }

  if (!subscription) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No active subscription found for this organization.
      </Alert>
    )
  }

  const daysLeft = daysUntil(subscription.expirationDate)
  const showTrialBanner = daysLeft <= 14 && subscription.status === 'ACTIVE'

  return (
    <Box>
      <Typography variant="h5" gutterBottom>{t('dashboard.title')}</Typography>

      {showTrialBanner && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('dashboard.trialDaysRemaining', { days: daysLeft })}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* Current Plan Card */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="h6">{t('dashboard.currentPlan')}</Typography>
              <Chip label={subscription.status} color={statusColor(subscription.status)} size="small" />
            </Box>
            <Typography variant="h5" sx={{ mb: 1 }}>{subscription.plan.name}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {subscription.plan.description}
            </Typography>
            {subscription.plan.monthlyPrice != null && (
              <Typography variant="body1">
                ${subscription.plan.monthlyPrice} {t('dashboard.perMonth')}
                {subscription.plan.annualPrice != null && (
                  <> · ${subscription.plan.annualPrice} {t('dashboard.perYear')}</>
                )}
              </Typography>
            )}
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {t('dashboard.startDate')}: {new Date(subscription.startDate).toLocaleDateString()}
              </Typography>
              <br />
              <Typography variant="caption" color="text.secondary">
                {t('dashboard.expirationDate')}: {new Date(subscription.expirationDate).toLocaleDateString()}
              </Typography>
            </Box>
            <FormControlLabel
              sx={{ mt: 1 }}
              control={
                <Switch
                  checked={subscription.autoRenew}
                  disabled={updating}
                  onChange={(e) => { void updateSubscription(e.target.checked) }}
                />
              }
              label={t('dashboard.autoRenew')}
            />
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" onClick={() => navigate('/plans')}>
                {t('dashboard.upgradeCta')}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Quota Usage Card */}
        {quotaUsage && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>{t('dashboard.quotaUsage')}</Typography>
              <QuotaGauge
                label={t('dashboard.users')}
                used={quotaUsage.activeUsers}
                max={quotaUsage.maxUsers}
                unlimited={t('dashboard.unlimited')}
              />
              <QuotaGauge
                label={t('dashboard.transactions')}
                used={quotaUsage.transactionsThisMonth}
                max={quotaUsage.maxTransactionsPerMonth}
                unlimited={t('dashboard.unlimited')}
              />
              <QuotaGauge
                label={t('dashboard.apiCalls')}
                used={quotaUsage.apiCallsThisMonth}
                max={quotaUsage.apiRateLimit}
                unlimited={t('dashboard.unlimited')}
              />
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  )
}
