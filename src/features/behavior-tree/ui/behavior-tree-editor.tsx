import { useState, useRef, useCallback } from 'react';
import type { NodeType } from '../model/node.types';
import { NODE_TYPE } from '../model/node.types';
import { useBtEditor } from '../hooks/use-bt-editor';
import { TreeNodeView } from './tree-node-view';
import { NodeInspector } from './node-inspector';
import { NodePalette } from './node-palette';

const canHaveChildren = (type: NodeType | undefined) =>
  type === NODE_TYPE.SELECTOR ||
  type === NODE_TYPE.SEQUENCE ||
  type === NODE_TYPE.DECORATOR;

export const BehaviorTreeEditor = () => {
  const editor = useBtEditor();
  const [newTreeName, setNewTreeName] = useState('');
  const [showNewTree, setShowNewTree] = useState(false);
  const [inspectorWidth, setInspectorWidth] = useState(200);
  const splitResizing = useRef(false);

  const handleSplitResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    splitResizing.current = true;
    const startX = e.clientX;
    const startW = inspectorWidth;
    const onMove = (ev: MouseEvent) => {
      if (!splitResizing.current) return;
      setInspectorWidth(Math.max(120, Math.min(480, startW + (startX - ev.clientX))));
    };
    const onUp = () => {
      splitResizing.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [inspectorWidth]);

  const selectedIsComposite = editor.selectedNode
    ? canHaveChildren(editor.selectedNode.type)
    : false;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#1e1e1e',
      color: '#e0e0e0',
      fontFamily: 'monospace',
      border: '1px solid #333',
      overflow: 'hidden',
    }}>

      {/* ─── Toolbar ─────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 4px',
        backgroundColor: '#252525',
        borderBottom: '1px solid #333',
        flexShrink: 0,
        flexWrap: 'wrap',
      }}>
        <span style={{ fontWeight: 'bold', color: '#4a9eff', fontSize: '14px' }}>🌳 Behavior Trees</span>

        <div style={{ flex: 1, display: 'flex', gap: '6px', overflowX: 'auto' }}>
          {editor.trees.map(t => (
            <button
              key={t.id}
              onClick={() => editor.setActiveTree(t.id)}
              style={{
                padding: '4px 10px',
                backgroundColor: t.id === editor.activeTreeId ? '#4a7cc7' : '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                whiteSpace: 'nowrap',
              }}
            >
              {t.name}
            </button>
          ))}
        </div>

        {showNewTree ? (
          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              autoFocus
              value={newTreeName}
              onChange={e => setNewTreeName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newTreeName.trim()) {
                  editor.addTree(newTreeName.trim());
                  setNewTreeName('');
                  setShowNewTree(false);
                }
                if (e.key === 'Escape') { setShowNewTree(false); setNewTreeName(''); }
              }}
              placeholder="Tree name…"
              style={{ padding: '4px 8px', backgroundColor: '#1a1a1a', color: '#e0e0e0', border: '1px solid #555', borderRadius: '4px', fontSize: '12px' }}
            />
            <button onClick={() => setShowNewTree(false)} style={{ padding: '4px 8px', backgroundColor: '#333', color: '#888', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewTree(true)}
            style={{ padding: '4px 10px', backgroundColor: '#2a4a2a', color: '#4ac77c', border: '1px solid #3a6a3a', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
          >
            + New Tree
          </button>
        )}

        <button
          onClick={() => editor.activeTree && editor.expandAll(editor.activeTree.root)}
          title="Expand all"
          style={{ padding: '4px 8px', backgroundColor: '#333', color: '#aaa', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
        >⇕</button>

        <button
          onClick={editor.openJsonMode}
          title="Edit as JSON"
          style={{ padding: '4px 8px', backgroundColor: editor.jsonMode ? '#2a4a7c' : '#333', color: '#4a9eff', border: '1px solid #2a4a7c', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
        >{'{ }'}</button>
      </div>

      {/* ─── JSON Mode ───────────────────────────── */}
      {editor.jsonMode ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2px', gap: '2px' }}>
          <textarea
            value={editor.jsonDraft}
            onChange={e => editor.setJsonDraft(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: '#111',
              color: '#e0e0e0',
              border: '1px solid #555',
              borderRadius: '4px',
              padding: '10px',
              fontFamily: 'monospace',
              fontSize: '12px',
              resize: 'none',
            }}
          />
          {editor.jsonError && (
            <div style={{ color: '#f44336', fontSize: '12px' }}>⚠ {editor.jsonError}</div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={editor.applyJson}
              style={{ padding: '8px 16px', backgroundColor: '#2a4a2a', color: '#4ac77c', border: '1px solid #3a6a3a', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
            >Apply JSON</button>
            <button
              onClick={() => editor.setJsonMode(false)}
              style={{ padding: '8px 16px', backgroundColor: '#333', color: '#888', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
            >Cancel</button>
          </div>
        </div>
      ) : (
        /* ─── Visual Mode ──────────────────────── */
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left: Tree View */}
          <div style={{ flex: 1, overflowY: 'auto', borderRight: '1px solid #333' }}>
            {editor.activeTree ? (
              <TreeNodeView
                node={editor.activeTree.root}
                depth={0}
                selectedId={editor.selectedNodeId}
                expandedIds={editor.expandedIds}
                onSelect={editor.setSelectedNodeId}
                onToggle={editor.toggleExpand}
                onAddChild={(parentId, type) => editor.addChild(parentId, type)}
                onDelete={editor.deleteNode}
              />
            ) : (
              <div style={{ padding: '4px', color: '#666', fontSize: '12px' }}>No tree selected</div>
            )}
          </div>

          {/* Resize handle between tree and inspector */}
          <div
            onMouseDown={handleSplitResizeStart}
            style={{
              width: '4px',
              cursor: 'col-resize',
              backgroundColor: '#2a2a2a',
              flexShrink: 0,
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#4a9eff')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2a2a2a')}
          />

          {/* Right: Inspector */}
          <div style={{ width: `${inspectorWidth}px`, flexShrink: 0, overflowY: 'auto' }}>
            <NodeInspector
              node={editor.selectedNode ?? null}
              onChange={editor.updateNode}
              onDelete={editor.deleteNode}
            />
          </div>
        </div>
      )}

      {/* ─── Palette ─────────────────────────────── */}
      {!editor.jsonMode && (
        <NodePalette
          selectedParentId={selectedIsComposite ? editor.selectedNodeId : null}
          onAdd={(type: NodeType) => {
            if (editor.selectedNodeId) editor.addChild(editor.selectedNodeId, type);
          }}
        />
      )}
    </div>
  );
};
