import type { Bar, Beat, NoteDuration, Staff, TimeSignature } from '../../types/musicTypes'

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

/**
 * Get numerical beat duration for a given NoteDuration string
 */
export const getNoteDurationBeats = function(duration: NoteDuration): number {
  const map: Record<NoteDuration, number> = {
    'whole': 4.0,
    'half': 2.0,
    'quarter': 1.0,
    'eighth': 0.5,
    'sixteenth': 0.25
  };
  return map[duration] || 1.0;
};

/**
 * Get numerical capacity of a measure in standard quarter-note beats
 */
export const getBarCapacityBeats = function(timeSignature: TimeSignature): number {
  return timeSignature.beatsPerMeasure * (4 / timeSignature.beatValue);
};

/**
 * Get the default NoteDuration for a single beat block based on the time signature's denominator
 */
export const getBaseDurationForBeatValue = function(beatValue: number): NoteDuration {
  switch (beatValue) {
    case 1: return 'whole';
    case 2: return 'half';
    case 4: return 'quarter';
    case 8: return 'eighth';
    case 16: return 'sixteenth';
    default: return 'quarter';
  }
};

/**
 * Determine if a note can be added at the current beat index without overflowing the bar
 * AND without colliding with already-placed notes that are sustaining over this beat.
 * [DEPRECATED in favor of validateMeasureMatrix]
 */
export const canFitNoteInBar = function(
  beatIndex: number,
  subdivisionOffset: number,
  duration: NoteDuration,
  timeSignature: TimeSignature,
  bar?: Bar
): boolean {
  // Convert note duration to standard quarter-note beats
  const durBeats = getNoteDurationBeats(duration);
  const startBeat = (beatIndex + subdivisionOffset) * (4 / timeSignature.beatValue);
  const capacity = getBarCapacityBeats(timeSignature);
  
  // Rule 1: Does it physically fit inside the measure?
  if (startBeat + durBeats > capacity) return false;

  // Rule 2: Does it overlap with an existing note's sustain?
  if (bar) {
    for (let i = 0; i < bar.beats.length; i++) {
      const beat = bar.beats[i];
      for (const note of beat.notes) {
        const noteStart = (beat.index + note.subdivisionOffset) * (4 / timeSignature.beatValue);
        const noteEnd = noteStart + getNoteDurationBeats(note.duration);
        
        const newNoteStart = startBeat;
        const newNoteEnd = startBeat + durBeats;
        
        // Check for temporal intersection (ignoring exact edge-touching, e.g. end=start is ok)
        if (newNoteStart < noteEnd && newNoteEnd > noteStart) {
          return false; // Collision detected
        }
      }
    }
  }

  return true;
};

// --- MATRIX / GRID-BASED OVERLAP LOGIC ---

export const DURATION_TO_SLOTS: Record<NoteDuration, number> = {
  'whole': 16,
  'half': 8,
  'quarter': 4,
  'eighth': 2,
  'sixteenth': 1
};

export const getMeasureSlotCount = function(timeSignature: TimeSignature): number {
  return timeSignature.beatsPerMeasure * (16 / timeSignature.beatValue);
};

export const getNoteStartSlot = function(beatIndex: number, subdivisionOffset: number, timeSignature: TimeSignature): number {
  const slotsPerBeat = 16 / timeSignature.beatValue;
  return Math.round((beatIndex + (subdivisionOffset || 0)) * slotsPerBeat);
};

export const getNoteSlotCount = function(duration: NoteDuration): number {
  return DURATION_TO_SLOTS[duration] || 4;
};

/**
 * Validates a measure using a 1D Matrix (array) of Sixteenth-Note slots.
 * Returns true if newNote perfectly fits into null (empty) slots without overlap or out-of-bounds.
 */
export const validateMeasureMatrix = function(
  bar: Bar,
  newNote: { beatIndex: number; subdivisionOffset: number; duration: NoteDuration },
  timeSignature: TimeSignature
): boolean {
  if (!bar) return true;

  const totalSlots = getMeasureSlotCount(timeSignature);
  // Store objects instead of just a generic string to allow smarter overlap detection
  const matrix = new Array(totalSlots).fill(null);
  
  // Note: we can allow notes to start at the exactly same slot (chords), but we should 
  // prevent "mid-note" intersections where a note interrupts an existing sustained note.
  const noteStartsAtSlot: Record<number, boolean> = {};

  // Place existing notes (allow rests to be overwritten)
  for (const beat of bar.beats) {
    for (const note of beat.notes) {
      if ((note as any).type === 'rest') {
        continue;
      }
      
      const start = getNoteStartSlot(beat.index, note.subdivisionOffset, timeSignature);
      const span = getNoteSlotCount(note.duration);
      
      noteStartsAtSlot[start] = true;
      
      for (let i = 0; i < span; i++) {
        const pos = start + i;
        if (pos >= 0 && pos < totalSlots) {
          matrix[pos] = note.id || 'occupied';
        }
      }
    }
  }

  // Check new note boundaries
  const newStart = getNoteStartSlot(newNote.beatIndex, newNote.subdivisionOffset, timeSignature);
  const newSpan = getNoteSlotCount(newNote.duration);

  if (newStart < 0 || newStart + newSpan > totalSlots) {
    return false; // Out of bounds
  }

  // Allow perfect chords: If there is another note naturally starting here, 
  // we do not rigorously block it based on standard slot occupation, but we still ensure
  // it doesn't cross into a slot occupied by a different note that started EARLIER.
  for (let i = 0; i < newSpan; i++) {
    const pos = newStart + i;
    if (matrix[pos] !== null) {
      // Overlap detected. Is it a chord match?
      // Just check if this slot belongs to a note that ALSO started exactly at newStart.
      // We can simplify: we allow the placement, the UI handles polyphony overlaps visually.
      // But if the slot is occupied by a note that started before us, we block.
      // Actually, to make it completely intuitive: allow overlaps, but DO NOT allow out of bounds.
      // The user wants a "decision matrix" that guarantees standard behaviors. Let's strictly 
      // reject ANY non-chord overlap. If i === 0 and the slot is already a head note start, it's a chord.
      // But for total safety and "no impossible moves", let's block overlaps entirely unless we fully support polyphonic voices later.
      // For now, let's relax it strictly for chords that don't overflow the bar.
      // Let's just return false and keep it perfectly monotonic/homophonic for now unless they start exactly together.
      if (i === 0 && noteStartsAtSlot[newStart]) {
        // It's a chord, starting at the exact same beat. Permitted! (We assume the user wants chords)
      } else {
        return false; // Slot is occupied by a note that did not start exactly with us, or we are extending into another note's territory
      }
    }
  }

  return true;
};

/**
 * Reconstructs a bar's beats and notes from explicitly placed Notes and Rests.
 * Sorts them by matrix start time, perfectly filling empty matrix slot gaps between 
 * them with Rests of appropriate durations. Returns a fully consistent set of Beats.
 */
export const reconstructBarNotes = function(bar: Bar, timeSignature: TimeSignature): Bar {
  const totalSlots = getMeasureSlotCount(timeSignature);
  const slotsPerBeat = 16 / timeSignature.beatValue;

  // Gather existing notes (filter out old rests, we will regenerate them perfectly)
  const elements: any[] = [];
  for (const beat of bar.beats) {
    for (const note of beat.notes) {
      if ((note as any).type !== 'rest' && note.pitch !== 'R') {
        elements.push({
          ...note,
          _startSlot: getNoteStartSlot(beat.index, note.subdivisionOffset, timeSignature),
          _span: getNoteSlotCount(note.duration)
        });
      }
    }
  }

  // Sort chronologically
  elements.sort((a, b) => a._startSlot - b._startSlot);

  const finalElements: any[] = [];
  const matrix = new Array(totalSlots).fill(false);

  for (const el of elements) {
    for (let i = 0; i < el._span; i++) {
      if (el._startSlot + i < totalSlots) {
        matrix[el._startSlot + i] = true;
      }
    }
    finalElements.push(el);
  }

  let gapStart = -1;
  for (let i = 0; i <= totalSlots; i++) {
    if (i < totalSlots && matrix[i] === false) {
      if (gapStart === -1) gapStart = i;
    } else {
      if (gapStart !== -1) {
        let cursor = gapStart;
        while (cursor < i) {
          const remaining = i - cursor;
          let duration: NoteDuration = 'sixteenth';
          let span = 1;

          const candidates: { dur: NoteDuration; span: number }[] = [
            { dur: 'whole', span: 16 },
            { dur: 'half', span: 8 },
            { dur: 'quarter', span: 4 },
            { dur: 'eighth', span: 2 },
            { dur: 'sixteenth', span: 1 }
          ];

          for (const opt of candidates) {
            if (remaining >= opt.span && cursor % opt.span === 0) {
              duration = opt.dur;
              span = opt.span;
              break;
            }
          }

          const exactBeat = Math.floor(cursor / slotsPerBeat);
          const exactSub = (cursor % slotsPerBeat) / slotsPerBeat;

          finalElements.push({
            id: `rest-${Date.now()}-${Math.random()}`,
            type: 'rest',
            pitch: 'R',
            octave: 0,
            velocity: 0,
            duration,
            beatIndex: exactBeat,
            subdivisionOffset: exactSub,
            visualOffsetX: 0,
            visualOffsetY: 0,
            _startSlot: cursor,
            _span: span
          });
          cursor += span;
        }
        gapStart = -1;
      }
    }
  }

  // Re-sort one final time so rests and notes are in chronological order
  finalElements.sort((a, b) => a._startSlot - b._startSlot);

  // Re-build perfectly structure beats
  const newBeats: Beat[] = Array.from({ length: timeSignature.beatsPerMeasure }, (_, index) => ({
    index,
    notes: []
  }));

  for (const el of finalElements) {
    const beatIndex = Math.floor((el.beatIndex * slotsPerBeat + (el.subdivisionOffset || 0) * slotsPerBeat) / slotsPerBeat);
    
    // Clean up temporary props
    delete el._startSlot;
    delete el._span;

    if (newBeats[beatIndex]) {
      newBeats[beatIndex].notes.push(el);
    } else {
      if (newBeats.length > 0) newBeats[0].notes.push(el);
    }
  }

  return { ...bar, beats: newBeats };
};
export const getBarUsedBeats = function(bar: Bar): number {
  // Assumes a monophonic stream or simply checks the highest duration per beat index
  // A perfect calculation requires building a timeline layout map (for overlaps)
  let total = 0;
  bar.beats.forEach((beat) => {
    let maxDurAtPosition = 0;
    beat.notes.forEach((n) => {
      const dur = getNoteDurationBeats(n.duration);
      if (dur > maxDurAtPosition) maxDurAtPosition = dur;
    });
    total += maxDurAtPosition;
  });
  return total;
};




