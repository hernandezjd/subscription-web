import { useAuth } from 'react-oidc-context'
import type { ReactNode } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

export function AuthGuard({ children }: { children: ReactNode }) {
  const auth = useAuth()

  if (auth.isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    )
  }

  if (!auth.isAuthenticated) {
    auth.signinRedirect()
    return null
  }

  return <>{children}</>
}
