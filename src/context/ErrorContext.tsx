import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { FormattedError } from '@accounts/error-handling-web'

interface ErrorContextType {
  error: FormattedError | null
  showError: (error: FormattedError) => void
  clearError: () => void
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<FormattedError | null>(null)

  const showError = useCallback((err: FormattedError) => {
    setError(err)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return (
    <ErrorContext.Provider value={{ error, showError, clearError }}>
      {children}
    </ErrorContext.Provider>
  )
}

export function useError() {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useError must be used within ErrorProvider')
  }
  return context
}
