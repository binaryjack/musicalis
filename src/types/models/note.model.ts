import { MusicNote, NoteDuration, RestType, MusicalElementType } from '../enums';

/**
 * Base interface for musical elements
 */
export interface MusicalElement {
  id: string;
  type: MusicalElementType;
  duration: NoteDuration;
  dotted: boolean;
}

/**
 * Represents a musical note
 */
export interface Note extends MusicalElement {
  type: typeof MusicalElementType.NOTE;
  pitch: MusicNote;
  octave: number; // 0-8 for piano
  velocity: number; // 0-127 (MIDI standard)
  accidental?: 'sharp' | 'flat' | 'natural';
}

/**
 * Represents a musical rest
 */
export interface Rest extends MusicalElement {
  type: typeof MusicalElementType.REST;
  restType: RestType;
}

/**
 * Union type for both notes and rests
 */
export type MusicalNote = Note | Rest;

/**
 * Legacy Note interface for backward compatibility
 * @deprecated Use Note or Rest interfaces instead
 */
export interface LegacyNote {
  id: string;
  pitch: MusicNote | null; // null represents a rest/silence
  octave: number; // 0-8 for piano
  duration: NoteDuration;
  dotted: boolean;
  velocity: number; // 0-127 (MIDI standard)
  accidental?: 'sharp' | 'flat' | 'natural';
}

/**
 * Note with timing information
 */
export interface NoteWithTiming extends Note {
  startTime: number; // milliseconds
  endTime: number; // milliseconds
  durationMs: number; // milliseconds
}
