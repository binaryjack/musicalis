import type { BTTreeDef } from '../model/node.types'

export const DEFAULT_TREE: BTTreeDef = {
  id: 'default',
  name: 'Staff Interaction',
  description: 'Hover → Click-place → Drag → Ctrl+Sustain staff interaction behavior tree',
  root: {
    id: 'root',
    type: 'selector',
    label: 'Root',
    children: [

      // ── 0. Bar Add / Remove buttons ──────────────────────────────────────────
      {
        id: 'seq-bar-add', type: 'sequence', label: 'Add Bar',
        children: [
          { id: 'c-ba-pressed', type: 'condition', label: 'Mouse Pressed',          conditionKey: 'mouse.isPressed' },
          { id: 'c-ba-hover',   type: 'condition', label: 'Add Button Hovered',     conditionKey: 'button.isAddHovered' },
          { id: 'a-ba-add',     type: 'action',    label: 'Add Bar',                actionKey: 'bar.add' },
        ],
      },
      {
        id: 'seq-bar-remove', type: 'sequence', label: 'Remove Bar',
        children: [
          { id: 'c-br-pressed', type: 'condition', label: 'Mouse Pressed',          conditionKey: 'mouse.isPressed' },
          { id: 'c-br-hover',   type: 'condition', label: 'Remove Button Hovered',  conditionKey: 'button.isRemoveHovered' },
          { id: 'a-br-remove',  type: 'action',    label: 'Remove Bar',             actionKey: 'bar.remove' },
        ],
      },

      // ── 1. Ctrl+Sustain ──────────────────────────────────────────────────────
      {
        id: 'seq-sustain', type: 'sequence', label: 'Ctrl+Sustain Beam',
        children: [
          { id: 'c-sus-design', type: 'condition', label: 'Is Design Mode',  conditionKey: 'mode.isDesign' },
          { id: 'c-sus-ctrl',   type: 'condition', label: 'Ctrl Is Down',    conditionKey: 'mouse.isCtrlDown' },
          { id: 'c-sus-mouse',  type: 'condition', label: 'Mouse Is Down',   conditionKey: 'mouse.isDown' },
          { id: 'a-sus-begin',  type: 'action',    label: 'Begin Sustain',   actionKey: 'sustain.begin' },
          { id: 'a-sus-range',  type: 'action',    label: 'Highlight Range', actionKey: 'sustain.highlightRange' },
        ],
      },
      {
        id: 'seq-sustain-commit', type: 'sequence', label: 'Commit Sustain',
        children: [
          { id: 'c-sus-active', type: 'condition', label: 'Sustain Active',  conditionKey: 'sustain.isActive' },
          { id: 'c-sus-up',     type: 'condition', label: 'Mouse Released',  conditionKey: 'mouse.isUp' },
          { id: 'a-sus-commit', type: 'action',    label: 'Commit Sustain',  actionKey: 'sustain.commit' },
        ],
      },

      // ── 2. Note Drag ─────────────────────────────────────────────────────────
      {
        id: 'seq-drag-hover', type: 'sequence', label: 'Note Drag (hover preview)',
        children: [
          { id: 'c-dh-dragging', type: 'condition', label: 'Is Dragging',         conditionKey: 'note.isDragging' },
          { id: 'c-dh-down',     type: 'condition', label: 'Mouse Is Down',       conditionKey: 'mouse.isDown' },
          { id: 'c-dh-subdiv',   type: 'condition', label: 'Subdivision Hovered', conditionKey: 'subdivision.isHovered' },
          { id: 'a-dh-hl',       type: 'action',    label: 'Highlight Target',    actionKey: 'subdivision.highlight' },
          { id: 'a-dh-ghost',    type: 'action',    label: 'Ghost Note',          actionKey: 'note.renderGhost' },
        ],
      },
      {
        id: 'seq-drag-update', type: 'sequence', label: 'Note Drag (begin)',
        children: [
          { id: 'c-drag-not-yet', type: 'condition', label: 'Not Yet Dragging', conditionKey: 'note.isNotDragging' },
          { id: 'c-drag-shift',   type: 'condition', label: 'Shift Held',       conditionKey: 'mouse.isShiftDown' },
          { id: 'c-drag-sel',     type: 'condition', label: 'Note Selected',    conditionKey: 'note.isSelected' },
          { id: 'c-drag-down',    type: 'condition', label: 'Mouse Is Down',    conditionKey: 'mouse.isDown' },
          { id: 'a-drag-begin',   type: 'action',    label: 'Begin Drag',       actionKey: 'note.beginDrag' },
        ],
      },
      {
        id: 'seq-drag-commit', type: 'sequence', label: 'Note Drag (commit)',
        children: [
          { id: 'c-drag-active', type: 'condition', label: 'Is Dragging',     conditionKey: 'note.isDragging' },
          { id: 'c-drag-up',     type: 'condition', label: 'Mouse Released',  conditionKey: 'mouse.isUp' },
          {
            id: 'd-drag-guard', type: 'decorator', label: 'No Note At Target', decoratorType: 'invert',
            children: [{ id: 'c-drag-occupied', type: 'condition', label: 'Position Has Note', conditionKey: 'position.hasNote' }],
          },
          { id: 'a-drag-rest-del', type: 'action', label: 'Delete Rest',  actionKey: 'rest.deleteAtPosition' },
          { id: 'a-drag-commit',   type: 'action', label: 'Commit Drag',  actionKey: 'note.commitDrag' },
          { id: 'a-drag-sound',    type: 'action', label: 'Play Sound',   actionKey: 'note.playSound' },
        ],
      },
      {
        id: 'seq-drag-delete', type: 'sequence', label: 'Note Drag (delete off-canvas)',
        children: [
          { id: 'c-dragd-active', type: 'condition', label: 'Is Dragging',        conditionKey: 'note.isDragging' },
          { id: 'c-dragd-up',     type: 'condition', label: 'Mouse Released',      conditionKey: 'mouse.isUp' },
          { id: 'c-dragd-off',    type: 'condition', label: 'Dropped Off Canvas',  conditionKey: 'note.isOffCanvas' },
          { id: 'a-dragd-delete', type: 'action',    label: 'Delete Dragged Note', actionKey: 'note.deleteDrag' },
        ],
      },
      {
        id: 'seq-drag-cancel', type: 'sequence', label: 'Note Drag (cancel)',
        children: [
          { id: 'c-dragc-active', type: 'condition', label: 'Is Dragging',     conditionKey: 'note.isDragging' },
          { id: 'c-dragc-up',     type: 'condition', label: 'Mouse Released',  conditionKey: 'mouse.isUp' },
          { id: 'a-drag-cancel',  type: 'action',    label: 'Cancel Drag',     actionKey: 'note.cancelDrag' },
        ],
      },

      // ── 3. Click to Place Note ────────────────────────────────────────────────
      {
        id: 'seq-click-place', type: 'sequence', label: 'Click-Place Note',
        children: [
          { id: 'c-cp-design',  type: 'condition', label: 'Is Design Mode',      conditionKey: 'mode.isDesign' },
          { id: 'c-cp-pressed', type: 'condition', label: 'Mouse Pressed',       conditionKey: 'mouse.isPressed' },
          { id: 'c-cp-subdiv',  type: 'condition', label: 'Subdivision Hovered', conditionKey: 'subdivision.isHovered' },
          { id: 'c-cp-allowed', type: 'condition', label: 'Subdivision Allowed', conditionKey: 'subdivision.isAllowed' },
          { id: 'a-cp-delrest', type: 'action',    label: 'Delete Rest',         actionKey: 'rest.deleteAtPosition' },
          { id: 'a-cp-place',   type: 'action',    label: 'Place Note',          actionKey: 'note.add', params: { duration: 'quarter' } },
          { id: 'a-cp-sound',   type: 'action',    label: 'Play Sound',          actionKey: 'note.playSound' },
        ],
      },

      // ── 4. Hover Ghost ───────────────────────────────────────────────────────
      {
        id: 'seq-hover', type: 'sequence', label: 'Hover Ghost',
        children: [
          { id: 'c-hov-design',  type: 'condition', label: 'Is Design Mode',      conditionKey: 'mode.isDesign' },
          { id: 'c-hov-subdiv',  type: 'condition', label: 'Subdivision Hovered', conditionKey: 'subdivision.isHovered' },
          { id: 'c-hov-allowed', type: 'condition', label: 'Subdivision Allowed', conditionKey: 'subdivision.isAllowed' },
          { id: 'c-hov-note',    type: 'condition', label: 'Note Tool Active',    conditionKey: 'toolbox.isNoteToolActive' },
          { id: 'a-hov-hl',      type: 'action',    label: 'Highlight Cell',      actionKey: 'subdivision.highlight' },
          { id: 'a-hov-ghost',   type: 'action',    label: 'Ghost Note',          actionKey: 'note.renderGhost' },
        ],
      },

      // ── 5. Drag Playhead ─────────────────────────────────────────────────────
      {
        id: 'seq-playhead', type: 'sequence', label: 'Drag Playhead',
        children: [
          { id: 'c-ph-playback', type: 'condition', label: 'Is Playback Mode', conditionKey: 'mode.isPlayback' },
          { id: 'c-ph-down',     type: 'condition', label: 'Mouse Down',       conditionKey: 'mouse.isDown' },
          { id: 'a-ph-set',      type: 'action',    label: 'Set Playhead',     actionKey: 'playhead.set' },
        ],
      },

    ],
  },
  createdAt: '2026-04-02T00:00:00.000Z',
  updatedAt: '2026-04-02T00:00:00.000Z',
};
