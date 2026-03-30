import type { TimeSignature, Bar, Beat, Staff } from '../../types/musicTypes';

/**
 * Parse time signature string to TimeSignature object
 */
export const parseTimeSignature = function(timeSig: string): TimeSignature {
  const [numerator, denominator] = timeSig.split('/').map(Number);
  return {
    beatsPerMeasure: numerator,
    beatValue: denominator,
    display: timeSig,
  };
};

/**
 * Create an empty beat
 */
export const createEmptyBeat = function(index: number): Beat {
  return {
    index,
    notes: [],
  };
};

/**
 * Create an empty bar with the correct number of beats
 */
export const createEmptyBar = function(
  index: number, 
  timeSignature: TimeSignature
): Bar {
  const beats: Beat[] = [];
  for (let i = 0; i < timeSignature.beatsPerMeasure; i++) {
    beats.push(createEmptyBeat(i));
  }
  
  return {
    index,
    beats,
  };
};

/**
 * Get effective time signature for a bar (with fallback to staff/project)
 */
export const getEffectiveTimeSignature = function(
  bar: Bar,
  staff: Staff,
  projectDefault: TimeSignature
): TimeSignature {
  return bar.timeSignature || staff.timeSignature || projectDefault;
};

/**
 * Get effective BPM for a bar (with fallback to project)
 */
export const getEffectiveBPM = function(
  bar: Bar,
  projectBPM: number
): number {
  return bar.bpm || projectBPM;
};

/**
 * Initialize staff with default bars
 */
export const initializeStaff = function(
  staff: Partial<Staff>,
  defaultTimeSignature: TimeSignature,
  barCount: number = 1
): Staff {
  const bars: Bar[] = [];
  
  for (let i = 0; i < barCount; i++) {
    bars.push(createEmptyBar(i, defaultTimeSignature));
  }
  
  return {
    id: staff.id || 'staff-1',
    name: staff.name || 'Staff 1',
    clef: staff.clef || 'treble',
    keySignature: staff.keySignature || 'C',
    bars,
    instrument: staff.instrument || 'piano',
    volume: staff.volume ?? 0.8,
    muted: staff.muted ?? false,
    visible: staff.visible ?? true,
    colorMapping: staff.colorMapping || { id: 'default', name: 'Default', colors: [] },
  };
};
