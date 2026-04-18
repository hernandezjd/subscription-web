import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import type { FormattedError } from '@accounts/error-handling-web'

interface ErrorDialogProps {
  open: boolean
  error: FormattedError | null
  onClose: () => void
}

export function ErrorDialog({ open, error, onClose }: ErrorDialogProps) {
  const { t } = useTranslation()

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  if (!error) return null

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('error.title')}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color={error.severity === 'warning' ? 'warning.main' : 'error'}>
            {error.userMessage}
          </Typography>
          {error.suggestion && (
            <Typography variant="caption" color="textSecondary">
              {error.suggestion}
            </Typography>
          )}
          {error.requestId && (
            <Typography variant="caption" sx={{ fontFamily: 'monospace', mt: 1 }}>
              {t('error.requestId')}: {error.requestId}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="contained">
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
