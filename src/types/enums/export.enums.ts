/**
 * Video quality presets for export
 */
export const VideoQuality = {
  DRAFT: 'draft',
  MID: 'mid',
  HI: 'hi',
} as const;

export type VideoQuality = typeof VideoQuality[keyof typeof VideoQuality];

/**
 * Export formats
 */
export const ExportFormat = {
  MP4: 'mp4',
  WEBM: 'webm', 
  GIF: 'gif',
} as const;

export type ExportFormat = typeof ExportFormat[keyof typeof ExportFormat];

/**
 * Export quality levels  
 */
export const ExportQuality = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high', 
  ULTRA: 'ultra',
} as const;

export type ExportQuality = typeof ExportQuality[keyof typeof ExportQuality];

/**
 * Theme modes
 */
export const ThemeMode = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

export type ThemeMode = typeof ThemeMode[keyof typeof ThemeMode];

/**
 * Video export status
 */
export const ExportStatus = {
  IDLE: 'idle',
  PREPARING: 'preparing',
  RECORDING: 'recording',
  PROCESSING: 'processing',
  COMPLETE: 'complete',
  ERROR: 'error',
  CANCELLED: 'cancelled',
} as const;

export type ExportStatus = typeof ExportStatus[keyof typeof ExportStatus];

/**
 * Video codec formats
 */
export const VideoCodec = {
  H264: 'h264',
  VP8: 'vp8',
  VP9: 'vp9',
} as const;

export type VideoCodec = typeof VideoCodec[keyof typeof VideoCodec];

/**
 * Audio codec formats
 */
export const AudioCodec = {
  AAC: 'aac',
  OPUS: 'opus',
  MP3: 'mp3',
} as const;

export type AudioCodec = typeof AudioCodec[keyof typeof AudioCodec];
