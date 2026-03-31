import { NoteDuration, RestType, MusicalElementType, MusicNote } from '../../types';
import type { Note, Rest, MusicalNote } from '../../types/models/note.model';

/**
 * Maps note duration to corresponding rest type
 */
export const durationToRestType = (duration: NoteDuration): RestType => {
  const mapping: Record<NoteDuration, RestType> = {
    [NoteDuration.WHOLE]: RestType.WHOLE_REST,
    [NoteDuration.HALF]: RestType.HALF_REST,
    [NoteDuration.QUARTER]: RestType.QUARTER_REST,
    [NoteDuration.EIGHTH]: RestType.EIGHTH_REST,
    [NoteDuration.SIXTEENTH]: RestType.SIXTEENTH_REST,
  };
  return mapping[duration];
};

/**
 * Maps rest type to corresponding note duration
 */
export const restTypeToDuration = (restType: RestType): NoteDuration => {
  const mapping: Record<RestType, NoteDuration> = {
    [RestType.WHOLE_REST]: NoteDuration.WHOLE,
    [RestType.HALF_REST]: NoteDuration.HALF,
    [RestType.QUARTER_REST]: NoteDuration.QUARTER,
    [RestType.EIGHTH_REST]: NoteDuration.EIGHTH,
    [RestType.SIXTEENTH_REST]: NoteDuration.SIXTEENTH,
  };
  return mapping[restType];
};

/**
 * Creates a new musical note
 */
export const createNote = (config: {
  pitch: MusicNote;
  octave: number;
  duration: NoteDuration;
  velocity?: number;
  dotted?: boolean;
  accidental?: 'sharp' | 'flat' | 'natural';
}): Note => {
  return {
    id: `note-${Date.now()}-${Math.random().toString(36).substring(2)}`,
    type: MusicalElementType.NOTE,
    pitch: config.pitch,
    octave: config.octave,
    duration: config.duration,
    velocity: config.velocity ?? 64,
    dotted: config.dotted ?? false,
    accidental: config.accidental,
  };
};

/**
 * Creates a new musical rest
 */
export const createRest = (config: {
  duration: NoteDuration;
  dotted?: boolean;
}): Rest => {
  return {
    id: `rest-${Date.now()}-${Math.random().toString(36).substring(2)}`,
    type: MusicalElementType.REST,
    restType: durationToRestType(config.duration),
    duration: config.duration,
    dotted: config.dotted ?? false,
  };
};

/**
 * Type guards
 */
export const isNote = (element: MusicalNote): element is Note => {
  return element.type === MusicalElementType.NOTE;
};

export const isRest = (element: MusicalNote): element is Rest => {
  return element.type === MusicalElementType.REST;
};

/**
 * Duration calculations in milliseconds
 */
export const getDurationInMs = (duration: NoteDuration, bpm: number, dotted: boolean = false): number => {
  // Calculate beat duration (quarter note) in ms
  const quarterNoteDuration = (60 / bpm) * 1000;
  
  let durationMs: number;
  
  switch (duration) {
    case NoteDuration.WHOLE:
      durationMs = quarterNoteDuration * 4;
      break;
    case NoteDuration.HALF:
      durationMs = quarterNoteDuration * 2;
      break;
    case NoteDuration.QUARTER:
      durationMs = quarterNoteDuration;
      break;
    case NoteDuration.EIGHTH:
      durationMs = quarterNoteDuration / 2;
      break;
    case NoteDuration.SIXTEENTH:
      durationMs = quarterNoteDuration / 4;
      break;
    default:
      durationMs = quarterNoteDuration;
  }
  
  // Apply dotting (adds half the original duration)
  if (dotted) {
    durationMs *= 1.5;
  }
  
  return durationMs;
};

/**
 * Get display name for musical elements
 */
export const getElementDisplayName = (element: MusicalNote): string => {
  if (isNote(element)) {
    const accidental = element.accidental ? 
      element.accidental === 'sharp' ? '#' : 
      element.accidental === 'flat' ? 'b' : 
      '♮' : '';
    return `${element.pitch}${accidental}${element.octave}`;
  } else {
    return `Rest (${element.duration})`;
  }
};

/**
 * Convert duration to musical notation
 */
export const getDurationSymbol = (duration: NoteDuration, dotted: boolean = false): string => {
  const symbols: Record<NoteDuration, string> = {
    [NoteDuration.WHOLE]: '𝅝',
    [NoteDuration.HALF]: '𝅗𝅥',
    [NoteDuration.QUARTER]: '♩',
    [NoteDuration.EIGHTH]: '♪',
    [NoteDuration.SIXTEENTH]: '𝅘𝅥𝅯',
  };
  
  const symbol = symbols[duration];
  return dotted ? `${symbol}.` : symbol;
};

/**
 * Convert rest to musical notation
 */
export const getRestSymbol = (restType: RestType, dotted: boolean = false): string => {
  const symbols: Record<RestType, string> = {
    [RestType.WHOLE_REST]: '𝄻',
    [RestType.HALF_REST]: '𝄼',
    [RestType.QUARTER_REST]: '𝄽',
    [RestType.EIGHTH_REST]: '𝄾',
    [RestType.SIXTEENTH_REST]: '𝄿',
  };
  
  const symbol = symbols[restType];
  return dotted ? `${symbol}.` : symbol;
};