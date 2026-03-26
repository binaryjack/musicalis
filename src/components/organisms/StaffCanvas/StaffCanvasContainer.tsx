import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { EditorMode } from '../../../types/enums';
import styles from './StaffCanvas.module.css';

interface StaffCanvasContainerProps {
  children: ReactNode;
  className?: string;
  mode: EditorMode;
}

export const StaffCanvasContainer = ({
  children,
  className = '',
  mode,
}: StaffCanvasContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Add mode-specific classes
    const modeClass = mode === EditorMode.DESIGN ? 'designMode' : 'playbackMode';
    container.classList.add(styles[modeClass]);

    return () => {
      container.classList.remove(styles.designMode, styles.playbackMode);
    };
  }, [mode]);

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className}`}
    >
      {children}
    </div>
  );
};