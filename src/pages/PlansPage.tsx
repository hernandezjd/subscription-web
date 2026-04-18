import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from 'react-oidc-context'
import { useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import { useApiQuery, useApiMutation } from '@accounts/error-handling-web'
import { createAuthClient } from '../api/client'
import type { components } from '../api/types'

type Plan = components['schemas']['Plan']
type Subscription = components['schemas']['Subscription']

export function PlansPage() {
  const { t } = useTranslation()
  const auth = useAuth()
  const queryClient = useQueryClient()
  const orgId = import.meta.env.VITE_ORG_ID as string | undefined

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)

  const { data: plans, isLoading: plansLoading } = useApiQuery(
    ['plans'],
    async () => {
      const client = createAuthClient(auth.user!.access_token)
      const response = await client.GET('/plans')
      return { data: response.error ? undefined : response.data as Plan[], error: response.error }
    },
    { enabled: !!auth.user },
  )

  const { data: subscription } = useApiQuery(
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

  const { mutateAsync: changePlan, isPending: changing } = useApiMutation(
    async (planId: string) => {
      if (!subscription) return { data: undefined, error: null }
      const client = createAuthClient(auth.user!.access_token)
      const response = await client.PUT('/subscriptions/{id}', {
        params: { path: { id: subscription.id } },
        body: { planId },
      })
      return { data: response.data, error: response.error }
    },
    {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['subscription', orgId] })
      },
    },
  )

  async function handleConfirmChange() {
    if (!selectedPlan) return
    await changePlan(selectedPlan.id)
    setSelectedPlan(null)
  }

  if (plansLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>{t('plans.title')}</Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
        {(plans ?? []).map((plan) => {
          const isCurrent = subscription?.planId === plan.id
          return (
            <Card
              key={plan.id}
              sx={{ border: isCurrent ? 2 : 1, borderColor: isCurrent ? 'primary.main' : 'divider' }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6">{plan.name}</Typography>
                  {isCurrent && <Chip label={t('plans.currentPlan')} color="primary" size="small" />}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {plan.description}
                </Typography>
                {plan.monthlyPrice != null && (
                  <Typography variant="h6">
                    ${plan.monthlyPrice} <Typography component="span" variant="body2">{t('plans.perMonth')}</Typography>
                  </Typography>
                )}
                {plan.annualPrice != null && (
                  <Typography variant="body2" color="text.secondary">
                    ${plan.annualPrice} {t('plans.perYear')}
                  </Typography>
                )}
                <List dense sx={{ mt: 1 }}>
                  <ListItem disablePadding>
                    <ListItemText
                      primary={t('plans.maxUsers')}
                      secondary={plan.quotas.maxUsers == null ? t('plans.unlimited') : plan.quotas.maxUsers}
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemText
                      primary={t('plans.maxTransactions')}
                      secondary={plan.quotas.maxTransactionsPerMonth == null ? t('plans.unlimited') : plan.quotas.maxTransactionsPerMonth}
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemText
                      primary={t('plans.apiRateLimit')}
                      secondary={plan.quotas.apiRateLimit == null ? t('plans.unlimited') : plan.quotas.apiRateLimit}
                    />
                  </ListItem>
                </List>
              </CardContent>
              {!isCurrent && subscription && (
                <CardActions>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setSelectedPlan(plan)}
                  >
                    {t('plans.selectPlan')}
                  </Button>
                </CardActions>
              )}
            </Card>
          )
        })}
      </Box>

      <Dialog open={!!selectedPlan} onClose={() => setSelectedPlan(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('plans.confirmTitle')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('plans.confirmMessage', { name: selectedPlan?.name ?? '' })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedPlan(null)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={() => { void handleConfirmChange() }} disabled={changing}>
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
