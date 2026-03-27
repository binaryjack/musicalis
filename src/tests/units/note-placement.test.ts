import { describe, test, expect } from '@jest/globals';

interface NotePosition {
  x: number;
  y: number;
}

interface StaffDimensions {
  width: number;
  height: number;
  lineSpacing: number;
}

export const calculatePitchFromY = function(y: number, staffTop: number, lineSpacing: number): string {
  const staffMiddle = staffTop + (lineSpacing * 2);
  const relativeY = y - staffMiddle;
  
  const pitchMap = [
    'F/5', 'E/5', 'D/5', 'C/5', 'B/4', 'A/4', 'G/4', 'F/4', 'E/4', 'D/4', 'C/4'
  ];
  
  const index = Math.max(0, Math.min(pitchMap.length - 1, Math.floor(-relativeY / (lineSpacing / 2)) + 5));
  return pitchMap[index];
};

export const calculateBeatFromX = function(x: number, staffStart: number, staffWidth: number, beatsPerMeasure: number): number {
  const relativeX = x - staffStart;
  const beatWidth = staffWidth / beatsPerMeasure;
  return Math.max(0, Math.floor(relativeX / beatWidth));
};

export const isValidStaffPosition = function(position: NotePosition, staff: StaffDimensions): boolean {
  return position.x >= 0 && 
         position.x <= staff.width && 
         position.y >= 0 && 
         position.y <= staff.height;
};

describe('pitch-calculation from-y-coordinate', () => {
  test('calculates-pitch-from-center', () => {
    const pitch = calculatePitchFromY(120, 100, 10);
    expect(pitch).toBe('A/4');
  });

  test('calculates-higher-pitch-above-center', () => {
    const pitch = calculatePitchFromY(100, 100, 10);
    expect(pitch).toBe('D/4');
  });

  test('calculates-lower-pitch-below-center', () => {
    const pitch = calculatePitchFromY(140, 100, 10);
    expect(pitch).toBe('E/5');
  });

  test('clamps-to-highest-pitch', () => {
    const pitch = calculatePitchFromY(50, 100, 10);
    expect(pitch).toBe('C/4');
  });

  test('clamps-to-lowest-pitch', () => {
    const pitch = calculatePitchFromY(200, 100, 10);
    expect(pitch).toBe('F/5');
  });
});

describe('beat-calculation from-x-coordinate', () => {
  test('calculates-first-beat', () => {
    const beat = calculateBeatFromX(50, 0, 400, 4);
    expect(beat).toBe(0);
  });

  test('calculates-second-beat', () => {
    const beat = calculateBeatFromX(150, 0, 400, 4);
    expect(beat).toBe(1);
  });

  test('calculates-fourth-beat', () => {
    const beat = calculateBeatFromX(350, 0, 400, 4);
    expect(beat).toBe(3);
  });

  test('handles-click-before-staff', () => {
    const beat = calculateBeatFromX(-50, 0, 400, 4);
    expect(beat).toBe(0);
  });

  test('handles-different-time-signatures', () => {
    const beat = calculateBeatFromX(200, 0, 300, 3);
    expect(beat).toBe(2);
  });
});

describe('staff-position validation', () => {
  const staffDimensions: StaffDimensions = {
    width: 800,
    height: 200,
    lineSpacing: 10
  };

  test('validates-position-within-bounds', () => {
    const position: NotePosition = { x: 400, y: 100 };
    expect(isValidStaffPosition(position, staffDimensions)).toBe(true);
  });

  test('rejects-position-left-of-staff', () => {
    const position: NotePosition = { x: -50, y: 100 };
    expect(isValidStaffPosition(position, staffDimensions)).toBe(false);
  });

  test('rejects-position-right-of-staff', () => {
    const position: NotePosition = { x: 900, y: 100 };
    expect(isValidStaffPosition(position, staffDimensions)).toBe(false);
  });

  test('rejects-position-above-staff', () => {
    const position: NotePosition = { x: 400, y: -50 };
    expect(isValidStaffPosition(position, staffDimensions)).toBe(false);
  });

  test('rejects-position-below-staff', () => {
    const position: NotePosition = { x: 400, y: 250 };
    expect(isValidStaffPosition(position, staffDimensions)).toBe(false);
  });

  test('accepts-position-at-edges', () => {
    const topLeft: NotePosition = { x: 0, y: 0 };
    const bottomRight: NotePosition = { x: 800, y: 200 };
    
    expect(isValidStaffPosition(topLeft, staffDimensions)).toBe(true);
    expect(isValidStaffPosition(bottomRight, staffDimensions)).toBe(true);
  });
});