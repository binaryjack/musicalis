import { MetronomeSubdivision, MetronomeSoundType } from '../enums';

/**
 * Metronome configuration
 */
export interface MetronomeConfig {
  enabled: boolean;
  bpm: number; // Beats per minute
  volume: number; // 0-1
  soundType: MetronomeSoundType;
  subdivision: MetronomeSubdivision;
  accentFirst: boolean; // Accent first beat of bar
}
