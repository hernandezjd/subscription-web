import { useTranslation } from 'react-i18next'
import { useAuth } from 'react-oidc-context'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { useApiQuery } from '@accounts/error-handling-web'
import { createAuthClient } from '../api/client'
import type { components } from '../api/types'

type Subscription = components['schemas']['Subscription']

function statusColor(status: string): 'success' | 'error' | 'warning' | 'default' {
  if (status === 'ACTIVE') return 'success'
  if (status === 'EXPIRED') return 'error'
  if (status === 'SUSPENDED') return 'warning'
  return 'default'
}

export function HistoryPage() {
  const { t } = useTranslation()
  const auth = useAuth()
  const orgId = import.meta.env.VITE_ORG_ID as string | undefined

  const { data: subscription, isLoading } = useApiQuery(
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

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    )
  }

  if (!subscription) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>{t('history.title')}</Typography>
        <Alert severity="info">{t('history.noHistory')}</Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>{t('history.title')}</Typography>

      <Card sx={{ maxWidth: 500 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">{subscription.plan.name}</Typography>
            <Chip label={subscription.status} color={statusColor(subscription.status)} size="small" />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">{t('history.startDate')}</Typography>
              <Typography variant="body2">{new Date(subscription.startDate).toLocaleDateString()}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">{t('history.expirationDate')}</Typography>
              <Typography variant="body2">{new Date(subscription.expirationDate).toLocaleDateString()}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">{t('history.autoRenew')}</Typography>
              <Typography variant="body2">{subscription.autoRenew ? 'Yes' : 'No'}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
