
export interface ToolbarItem {
  id: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  onClick?: () => void;
  disabled?: boolean;
}

export interface ToolbarProps {
  items?: ToolbarItem[];
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  children?: React.ReactNode;
}

export const Toolbar = function(props: ToolbarProps) { 
  return (
    <div className="toolbar">
      {props.items?.map(item => (
        <button 
          key={item.id}
          className={`toolbar-item ${item.variant || 'secondary'}`}
          onClick={item.onClick}
          disabled={item.disabled}
        >
          {item.icon && <span className="icon">{item.icon}</span>}
          <span>{item.label}</span>
        </button>
      ))}
      {props.children}
    </div>
  ); 
};