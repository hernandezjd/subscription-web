import { useMemo, type ReactNode } from 'react'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import GlobalStyles from '@mui/material/GlobalStyles'
import { createAppTheme, defaultThemeSettings } from '@/theme'

interface AppThemeProviderProps {
  children: ReactNode
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const theme = useMemo(() => createAppTheme(defaultThemeSettings), [])

  const cssVars = {
    '--pa-color-primary': defaultThemeSettings.palette.primaryMain,
    '--pa-color-secondary': defaultThemeSettings.palette.secondaryMain,
    '--pa-color-error': defaultThemeSettings.palette.errorMain,
    '--pa-color-warning': defaultThemeSettings.palette.warningMain,
    '--pa-color-success': defaultThemeSettings.palette.successMain,
    '--pa-color-info': defaultThemeSettings.palette.infoMain,
    '--pa-font-family': defaultThemeSettings.typography.fontFamily,
    '--pa-font-size-base': `${defaultThemeSettings.typography.fontSizeBase}px`,
    '--pa-spacing-unit': `${defaultThemeSettings.spacing.unit}px`,
    '--pa-border-radius-subtle': `${defaultThemeSettings.shape.borderRadiusSubtle}px`,
    '--pa-border-radius-standard': `${defaultThemeSettings.shape.borderRadiusStandard}px`,
    '--pa-border-radius-large': `${defaultThemeSettings.shape.borderRadiusLarge}px`,
  }

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={{ ':root': cssVars }} />
      {children}
    </MuiThemeProvider>
  )
}
