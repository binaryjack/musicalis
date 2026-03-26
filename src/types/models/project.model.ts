import { TimeSignature, AudioQuality } from '../enums';
import type { PianoStaff } from './staff.model';
import type { MetronomeConfig } from './metronome.model';

/**
 * Root project model
 */
export interface Project {
  id: string;
  name: string;
  description?: string;
  tempo: number; // BPM
  timeSignature: TimeSignature;
  audioQuality: AudioQuality;
  createdAt: number;
  updatedAt: number;
  pianoStaves: PianoStaff[];
  activeColorMappingId: string;
  metronomeConfig: MetronomeConfig;
  tags?: string[];
}
