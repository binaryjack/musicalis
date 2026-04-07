import { BehaviorTreeEditor } from '../../../features/behavior-tree'

interface EditorBtPanelProps {
  width: number;
  collapsed: boolean;
  onCollapseToggle: () => void;
  onResizeStart: (e: React.MouseEvent) => void;
}

export const EditorBtPanel = function({ width, collapsed, onCollapseToggle, onResizeStart }: EditorBtPanelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', flexShrink: 0 }}>
      {/* Drag-resize handle */}
      <div
        onMouseDown={onResizeStart}
        style={{ width: '4px', cursor: 'col-resize', backgroundColor: '#333', flexShrink: 0, transition: 'background-color 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#4a9eff')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#333')}
      />
      <div style={{
        width: collapsed ? '28px' : `${width}px`,
        minWidth: collapsed ? '28px' : '180px',
        backgroundColor: '#1a1a1a',
        borderLeft: '1px solid #333',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.15s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 4px', backgroundColor: '#252525', borderBottom: '1px solid #333', flexShrink: 0 }}>
          <button
            onClick={onCollapseToggle}
            title={collapsed ? 'Expand panel' : 'Collapse panel'}
            style={{ background: 'none', border: 'none', color: '#4a9eff', cursor: 'pointer', fontSize: '12px', padding: '2px 4px', flexShrink: 0 }}
          >
            {collapsed ? '◀' : '▶'}
          </button>
          {!collapsed && <span style={{ fontSize: '11px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Behavior Tree</span>}
        </div>
        {!collapsed && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <BehaviorTreeEditor />
          </div>
        )}
      </div>
    </div>
  );
};
