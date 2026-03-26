/**
 * Playback mode types - strict union
 */
export const playbackMode = {
  stopped: 'stopped',
  playing: 'playing',
  paused: 'paused',
  recording: 'recording', 
} as const;

export type PlaybackMode = typeof playbackMode[keyof typeof playbackMode];

/**
 * Editor mode types - strict union
 */
export const editorMode = {
  edit: 'edit',
  playback: 'playback',
} as const;

export type EditorMode = typeof editorMode[keyof typeof editorMode];