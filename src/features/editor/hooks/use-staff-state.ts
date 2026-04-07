import { useState } from 'react'
import type { UsePlaybackReturn } from '../../../hooks/usePlayback'
import {
  validateMeasureMatrix,
  reconstructBarNotes,
  createEmptyBar,
  getEffectiveTimeSignature,
  initializeStaff,
  parseTimeSignature,
} from '../../../shared/utils/music-helpers'
import type { Note, MusicNote, NoteDuration, Staff } from '../../../types/musicTypes'

interface UseStaffStateOptions {
  playback: UsePlaybackReturn;
  selectedRest: string;
  addLog: (message: string, type?: 'error' | 'warning' | 'info') => void;
  setIsConsoleOpen: (open: boolean) => void;
}

export const useStaffState = ({ playback, selectedRest, addLog, setIsConsoleOpen }: UseStaffStateOptions) => {
  const defaultTimeSignature = parseTimeSignature('4/4');

  const [staffs, setStaffs] = useState<Staff[]>([
    initializeStaff({ id: 'staff-1', name: 'Piano Staff 1', clef: 'treble', keySignature: 'C', instrument: 'piano' }, defaultTimeSignature, 1),
  ]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('staff-1');
  const [timeSignature, setTimeSignature] = useState<string>('4/4');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [barToDelete, setBarToDelete] = useState<{ staffId: string; barIndex: number } | null>(null);

  const handleAddStaff = () => {
    const id = `staff-${staffs.length + 1}`;
    setStaffs(prev => [...prev, initializeStaff({ id, name: `Piano Staff ${prev.length + 1}`, clef: 'treble', keySignature: 'C', instrument: 'piano' }, defaultTimeSignature, 1)]);
    setSelectedStaffId(id);
  };

  const handleTimeSignatureChange = (newSig: string) => {
    setTimeSignature(newSig);
    const parsed = parseTimeSignature(newSig);
    setStaffs(prev => prev.map(staff => ({
      ...staff,
      timeSignature: parsed,
      bars: staff.bars.map((_bar, i) => createEmptyBar(i, parsed)),
    })));
  };

  const handleAddBar = (staffId: string, afterBarIndex: number) => {
    void afterBarIndex;
    setStaffs(prev => prev.map(staff => {
      if (staff.id !== staffId) return staff;
      const timeSig = staff.timeSignature || defaultTimeSignature;
      return { ...staff, bars: [...staff.bars, createEmptyBar(staff.bars.length, timeSig)] };
    }));
  };

  const handleRemoveBar = (staffId: string, barIndex: number) => {
    setBarToDelete({ staffId, barIndex });
    setShowDeleteModal(true);
  };

  const confirmDeleteBar = () => {
    if (barToDelete) {
      setStaffs(prev => prev.map(staff => {
        if (staff.id !== barToDelete.staffId || staff.bars.length <= 1) return staff;
        return { ...staff, bars: staff.bars.slice(0, -1).map((bar, i) => ({ ...bar, index: i })) };
      }));
    }
    setBarToDelete(null);
    setShowDeleteModal(false);
  };

  const cancelDeleteBar = () => {
    setBarToDelete(null);
    setShowDeleteModal(false);
  };

  const handleRemoveNote = (staffId: string, barIndex: number, beatIndex: number, noteId: string) => {
    setStaffs(prev => prev.map(staff => {
      if (staff.id !== staffId) return staff;
      const updatedBars = staff.bars.map((bar, bi) => {
        if (bi !== barIndex) return bar;
        const updatedBeats = bar.beats.map((beat, bti) => {
          if (bti !== beatIndex) return beat;
          return { ...beat, notes: beat.notes.filter(n => n.id !== noteId) };
        });
        return reconstructBarNotes({ ...bar, beats: updatedBeats }, getEffectiveTimeSignature(bar, staff, defaultTimeSignature));
      });
      return { ...staff, bars: updatedBars };
    }));
  };

  const handleResizeDuration = (staffId: string, barIndex: number, beatIndex: number, noteId: string, newDuration: NoteDuration) => {
    setStaffs(prev => prev.map(staff => {
      if (staff.id !== staffId) return staff;
      const updatedBars = staff.bars.map((bar, bi) => {
        if (bi !== barIndex) return bar;
        const updatedBeats = bar.beats.map((beat, bti) => {
          if (bti !== beatIndex) return beat;
          return { ...beat, notes: beat.notes.map(n => n.id === noteId ? { ...n, duration: newDuration } : n) };
        });
        return reconstructBarNotes({ ...bar, beats: updatedBeats }, getEffectiveTimeSignature(bar, staff, defaultTimeSignature));
      });
      return { ...staff, bars: updatedBars };
    }));
  };

  const handleMoveNote = (
    staffId: string, sourceBarIndex: number, sourceBeatIndex: number, noteId: string,
    targetBarIndex: number, targetBeatIndex: number, pitch: string, octave: number,
  ) => {
    setStaffs(prev => prev.map(staff => {
      if (staff.id !== staffId) return staff;
      let noteToMove: Note | null = null;

      const tempBars = staff.bars.map((bar, bi) => {
        if (bi !== sourceBarIndex) return bar;
        return {
          ...bar,
          beats: bar.beats.map((beat, bti) => {
            if (bti !== sourceBeatIndex) return beat;
            const found = beat.notes.find(n => n.id === noteId);
            if (found) noteToMove = found;
            return { ...beat, notes: beat.notes.filter(n => n.id !== noteId) };
          }),
        };
      });

      if (!noteToMove) return staff;

      const targetBar = tempBars[targetBarIndex];
      if (targetBar) {
        const timeSig = getEffectiveTimeSignature(targetBar, staff, defaultTimeSignature);
        if (!validateMeasureMatrix(targetBar, {
          beatIndex: Math.floor(targetBeatIndex),
          subdivisionOffset: targetBeatIndex - Math.floor(targetBeatIndex),
          duration: (noteToMove as Note).duration,
        }, timeSig)) {
          addLog('Move rejected: Matrix bounds or overlap check failed.', 'warning');
          return staff;
        }
      }

      if ((noteToMove as Note).pitch !== pitch || (noteToMove as Note).octave !== octave) {
        try { if (pitch !== 'R') playback.playNote(`${pitch}${octave}` as MusicNote, (noteToMove as Note).duration); } catch { /* ignore */ }
      }

      const updatedNote = {
        ...(noteToMove as Note),
        pitch, octave,
        type: pitch === 'R' ? 'rest' : 'note',
        velocity: pitch === 'R' ? 0 : 0.8,
        beatIndex: Math.floor(targetBeatIndex),
        subdivisionOffset: targetBeatIndex - Math.floor(targetBeatIndex),
      } as Note;

      const finalBars = tempBars.map((bar, bi) => {
        if (bi !== targetBarIndex && bi !== sourceBarIndex) return bar;
        const finalBeats = bi === targetBarIndex
          ? bar.beats.map((beat, bti) => bti === Math.floor(targetBeatIndex) ? { ...beat, notes: [...beat.notes, updatedNote] } : beat)
          : bar.beats;
        return reconstructBarNotes({ ...bar, beats: finalBeats }, getEffectiveTimeSignature(bar, staff, defaultTimeSignature));
      });

      return { ...staff, bars: finalBars };
    }));
  };

  const handleAddNote = (staffId: string, barIndex: number, rawBeatIndex: number, pitch: string, octave: number, duration: NoteDuration) => {
    const beatIndex = Math.floor(rawBeatIndex);
    const subdivisionOffset = rawBeatIndex - beatIndex;
    const currentStaff = staffs.find(s => s.id === staffId);

    if (currentStaff) {
      const bar = currentStaff.bars[barIndex];
      if (bar) {
        const alreadyExists = bar.beats[beatIndex]?.notes.some(
          n => n.pitch === pitch && n.octave === octave && Math.abs((n.subdivisionOffset ?? 0) - subdivisionOffset) < 0.01,
        );
        if (alreadyExists) return;
        const timeSig = getEffectiveTimeSignature(bar, currentStaff, defaultTimeSignature);
        if (!validateMeasureMatrix(bar, { beatIndex, subdivisionOffset, duration }, timeSig)) {
          const msg = `Cannot fit ${duration} note at beat ${beatIndex + 1} in ${timeSig.display} measure.`;
          addLog(msg, 'warning');
          setIsConsoleOpen(true);
          return;
        }
      }
    }

    try { if (!selectedRest) playback.playNote(`${pitch}${octave}` as MusicNote, duration); } catch { /* ignore */ }

    setStaffs(prev => prev.map(staff => {
      if (staff.id !== staffId) return staff;
      const updatedBars = staff.bars.map((bar, bi) => {
        if (bi !== barIndex) return bar;
        const timeSig = getEffectiveTimeSignature(bar, staff, defaultTimeSignature);
        const isRest = !!selectedRest;
        const updatedBeats = bar.beats.map((beat, bti) => {
          if (bti !== beatIndex) return beat;
          const newNote = {
            id: `${isRest ? 'rest' : 'note'}-${Date.now()}-${Math.random()}`,
            type: isRest ? 'rest' : 'note',
            pitch: isRest ? 'R' : pitch, octave: isRest ? 0 : octave,
            duration, beatIndex, subdivisionOffset,
            visualOffsetX: 0, visualOffsetY: 0,
            velocity: isRest ? 0 : 0.8,
          };
          return { ...beat, notes: [...beat.notes, newNote as unknown as Note] };
        });
        return reconstructBarNotes({ ...bar, beats: updatedBeats }, timeSig);
      });
      return { ...staff, bars: updatedBars };
    }));
  };

  const handleAddRest = (staffId: string, barIndex: number, beatIndex: number, duration: NoteDuration) => {
    setStaffs(prev => prev.map(staff => {
      if (staff.id !== staffId) return staff;
      const updatedBars = staff.bars.map((bar, bi) => {
        if (bi !== barIndex) return bar;
        const timeSig = getEffectiveTimeSignature(bar, staff, defaultTimeSignature);
        const updatedBeats = bar.beats.map((beat, bti) => {
          if (bti !== beatIndex) return beat;
          const newRest = { id: `rest-${Date.now()}-${Math.random()}`, type: 'rest', duration, beatIndex, subdivisionOffset: 0, visualOffsetX: 0, visualOffsetY: 0, pitch: 'R', octave: 0, velocity: 0 };
          return { ...beat, notes: [...beat.notes, newRest as unknown as Note] };
        });
        return reconstructBarNotes({ ...bar, beats: updatedBeats }, timeSig);
      });
      return { ...staff, bars: updatedBars };
    }));
  };

  return {
    staffs, setStaffs,
    selectedStaffId, setSelectedStaffId,
    timeSignature, defaultTimeSignature,
    showDeleteModal, barToDelete,
    handleAddStaff, handleTimeSignatureChange,
    handleAddBar, handleRemoveBar, confirmDeleteBar, cancelDeleteBar,
    handleAddNote, handleAddRest, handleRemoveNote, handleMoveNote, handleResizeDuration,
  };
};
