import { MusicNote, NoteDuration } from '../enums';

/**
 * Represents a single musical note
 */
export interface Note {
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
