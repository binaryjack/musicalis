import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { BTNodeDef, BTTreeDef } from '../model/node.types';

interface BTState {
  trees: BTTreeDef[];
  activeTreeId: string | null;
}

const DEFAULT_TREE: BTTreeDef = {
  id: 'default',
  name: 'Default Behavior',
  description: 'Built-in staff interaction behavior tree',
  root: {
    id: 'root',
    type: 'selector',
    label: 'Root',
    children: [
      {
        id: 'seq-add-note',
        type: 'sequence',
        label: 'Add Note',
        children: [
          { id: 'c-design-1',  type: 'condition', label: 'Is Design Mode',  conditionKey: 'mode.isDesign' },
          { id: 'c-mouse-1',   type: 'condition', label: 'Mouse Pressed',   conditionKey: 'mouse.isPressed' },
          { id: 'c-staff-1',   type: 'condition', label: 'Staff Selected',  conditionKey: 'staff.isSelected' },
          { id: 'a-note-add',  type: 'action',    label: 'Add Note',        actionKey: 'note.add', params: { duration: 'quarter' } },
        ],
      },
      {
        id: 'seq-remove-note',
        type: 'sequence',
        label: 'Remove Note',
        children: [
          { id: 'c-design-2',    type: 'condition', label: 'Is Design Mode',  conditionKey: 'mode.isDesign' },
          { id: 'c-note-sel',    type: 'condition', label: 'Note Selected',   conditionKey: 'note.isSelected' },
          { id: 'a-note-remove', type: 'action',    label: 'Remove Note',     actionKey: 'note.remove' },
        ],
      },
      {
        id: 'seq-playhead',
        type: 'sequence',
        label: 'Drag Playhead',
        children: [
          { id: 'c-playback',    type: 'condition', label: 'Is Playback Mode', conditionKey: 'mode.isPlayback' },
          { id: 'c-mouse-down',  type: 'condition', label: 'Mouse Down',       conditionKey: 'mouse.isDown' },
          { id: 'a-playhead',    type: 'action',    label: 'Set Playhead',     actionKey: 'playhead.set' },
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
