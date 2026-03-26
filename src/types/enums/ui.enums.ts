/**
 * Button variants for UI consistency
 */
export const ButtonVariant = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  DANGER: 'danger',
  SUCCESS: 'success',
  WARNING: 'warning',
} as const;

export type ButtonVariant = typeof ButtonVariant[keyof typeof ButtonVariant];

/**
 * Button sizes
 */
export const ButtonSize = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
} as const;

export type ButtonSize = typeof ButtonSize[keyof typeof ButtonSize];

/**
 * UI Theme modes
 */
export const UITheme = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

export type UITheme = typeof UITheme[keyof typeof UITheme];
