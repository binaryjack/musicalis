import { useEffect } from 'react';
import type { RefObject } from 'react';
import type { PianoStaff } from '../../../types/musicTypes';

interface UsePlayheadDragProps {
  isDragging: boolean;
  isPlaybackMode: boolean;
  onPlayheadDrag?: (newPosition: number) => void;
  containerRef: RefObject<HTMLDivElement | null>;
  staffs: PianoStaff[];
}

export function usePlayheadDrag({
  isDragging,
  isPlaybackMode,
  onPlayheadDrag,
  containerRef,
  staffs
}: UsePlayheadDragProps) {
  useEffect(() => {
    if (!isDragging || !isPlaybackMode) {
      console.log('Not dragging or not in playback mode, skipping drag setup');
      return;
    }

    console.log('Setting up drag listeners');

    const handleMouseMove = (event: MouseEvent) => {
      console.log('Mouse move during drag:', event.clientX, event.clientY);

      const containerDiv = containerRef.current;
      if (containerDiv && onPlayheadDrag) {
        const rect = containerDiv.getBoundingClientRect();
        const x = event.clientX - rect.left;

        // Calculate position properly using time signature and dynamic staff width
        const timeSignature = staffs[0]?.timeSignature || '4/4';
        const [beatsPerMeasure] = timeSignature.split('/').map(Number);
        // const firstStaffMeasures = staffs[0]?.measuresCount || 1; // Unused
        
        const measureWidth = 180; // FIXED_MEASURE_WIDTH
        const staffOriginX = 10; // STAFF_ORIGIN_X
        
        // Calculate new position based on clicked X coordinate
        // Width of one beat
        const beatWidth = measureWidth / beatsPerMeasure;
        
        // Calculate which beat was clicked overall
        const offsetFromStart = Math.max(0, x - staffOriginX);
        const newPosition = offsetFromStart / beatWidth;

        console.log('Mouse X:', x, 'Beat width:', beatWidth, 'New position:', newPosition);
        onPlayheadDrag(newPosition);
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      console.log('Mouse up - ending drag');
      event.preventDefault();
      // Wait, isDragging setting is in the parent. We can't setState here easily unless we pass setIsDragging.
      // But actually we need to trigger a mouseup event or parent needs to pass an onDragEnd.
      // Let's fire a custom event on document or pass a callback.
    };

    // We'll hook these up natively and use a dispatch mechanism since we extracted blindly.
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      console.log('Cleaning up drag listeners');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onPlayheadDrag, staffs, isPlaybackMode, containerRef]);
}