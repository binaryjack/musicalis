import { MusicStaffSvg } from '../../../widgets/music-staff-svg'
import type { Note, NoteDuration, Staff } from '../../../types/musicTypes'

interface EditorCanvasAreaProps {
  staffs: Staff[];
  mode: 'design' | 'playback';
  cursorPosition: number;
  zoom: number;
  selectedDuration: NoteDuration;
  selectedRest: string;
  selectedStaffId: string;
  selectedElement: { staffId: string; barIndex: number; beatIndex: number; note: Note } | null;
  onSelectNote: (note: { barIndex: number; beatIndex: number; note: Note } | null, staffId: string) => void;
  onAddBar: (staffId: string, afterBarIndex: number) => void;
  onRemoveBar: (staffId: string, barIndex: number) => void;
  onPlayheadChange: (position: number) => void;
  onAddNote: (staffId: string, barIndex: number, beatIndex: number, pitch: string, octave: number, duration: NoteDuration) => void;
  onAddRest: (staffId: string, barIndex: number, beatIndex: number, duration: NoteDuration) => void;
  onRemoveNote: (staffId: string, barIndex: number, beatIndex: number, noteId: string) => void;
  onMoveNote: (staffId: string, sourceBarIndex: number, sourceBeatIndex: number, noteId: string, targetBarIndex: number, targetBeatIndex: number, pitch: string, octave: number) => void;
  onResizeDuration: (staffId: string, barIndex: number, beatIndex: number, noteId: string, newDuration: NoteDuration) => void;
}

export const EditorCanvasArea = function({ staffs, mode, cursorPosition, zoom, selectedDuration, selectedRest, selectedStaffId, selectedElement, onSelectNote, onAddBar, onRemoveBar, onPlayheadChange, onAddNote, onAddRest, onRemoveNote, onMoveNote, onResizeDuration }: EditorCanvasAreaProps) {
  return (
    <div style={{ flex: 1, backgroundColor: '#151515', padding: '16px', overflow: 'auto' }}>
      <div style={{ backgroundColor: '#222', borderRadius: '6px', padding: '0', height: 'calc(100% - 40px)', border: '1px solid #333', overflowX: 'auto', overflowY: 'auto' }}>
        <h2 style={{ margin: '0 0 8px 0', color: '#f0f0f0', fontSize: '16px', padding: '10px' }}>
          Staff Editor - Mode: {mode} - Selected: {selectedStaffId}
        </h2>
        {staffs.map(staff => (
          <MusicStaffSvg
            key={staff.id}
            staff={staff}
            zoom={zoom}
            playheadPosition={cursorPosition}
            darkMode={true}
            selectedDuration={selectedDuration}
            selectedRest={selectedRest}
            mode={mode}
            selectedElementId={selectedElement?.note.id || null}
            onSelectNote={(note) => onSelectNote(note, staff.id)}
            onAddBar={onAddBar}
            onRemoveBar={onRemoveBar}
            onPlayheadChange={onPlayheadChange}
            onAddNote={onAddNote}
            onAddRest={onAddRest}
            onRemoveNote={onRemoveNote}
            onMoveNote={onMoveNote}
            onResizeDuration={onResizeDuration}
            height={200}
          />
        ))}
      </div>
    </div>
  );
};
