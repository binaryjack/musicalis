interface ToolboxButtonProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  onContextMenu?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
  className?: string;
}

export const ToolboxButton = function({ active, onClick, icon, label, onContextMenu, children, className }: ToolboxButtonProps) {
  return (
    <button
      className={className}
      onClick={onClick}
      onContextMenu={onContextMenu}
      title={label}
      style={{
        width: '32px', height: '32px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: active ? '#4a9eff' : '#333',
        color: active ? '#fff' : '#ccc',
        border: '1px solid',
        borderColor: active ? '#2d88ff' : '#444',
        borderRadius: '4px', cursor: 'pointer', fontSize: '18px',
        padding: 0,
        boxShadow: active ? '0 0 0 2px rgba(74,158,255,0.3)' : 'none',
        transition: 'all 0.1s ease',
        position: 'relative',
      }}
    >
      {icon}
      {children}
    </button>
  );
};
