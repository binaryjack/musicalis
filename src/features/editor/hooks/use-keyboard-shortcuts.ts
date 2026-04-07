import { useEffect } from 'react'
import type { Note, Staff } from '../../../types/musicTypes'

interface UseKeyboardShortcutsOptions {
  selectedElement: { staffId: string; barIndex: number; beatIndex: number; note: Note } | null;
  setSelectedElement: (el: { staffId: string; barIndex: number; beatIndex: number; note: Note } | null) => void;
  staffs: Staff[];
  setStaffs: React.Dispatch<React.SetStateAction<Staff[]>>;
  handleRemoveNote: (staffId: string, barIndex: number, beatIndex: number, noteId: string) => void;
}

export const useKeyboardShortcuts = ({ selectedElement, setSelectedElement, staffs, setStaffs, handleRemoveNote }: UseKeyboardShortcutsOptions) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!selectedElement) return;
      const { staffId, barIndex, beatIndex, note } = selectedElement;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (staffs.find(s => s.id === staffId)) {
          handleRemoveNote(staffId, barIndex, beatIndex, note.id);
          setSelectedElement(null);
        }
        return;
      }

      if (e.key.toLowerCase() === 'r' || e.key.toLowerCase() === 't') {
        e.preventDefault();
        const isRest = note.pitch === 'R';
        setStaffs(prev => prev.map(staff => {
          if (staff.id !== staffId) return staff;
          return {
            ...staff,
            bars: staff.bars.map((bar, bi) => {
              if (bi !== barIndex) return bar;
              return {
                ...bar,
                beats: bar.beats.map((beat, bti) => {
                  if (bti !== beatIndex) return beat;
                  return {
                    ...beat,
                    notes: beat.notes.map(n => {
                      if (n.id !== note.id) return n;
                      return { ...n, type: isRest ? 'note' : 'rest', pitch: isRest ? 'C' : 'R', octave: isRest ? 5 : 0, velocity: isRest ? 0.8 : 0 } as unknown as Note;
                    }),
                  };
                }),
              };
            }),
          };
        }));
        setSelectedElement(null);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selectedElement, staffs, handleRemoveNote, setSelectedElement, setStaffs]);
};
