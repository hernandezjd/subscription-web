import { AuthProvider } from 'react-oidc-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { oidcConfig, userManager } from './auth/oidc-config'
import { AuthGuard } from './components/AuthGuard'
import { AppThemeProvider } from './context/ThemeProvider'
import { ErrorProvider, useError } from './context/ErrorContext'
import { AppShell } from './components/layout/AppShell'
import { ErrorDialog } from './components/ErrorDialog'
import { CallbackPage } from './pages/CallbackPage'
import { DashboardPage } from './pages/DashboardPage'
import { PlansPage } from './pages/PlansPage'
import { HistoryPage } from './pages/HistoryPage'

const queryClient = new QueryClient()

function AppContent() {
  const { error, clearError } = useError()

  return (
    <>
      <BrowserRouter basename="/subscription">
        <Routes>
          <Route path="/callback" element={<CallbackPage />} />
          <Route
            path="/*"
            element={
              <AuthGuard>
                <AppShell />
              </AuthGuard>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="plans" element={<PlansPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ErrorDialog open={!!error} error={error} onClose={clearError} />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider {...oidcConfig} userManager={userManager}>
      <QueryClientProvider client={queryClient}>
        <AppThemeProvider>
          <ErrorProvider>
            <AppContent />
          </ErrorProvider>
        </AppThemeProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}
