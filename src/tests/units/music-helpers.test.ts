import { 
  reconstructBarNotes, 
  parseTimeSignature,
  validateMeasureMatrix
} from '../../shared/utils/music-helpers';
import type { Bar, Note, Beat } from '../../types/musicTypes';

describe('music-helpers', () => {
  const timeSig44 = parseTimeSignature('4/4');

  describe('validateMeasureMatrix', () => {
    it('should allow placing a note in an empty measure', () => {
      const emptyBar: Bar = { index: 0, beats: [ { index: 0, notes: [] } ] };
      expect(validateMeasureMatrix(emptyBar, { duration: 'quarter', beatIndex: 0, subdivisionOffset: 0 } as Note, timeSig44)).toBe(true);
    });

    it('should flag overlapping notes as invalid if beat is occupied', () => {
      const occupiedBar: Bar = {
        index: 0,
        beats: [
          { index: 0, notes: [ { id: 'n1', type: 'note', duration: 'half', beatIndex: 0, subdivisionOffset: 0, pitch: 'C', octave: 4, velocity: 1 } as unknown as Note ] }
        ]
      };
      
      expect(validateMeasureMatrix(occupiedBar, { duration: 'quarter', beatIndex: 1, subdivisionOffset: 0 } as Note, timeSig44)).toBe(false);
    });

    it('should flag a note that exceeds the measure boundaries', () => {
      const emptyBar: Bar = { index: 0, beats: [ { index: 0, notes: [] } ] };
      
      expect(validateMeasureMatrix(emptyBar, { duration: 'half', beatIndex: 3, subdivisionOffset: 0.5 } as Note, timeSig44)).toBe(false);
    });

    it('should ignore pure rests when validating space (volatile rests)', () => {
      const restBar: Bar = {
        index: 0,
        beats: [
          { index: 0, notes: [ { id: 'r1', type: 'rest', duration: 'whole', beatIndex: 0, subdivisionOffset: 0, pitch: 'R', octave: 4, velocity: 1 } as unknown as Note ] }
        ]
      };
      
      expect(validateMeasureMatrix(restBar, { duration: 'quarter', beatIndex: 2, subdivisionOffset: 0 } as Note, timeSig44)).toBe(true);
    });
  });

  describe('reconstructBarNotes', () => {
    it('should fill an empty bar with a single whole rest', () => {
      const emptyBar: Bar = {
        index: 0,
        beats: [
          { index: 0, notes: [] },
          { index: 1, notes: [] },
          { index: 2, notes: [] },
          { index: 3, notes: [] },
        ]
      };
      
      const result = reconstructBarNotes(emptyBar, timeSig44);
      
      const allNotes = result.beats.flatMap((b: Beat) => b.notes);
      expect(allNotes.length).toBe(1);
      expect((allNotes[0] as any).type).toBe('rest');
      expect(allNotes[0].duration).toBe('whole');
      expect(allNotes[0].beatIndex).toBe(0);
      expect((allNotes[0] as any).subdivisionOffset).toBe(0);
    });

    it('should fill gaps around a quarter note', () => {
      const noteBeats: Bar = {
        index: 0,
        beats: [
          { index: 0, notes: [] },
          { index: 1, notes: [
            { id: 'n1', type: 'note', duration: 'quarter', beatIndex: 1, subdivisionOffset: 0, pitch: 'C', octave: 4, velocity: 1 } as unknown as Note
          ] },
          { index: 2, notes: [] },
          { index: 3, notes: [] },
        ]
      };

      const result = reconstructBarNotes(noteBeats, timeSig44);
      const allNotes = result.beats.flatMap((b: Beat) => b.notes);
      
      expect(allNotes.length).toBe(3);
      
      expect((allNotes[0] as any).type).toBe('rest');
      expect(allNotes[0].duration).toBe('quarter');
      expect(allNotes[0].beatIndex).toBe(0);
      
      expect((allNotes[1] as any).type).toBe('note');
      expect(allNotes[1].duration).toBe('quarter');
      expect(allNotes[1].beatIndex).toBe(1);
      
      expect((allNotes[2] as any).type).toBe('rest');
      expect(allNotes[2].duration).toBe('half');
      expect(allNotes[2].beatIndex).toBe(2);
    });

    it('should preserve original note coordinates exactly', () => {
      const noteBeats: Bar = {
        index: 0,
        beats: [
          { index: 0, notes: [
            { id: 'n1', type: 'note', duration: 'eighth', beatIndex: 0, subdivisionOffset: 0.5, pitch: 'C', octave: 4, velocity: 1 } as unknown as Note
          ] },
          { index: 1, notes: [] },
          { index: 2, notes: [] },
          { index: 3, notes: [] },
        ]
      };

      const result = reconstructBarNotes(noteBeats, timeSig44);
      const allNotes = result.beats.flatMap((b: Beat) => b.notes);
      
      const theNote = allNotes.find((n: unknown) => (n as any).type === 'note');
      expect(theNote).toBeDefined();
      expect(theNote!.beatIndex).toBe(0);
      expect((theNote as any).subdivisionOffset).toBe(0.5);
      
      expect((allNotes[0] as any).duration).toBe('eighth');
      expect((allNotes[0] as any).type).toBe('rest');
    });

    it('should calculate proper rests around notes', () => {
      const noteBeats: Bar = {
        index: 0,
        beats: [
          { index: 0, notes: [
            { id: 'n1', type: 'note', duration: 'quarter', beatIndex: 0, subdivisionOffset: 0, pitch: 'C', octave: 4, velocity: 1 } as unknown as Note,
            { id: 'n2', type: 'note', duration: 'quarter', beatIndex: 0, subdivisionOffset: 0, pitch: 'E', octave: 4, velocity: 1 } as unknown as Note
          ] },
          { index: 1, notes: [] },
          { index: 2, notes: [] },
          { index: 3, notes: [] },
        ]
      };

      const result = reconstructBarNotes(noteBeats, timeSig44);
      const allNotes = result.beats.flatMap((b: Beat) => b.notes);
      
      const rests = allNotes.filter((n: any) => n.type === 'rest');
      expect(rests.length).toBeGreaterThan(0);
    });

    it('should not add any rests if the bar is completely full', () => {
      const fullBar: Bar = {
        index: 0,
        beats: [
          { index: 0, notes: [{ id: 'n1', type: 'note', duration: 'quarter', beatIndex: 0, subdivisionOffset: 0, pitch: 'C', octave: 4, velocity: 1 } as unknown as Note] },
          { index: 1, notes: [{ id: 'n2', type: 'note', duration: 'quarter', beatIndex: 1, subdivisionOffset: 0, pitch: 'D', octave: 4, velocity: 1 } as unknown as Note] },
          { index: 2, notes: [{ id: 'n3', type: 'note', duration: 'quarter', beatIndex: 2, subdivisionOffset: 0, pitch: 'E', octave: 4, velocity: 1 } as unknown as Note] },
          { index: 3, notes: [{ id: 'n4', type: 'note', duration: 'quarter', beatIndex: 3, subdivisionOffset: 0, pitch: 'F', octave: 4, velocity: 1 } as unknown as Note] },
        ]
      };
      
      const result = reconstructBarNotes(fullBar, timeSig44);
      const allNotes = result.beats.flatMap((b: Beat) => b.notes);
      
      const rests = allNotes.filter((n: any) => n.type === 'rest');
      expect(rests.length).toBe(0);
      expect(allNotes.length).toBe(4);
    });
  });
});

