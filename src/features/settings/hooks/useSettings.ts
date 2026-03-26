import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';

// Simple action creators
const updateSettings = (updates: any) => ({ type: 'settings/updateSettings', payload: updates });
const resetSettings = () => ({ type: 'settings/resetSettings' });
const setTheme = (theme: string) => ({ type: 'settings/setTheme', payload: theme });
const setAutoSaveInterval = (interval: number) => ({ type: 'settings/setAutoSaveInterval', payload: interval });
const updateAudioSettings = (audio: any) => ({ type: 'settings/updateAudioSettings', payload: audio });
const updateExportSettings = (exportSettings: any) => ({ type: 'settings/updateExportSettings', payload: exportSettings });
const updateColorMappingSettings = (colorSettings: any) => ({ type: 'settings/updateColorMappingSettings', payload: colorSettings });

export const useSettings = () => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.settings);
  
  return {
    settings,
    updateSettings: (updates: any) => dispatch(updateSettings(updates)),
    resetSettings: () => dispatch(resetSettings()),
    setTheme: (theme: string) => dispatch(setTheme(theme)),
    setAutoSaveInterval: (interval: number) => dispatch(setAutoSaveInterval(interval)),
    updateAudioSettings: (audioSettings: any) => dispatch(updateAudioSettings(audioSettings)),
    updateExportSettings: (exportSettings: any) => dispatch(updateExportSettings(exportSettings)),
    updateColorMappingSettings: (colorSettings: any) => dispatch(updateColorMappingSettings(colorSettings)),
  };
};