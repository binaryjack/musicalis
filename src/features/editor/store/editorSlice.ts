import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { EditorState } from '../../../types';
import { EditorMode } from '../../../types';

const initialState: EditorState = {
  mode: EditorMode.DESIGN,
  currentStaffId: null,
  currentBarId: null,
  selectedNoteIds: [],
  clipboard: {
    type: null,
    data: null,
  },
  isDirty: false,
  error: null,
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setMode: (state, action: PayloadAction<EditorMode>) => {
      state.mode = action.payload;
    },
    setCurrentStaff: (state, action: PayloadAction<string | null>) => {
      state.currentStaffId = action.payload;
    },
    setCurrentBar: (state, action: PayloadAction<string | null>) => {
      state.currentBarId = action.payload;
    },
    selectNotes: (state, action: PayloadAction<string[]>) => {
      state.selectedNoteIds = action.payload;
    },
    clearSelection: (state) => {
      state.selectedNoteIds = [];
    },
    markDirty: (state) => {
      state.isDirty = true;
    },
    markClean: (state) => {
      state.isDirty = false;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export default editorSlice.reducer;
export const editorActions = editorSlice.actions;
