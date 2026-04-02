import type { UITheme } from '../types/uiTypes';
import type { SettingsState, AudioSettings, ExportSettings } from '../types/settingsTypes';

type SettingsActions = {
  readonly setTheme: (theme: UITheme) => void;
  readonly setAutoSaveInterval: (interval: number) => void;
  readonly updateAudioSettings: (settings: Partial<AudioSettings>) => void;
  readonly updateExportSettings: (settings: Partial<ExportSettings>) => void;
};

type StorageAdapter = {
  readonly load: (key: string) => Promise<unknown>;
  readonly save: (key: string, data: unknown) => Promise<void>;
};

export const createSettings = function(
  this: any,
  storage: StorageAdapter,
  initialState: SettingsState
) {
  let currentState = initialState;
  const listeners = new Set<(state: SettingsState) => void>();
  const storageKey = 'musicalist-settings';
  
  const notify = function() {
    listeners.forEach(listener => listener(currentState));
  };
  
  const saveToStorage = async function() {
    try {
      await storage.save(storageKey, currentState);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };
  
  const actions: SettingsActions = Object.freeze({
    setTheme: function(theme: UITheme) {
      currentState = {
        ...currentState,
        theme,
      };
      notify();
      saveToStorage();
    },
    
    setAutoSaveInterval: function(interval: number) {
      currentState = {
        ...currentState,
        autoSaveInterval: interval,
      };
      notify();
      saveToStorage();
    },
    
    updateAudioSettings: function(updates: Partial<AudioSettings>) {
      currentState = {
        ...currentState,
        audio: {
          ...currentState.audio,
          ...updates,
        },
      };
      notify();
      saveToStorage();
    },
    
    updateExportSettings: function(updates: Partial<ExportSettings>) {
      currentState = {
        ...currentState,
        export: {
          ...currentState.export,
          ...updates,
        },
      };
      notify();
      saveToStorage();
    },
  });
  
  Object.defineProperty(this, 'state', {
    get: () => currentState,
    enumerable: false,
  });
  
  Object.defineProperty(this, 'actions', {
    value: actions,
    enumerable: false,
    writable: false,
  });
  
  Object.defineProperty(this, 'subscribe', {
    value: function(listener: (state: SettingsState) => void) {
      listeners.add(listener);
      return function() {
        listeners.delete(listener);
      };
    },
    enumerable: false,
    writable: false,
  });
  
  return Object.freeze(this);
};