/** Pure pitch-to-Y and Y-to-pitch math for treble clef rendering.
 * Reference: F6 sits on staffTop (top line of the 5-line staff).
 * Each diatonic step = staffLineSpacing/2 pixels downward.
 * Range: C2 (lowest) → C8 (highest).
 */

export const STAFF_LINE_SPACING = 12;

const DIATONIC = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const PITCH_INDEX: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

export interface PitchRow { y: number; pitch: string; octave: number }

export const buildPitchTable = (height: number): PitchRow[] => {
  const ls = STAFF_LINE_SPACING;
  const top = (height / 2) - (ls * 2); // staffTop = F6 anchor
  const rows: PitchRow[] = [];
  for (let oct = 8; oct >= 2; oct--) {
    for (let pi = 6; pi >= 0; pi--) {
      const p = DIATONIC[pi];
      const steps = (oct - 6) * 7 + (PITCH_INDEX[p] - 3);
      rows.push({ y: top - steps * (ls / 2), pitch: p, octave: oct });
    }
  }
  return rows;
};

export const getNoteY = (pitch: string, octave: number, height: number): number => {
  const ls = STAFF_LINE_SPACING;
  const top = (height / 2) - (ls * 2);
  const steps = (octave - 6) * 7 + ((PITCH_INDEX[pitch] ?? 3) - 3);
  return top - steps * (ls / 2);
};

export const getYToPitch = (y: number, height: number): { pitch: string; octave: number } => {
  const table = buildPitchTable(height);
  let closest = table[0];
  let minDist = Math.abs(y - table[0].y);
  for (const row of table) {
    const d = Math.abs(y - row.y);
    if (d < minDist) { minDist = d; closest = row; }
  }
  return { pitch: closest.pitch, octave: closest.octave };
};
