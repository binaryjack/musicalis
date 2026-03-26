import { createEditor } from '../features/createEditor';
import { createProjects } from '../features/createProjects';
import { createSettings } from '../features/createSettings';
import type { EditorState } from '../types/editorStateTypes';
import type { SettingsState } from '../types/settingsTypes';

type AppState = {
  readonly editor: EditorState;
  readonly projects: {
    readonly items: readonly unknown[];
    readonly loading: boolean;
    readonly error: string;
  };
  readonly settings: SettingsState;
};

type StorageAdapter = {
  readonly load: (key: string) => Promise<unknown>;
  readonly save: (key: string, data: unknown) => Promise<void>;
};

type AppStore = {
  readonly state: AppState;
  readonly editor: ReturnType<typeof createEditor>;
  readonly projects: ReturnType<typeof createProjects>;
  readonly settings: ReturnType<typeof createSettings>;
  readonly subscribe: (listener: (state: AppState) => void) => () => void;
  readonly destroy: () => void;
};

export const createAppStore = function(storage: StorageAdapter): AppStore {
  // Initialize default states
  const initialEditorState: EditorState = {
    ui: {
      mode: 'edit',
      showKeyboard: true,
      showStaff: true,
      showTimeline: true,
      zoomLevel: 1,
    },
    tools: {
      selectedNote: 'C4',
      selectedDuration: 'quarter',
      velocity: 80,
    },
    error: '',
  };
  
  const initialSettingsState: SettingsState = {
    theme: 'light',
    autoSaveInterval: 30000,
    audio: {
      sampleRate: 44100,
      bufferSize: 512,
      masterVolume: 0.8,
      metronomeVolume: 0.5,
      outputDevice: 'default',
    },
    export: {
      format: 'mp4',
      quality: 'high',
      fps: 60,
      resolution: '1920x1080',
      includeAudio: true,
      backgroundColor: '#ffffff',
    },
    colorMapping: {
      autoAssign: true,
      colorScheme: 'rainbow',
      customMappings: {},
    },
  };
  
  const initialProjectsState = {
    items: [],
    loading: false,
    error: '',
  };
  
  // Create feature instances
  const editor = new (createEditor as any)(initialEditorState);
  const projects = new (createProjects as any)(storage, initialProjectsState);
  const settings = new (createSettings as any)(storage, initialSettingsState);
  
  let currentState: AppState = {
    editor: editor.state,
    projects: projects.state,
    settings: settings.state,
  };
  
  const listeners = new Set<(state: AppState) => void>();
  
  const notify = function() {
    listeners.forEach(listener => listener(currentState));
  };
  
  const updateState = function() {
    currentState = {
      editor: editor.state,
      projects: projects.state,
      settings: settings.state,
    };
    notify();
  };
  
  // Subscribe to feature changes
  const unsubscribeEditor = editor.subscribe(updateState);
  const unsubscribeProjects = projects.subscribe(updateState);
  const unsubscribeSettings = settings.subscribe(updateState);
  
  const store: AppStore = Object.freeze({
    get state() {
      return currentState;
    },
    
    editor,
    projects,
    settings,
    
    subscribe: function(listener: (state: AppState) => void) {
      listeners.add(listener);
      return function() {
        listeners.delete(listener);
      };
    },
    
    destroy: function() {
      unsubscribeEditor();
      unsubscribeProjects();
      unsubscribeSettings();
      listeners.clear();
    },
  });
  
  return store;
};