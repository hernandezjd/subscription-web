import Box from '@mui/material/Box'
import { useAppVersion } from '../hooks/useAppVersion'

export function VersionFooter() {
  const { versionInfo } = useAppVersion()

  return (
    <Box
      sx={{
        padding: '8px 12px',
        fontSize: '0.75rem',
        color: 'text.secondary',
        borderTop: '1px solid',
        borderColor: 'divider',
        marginTop: 'auto',
        textAlign: 'center',
      }}
    >
      subscription-web v{versionInfo.version} ({versionInfo.commitHash})
    </Box>
  )
}
