/**
 * Export format types - strict union
 */
export const exportFormat = {
  mp4: 'mp4',
  mov: 'mov',
  avi: 'avi',
  webm: 'webm',
  gif: 'gif',
} as const;

export type ExportFormat = typeof exportFormat[keyof typeof exportFormat];

/**
 * Export quality types - strict union with kebab-case values
 */
export const exportQuality = {
  low: 'low',
  medium: 'medium', 
  high: 'high',
  'ultra-high': 'ultra-high',
} as const;

export type ExportQuality = typeof exportQuality[keyof typeof exportQuality];

/**
 * Export status tracking - strict union
 */
export const exportStatus = {
  idle: 'idle',
  preparing: 'preparing',
  rendering: 'rendering',
  encoding: 'encoding',
  completed: 'completed',
  error: 'error',
} as const;

export type ExportStatus = typeof exportStatus[keyof typeof exportStatus];