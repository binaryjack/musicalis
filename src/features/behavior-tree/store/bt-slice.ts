import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { BTNodeDef, BTTreeDef } from '../model/node.types';

interface BTState {
  trees: BTTreeDef[];
  activeTreeId: string | null;
}

const DEFAULT_TREE: BTTreeDef = {
  id: 'default',
  name: 'Staff Interaction',
  description: 'Hover → Click-place → Drag → Ctrl+Sustain staff interaction behavior tree',
  root: {
    id: 'root',
    type: 'selector',
    label: 'Root',
    children: [

      // ── 1. Ctrl+Drag Sustain (highest priority) ──────────────────────────────
      // Requires Ctrl held + mouse down. Keeps RUNNING via sustain.begin while
      // held; on release frame the mouse.isUp branch commits the beam note.
      {
        id: 'seq-sustain',
        type: 'sequence',
        label: 'Ctrl+Sustain Beam',
        children: [
          { id: 'c-sus-design',   type: 'condition', label: 'Is Design Mode',    conditionKey: 'mode.isDesign' },
          { id: 'c-sus-ctrl',     type: 'condition', label: 'Ctrl Is Down',      conditionKey: 'mouse.isCtrlDown' },
          { id: 'c-sus-mouse',    type: 'condition', label: 'Mouse Is Down',     conditionKey: 'mouse.isDown' },
          { id: 'a-sus-begin',    type: 'action',    label: 'Begin Sustain',     actionKey: 'sustain.begin' },
          { id: 'a-sus-range',    type: 'action',    label: 'Highlight Range',   actionKey: 'sustain.highlightRange' },
        ],
      },
      // Commit sustain on the release frame (separate branch, same priority group)
      {
        id: 'seq-sustain-commit',
        type: 'sequence',
        label: 'Commit Sustain',
        children: [
          { id: 'c-sus-active',   type: 'condition', label: 'Sustain Active',    conditionKey: 'sustain.isActive' },
          { id: 'c-sus-up',       type: 'condition', label: 'Mouse Released',    conditionKey: 'mouse.isUp' },
          { id: 'a-sus-commit',   type: 'action',    label: 'Commit Sustain',    actionKey: 'sustain.commit' },
        ],
      },

      // ── 2. Note Drag ─────────────────────────────────────────────────────────
      // While dragging: renders ghost + highlights target. RUNNING state held
      // via note.beginDrag. Release frame: commit or cancel.
      {
        id: 'seq-drag-update',
        type: 'sequence',
        label: 'Note Drag (update)',
        children: [
          { id: 'c-drag-sel',     type: 'condition', label: 'Note Selected',     conditionKey: 'note.isSelected' },
          { id: 'c-drag-down',    type: 'condition', label: 'Mouse Is Down',     conditionKey: 'mouse.isDown' },
          // note.beginDrag sets isDragging=true and returns RUNNING → holds the sequence
          { id: 'a-drag-begin',   type: 'action',    label: 'Begin Drag',        actionKey: 'note.beginDrag' },
          { id: 'a-drag-ghost',   type: 'action',    label: 'Ghost Note',        actionKey: 'note.renderGhost' },
          { id: 'a-drag-hl',      type: 'action',    label: 'Highlight Target',  actionKey: 'subdivision.highlight' },
        ],
      },
      {
        id: 'seq-drag-commit',
        type: 'sequence',
        label: 'Note Drag (commit)',
        children: [
          { id: 'c-drag-active',  type: 'condition', label: 'Is Dragging',       conditionKey: 'note.isDragging' },
          { id: 'c-drag-up',      type: 'condition', label: 'Mouse Released',    conditionKey: 'mouse.isUp' },
          // Guard: only commit when target cell is not already occupied by a note
          {
            id: 'd-drag-guard',
            type: 'decorator',
            label: 'No Note At Target',
            decoratorType: 'invert',
            children: [
              { id: 'c-drag-occupied', type: 'condition', label: 'Position Has Note', conditionKey: 'position.hasNote' },
            ],
          },
          { id: 'a-drag-rest-del', type: 'action',   label: 'Delete Rest',       actionKey: 'rest.deleteAtPosition' },
          { id: 'a-drag-commit',   type: 'action',   label: 'Commit Drag',       actionKey: 'note.commitDrag' },
          { id: 'a-drag-sound',    type: 'action',   label: 'Play Sound',        actionKey: 'note.playSound' },
        ],
      },
      {
        id: 'seq-drag-cancel',
        type: 'sequence',
        label: 'Note Drag (cancel)',
        children: [
          { id: 'c-dragc-active', type: 'condition', label: 'Is Dragging',       conditionKey: 'note.isDragging' },
          { id: 'c-dragc-up',     type: 'condition', label: 'Mouse Released',    conditionKey: 'mouse.isUp' },
          // Reaches here only when the guard above failed (position occupied)
          { id: 'a-drag-cancel',  type: 'action',    label: 'Cancel Drag',       actionKey: 'note.cancelDrag' },
        ],
      },

      // ── 3. Click to Place Note ────────────────────────────────────────────────
      // Single-frame press on an allowed subdivision. Guard prevents double-placement.
      {
        id: 'seq-click-place',
        type: 'sequence',
        label: 'Click-Place Note',
        children: [
          { id: 'c-cp-design',    type: 'condition', label: 'Is Design Mode',    conditionKey: 'mode.isDesign' },
          { id: 'c-cp-pressed',   type: 'condition', label: 'Mouse Pressed',     conditionKey: 'mouse.isPressed' },
          { id: 'c-cp-subdiv',    type: 'condition', label: 'Subdivision Hovered', conditionKey: 'subdivision.isHovered' },
          { id: 'c-cp-allowed',   type: 'condition', label: 'Subdivision Allowed', conditionKey: 'subdivision.isAllowed' },
          // Guard: fail if a NOTE already exists there (rest is ok — deleted below)
          {
            id: 'd-cp-guard',
            type: 'decorator',
            label: 'No Note Already',
            decoratorType: 'invert',
            children: [
              { id: 'c-cp-hasnote', type: 'condition', label: 'Position Has Note', conditionKey: 'position.hasNote' },
            ],
          },
          // If a rest is there, delete it first
          { id: 'a-cp-delrest',   type: 'action',    label: 'Delete Rest',       actionKey: 'rest.deleteAtPosition' },
          { id: 'a-cp-place',     type: 'action',    label: 'Place Note',        actionKey: 'note.add', params: { duration: 'quarter' } },
          { id: 'a-cp-sound',     type: 'action',    label: 'Play Sound',        actionKey: 'note.playSound' },
        ],
      },

      // ── 4. Hover Ghost (lowest priority — always runs when nothing else matches)
      // Shows a ghost note preview + highlights the hovered subdivision.
      {
        id: 'seq-hover',
        type: 'sequence',
        label: 'Hover Ghost',
        children: [
          { id: 'c-hov-design',   type: 'condition', label: 'Is Design Mode',    conditionKey: 'mode.isDesign' },
          { id: 'c-hov-subdiv',   type: 'condition', label: 'Subdivision Hovered', conditionKey: 'subdivision.isHovered' },
          { id: 'c-hov-allowed',  type: 'condition', label: 'Subdivision Allowed', conditionKey: 'subdivision.isAllowed' },
          { id: 'c-hov-note',     type: 'condition', label: 'Note Selected',     conditionKey: 'note.isSelected' },
          { id: 'a-hov-hl',       type: 'action',    label: 'Highlight Cell',    actionKey: 'subdivision.highlight' },
          { id: 'a-hov-ghost',    type: 'action',    label: 'Ghost Note',        actionKey: 'note.renderGhost' },
        ],
      },

      // ── 5. Drag Playhead (playback mode) ────────────────────────────────────
      {
        id: 'seq-playhead',
        type: 'sequence',
        label: 'Drag Playhead',
        children: [
          { id: 'c-ph-playback',  type: 'condition', label: 'Is Playback Mode',  conditionKey: 'mode.isPlayback' },
          { id: 'c-ph-down',      type: 'condition', label: 'Mouse Down',        conditionKey: 'mouse.isDown' },
          { id: 'a-ph-set',       type: 'action',    label: 'Set Playhead',      actionKey: 'playhead.set' },
        ],
      },

    ],
  },
  createdAt: '2026-04-02T00:00:00.000Z',
  updatedAt: '2026-04-02T00:00:00.000Z',
};

const initialState: BTState = {
  trees: [DEFAULT_TREE],
  activeTreeId: 'default',
};

const patchNode = (root: BTNodeDef, patch: BTNodeDef): BTNodeDef => {
  if (root.id === patch.id) return patch;
  if (!root.children) return root;
  return { ...root, children: root.children.map(c => patchNode(c, patch)) };
};

const removeNode = (root: BTNodeDef, nodeId: string): BTNodeDef => {
  if (!root.children) return root;
  return {
    ...root,
    children: root.children
      .filter(c => c.id !== nodeId)
      .map(c => removeNode(c, nodeId)),
  };
};

const insertChild = (root: BTNodeDef, parentId: string, child: BTNodeDef): BTNodeDef => {
  if (root.id === parentId) return { ...root, children: [...(root.children ?? []), child] };
  if (!root.children) return root;
  return { ...root, children: root.children.map(c => insertChild(c, parentId, child)) };
};

export const btSlice = createSlice({
  name: 'behaviorTree',
  initialState,
  reducers: {
    addTree: (state, action: PayloadAction<BTTreeDef>) => {
      state.trees.push(action.payload);
    },
    updateTree: (state, action: PayloadAction<BTTreeDef>) => {
      const idx = state.trees.findIndex(t => t.id === action.payload.id);
      if (idx !== -1) {
        state.trees[idx] = { ...action.payload, updatedAt: new Date().toISOString() };
      }
    },
    deleteTree: (state, action: PayloadAction<string>) => {
      state.trees = state.trees.filter(t => t.id !== action.payload);
      if (state.activeTreeId === action.payload) {
        state.activeTreeId = state.trees[0]?.id ?? null;
      }
    },
    setActiveTree: (state, action: PayloadAction<string>) => {
      state.activeTreeId = action.payload;
    },
    updateNode: (state, action: PayloadAction<{ treeId: string; node: BTNodeDef }>) => {
      const tree = state.trees.find(t => t.id === action.payload.treeId);
      if (!tree) return;
      tree.root = patchNode(tree.root, action.payload.node);
      tree.updatedAt = new Date().toISOString();
    },
    addChildNode: (state, action: PayloadAction<{ treeId: string; parentId: string; node: BTNodeDef }>) => {
      const tree = state.trees.find(t => t.id === action.payload.treeId);
      if (!tree) return;
      tree.root = insertChild(tree.root, action.payload.parentId, action.payload.node);
      tree.updatedAt = new Date().toISOString();
    },
    deleteNode: (state, action: PayloadAction<{ treeId: string; nodeId: string }>) => {
      const tree = state.trees.find(t => t.id === action.payload.treeId);
      if (!tree) return;
      tree.root = removeNode(tree.root, action.payload.nodeId);
      tree.updatedAt = new Date().toISOString();
    },
  },
});

export const btActions = btSlice.actions;
export const btReducer = btSlice.reducer;
