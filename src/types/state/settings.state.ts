import { ThemeMode, AudioQuality } from '../enums';

/**
 * Redux state shape for settings feature
 */
export interface SettingsState {
  theme: ThemeMode;
  audioQuality: AudioQuality;
  audioOutputDevice?: string;
  autoSave: boolean;
  autoSaveInterval: number; // milliseconds
  defaultTempo: number;
  bufferCacheSizeMB: number; // Per-device allocation
  notifications: {
    enabled: boolean;
    sound: boolean;
  };
}
