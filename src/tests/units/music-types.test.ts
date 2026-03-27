import { describe, test, expect } from '@jest/globals';
import { musicNote, noteDuration } from '../../types/musicTypes';
import { noteVelocity } from '../../types/velocity.types';

describe('music-note validation', () => {
  test('validates-c4-note', () => {
    expect(musicNote.C4).toBe('C4');
  });

  test('validates-d4-note', () => {
    expect(musicNote.D4).toBe('D4');
  });

  test('validates-e4-note', () => {
    expect(musicNote.E4).toBe('E4');
  });

  test('validates-f4-note', () => {
    expect(musicNote.F4).toBe('F4');
  });

  test('validates-g4-note', () => {
    expect(musicNote.G4).toBe('G4');
  });

  test('validates-a4-note', () => {
    expect(musicNote.A4).toBe('A4');
  });

  test('validates-b4-note', () => {
    expect(musicNote.B4).toBe('B4');
  });
});

describe('note-duration validation', () => {
  test('validates-whole-duration', () => {
    expect(noteDuration.whole).toBe('whole');
  });

  test('validates-half-duration', () => {
    expect(noteDuration.half).toBe('half');
  });

  test('validates-quarter-duration', () => {
    expect(noteDuration.quarter).toBe('quarter');
  });

  test('validates-eighth-duration', () => {
    expect(noteDuration.eighth).toBe('eighth');
  });

  test('validates-sixteenth-duration', () => {
    expect(noteDuration.sixteenth).toBe('sixteenth');
  });
});

describe('note-velocity validation', () => {
  test('validates-min-velocity', () => {
    expect(noteVelocity.min).toBe(1);
  });

  test('validates-max-velocity', () => {
    expect(noteVelocity.max).toBe(127);
  });

  test('validates-default-velocity', () => {
    expect(noteVelocity.default).toBe(80);
  });
});