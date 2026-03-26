import { TimeSignature, Clef } from '../enums';
import type { Note } from './note.model';

/**
 * Represents a musical bar/measure
 */
export interface Bar {
  id: string;
  staffId: string;
  clef: Clef;
  notes: Note[];
  timeSignature?: TimeSignature;
  tempoOverride?: number; // BPM if different from project
}
