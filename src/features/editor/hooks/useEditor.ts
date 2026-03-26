import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  selectEditorUI,
  selectIsDesignMode,
  selectIsPlaybackMode,
  selectHasSelection,
  selectCanPaste,
} from '../store/editorSelectors';
import { editorActions } from '../store/editorSlice';
import type { EditorMode } from '../../../types';

/**
 * Custom hook for editor feature
 * Provides access to editor state and actions
 */
export const useEditor = () => {
  const dispatch = useAppDispatch();
  const editorUI = useAppSelector(selectEditorUI);
  const isDesignMode = useAppSelector(selectIsDesignMode);
  const isPlaybackMode = useAppSelector(selectIsPlaybackMode);
  const hasSelection = useAppSelector(selectHasSelection);
  const canPaste = useAppSelector(selectCanPaste);

  return {
    // State
    editorUI,
    isDesignMode,
    isPlaybackMode,
    hasSelection,
    canPaste,

    // Actions
    setMode: (mode: EditorMode) => dispatch(editorActions.setMode(mode)),
    setCurrentStaff: (staffId: string | null) => dispatch(editorActions.setCurrentStaff(staffId)),
    setCurrentBar: (barId: string | null) => dispatch(editorActions.setCurrentBar(barId)),
    selectNotes: (noteIds: string[]) => dispatch(editorActions.selectNotes(noteIds)),
    clearSelection: () => dispatch(editorActions.clearSelection()),
    markDirty: () => dispatch(editorActions.markDirty()),
    markClean: () => dispatch(editorActions.markClean()),
    setError: (error: string | null) => dispatch(editorActions.setError(error)),
  };
};
