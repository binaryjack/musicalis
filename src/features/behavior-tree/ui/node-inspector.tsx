import { useState, useEffect } from 'react';
import type { BTNodeDef, NodeType } from '../model/node.types';
import { NODE_TYPE } from '../model/node.types';
import { defaultRegistry } from '../lib/bt-registry';

interface NodeInspectorProps {
  node: BTNodeDef | null;
  onChange: (updated: BTNodeDef) => void;
  onDelete: (id: string) => void;
}

const ALL_NODE_TYPES: NodeType[] = [
  NODE_TYPE.SELECTOR,
  NODE_TYPE.SEQUENCE,
  NODE_TYPE.CONDITION,
  NODE_TYPE.ACTION,
  NODE_TYPE.DECORATOR,
];

const inputStyle = {
  width: '100%',
  padding: '6px 8px',
  backgroundColor: '#1a1a1a',
  color: '#e0e0e0',
  border: '1px solid #555',
  borderRadius: '4px',
  fontSize: '13px',
  boxSizing: 'border-box' as const,
};

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  color: '#888',
  marginBottom: '4px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

export const NodeInspector = ({ node, onChange, onDelete }: NodeInspectorProps) => {
  const [draft, setDraft] = useState<BTNodeDef | null>(node);

  useEffect(() => { setDraft(node); }, [node]);

  if (!draft) {
    return (
      <div style={{ padding: '16px', color: '#666', fontSize: '13px' }}>
        Select a node to inspect
      </div>
    );
  }

  const patch = (partial: Partial<BTNodeDef>) => {
    const updated = { ...draft, ...partial };
    setDraft(updated);
    onChange(updated);
  };

  const patchParam = (key: string, value: unknown) => {
    patch({ params: { ...(draft.params ?? {}), [key]: value } });
  };

  const conditionKeys = Object.keys(defaultRegistry.conditions);
  const actionKeys = Object.keys(defaultRegistry.actions);
  const selectedCondition = draft.conditionKey ? defaultRegistry.conditions[draft.conditionKey] : null;
  const selectedAction = draft.actionKey ? defaultRegistry.actions[draft.actionKey] : null;
  const paramDefs = selectedCondition?.params ?? selectedAction?.params ?? [];

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', height: '100%' }}>
      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f0f0f0', borderBottom: '1px solid #444', paddingBottom: '8px' }}>
        Node Inspector
      </div>

      {/* Label */}
      <div>
        <label style={labelStyle}>Label</label>
        <input
          style={inputStyle}
          value={draft.label}
          onChange={e => patch({ label: e.target.value })}
        />
      </div>

      {/* Type */}
      <div>
        <label style={labelStyle}>Type</label>
        <select
          style={inputStyle}
          value={draft.type}
          onChange={e => patch({ type: e.target.value as NodeType, conditionKey: undefined, actionKey: undefined })}
          disabled={draft.id === 'root'}
        >
          {ALL_NODE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Description */}
      <div>
        <label style={labelStyle}>Description</label>
        <input
          style={inputStyle}
          value={draft.description ?? ''}
          onChange={e => patch({ description: e.target.value })}
          placeholder="Optional note…"
        />
      </div>

      {/* Condition Key */}
      {draft.type === NODE_TYPE.CONDITION && (
        <div>
          <label style={labelStyle}>Condition</label>
          <select
            style={inputStyle}
            value={draft.conditionKey ?? ''}
            onChange={e => patch({ conditionKey: e.target.value })}
          >
            <option value="">— select condition —</option>
            {conditionKeys.map(k => (
              <option key={k} value={k}>{defaultRegistry.conditions[k].label}</option>
            ))}
          </select>
          {selectedCondition && (
            <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
              {selectedCondition.description}
            </div>
          )}
        </div>
      )}

      {/* Action Key */}
      {draft.type === NODE_TYPE.ACTION && (
        <div>
          <label style={labelStyle}>Action</label>
          <select
            style={inputStyle}
            value={draft.actionKey ?? ''}
            onChange={e => patch({ actionKey: e.target.value })}
          >
            <option value="">— select action —</option>
            {actionKeys.map(k => (
              <option key={k} value={k}>{defaultRegistry.actions[k].label}</option>
            ))}
          </select>
          {selectedAction && (
            <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
              {selectedAction.description}
            </div>
          )}
        </div>
      )}

      {/* Decorator Type */}
      {draft.type === NODE_TYPE.DECORATOR && (
        <div>
          <label style={labelStyle}>Decorator Type</label>
          <select
            style={inputStyle}
            value={draft.decoratorType ?? ''}
            onChange={e => patch({ decoratorType: e.target.value as BTNodeDef['decoratorType'] })}
          >
            <option value="">— select —</option>
            <option value="invert">Invert</option>
            <option value="repeat">Repeat</option>
            <option value="throttle">Throttle</option>
          </select>
        </div>
      )}

      {/* Params */}
      {paramDefs.length > 0 && (
        <div>
          <label style={labelStyle}>Parameters</label>
          {paramDefs.map(p => (
            <div key={p.key} style={{ marginBottom: '8px' }}>
              <label style={{ ...labelStyle, color: '#aaa' }}>{p.label}</label>
              {p.type === 'select' ? (
                <select
                  style={inputStyle}
                  value={String(draft.params?.[p.key] ?? p.defaultValue ?? '')}
                  onChange={e => patchParam(p.key, e.target.value)}
                >
                  {p.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : p.type === 'boolean' ? (
                <input
                  type="checkbox"
                  checked={Boolean(draft.params?.[p.key] ?? p.defaultValue)}
                  onChange={e => patchParam(p.key, e.target.checked)}
                />
              ) : (
                <input
                  style={inputStyle}
                  type={p.type === 'number' ? 'number' : 'text'}
                  value={String(draft.params?.[p.key] ?? p.defaultValue ?? '')}
                  onChange={e => patchParam(p.key, p.type === 'number' ? Number(e.target.value) : e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete */}
      {draft.id !== 'root' && (
        <button
          onClick={() => onDelete(draft.id)}
          style={{
            marginTop: 'auto',
            padding: '8px',
            backgroundColor: '#5a1a1a',
            color: '#ff6b6b',
            border: '1px solid #8a2a2a',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          🗑 Delete Node
        </button>
      )}
    </div>
  );
};
