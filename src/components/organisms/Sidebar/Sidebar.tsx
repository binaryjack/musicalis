import styles from './Sidebar.module.css';

interface SidebarProps {
  title?: string;
  children: React.ReactNode;
  position?: 'left' | 'right';
  collapsible?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar = ({
  title,
  children,
  position = 'left',
  collapsible = false,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) => {
  return (
    <aside
      className={`${styles.sidebar} ${styles[position]} ${isCollapsed ? styles.collapsed : ''}`}
    >
      {title && (
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          {collapsible && (
            <button
              className={styles.toggleBtn}
              onClick={onToggleCollapse}
              aria-label="Toggle sidebar"
            >
              {isCollapsed ? '▶' : '◀'}
            </button>
          )}
        </div>
      )}

      <div className={styles.content}>{children}</div>
    </aside>
  );
};
