/**
 * Playback states
 */
export const PlaybackState = {
  STOPPED: 'stopped',
  PLAYING: 'playing',
  PAUSED: 'paused',
} as const;

export type PlaybackState = typeof PlaybackState[keyof typeof PlaybackState];

/**
 * Color mapping preset types
 */
export const ColorMappingPreset = {
  BY_HAND: 'byHand',
  BY_OCTAVE: 'byOctave',
  BY_RANGE: 'byRange',
  CUSTOM: 'custom',
} as const;

export type ColorMappingPreset = typeof ColorMappingPreset[keyof typeof ColorMappingPreset];

/**
 * Editor modes
 */
export const EditorMode = {
  DESIGN: 'design',
  PLAYBACK: 'playback',
} as const;

export type EditorMode = typeof EditorMode[keyof typeof EditorMode];
