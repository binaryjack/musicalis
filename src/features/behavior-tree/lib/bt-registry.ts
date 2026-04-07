import { NODE_STATUS } from '../model/node.types'
import type { BTRegistry } from '../model/registry.types'

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
    'toolbox.isNoteToolActive': {
      key: 'toolbox.isNoteToolActive',
      label: 'Note Tool Active',
      description: 'True when the note tool is selected in design mode',
      fn: (ctx) => ctx.isNoteToolActive,
    },

    // ── Interaction-layer conditions ───────────────────────────────────────

    'mouse.isCtrlDown': {
      key: 'mouse.isCtrlDown',
      label: 'Ctrl Is Down',
      description: 'True while Ctrl key is held with the mouse',
      fn: (ctx) => ctx.mouse.isCtrlDown,
    },
    'mouse.isShiftDown': {
      key: 'mouse.isShiftDown',
      label: 'Shift Is Down',
      description: 'True while Shift key is held — activates drag/select mode',
      fn: (ctx) => ctx.mouse.isShiftDown,
    },
    'mouse.isUp': {
      key: 'mouse.isUp',
      label: 'Mouse Released',
      description: 'True on the single frame a mouse button is released',
      fn: (ctx) => ctx.mouse.isUp,
    },
    'subdivision.isHovered': {
      key: 'subdivision.isHovered',
      label: 'Subdivision Hovered',
      description: 'True when the cursor is over a specific staff subdivision cell',
      fn: (ctx) => ctx.hoveredSubdivision !== null,
    },
    'subdivision.isAllowed': {
      key: 'subdivision.isAllowed',
      label: 'Subdivision Is Allowed',
      description: 'True when the hovered subdivision is a legal target for the selected duration',
      fn: (ctx) => ctx.hoveredSubdivision?.isAllowed ?? false,
    },
    'position.hasNote': {
      key: 'position.hasNote',
      label: 'Position Has Note',
      description: 'True when a note already occupies the hovered subdivision (guard: prevents double-placement)',
      fn: (ctx) => ctx.hoveredSubdivision?.hasNote ?? false,
    },
    'position.hasRest': {
      key: 'position.hasRest',
      label: 'Position Has Rest',
      description: 'True when a rest occupies the hovered subdivision',
      fn: (ctx) => ctx.hoveredSubdivision?.hasRest ?? false,
    },
    'note.isDragging': {
      key: 'note.isDragging',
      label: 'Note Is Dragging',
      description: 'True while a note drag operation is in progress',
      fn: (ctx) => ctx.isDragging,
    },
    'note.isNotDragging': {
      key: 'note.isNotDragging',
      label: 'Note Is Not Dragging',
      description: 'True when no drag is in progress — guards the begin-drag sequence',
      fn: (ctx) => !ctx.isDragging,
    },
    'sustain.isActive': {
      key: 'sustain.isActive',
      label: 'Sustain Mode Active',
      description: 'True while a Ctrl+drag beam/sustain operation is in progress',
      fn: (ctx) => ctx.isSustainMode,
    },
    'button.isAddHovered': {
      key: 'button.isAddHovered',
      label: 'Add-Bar Button Hovered',
      description: 'True when the cursor is over the add-bar button',
      fn: (ctx) => ctx.hoveredButton === 'add',
    },
    'button.isRemoveHovered': {
      key: 'button.isRemoveHovered',
      label: 'Remove-Bar Button Hovered',
      description: 'True when the cursor is over the remove-bar button',
      fn: (ctx) => ctx.hoveredButton === 'remove',
    },
    'note.isOffCanvas': {
      key: 'note.isOffCanvas',
      label: 'Dragged Note Is Off Canvas',
      description: 'True when the dragged note is released outside the staff vertical bounds',
      fn: (ctx) => ctx.isOffCanvas,
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

    // ── Interaction-layer actions ──────────────────────────────────────────

    'note.playSound': {
      key: 'note.playSound',
      label: 'Play Note Sound',
      description: 'Trigger audio playback for the placed / moved note',
      fn: () => NODE_STATUS.SUCCESS,
    },
    'rest.deleteAtPosition': {
      key: 'rest.deleteAtPosition',
      label: 'Delete Rest At Position',
      description: 'Remove a rest at the hovered subdivision to make room for a note (no-op if no rest)',
      fn: () => NODE_STATUS.SUCCESS,
    },
    'subdivision.highlight': {
      key: 'subdivision.highlight',
      label: 'Highlight Subdivision',
      description: 'Visually highlight the hovered subdivision cell as a valid drop target',
      fn: () => NODE_STATUS.SUCCESS,
    },
    'note.renderGhost': {
      key: 'note.renderGhost',
      label: 'Render Ghost Note',
      description: 'Render a translucent preview of the selected note at the hovered subdivision',
      fn: () => NODE_STATUS.SUCCESS,
    },
    'note.beginDrag': {
      key: 'note.beginDrag',
      label: 'Begin Note Drag',
      description: 'Start a note drag — marks isDragging and stores dragSourceNoteId. Returns RUNNING until released.',
      fn: () => NODE_STATUS.RUNNING,
    },
    'note.commitDrag': {
      key: 'note.commitDrag',
      label: 'Commit Note Drag',
      description: 'Drop the dragged note onto the hovered subdivision (replaces rest if present, cancels if occupied)',
      fn: () => NODE_STATUS.SUCCESS,
    },
    'note.cancelDrag': {
      key: 'note.cancelDrag',
      label: 'Cancel Note Drag',
      description: 'Abort the current drag and restore the note to its original position',
      fn: () => NODE_STATUS.SUCCESS,
    },
    'sustain.begin': {
      key: 'sustain.begin',
      label: 'Begin Sustain Mode',
      description: 'Start a Ctrl+drag beam/sustain — sets isSustainMode on first tick, returns SUCCESS so the sequence continues to highlightRange.',
      fn: () => NODE_STATUS.SUCCESS,
    },
    'sustain.highlightRange': {
      key: 'sustain.highlightRange',
      label: 'Highlight Sustain Range',
      description: 'Highlight the maximum allowed subdivision range for the ongoing sustain drag',
      fn: () => NODE_STATUS.SUCCESS,
    },
    'sustain.commit': {
      key: 'sustain.commit',
      label: 'Commit Sustain',
      description: 'On mouse-up: replace covered notes with beamed/sustained note. Cancels if off-staff.',
      fn: () => NODE_STATUS.SUCCESS,
    },
    'note.deleteDrag': {
      key: 'note.deleteDrag',
      label: 'Delete Dragged Note',
      description: 'Cancel drag and permanently remove the source note (dropped off canvas).',
      fn: () => NODE_STATUS.SUCCESS,
    },
  },
};
