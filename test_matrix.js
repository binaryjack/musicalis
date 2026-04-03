const DURATION_TO_SLOTS = { 'whole': 16, 'half': 8, 'quarter': 4, 'eighth': 2, 'sixteenth': 1 };
const timeSignature = { beatsPerMeasure: 4, beatValue: 4 };

function getNoteStartSlot(beatIndex, subdivisionOffset, timeSignature) {
    const slotsPerBeat = 16 / timeSignature.beatValue;
    return Math.round((beatIndex + (subdivisionOffset || 0)) * slotsPerBeat);   
}
function getNoteSlotCount(duration) { return DURATION_TO_SLOTS[duration] || 4; }

const bar = {
    beats: [
        { index: 0, notes: [ { subdivisionOffset: 0, duration: 'sixteenth', id: 'n1', type: 'note' }, { subdivisionOffset: 0.25, duration: 'sixteenth', id: 'n2', type: 'note' } ] }
    ]
};

function validateMeasureMatrix(bar, newNote, timeSignature) {
    const totalSlots = timeSignature.beatsPerMeasure * (16 / timeSignature.beatValue);
    const matrix = new Array(totalSlots).fill(null);
    const noteStartsAtSlot = {};

    for (const beat of bar.beats) {
      for (const note of beat.notes) {
        if (note.type === 'rest') continue;
        const start = getNoteStartSlot(beat.index, note.subdivisionOffset, timeSignature);
        const span = getNoteSlotCount(note.duration);
        noteStartsAtSlot[start] = true;
        for (let i = 0; i < span; i++) {
          const pos = start + i;
          if (pos >= 0 && pos < totalSlots) matrix[pos] = note.id || 'occupied';
        }
      }
    }

    const newStart = getNoteStartSlot(newNote.beatIndex, newNote.subdivisionOffset, timeSignature);
    const newSpan = getNoteSlotCount(newNote.duration);
    if (newStart < 0 || newStart + newSpan > totalSlots) return false;

    for (let i = 0; i < newSpan; i++) {
      const pos = newStart + i;
      if (matrix[pos] !== null) {
        if (i === 0 && noteStartsAtSlot[newStart]) { } else { return false; }
      }
    }
    return true;
}

console.log("3rd:", validateMeasureMatrix(bar, { beatIndex: 0, subdivisionOffset: 0.5, duration: 'sixteenth'}, timeSignature));
