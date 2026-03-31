/**
 * Musical note pitches (octave 0-8 for piano range)
 */
export const MusicNote = {
  C: 'C',
  D: 'D',
  E: 'E',
  F: 'F',
  G: 'G',
  A: 'A',
  B: 'B',
} as const;

export type MusicNote = typeof MusicNote[keyof typeof MusicNote];

/**
 * Note durations in musical time
 */
export const NoteDuration = {
  WHOLE: 'whole',
  HALF: 'half',
  QUARTER: 'quarter',
  EIGHTH: 'eighth',
  SIXTEENTH: 'sixteenth',
} as const;

export type NoteDuration = typeof NoteDuration[keyof typeof NoteDuration];

/**
 * Time signatures for bars
 */
export const TimeSignature = {
  FOUR_FOUR: '4/4',
  THREE_FOUR: '3/4',
  TWO_FOUR: '2/4',
  SIX_EIGHT: '6/8',
} as const;

export type TimeSignature = typeof TimeSignature[keyof typeof TimeSignature];

/**
 * Musical clefs
 */
export const Clef = {
  TREBLE: 'treble',
  BASS: 'bass',
  ALTO: 'alto',
} as const;

export type Clef = typeof Clef[keyof typeof Clef];

/**
 * Metronome subdivision options
 */
export const MetronomeSubdivision = {
  QUARTER: 'quarter',
  EIGHTH: 'eighth',
  SIXTEENTH: 'sixteenth',
} as const;

export type MetronomeSubdivision = typeof MetronomeSubdivision[keyof typeof MetronomeSubdivision];

/**
 * Metronome sound types
 */
export const MetronomeSoundType = {
  CLICK: 'click',
  BELL: 'bell',
  WOOD: 'wood',
} as const;

export type MetronomeSoundType = typeof MetronomeSoundType[keyof typeof MetronomeSoundType];

/**
 * Rest types corresponding to note durations
 */
export const RestType = {
  WHOLE_REST: 'whole-rest',
  HALF_REST: 'half-rest',
  QUARTER_REST: 'quarter-rest',
  EIGHTH_REST: 'eighth-rest',
  SIXTEENTH_REST: 'sixteenth-rest',
} as const;

export type RestType = typeof RestType[keyof typeof RestType];

/**
 * Musical element type - either note or rest
 */
export const MusicalElementType = {
  NOTE: 'note',
  REST: 'rest',
} as const;

export type MusicalElementType = typeof MusicalElementType[keyof typeof MusicalElementType];

/**
 * Audio quality tiers with sample rates
 */
export const AudioQuality = {
  DRAFT: 'draft',
  MID: 'mid',
  HI: 'hi',
} as const;

export type AudioQuality = typeof AudioQuality[keyof typeof AudioQuality];

/**
 * Sample rates for audio quality
 */
export const AUDIO_QUALITY_SAMPLE_RATES: Record<AudioQuality, number> = {
  [AudioQuality.DRAFT]: 22050,
  [AudioQuality.MID]: 44100,
  [AudioQuality.HI]: 48000,
};
