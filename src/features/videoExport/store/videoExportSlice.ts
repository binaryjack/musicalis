import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { VideoExportState, VideoExportResult } from '../../../types';
import { ExportStatus, VideoQuality } from '../../../types';

const initialState: VideoExportState = {
  progress: {
    status: ExportStatus.IDLE,
    progress: 0,
    currentPhase: 'preparation',
    message: '',
  },
  results: [],
  settings: {
    defaultQuality: VideoQuality.MID,
    defaultBackgroundColor: '#ffffff',
  },
  loading: false,
  error: null,
};

const videoExportSlice = createSlice({
  name: 'videoExport',
  initialState,
  reducers: {
    startExport: (state) => {
      state.loading = true;
      state.progress = {
        status: ExportStatus.PREPARING,
        progress: 0,
        currentPhase: 'preparation',
        message: 'Preparing export...',
      };
    },
    updateExportProgress: (
      state,
      action: PayloadAction<{
        progress: number;
        currentPhase: 'preparation' | 'recording' | 'processing' | 'encoding';
        message: string;
      }>
    ) => {
      state.progress = {
        ...state.progress,
        progress: action.payload.progress,
        currentPhase: action.payload.currentPhase,
        message: action.payload.message,
      };
    },
    exportSuccess: (state, action: PayloadAction<VideoExportResult>) => {
      state.loading = false;
      state.progress.status = ExportStatus.COMPLETE;
      state.results.push(action.payload);
    },
    exportError: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.progress.status = ExportStatus.ERROR;
      state.error = action.payload;
      state.progress.message = action.payload;
    },
    resetExport: (state) => {
      state.progress = initialState.progress;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export default videoExportSlice.reducer;
export const videoExportActions = videoExportSlice.actions;
