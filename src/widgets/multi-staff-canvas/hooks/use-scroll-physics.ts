import { useCallback } from 'react';

export function useScrollPhysics(width: number, playheadX: number) {
  const calculatePlayheadScrollState = useCallback(() => {
    const contentWidth = (width || 800) * 2; // Assuming 2x width for scrolling 
    const viewportWidth = width || 800;
    const centerOffset = viewportWidth / 2;

    let scrollState: 'free' | 'center-lock' | 'end-boundary';
    let scrollPosition: number;
    let visualPlayheadX: number;

    if (playheadX < centerOffset) {
      // STATE 1: Free Movement
      scrollState = 'free';
      scrollPosition = 0;
      visualPlayheadX = playheadX;
    } else if (playheadX <= (contentWidth - centerOffset)) {
      // STATE 2: Center-Lock
      scrollState = 'center-lock';
      scrollPosition = playheadX - centerOffset;
      visualPlayheadX = centerOffset;
    } else {
      // STATE 3: End Boundary
      scrollState = 'end-boundary';
      scrollPosition = contentWidth - viewportWidth;
      visualPlayheadX = playheadX - scrollPosition;
    }
    
    return { scrollState, scrollPosition, visualPlayheadX };
  }, [playheadX, width]);

  return { calculatePlayheadScrollState };
}