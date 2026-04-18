import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from 'react-oidc-context'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

export function CallbackPage() {
  const auth = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [auth.isLoading, auth.isAuthenticated, navigate])

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <CircularProgress />
    </Box>
  )
}
