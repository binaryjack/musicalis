import type { BTRegistry } from '../model/registry.types';
import { NODE_STATUS } from '../model/node.types';

/**
 * Default registry of built-in conditions and actions.
 * Action `fn` returns SUCCESS — real side effects are dispatched via
 * the command bus outside the engine (engine stays pure).
 */
export const defaultRegistry: BTRegistry = {
  conditions: {
    'mouse.isDown': {
      key: 'mouse.isDown',
      label: 'Mouse Is Down',
      description: 'True while mouse button is held',
      fn: (ctx) => ctx.mouse.isDown,
    },
    'mouse.isPressed': {
      key: 'mouse.isPressed',
      label: 'Mouse Is Pressed',
      description: 'True on the frame a mouse button is first pressed',
      fn: (ctx) => ctx.mouse.isPressed,
    },
    'mode.isDesign': {
      key: 'mode.isDesign',
      label: 'Is Design Mode',
      description: 'True when the editor is in design mode',
      fn: (ctx) => ctx.mode === 'design',
    },
    'mode.isPlayback': {
      key: 'mode.isPlayback',
      label: 'Is Playback Mode',
      description: 'True when the editor is in playback mode',
      fn: (ctx) => ctx.mode === 'playback',
    },
    'staff.isSelected': {
      key: 'staff.isSelected',
      label: 'Staff Is Selected',
      description: 'True when at least one staff is selected',
      fn: (ctx) => ctx.selectedStaffId !== null,
    },
    'note.isSelected': {
      key: 'note.isSelected',
      label: 'Note Is Selected',
      description: 'True when a note is currently selected',
      fn: (ctx) => ctx.selectedNoteId !== null,
    },
    'bar.isHovered': {
      key: 'bar.isHovered',
      label: 'Bar Is Hovered',
      description: 'True when the cursor is over a bar',
      fn: (ctx) => ctx.hoveredBar !== null,
    },
    'cursor.inBounds': {
      key: 'cursor.inBounds',
      label: 'Cursor In Bounds',
      description: 'True when cursor position is >= 0',
      fn: (ctx) => ctx.cursorPosition >= 0,
    },
  },

  actions: {
    'note.add': {
      key: 'note.add',
      label: 'Add Note',
      description: 'Add a note at the cursor position on the selected staff',
      params: [
        { key: 'pitch',    label: 'Pitch',    type: 'string', defaultValue: 'C4' },
        { key: 'duration', label: 'Duration', type: 'select',
          options: ['whole', 'half', 'quarter', 'eighth', 'sixteenth'],
          defaultValue: 'quarter' },
      ],
      fn: () => NODE_STATUS.SUCCESS,
    },
    'note.remove': {
      key: 'note.remove',
      label: 'Remove Note',
      description: 'Remove the currently selected note',
      fn: () => NODE_STATUS.SUCCESS,
    },
    'note.move': {
      key: 'note.move',
      label: 'Move Note',
      description: 'Move the selected note to a target bar/beat',
      params: [
        { key: 'targetBarIndex',  label: 'Target Bar',  type: 'number', defaultValue: 0 },
        { key: 'targetBeatIndex', label: 'Target Beat', type: 'number', defaultValue: 0 },
      ],
      fn: () => NODE_STATUS.SUCCESS,
    },
    'note.swap': {
      key: 'note.swap',
      label: 'Swap Notes',
      description: 'Swap selected note with target position',
      params: [
        { key: 'targetBarIndex',  label: 'Target Bar',  type: 'number', defaultValue: 0 },
        { key: 'targetBeatIndex', label: 'Target Beat', type: 'number', defaultValue: 0 },
      ],
      fn: () => NODE_STATUS.SUCCESS,
    },
    'staff.select': {
      key: 'staff.select',
      label: 'Select Staff',
      description: 'Select the hovered or specified staff',
      fn: () => NODE_STATUS.SUCCESS,
    },
    'bar.add': {
      key: 'bar.add',
      label: 'Add Bar',
      description: 'Add a bar after the hovered position',
      fn: () => NODE_STATUS.SUCCESS,
    },
    'bar.remove': {
      key: 'bar.remove',
      label: 'Remove Bar',
      description: 'Remove the hovered bar',
      fn: () => NODE_STATUS.SUCCESS,
    },
    'playhead.set': {
      key: 'playhead.set',
      label: 'Set Playhead',
      description: 'Move the playhead to the cursor position',
      fn: () => NODE_STATUS.SUCCESS,
    },
  },
};
