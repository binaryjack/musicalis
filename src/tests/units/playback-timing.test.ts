import { describe, test, expect } from '@jest/globals';

export const calculateNoteDurationMs = function(duration: string, bpm: number): number {
  const quarterNoteMs = (60 / bpm) * 1000;
  
  const durationMap: Record<string, number> = {
    'whole': quarterNoteMs * 4,
    'half': quarterNoteMs * 2,
    'quarter': quarterNoteMs,
    'eighth': quarterNoteMs / 2,
    'sixteenth': quarterNoteMs / 4,
  };
  
  return durationMap[duration] || quarterNoteMs;
};

export const calculateBeatPosition = function(timeMs: number, bpm: number): number {
  const quarterNoteMs = (60 / bpm) * 1000;
  return timeMs / quarterNoteMs;
};

export const calculateMeasureFromBeat = function(beat: number, timeSignatureNumerator: number): number {
  return Math.floor(beat / timeSignatureNumerator);
};

export const validateTempo = function(bpm: number): boolean {
  return bpm >= 40 && bpm <= 300;
};

describe('note-duration calculations', () => {
  test('calculates-quarter-note-at-120-bpm', () => {
    const duration = calculateNoteDurationMs('quarter', 120);
    expect(duration).toBe(500);
  });

  test('calculates-whole-note-at-120-bpm', () => {
    const duration = calculateNoteDurationMs('whole', 120);
    expect(duration).toBe(2000);
  });

  test('calculates-eighth-note-at-120-bpm', () => {
    const duration = calculateNoteDurationMs('eighth', 120);
    expect(duration).toBe(250);
  });

  test('calculates-half-note-at-60-bpm', () => {
    const duration = calculateNoteDurationMs('half', 60);
    expect(duration).toBe(2000);
  });

  test('handles-invalid-duration', () => {
    const duration = calculateNoteDurationMs('invalid', 120);
    expect(duration).toBe(500);
  });

  test('calculates-sixteenth-note-at-180-bpm', () => {
    const duration = calculateNoteDurationMs('sixteenth', 180);
    expect(duration).toBeCloseTo(83.33, 1);
  });
});

describe('beat-position calculations', () => {
  test('calculates-beat-from-time-at-120-bpm', () => {
    const beat = calculateBeatPosition(1000, 120);
    expect(beat).toBe(2);
  });

  test('calculates-beat-from-time-at-60-bpm', () => {
    const beat = calculateBeatPosition(2000, 60);
    expect(beat).toBe(2);
  });

  test('handles-fractional-beats', () => {
    const beat = calculateBeatPosition(750, 120);
    expect(beat).toBe(1.5);
  });
});

describe('measure calculations', () => {
  test('calculates-measure-in-4-4-time', () => {
    const measure = calculateMeasureFromBeat(8, 4);
    expect(measure).toBe(2);
  });

  test('calculates-measure-in-3-4-time', () => {
    const measure = calculateMeasureFromBeat(9, 3);
    expect(measure).toBe(3);
  });

  test('calculates-first-measure', () => {
    const measure = calculateMeasureFromBeat(2, 4);
    expect(measure).toBe(0);
  });
});

describe('tempo validation', () => {
  test('validates-normal-tempo', () => {
    expect(validateTempo(120)).toBe(true);
  });

  test('validates-slow-tempo', () => {
    expect(validateTempo(60)).toBe(true);
  });

  test('validates-fast-tempo', () => {
    expect(validateTempo(200)).toBe(true);
  });

  test('rejects-too-slow-tempo', () => {
    expect(validateTempo(30)).toBe(false);
  });

  test('rejects-too-fast-tempo', () => {
    expect(validateTempo(400)).toBe(false);
  });

  test('validates-edge-cases', () => {
    expect(validateTempo(40)).toBe(true);
    expect(validateTempo(300)).toBe(true);
    expect(validateTempo(39)).toBe(false);
    expect(validateTempo(301)).toBe(false);
  });
});