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
 * Musical note pitches - scientific notation
 */
export const musicNote = {
  // Basic notes without octave (for pitch class)
  C: 'C',
  D: 'D', 
  E: 'E',
  F: 'F',
  G: 'G',
  A: 'A',
  B: 'B',
  
  // Scientific notation with octaves (commonly used)
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
 * Pitch notation systems
 */
export const pitchNotationSystem = {
  scientific: 'scientific',           // C4, D#4, Bb5
  'solfege-fixed': 'solfege-fixed',   // Do4, Do#4, Sib5 (Do = C always)
  'solfege-movable': 'solfege-movable', // Do, Re, Mi (Do = tonic)
} as const;

export type PitchNotationSystem = typeof pitchNotationSystem[keyof typeof pitchNotationSystem];

/**
 * Time Signature
 */
export interface TimeSignature {
  beatsPerMeasure: number;  // 4 in "4/4"
  beatValue: number;        // 4 in "4/4" (quarter note)
  display: string;          // "4/4"
}

/**
 * Tempo
 */
export interface Tempo {
  bpm: number;              // 120
  beatUnit: number;         // 4 (quarter note)
}

/**
 * Note - represents a single musical note
 */
export interface Note {
  id: string;
  
  // Pitch
  pitch: string;                    // "C", "D#", "Bb"
  octave: number;                   // 4, 5, 6
  accidental?: '#' | 'b' | '♮';    // Sharp, flat, natural
  
  // Duration
  duration: NoteDuration;
  
  // Position (PLAYBACK - for audio sync)
  beatIndex: number;                // Which beat in bar (0-3 for 4/4)
  subdivisionOffset: number;        // 0 = on-beat, 0.5 = half-beat
  
  // Position (VISUAL - for display adjustment)
  visualOffsetX?: number;           // Pixels offset from calculated position
  visualOffsetY?: number;           // Pixels offset for vertical clarity
  
  // Audio
  velocity: number;                 // 0-127 (MIDI)
  
  // Visual
  colorId?: string;
}

/**
 * Beat - represents one beat within a bar
 */
export interface Beat {
  index: number;                    // 0-based within bar
  notes: Note[];                    // All notes at this beat
}

/**
 * Bar - represents one measure
 */
export interface Bar {
  index: number;                    // 0-based
  timeSignature?: TimeSignature;    // Override staff/project
  bpm?: number;                     // Override project tempo
  beats: Beat[];                    // Always full array based on time signature
}

/**
 * Staff - represents a musical staff
 */
export interface Staff {
  id: string;
  name: string;
  clef: 'treble' | 'bass' | 'alto' | 'tenor';
  keySignature: string;             // "C", "G", "F#m"
  timeSignature?: TimeSignature;    // Override project default
  bars: Bar[];                      // Array of bars
  
  // Audio
  instrument: string;
  volume: number;                   // 0-1
  muted: boolean;
  visible: boolean;
  
  // Visual
  colorMapping: ColorMapping;
}

/**
 * Project - top level container
 */
export interface Project {
  id: string;
  name: string;
  bpm: number;                      // Default tempo
  defaultTimeSignature: TimeSignature;
  staffs: Staff[];
  config: ProjectConfig;
}

/**
 * Project Configuration
 */
export interface ProjectConfig {
  pitchNotation: PitchNotationSystem;
  snapToBeat: boolean;              // Auto-snap notes to beat grid
  snapSubdivision: number;          // 1, 2, 4, 8, 16
  defaultSubdivisions: number;      // For beat rendering
}

/**
 * Legacy PianoStaff - keeping for backward compatibility
 * @deprecated Use Staff instead
 */
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
  measuresCount?: number;
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
  pitchRange?: { min: string; max: string };
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
  timeSignature: TimeSignature;
  keySignature: { key: string; mode: string; sharps: number; flats: number };
}

// Legacy Bar interface removed - using new Bar interface above

export interface BarMeasure extends Bar {
  duration?: number;
  isEmpty?: boolean;
  isRepeatable?: boolean;
}

export interface KeySignature {
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