import type { Bar, Note } from '../models';
import { EditorMode } from '../enums';

/**
 * Redux state shape for editor feature
 */
export interface EditorState {
  mode: EditorMode; // 'design' | 'playback'
  currentStaffId: string | null;
  currentBarId: string | null;
  selectedNoteIds: string[];
  clipboard: {
    type: 'note' | 'bar' | null;
    data: Note | Bar | null;
  };
  isDirty: boolean;
  error: string | null;
}

/**
 * Entry for undo/redo functionality
 */
export interface EditorHistoryEntry {
  timestamp: number;
  action: string;
  state: unknown;
}
