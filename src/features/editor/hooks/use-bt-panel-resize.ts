import { useCallback } from 'react'

export const useBtPanelResize = (btPanelWidth: number, setBtPanelWidth: (w: number) => void) => {
  return useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = btPanelWidth;
    const onMove = (ev: MouseEvent) => {
      setBtPanelWidth(Math.max(180, Math.min(900, startW + (startX - ev.clientX))));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [btPanelWidth, setBtPanelWidth]);
};
