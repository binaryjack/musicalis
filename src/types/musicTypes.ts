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

export interface PianoStaff {
  id: string;
  name: string;
  clef: 'treble' | 'bass' | 'alto' | 'tenor';
  keySignature: string;
  timeSignature: string;
  notes: Note[];
  colorMapping: ColorMapping;
  visible: boolean;
  muted: boolean;
  volume: number;
  instrument: string;
  measuresCount?: number; // Number of measures in this staff
}

export interface Note {
  id: string;
  pitch: MusicNote;
  duration: NoteDuration;
  position: number;
  velocity: number;
  staffId: string;
  barNumber: number;
  colorId?: string;
}

export interface ColorMapping {
  id: string;
  name: string;
  colors: ColorRule[];
}

export interface ColorRule {
  id: string;
  name: string;
  hex: string;
  condition: NoteCondition;
}

export interface NoteCondition {
  pitchRange?: { min: MusicNote; max: MusicNote };
  velocityRange?: { min: number; max: number };
  durationTypes?: NoteDuration[];
  barRange?: { start: number; end: number };
}

export interface MemoryInfo {
  totalMemoryMB: number;
  usedMemoryMB: number;
  bufferCacheMB: number;
  maxCacheMB: number;
  usagePercent: number;
  warningLevel: 'safe' | 'warning' | 'critical';
}

export interface AudioQuality {
  id: string;
  name: string;
  sampleRate: number;
  bitRate: number;
  memoryImpactMB: number;
}

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

// Additional types for compatibility
export interface MusicComposition {
  id: string;
  title: string;
  bpm: number;
  timeSignature: { numerator: number; denominator: number };
  keySignature: { key: string; mode: string; sharps: number; flats: number };
  bars: Bar[];
}

export interface Bar {
  id: string;
  number: number;
  timeSignature?: string | TimeSignature;
  keySignature?: string | KeySignature;
  notes: Note[];
  duration?: number;
  isEmpty?: boolean;
  isRepeatable?: boolean;
}

export interface BarMeasure extends Bar {
  duration?: number;
  isEmpty?: boolean;
  isRepeatable?: boolean;
}

export interface TimeSignature {
  numerator: number;
  denominator: number;
}

export interface KeySignature {
  key: string;
  mode: string;
  sharps: number;
  flats: number;
}

export interface VideoExportOptions {
  format: 'mp4' | 'webm' | 'avi';
  quality: 'draft' | 'mid' | 'hi-res';
  audioSampleRate: number;
  videoBitrate: number;
  resolution: { width: number; height: number };
  includeMetadata: boolean;
  showNoteColors: boolean;
  showPlayhead: boolean;
}