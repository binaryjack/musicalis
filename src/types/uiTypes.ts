/**
 * UI Button variants - strict union
 */
export const buttonVariant = {
  primary: 'primary',
  secondary: 'secondary', 
  danger: 'danger',
  success: 'success',
  warning: 'warning',
} as const;

export type ButtonVariant = typeof buttonVariant[keyof typeof buttonVariant];

/**
 * UI Button sizes - strict union
 */
export const buttonSize = {
  small: 'small',
  medium: 'medium',
  large: 'large',
} as const;

export type ButtonSize = typeof buttonSize[keyof typeof buttonSize];

/**
 * UI Theme types - strict union
 */
export const uiTheme = {
  light: 'light',
  dark: 'dark',
  system: 'system',
} as const;

export type UITheme = typeof uiTheme[keyof typeof uiTheme];