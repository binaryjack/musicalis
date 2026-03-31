import type { EditorState } from '../types/editorStateTypes';
import type { EditorMode } from '../types/playbackTypes';

type EditorActions = {
  readonly setMode: (mode: EditorMode) => void;
  readonly setSelectedNote: (note: string) => void;
  readonly setSelectedDuration: (duration: string) => void;
  readonly setVelocity: (velocity: number) => void;
  readonly setError: (error: string) => void;
};

export const createEditor = function(initialState: EditorState) {
  let currentState = initialState;
  const listeners = new Set<(state: EditorState) => void>();
  
  const notify = function() {
    listeners.forEach(listener => listener(currentState));
  };
  
  const actions: EditorActions = Object.freeze({
    setMode: function(mode: EditorMode) {
      currentState = {
        ...currentState,
        ui: {
          ...currentState.ui,
          mode,
        },
      };
      notify();
    },
    
    setSelectedNote: function(note: string) {
      currentState = {
        ...currentState,
        tools: {
          ...currentState.tools,
          selectedNote: note,
        },
      };
      notify();
    },
    
    setSelectedDuration: function(duration: string) {
      currentState = {
        ...currentState,
        tools: {
          ...currentState.tools,
          selectedDuration: duration,
        },
      };
      notify();
    },
    
    setVelocity: function(velocity: number) {
      currentState = {
        ...currentState,
        tools: {
          ...currentState.tools,
          velocity,
        },
      };
      notify();
    },
    
    setError: function(error: string) {
      currentState = {
        ...currentState,
        error,
      };
      notify();
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
    value: function(listener: (state: EditorState) => void) {
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