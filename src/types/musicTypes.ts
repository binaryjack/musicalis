/**
 * Music note values - strict union with kebab-case values
 */
export const musicNote = {
  'C4': 'C4',
  'D4': 'D4', 
  'E4': 'E4',
  'F4': 'F4',
  'G4': 'G4',
  'A4': 'A4',
  'B4': 'B4',
  'C5': 'C5',
  'D5': 'D5',
  'E5': 'E5',
  'F5': 'F5',
  'G5': 'G5',
  'A5': 'A5',
  'B5': 'B5',
} as const;

export type MusicNote = typeof musicNote[keyof typeof musicNote];

/**
 * Note durations - strict union
 */
export const noteDuration = {
  whole: 'whole',
  half: 'half',
  quarter: 'quarter',
  eighth: 'eighth',
  sixteenth: 'sixteenth',
} as const;

export type NoteDuration = typeof noteDuration[keyof typeof noteDuration];

/**
 * Clef types - strict union  
 */
export const clefType = {
  treble: 'treble',
  bass: 'bass',
  alto: 'alto',
  tenor: 'tenor',
} as const;

export type ClefType = typeof clefType[keyof typeof clefType];