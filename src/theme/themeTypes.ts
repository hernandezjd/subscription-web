export interface PaletteSettings {
  primaryMain: string
  secondaryMain: string
  errorMain: string
  warningMain: string
  successMain: string
  infoMain: string
}

export interface TypographySettings {
  fontFamily: string
  fontSizeBase: number
}

export interface ShapeSettings {
  borderRadiusSubtle: number
  borderRadiusStandard: number
  borderRadiusLarge: number
}

export interface SpacingSettings {
  unit: number
}

export interface ThemeSettings {
  palette: PaletteSettings
  typography: TypographySettings
  shape: ShapeSettings
  spacing: SpacingSettings
}

export const defaultThemeSettings: ThemeSettings = {
  palette: {
    primaryMain: '#1976d2',
    secondaryMain: '#9c27b0',
    errorMain: '#d32f2f',
    warningMain: '#ed6c02',
    successMain: '#2e7d32',
    infoMain: '#0288d1',
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSizeBase: 14,
  },
  shape: {
    borderRadiusSubtle: 4,
    borderRadiusStandard: 8,
    borderRadiusLarge: 12,
  },
  spacing: {
    unit: 8,
  },
}
