import type { NoteDuration, Staff, TimeSignature } from '../../types/musicTypes'
import { getNoteDurationBeats } from './music-helpers'

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SubdivisionBox extends Box {
  offset: number;          // e.g., 0, 0.25, 0.5, 0.75
  durationValue: number;   // e.g., 0.25 for a sixteenth note slot
}

export interface BeatBox extends Box {
  index: number;
  subdivisions: SubdivisionBox[];
}

export interface BarBox extends Box {
  index: number;
  innerX: number;
  innerWidth: number;
  beats: BeatBox[];
  timeSignature: TimeSignature; // Cached for easy lookup
}

export interface StaffLayout {
  clefPadding: number;
  barPadding: number;
  bars: BarBox[];
  totalWidth: number;
}

// Current view config extraction
export interface LayoutConfig {
  barWidth: number;     // e.g., 200
  barPadding: number;   // e.g., 15 (inner padding left and right)
  clefPadding: number;  // e.g., 100 (space for clef/key before bar 0)
  staffHeight: number;  // e.g., 120
  staffTop: number;     // e.g., y offset
}

/**
 * Calculates the strict bounding boxes for a mathematical measure grid.
 * This completely decouples X-coordinate math from rendering, 
 * ensuring interactions and visuals use the exact same grid boundaries.
 */
export function calculateStaffLayout(
  staff: Staff,
  config: LayoutConfig
): StaffLayout {
  const barsBox: BarBox[] = [];
  let currentX = config.clefPadding; // Start after the clef space

  for (let i = 0; i < staff.bars.length; i++) {
    const bar = staff.bars[i];
    
    // Determine Time Sig for this bar (fallback to Staff or 4/4)
    const timeSig = bar.timeSignature || staff.timeSignature || { beatsPerMeasure: 4, beatValue: 4, display: '4/4' };
    const beatsCount = bar.beats.length || timeSig.beatsPerMeasure;
    
    // In the future, this is where we calculate DYNAMIC barWidths 
    // by scanning `bar.beats` content. For now, we enforce static block width.
    const currentBarWidth = config.barWidth; 
    
    const innerX = currentX + config.barPadding;
    const innerWidth = currentBarWidth - (config.barPadding * 2);
    const beatWidth = innerWidth / beatsCount;

    const beatBoxes: BeatBox[] = [];

    for (let beatIndex = 0; beatIndex < beatsCount; beatIndex++) {
      const beatStartX = innerX + (beatIndex * beatWidth);
      
      // Common sub-grids: 4 sixteenths per quarter beat
      // If we need dynamic subdivisions based on the notes in the beat, we map them here
      const subdivisions: SubdivisionBox[] = [];
      const slices = 4; // Assuming min resolution of 16th notes for standard grid
      const sliceWidth = beatWidth / slices;
      const sliceDur = (4 / timeSig.beatValue) / slices; // e.g. 0.25 beats for sixteenth

      for (let s = 0; s < slices; s++) {
        subdivisions.push({
          x: beatStartX + (s * sliceWidth),
          y: config.staffTop,
          width: sliceWidth,
          height: config.staffHeight,
          offset: s * sliceDur,
          durationValue: sliceDur
        });
      }

      beatBoxes.push({
        index: beatIndex,
        x: beatStartX,
        y: config.staffTop,
        width: beatWidth,
        height: config.staffHeight,
        subdivisions
      });
    }

    barsBox.push({
      index: i,
      x: currentX,
      y: config.staffTop,
      width: currentBarWidth,
      height: config.staffHeight,
      innerX: innerX,
      innerWidth: innerWidth,
      beats: beatBoxes,
      timeSignature: timeSig
    });

    currentX += currentBarWidth;
  }

  return {
    clefPadding: config.clefPadding,
    barPadding: config.barPadding,
    bars: barsBox,
    totalWidth: currentX
  };
}

/**
 * Gets exact glyph placement center inside the hierarchy.
 * @param layout The pre-calculated strict layout
 * @param barIndex 
 * @param beatIndex 
 * @param subdivisionOffset 
 * @param noteDuration 
 * @returns 
 */
export function getGlyphX(
  layout: StaffLayout,
  barIndex: number,
  beatIndex: number,
  subdivisionOffset: number,
  noteDuration: NoteDuration | string,
  visualOffset: number = 0
): number {
  const bar = layout.bars[barIndex];
  if (!bar) return 0;
  
  const beat = bar.beats[beatIndex];
  if (!beat) return 0;

  const timeSigValue = bar.timeSignature.beatValue;
  const durBeats = getNoteDurationBeats(noteDuration as NoteDuration);
  const unitsTaken = durBeats / (4 / timeSigValue);
  const noteWidth = beat.width * unitsTaken;

  const isWhole = noteDuration === 'whole';
  const startX = beat.x + (subdivisionOffset * beat.width);
  
  // Box centering math:
  return (isWhole ? bar.x + bar.width * 0.5 : startX + 15) + visualOffset;
}
