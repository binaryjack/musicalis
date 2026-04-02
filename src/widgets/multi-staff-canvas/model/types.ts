import type { PianoStaff } from '../../../types/musicTypes';
import type { ProjectData } from '../../../services/projectService';
import type { EditorMode } from '../../../types/enums';

export interface MultiStaffCanvasProps {
  project?: ProjectData | null;
  staffs: PianoStaff[];
  width?: number;
  height?: number;
  playheadPosition?: number;
  mode?: EditorMode;
  selectedStaffId?: string;
  darkMode?: boolean;
  onStaffClick?: (staffId: string, position: { x: number; y: number; pitch?: string; beat?: number }) => void;
  onNoteClick?: (noteId: string, staffId: string) => void;
  onNoteDelete?: (noteId: string, staffId: string) => void;
  onNoteMove?: (noteId: string, staffId: string, newPosition: number) => void;
  onPlayheadDrag?: (newPosition: number) => void;
  onAddBar?: (staffId: string, afterBarIndex: number) => void;
  onRemoveBar?: (staffId: string, barIndex: number) => void;
}