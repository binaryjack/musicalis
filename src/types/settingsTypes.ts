import type { UITheme } from './uiTypes';
import type { ExportFormat, ExportQuality } from './exportTypes';

export type AudioSettings = {
  readonly sampleRate: number;
  readonly bufferSize: number;
  readonly masterVolume: number;
  readonly metronomeVolume: number;
  readonly outputDevice: string;
};

export type ExportSettings = {
  readonly format: ExportFormat;
  readonly quality: ExportQuality;
  readonly fps: number;
  readonly resolution: string;
  readonly includeAudio: boolean;
  readonly backgroundColor: string;
};

export type ColorMappingSettings = {
  readonly autoAssign: boolean;
  readonly colorScheme: string;
  readonly customMappings: Record<string, string>;
};

export type SettingsState = {
  readonly theme: UITheme;
  readonly autoSaveInterval: number;
  readonly audio: AudioSettings;
  readonly export: ExportSettings;
  readonly colorMapping: ColorMappingSettings;
};

export const createAudioSettings = function(config: Partial<AudioSettings> = {}): AudioSettings {
  return Object.freeze({
    sampleRate: config.sampleRate || 44100,
    bufferSize: config.bufferSize || 512,
    masterVolume: config.masterVolume || 0.8,
    metronomeVolume: config.metronomeVolume || 0.5,
    outputDevice: config.outputDevice || 'default',
  });
};

export const createExportSettings = function(config: Partial<ExportSettings> = {}): ExportSettings {
  return Object.freeze({
    format: config.format || 'mp4',
    quality: config.quality || 'high',
    fps: config.fps || 60,
    resolution: config.resolution || '1920x1080',
    includeAudio: config.includeAudio !== false,
    backgroundColor: config.backgroundColor || '#ffffff',
  });
};