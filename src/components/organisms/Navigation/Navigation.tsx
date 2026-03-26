import { Button } from '../../atoms/Button/Button';
import styles from './Navigation.module.css';

interface NavigationProps {
  items: Array<{ id: string; label: string; icon?: string }>;
  activeItemId: string | null;
  onSelectItem: (itemId: string) => void;
  orientation?: 'vertical' | 'horizontal';
}

export const Navigation = ({
  items,
  activeItemId,
  onSelectItem,
  orientation = 'vertical',
}: NavigationProps) => {
  return (
    <nav className={`${styles.nav} ${styles[orientation]}`}>
      {items.map((item) => (
        <Button
          key={item.id}
          variant={activeItemId === item.id ? 'primary' : 'secondary'}
          size="small"
          onClick={() => onSelectItem(item.id)}
          className={styles.navItem}
        >
          {item.icon && <span className={styles.icon}>{item.icon}</span>}
          <span>{item.label}</span>
        </Button>
      ))}
    </nav>
  );
};
