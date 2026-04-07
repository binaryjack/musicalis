import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { BTNodeDef, BTTreeDef } from '../model/node.types'
import { DEFAULT_TREE } from './bt-default-tree'

export { DEFAULT_TREE } from './bt-default-tree'

interface BTState {
  trees: BTTreeDef[];
  activeTreeId: string | null;
}



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
