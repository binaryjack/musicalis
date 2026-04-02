import type { BTNodeDef, NodeStatus, NodeType } from '../model/node.types';
import { NODE_TYPE } from '../model/node.types';

interface TreeNodeViewProps {
  node: BTNodeDef;
  depth: number;
  selectedId: string | null;
  expandedIds: Set<string>;
  statusMap?: Map<string, NodeStatus>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onAddChild: (parentId: string, type: NodeType) => void;
  onDelete: (id: string) => void;
}

const NODE_ICONS: Record<string, string> = {
  selector:  '⊕',
  sequence:  '→',
  condition: '?',
  action:    '!',
  decorator: '◎',
};

const STATUS_COLOR: Record<string, string> = {
  success: '#4caf50',
  failure: '#f44336',
  running: '#ff9800',
  idle:    '#888',
};

const NODE_COLOR: Record<string, string> = {
  selector:  '#4a7cc7',
  sequence:  '#7c4ac7',
  condition: '#c7944a',
  action:    '#4ac77c',
  decorator: '#c74a7c',
};

export const TreeNodeView = ({
  node,
  depth,
  selectedId,
  expandedIds,
  statusMap,
  onSelect,
  onToggle,
  onAddChild,
  onDelete,
}: TreeNodeViewProps) => {
  const isSelected = node.id === selectedId;
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isComposite = node.type === NODE_TYPE.SELECTOR || node.type === NODE_TYPE.SEQUENCE || node.type === NODE_TYPE.DECORATOR;
  const status = statusMap?.get(node.id);
  const nodeColor = NODE_COLOR[node.type] ?? '#555';

  return (
    <div style={{ userSelect: 'none' }}>
      <div
        onClick={() => onSelect(node.id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 8px',
          paddingLeft: `${16 + depth * 20}px`,
          backgroundColor: isSelected ? '#2a4a7c' : 'transparent',
          borderLeft: isSelected ? '2px solid #4a9eff' : '2px solid transparent',
          cursor: 'pointer',
          borderRadius: '3px',
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#2a2a2a'; }}
        onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'; }}
      >
        {/* Expand toggle */}
        <span
          onClick={e => { e.stopPropagation(); if (hasChildren || isComposite) onToggle(node.id); }}
          style={{ color: '#888', fontSize: '10px', width: '12px', cursor: hasChildren || isComposite ? 'pointer' : 'default' }}
        >
          {isComposite ? (isExpanded ? '▼' : '▶') : ' '}
        </span>

        {/* Type badge */}
        <span style={{
          fontSize: '11px',
          fontWeight: 'bold',
          color: '#fff',
          backgroundColor: nodeColor,
          borderRadius: '3px',
          padding: '1px 5px',
          minWidth: '20px',
          textAlign: 'center',
        }}>
          {NODE_ICONS[node.type]}
        </span>

        {/* Label */}
        <span style={{ color: '#e0e0e0', fontSize: '13px', flex: 1 }}>
          {node.label}
        </span>

        {/* Key hint */}
        {(node.conditionKey || node.actionKey) && (
          <span style={{ color: '#888', fontSize: '11px', fontFamily: 'monospace' }}>
            {node.conditionKey ?? node.actionKey}
          </span>
        )}

        {/* Status dot */}
        {status && (
          <span style={{
            width: '8px', height: '8px',
            borderRadius: '50%',
            backgroundColor: STATUS_COLOR[status] ?? '#888',
            flexShrink: 0,
          }} title={status} />
        )}

        {/* Actions */}
        <span style={{ display: 'flex', gap: '4px', opacity: 0, transition: 'opacity 0.1s' }}
          className="node-actions"
          onMouseEnter={e => { (e.currentTarget as HTMLSpanElement).style.opacity = '1'; }}
        >
          {isComposite && (
            <span
              onClick={e => { e.stopPropagation(); onAddChild(node.id, NODE_TYPE.SEQUENCE); }}
              title="Add child node"
              style={{ color: '#4a9eff', cursor: 'pointer', fontSize: '14px', padding: '0 2px' }}
            >+</span>
          )}
          {node.id !== 'root' && (
            <span
              onClick={e => { e.stopPropagation(); onDelete(node.id); }}
              title="Delete node"
              style={{ color: '#f44336', cursor: 'pointer', fontSize: '14px', padding: '0 2px' }}
            >×</span>
          )}
        </span>
      </div>

      {/* Children */}
      {isExpanded && isComposite && (
        <div>
          {(node.children ?? []).map(child => (
            <TreeNodeView
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              statusMap={statusMap}
              onSelect={onSelect}
              onToggle={onToggle}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
