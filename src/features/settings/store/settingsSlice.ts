import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { SettingsState } from '../../../types';
import { ThemeMode, AudioQuality } from '../../../types';

/**
 * Detect device memory and calculate buffer allocation
 */
const getDefaultBufferSize = (): number => {
  const deviceMemory = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 4; // Default to 4GB if not available
  return Math.min(Math.floor(deviceMemory * 0.15 * 1024), 2048); // 15% of device RAM, max 2GB
};

const initialState: SettingsState = {
  theme: ThemeMode.LIGHT,
  audioQuality: AudioQuality.MID,
  autoSave: true,
  autoSaveInterval: 5000,
  defaultTempo: 120,
  bufferCacheSizeMB: getDefaultBufferSize(),
  notifications: {
    enabled: true,
    sound: true,
  },
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload;
    },
    setAudioQuality: (state, action: PayloadAction<AudioQuality>) => {
      state.audioQuality = action.payload;
    },
    setAutoSave: (state, action: PayloadAction<boolean>) => {
      state.autoSave = action.payload;
    },
    setAutoSaveInterval: (state, action: PayloadAction<number>) => {
      state.autoSaveInterval = action.payload;
    },
    setDefaultTempo: (state, action: PayloadAction<number>) => {
      state.defaultTempo = action.payload;
    },
    setBufferCacheSize: (state, action: PayloadAction<number>) => {
      state.bufferCacheSizeMB = action.payload;
    },
    setNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.notifications.enabled = action.payload;
    },
    setNotificationSound: (state, action: PayloadAction<boolean>) => {
      state.notifications.sound = action.payload;
    },
  },
});

export default settingsSlice.reducer;
export const settingsActions = settingsSlice.actions;
