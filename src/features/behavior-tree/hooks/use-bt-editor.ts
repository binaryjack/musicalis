import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';
import type { BTNodeDef, BTTreeDef, NodeType } from '../model/node.types';
import { NODE_TYPE } from '../model/node.types';
import { btActions } from '../store/bt-slice';

const uid = () => `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const findNode = (root: BTNodeDef, id: string | null): BTNodeDef | null => {
  if (!id) return null;
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
};

export const useBtEditor = () => {
  const dispatch = useDispatch();
  const { trees, activeTreeId } = useSelector((s: RootState) => s.behaviorTree);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['root']));
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonDraft, setJsonDraft] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const activeTree = trees.find((t: BTTreeDef) => t.id === activeTreeId) ?? null;
  const selectedNode = activeTree ? findNode(activeTree.root, selectedNodeId) : null;

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }, []);

  const expandAll = useCallback((root: BTNodeDef) => {
    const ids = new Set<string>();
    const collect = (n: BTNodeDef) => { ids.add(n.id); n.children?.forEach(collect); };
    collect(root);
    setExpandedIds(ids);
  }, []);

  const addChild = useCallback((parentId: string, type: NodeType) => {
    if (!activeTreeId) return;
    const node: BTNodeDef = { id: uid(), type, label: `New ${type}` };
    dispatch(btActions.addChildNode({ treeId: activeTreeId, parentId, node }));
    setExpandedIds(prev => new Set([...prev, parentId]));
    setSelectedNodeId(node.id);
  }, [activeTreeId, dispatch]);

  const deleteNode = useCallback((nodeId: string) => {
    if (!activeTreeId) return;
    dispatch(btActions.deleteNode({ treeId: activeTreeId, nodeId }));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  }, [activeTreeId, dispatch, selectedNodeId]);

  const updateNode = useCallback((node: BTNodeDef) => {
    if (!activeTreeId) return;
    dispatch(btActions.updateNode({ treeId: activeTreeId, node }));
  }, [activeTreeId, dispatch]);

  const openJsonMode = useCallback(() => {
    if (activeTree) setJsonDraft(JSON.stringify(activeTree, null, 2));
    setJsonError(null);
    setJsonMode(true);
  }, [activeTree]);

  const applyJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonDraft) as BTTreeDef;
      dispatch(btActions.updateTree(parsed));
      setJsonError(null);
      setJsonMode(false);
    } catch (e) {
      setJsonError((e as Error).message);
    }
  }, [jsonDraft, dispatch]);

  const addTree = useCallback((name: string) => {
    const tree: BTTreeDef = {
      id: uid(),
      name,
      root: { id: 'root', type: NODE_TYPE.SELECTOR, label: 'Root', children: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch(btActions.addTree(tree));
    dispatch(btActions.setActiveTree(tree.id));
    setSelectedNodeId(null);
    setExpandedIds(new Set(['root']));
  }, [dispatch]);

  const setActiveTree = useCallback((id: string) => {
    dispatch(btActions.setActiveTree(id));
    setSelectedNodeId(null);
    setExpandedIds(new Set(['root']));
  }, [dispatch]);

  const deleteTree = useCallback((id: string) => {
    dispatch(btActions.deleteTree(id));
  }, [dispatch]);

  return {
    trees,
    activeTree,
    activeTreeId,
    selectedNodeId,
    selectedNode,
    expandedIds,
    jsonMode,
    jsonDraft,
    jsonError,
    setJsonDraft,
    setJsonMode,
    setSelectedNodeId,
    toggleExpand,
    expandAll,
    addChild,
    deleteNode,
    updateNode,
    openJsonMode,
    applyJson,
    addTree,
    setActiveTree,
    deleteTree,
  };
};
