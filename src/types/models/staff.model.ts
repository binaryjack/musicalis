import type { Bar } from './bar.model';

/**
 * Represents a musical staff (single instrument)
 */
export interface PianoStaff {
  id: string;
  name: string;
  trebleClef: Bar[];
  bassClef: Bar[];
  colorMappingId: string;
  volume: number; // 0-1
  pan: number; // -1 (left) to 1 (right)
  muted: boolean;
  solo: boolean;
}
