import React, { useState } from 'react';
import styles from './collapsible-panel.module.css';

interface CollapsiblePanelProps {
  title: string;
  children: React.ReactNode;
  initialState?: 'open' | 'closed';
}

export const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({ title, children, initialState = 'open' }) => {
  const [isOpen, setIsOpen] = useState(initialState === 'open');

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`${styles.panel} ${isOpen ? styles.open : styles.closed}`}>
      <div className={styles.header} onClick={togglePanel}>
        <h3>{title}</h3>
        <span className={styles.toggleIcon}>{isOpen ? '▼' : '▶'}</span>
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};
