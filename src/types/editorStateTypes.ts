import type { EditorMode } from './playbackTypes';

export type EditorUI = {
  readonly mode: EditorMode;
  readonly showKeyboard: boolean;
  readonly showStaff: boolean;
  readonly showTimeline: boolean;
  readonly zoomLevel: number;
};

export type EditorTools = {
  readonly selectedNote: string;
  readonly selectedDuration: string;
  readonly velocity: number;
};

export type EditorState = {
  readonly ui: EditorUI;
  readonly tools: EditorTools;
  readonly error: string;
};

export const createEditorUI = function(config: Partial<EditorUI> = {}): EditorUI {
  return Object.freeze({
    mode: config.mode || 'edit',
    showKeyboard: config.showKeyboard !== false,
    showStaff: config.showStaff !== false,
    showTimeline: config.showTimeline !== false,
    zoomLevel: config.zoomLevel || 1,
  });
};

export const createEditorTools = function(config: Partial<EditorTools> = {}): EditorTools {
  return Object.freeze({
    selectedNote: config.selectedNote || 'C4',
    selectedDuration: config.selectedDuration || 'quarter',
    velocity: config.velocity || 80,
  });
};