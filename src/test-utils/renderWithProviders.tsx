import { type ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom'
import { AppThemeProvider } from '@/context/ThemeProvider'
import { ErrorProvider } from '@/context/ErrorContext'

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  routerProps?: MemoryRouterProps
}

export function renderWithProviders(
  ui: ReactElement,
  { routerProps, ...renderOptions }: RenderWithProvidersOptions = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AppThemeProvider>
          <MemoryRouter {...routerProps}>
            <ErrorProvider>{children}</ErrorProvider>
          </MemoryRouter>
        </AppThemeProvider>
      </QueryClientProvider>
    )
  }

  return { queryClient, ...render(ui, { wrapper: Wrapper, ...renderOptions }) }
}
