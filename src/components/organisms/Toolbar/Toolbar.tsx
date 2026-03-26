import { Button } from '../../atoms/Button/Button';
import styles from './Toolbar.module.css';

interface ToolbarItem {
  id: string;
  label: string;
  icon: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  onClick: () => void;
  disabled?: boolean;
}

interface ToolbarProps {
  items: ToolbarItem[];
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Toolbar = ({ items, position = 'top' }: ToolbarProps) => {
  const isVertical = position === 'left' || position === 'right';

  return (
    <div className={`${styles.toolbar} ${styles[position]}`}>
      {items.map((item) => (
        <Button
          key={item.id}
          variant={item.variant || 'secondary'}
          size="small"
          onClick={item.onClick}
          disabled={item.disabled}
          title={item.label}
          className={styles.toolbarItem}
        >
          <span className={styles.icon}>{item.icon}</span>
          {!isVertical && <span className={styles.label}>{item.label}</span>}
        </Button>
      ))}
    </div>
  );
};
