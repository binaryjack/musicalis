import { createSelector } from 'reselect';
import type { RootState } from '../../../store/store';

// Input selector
const selectEditorSlice = (state: RootState) => state.editor;

// Simple selectors
export const selectEditorMode = createSelector(
  [selectEditorSlice],
  (editor) => editor.mode
);

export const selectCurrentStaffId = createSelector(
  [selectEditorSlice],
  (editor) => editor.currentStaffId
);

export const selectCurrentBarId = createSelector(
  [selectEditorSlice],
  (editor) => editor.currentBarId
);

export const selectSelectedNoteIds = createSelector(
  [selectEditorSlice],
  (editor) => editor.selectedNoteIds
);

export const selectEditorDirty = createSelector(
  [selectEditorSlice],
  (editor) => editor.isDirty
);

export const selectEditorError = createSelector(
  [selectEditorSlice],
  (editor) => editor.error
);

export const selectClipboard = createSelector(
  [selectEditorSlice],
  (editor) => editor.clipboard
);

// Feature-level selectors
export const selectIsDesignMode = createSelector(
  [selectEditorMode],
  (mode) => mode === 'design'
);

export const selectIsPlaybackMode = createSelector(
  [selectEditorMode],
  (mode) => mode === 'playback'
);

export const selectHasSelection = createSelector(
  [selectSelectedNoteIds],
  (noteIds) => noteIds.length > 0
);

export const selectSelectionCount = createSelector(
  [selectSelectedNoteIds],
  (noteIds) => noteIds.length
);

export const selectCanPaste = createSelector(
  [selectClipboard],
  (clipboard) => clipboard.type !== null && clipboard.data !== null
);

// Component-level selectors
export const selectEditorUI = createSelector(
  [selectEditorMode, selectIsDesignMode, selectEditorDirty, selectHasSelection],
  (mode, isDesign, isDirty, hasSelection) => ({
    mode,
    isDesignMode: isDesign,
    isDirty,
    hasSelection,
    modeBadge: isDesign ? '✏️ Design' : '🎵 Playback',
  })
);
