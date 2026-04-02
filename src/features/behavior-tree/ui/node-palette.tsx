import { NODE_TYPE } from '../model/node.types';
import type { NodeType } from '../model/node.types';

interface NodePaletteProps {
  onAdd: (type: NodeType) => void;
  selectedParentId: string | null;
}

const PALETTE_ITEMS: { type: NodeType; icon: string; label: string; desc: string; color: string }[] = [
  { type: NODE_TYPE.SELECTOR,  icon: '⊕', label: 'Selector',  desc: 'Try children in order, return first SUCCESS', color: '#4a7cc7' },
  { type: NODE_TYPE.SEQUENCE,  icon: '→', label: 'Sequence',  desc: 'Run all children in order, fail on first FAILURE', color: '#7c4ac7' },
  { type: NODE_TYPE.CONDITION, icon: '?', label: 'Condition', desc: 'Checks a state — SUCCESS or FAILURE', color: '#c7944a' },
  { type: NODE_TYPE.ACTION,    icon: '!', label: 'Action',    desc: 'Executes a command — SUCCESS / FAILURE / RUNNING', color: '#4ac77c' },
  { type: NODE_TYPE.DECORATOR, icon: '◎', label: 'Decorator', desc: 'Wraps one child (invert, repeat, throttle)', color: '#c74a7c' },
];

export const NodePalette = ({ onAdd, selectedParentId }: NodePaletteProps) => (
  <div style={{ padding: '12px', borderTop: '1px solid #444' }}>
    <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {selectedParentId ? `Add child to selected node` : 'Select a composite node to add children'}
    </div>
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {PALETTE_ITEMS.map(item => (
        <button
          key={item.type}
          disabled={!selectedParentId}
          onClick={() => selectedParentId && onAdd(item.type)}
          title={item.desc}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            backgroundColor: selectedParentId ? item.color : '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedParentId ? 'pointer' : 'not-allowed',
            fontSize: '12px',
            opacity: selectedParentId ? 1 : 0.4,
            transition: 'opacity 0.1s, transform 0.1s',
          }}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  </div>
);
