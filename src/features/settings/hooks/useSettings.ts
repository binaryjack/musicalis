import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';
import type { SettingsState, AudioSettings, ExportSettings, ColorMappingSettings } from '../../../types/settingsTypes';

// Simple action creators
const updateSettings = (updates: Partial<SettingsState>) => ({ type: 'settings/updateSettings', payload: updates });
const resetSettings = () => ({ type: 'settings/resetSettings' });
const setTheme = (theme: string) => ({ type: 'settings/setTheme', payload: theme });
const setAutoSaveInterval = (interval: number) => ({ type: 'settings/setAutoSaveInterval', payload: interval });
const updateAudioSettings = (audio: Partial<AudioSettings>) => ({ type: 'settings/updateAudioSettings', payload: audio });
const updateExportSettings = (exportSettings: Partial<ExportSettings>) => ({ type: 'settings/updateExportSettings', payload: exportSettings });
const updateColorMappingSettings = (colorSettings: Partial<ColorMappingSettings>) => ({ type: 'settings/updateColorMappingSettings', payload: colorSettings });

export const useSettings = () => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.settings);
  
  return {
    settings,
    updateSettings: (updates: Partial<SettingsState>) => dispatch(updateSettings(updates)),
    resetSettings: () => dispatch(resetSettings()),
    setTheme: (theme: string) => dispatch(setTheme(theme)),
    setAutoSaveInterval: (interval: number) => dispatch(setAutoSaveInterval(interval)),
    updateAudioSettings: (audioSettings: Partial<AudioSettings>) => dispatch(updateAudioSettings(audioSettings)),
    updateExportSettings: (exportSettings: Partial<ExportSettings>) => dispatch(updateExportSettings(exportSettings)),
    updateColorMappingSettings: (colorSettings: Partial<ColorMappingSettings>) => dispatch(updateColorMappingSettings(colorSettings)),
  };
};