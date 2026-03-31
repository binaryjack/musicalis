import { useCallback, useEffect, useRef, useState } from 'react';
import type { PianoStaff } from '../../types/musicTypes';
import type { ProjectData } from '../../services/projectService';
import type { EditorMode } from '../../types/enums';

export interface MultiStaffCanvasProps {
  project?: ProjectData | null;
  staffs: PianoStaff[];
  width?: number;
  height?: number;
  playheadPosition?: number;
  mode?: EditorMode;
  selectedStaffId?: string;
  darkMode?: boolean;
  onStaffClick?: (staffId: string, position: { x: number; y: number; pitch?: string; beat?: number }) => void;
  onNoteClick?: (noteId: string, staffId: string) => void;
  onNoteDelete?: (noteId: string, staffId: string) => void;
  onNoteMove?: (noteId: string, staffId: string, newPosition: number) => void;
  onPlayheadDrag?: (newPosition: number) => void;
  onAddBar?: (staffId: string, afterBarIndex: number) => void;
  onRemoveBar?: (staffId: string, barIndex: number) => void;
}

export const MultiStaffCanvas = function(props: MultiStaffCanvasProps) {
  const {
    staffs,
    width,
    playheadPosition,
    mode = 'design',
    selectedStaffId,
    darkMode,
    onPlayheadDrag,
    onAddBar,
    onRemoveBar,
  } = props;

  // Only show playhead and allow dragging in playback mode
  const isPlaybackMode = mode === 'playback';
  const showPlayhead = isPlaybackMode && playheadPosition !== undefined;

  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const [dynamicWidth, setDynamicWidth] = useState(width || 800);
  const [playheadX, setPlayheadX] = useState(0);
  const [viewportScrollX, setViewportScrollX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredAddBar, setHoveredAddBar] = useState<{staffId: string, barIndex: number} | null>(null);
  const [hoveredRemoveBar, setHoveredRemoveBar] = useState<{staffId: string, barIndex: number} | null>(null);
  const staffHeight = 120;
  const staffSpacing = 20;
  const fixedMeasureWidth = 180; // Fixed width per measure
  const staffOriginX = 10;
  
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
  
  useEffect(() => {
    if (!containerRef.current || !staffs.length) return;
    
    // Calculate the maximum width needed for all staffs (considering different time signatures)
    let maxWidth = 0;
    staffs.forEach(staff => {
      const measuresCount = staff.measuresCount || 1;
      const measureWidth = fixedMeasureWidth;
      const staffWidth = 40 + (measuresCount * measureWidth) + 100;
      maxWidth = Math.max(maxWidth, staffWidth);
    });
    
    const calculatedWidth = maxWidth;
    const totalHeight = staffs.length * (staffHeight + staffSpacing);
    
    console.log('Dynamic canvas dimensions:', calculatedWidth, 'x', totalHeight + 40);
    setDynamicWidth(calculatedWidth);
    
    containerRef.current.innerHTML = '';
    
    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(calculatedWidth, totalHeight + 40);
    rendererRef.current = renderer;
    
    const context = renderer.getContext();
    
    // Apply dark mode styling
    if (darkMode) {
      // Set dark background for the entire canvas
      const svg = containerRef.current.querySelector('svg');
      if (svg) {
        svg.style.backgroundColor = '#1a1a1a';
      }
      
      // Set light colors for staff lines and symbols
      context.setStrokeStyle('#e0e0e0');
      context.setFillStyle('#f0f0f0');
    }
    
    staffs.forEach((staff, staffIndex) => {
      if (!staff.visible) return;
      
      const yPosition = 40 + (staffIndex * (staffHeight + staffSpacing));
      const measuresPerStaff = staff.measuresCount || 1; // Use staff's measure count
      const [beatsPerMeasure, beatValue] = staff.timeSignature.split('/').map(Number);
      const measureWidth = fixedMeasureWidth;
      
      // Add staff label with dark mode support
      context.setFillStyle(darkMode ? '#e0e0e0' : '#333');
      context.setFont('12px Arial');
      context.fillText(staff.name, 15, yPosition - 10);

      // Render one stave per measure so clicking + adds a true new bar, not stretched spacing.
      for (let measureIndex = 0; measureIndex < measuresPerStaff; measureIndex++) {
        const measureX = staffOriginX + (measureIndex * measureWidth);
        const measureStave = new Stave(measureX, yPosition, measureWidth);

        if (measureIndex === 0) {
          measureStave.addClef(staff.clef).addTimeSignature(staff.timeSignature);
          if (staff.keySignature !== 'C') {
            measureStave.addKeySignature(staff.keySignature);
          }
        }

        measureStave.setContext(context).draw();

        const notesInMeasure = staff.notes
          .filter(note => (note.barNumber || 1) === (measureIndex + 1))
          .filter(note => !note.colorId || staff.colorMapping.colors.find(c => c.id === note.colorId));

        if (notesInMeasure.length > 0) {
          const vexNotes = notesInMeasure.map(note => {
            const vexNote = new StaveNote({
              clef: staff.clef,
              keys: [`${note.pitch.toLowerCase()}/4`],
              duration: note.duration === 'quarter' ? 'q' :
                       note.duration === 'half' ? 'h' :
                       note.duration === 'whole' ? 'w' :
                       note.duration === 'eighth' ? '8' : 'q'
            });

            // Position stem properly - move it slightly left for better alignment
            vexNote.setStemDirection(-1); // -1 = stem down, 1 = stem up, 0 = auto

            const colorRule = note.colorId ? staff.colorMapping.colors.find(c => c.id === note.colorId) : null;
            if (colorRule) {
              vexNote.setStyle({ fillStyle: colorRule.hex, strokeStyle: colorRule.hex });
            } else if (darkMode) {
              vexNote.setStyle({ fillStyle: '#f0f0f0', strokeStyle: '#f0f0f0' });
            }

            return vexNote;
          });

          const voice = new Voice({ numBeats: beatsPerMeasure, beatValue });
          voice.setStrict(false);
          voice.addTickables(vexNotes);
          new Formatter().joinVoices([voice]).formatToStave([voice], measureStave);
          voice.draw(context, measureStave);
        }
      }
      
      // Draw final bar line (double line at the end of all measures)
      const finalBarX = staffOriginX + (measuresPerStaff * measureWidth);
      context.setLineWidth(2);
      context.beginPath();
      context.moveTo(finalBarX - 1, yPosition + 20);
      context.lineTo(finalBarX - 1, yPosition + 80);
      context.stroke();

      // Draw measure controls at the END of the entire staff (not per beat)
      const staffEndX = staffOriginX + (measuresPerStaff * measureWidth);
      
      console.log('Rendering buttons for staff:', staff.id, 'at staffEndX:', staffEndX, 'yPosition:', yPosition);
      
      // Add measure button (+ at end of staff)
      const isAddHovered = hoveredAddBar?.staffId === staff.id;
      const addButtonSize = isAddHovered ? 16 : 12;
      const addButtonX = staffEndX + 10;
      const addButtonY = yPosition + (staffHeight / 2);
      
      console.log('Add button at:', addButtonX, addButtonY, 'size:', addButtonSize, 'hovered:', isAddHovered);
      
      context.setFillStyle(darkMode ? (isAddHovered ? '#4a9eff' : '#666') : (isAddHovered ? '#007bff' : '#999'));
      context.beginPath();
      context.arc(addButtonX, addButtonY, addButtonSize / 2, 0, Math.PI * 2, false);
      context.fill();
      
      // + symbol
      context.setStrokeStyle('#fff');
      context.setLineWidth(2);
      context.beginPath();
      context.moveTo(addButtonX - 3, addButtonY);
      context.lineTo(addButtonX + 3, addButtonY);
      context.moveTo(addButtonX, addButtonY - 3);
      context.lineTo(addButtonX, addButtonY + 3);
      context.stroke();
      
      // Remove measure button (- at end of staff) - only show if more than 1 measure exists
      if (measuresPerStaff > 1) {
        const isRemoveHovered = hoveredRemoveBar?.staffId === staff.id;
        const removeButtonSize = isRemoveHovered ? 14 : 10;
        const removeButtonX = staffEndX + 35;
        const removeButtonY = yPosition + (staffHeight / 2);
        
        console.log('Remove button at:', removeButtonX, removeButtonY, 'size:', removeButtonSize, 'hovered:', isRemoveHovered);
        
        context.setFillStyle(darkMode ? (isRemoveHovered ? '#ff6b6b' : '#666') : (isRemoveHovered ? '#dc3545' : '#999'));
        context.beginPath();
        context.arc(removeButtonX, removeButtonY, removeButtonSize / 2, 0, Math.PI * 2, false);
        context.fill();
        
        // - symbol
        context.setStrokeStyle('#fff');
        context.setLineWidth(2);
        context.beginPath();
        context.moveTo(removeButtonX - 3, removeButtonY);
        context.lineTo(removeButtonX + 3, removeButtonY);
        context.stroke();
      }
    });
    
    // Draw playhead - only visible in playback mode
    if (showPlayhead && isPlaybackMode) {
      // Get time signature from first staff or default to 4/4
      const timeSignature = staffs[0]?.timeSignature || '4/4';
      const [beatsPerMeasure] = timeSignature.split('/').map(Number);
      
      const measureWidth = fixedMeasureWidth;
      const beatWidth = measureWidth / beatsPerMeasure;
      const playheadX = staffOriginX + (playheadPosition * beatWidth);
      
      // Different visual style when dragging
      context.setStrokeStyle(isDragging ? '#ff6666' : '#ff0000');
      context.setLineWidth(isDragging ? 3 : 2);
      context.beginPath();
      context.moveTo(playheadX, 20);
      context.lineTo(playheadX, totalHeight + 20);
      context.stroke();
      
      // Add draggable indicator at top
      context.setFillStyle(isDragging ? '#ff6666' : '#ff0000');
      context.beginPath();
      context.arc(playheadX, 15, 5, 0, Math.PI * 2, false);
      context.fill();
    }
    
    // ADD EVENT LISTENERS AFTER VEXFLOW RENDERING IS COMPLETE
    const containerDiv = containerRef.current;
    if (containerDiv) {
      console.log('Container div found, adding event listeners');
      
      const handleMouseDown = (event: MouseEvent) => {
        console.log('Mouse down detected at:', event.clientX, event.clientY);
        event.preventDefault();
        
        const rect = containerDiv.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        console.log('Relative coordinates:', x, y);
        
        // Check for bar control clicks first
        let handleByBarControl = false;
        
        staffs.forEach((staff, staffIndex) => {
          if (!staff.visible || handleByBarControl) return;
          
          const staffY = 40 + (staffIndex * (staffHeight + staffSpacing));
          const measuresPerStaff = staff.measuresCount || 1;
          const staffEndX = staffOriginX + (measuresPerStaff * fixedMeasureWidth);
          
          // Check add button click (at end of staff)
          const addButtonX = staffEndX + 10;
          const addButtonY = staffY + (staffHeight / 2);
          const addDistance = Math.sqrt((x - addButtonX) ** 2 + (y - addButtonY) ** 2);
          
          console.log('Add button click check:', { x, y, addButtonX, addButtonY, addDistance });
          
          if (addDistance < 15 && onAddBar) { // Increased hit area
            console.log('Add measure clicked for staff:', staff.id);
            onAddBar(staff.id, measuresPerStaff - 1); // Add after the last measure
            handleByBarControl = true;
            return;
          }
          
          // Check remove button click (only if more than 1 measure)
          if (measuresPerStaff > 1) {
            const removeButtonX = staffEndX + 35;
            const removeButtonY = staffY + (staffHeight / 2);
            const removeDistance = Math.sqrt((x - removeButtonX) ** 2 + (y - removeButtonY) ** 2);
            
            console.log('Remove button click check:', { x, y, removeButtonX, removeButtonY, removeDistance });
            
            if (removeDistance < 15 && onRemoveBar) { // Increased hit area
              console.log('Remove measure clicked for staff:', staff.id);
              onRemoveBar(staff.id, measuresPerStaff - 1); // Remove the last measure
              handleByBarControl = true;
              return;
            }
          }
        });
        
        // If bar control was clicked, don't handle as drag/staff click
        if (handleByBarControl) {
          return;
        }
        
        // Handle playhead dragging only when clicking near the playhead line - ONLY IN PLAYBACK MODE
        if (isPlaybackMode && playheadPosition !== undefined) {
          const timeSignature = staffs[0]?.timeSignature || '4/4';
          const [beatsPerMeasure] = timeSignature.split('/').map(Number);
          const beatWidth = fixedMeasureWidth / beatsPerMeasure;
          const currentPlayheadX = staffOriginX + (playheadPosition * beatWidth);
          const nearPlayhead = Math.abs(x - currentPlayheadX) < 10;

          if (!nearPlayhead) {
            return;
          }

          console.log('Starting drag mode');
          setIsDragging(true);
          if (onPlayheadDrag) {
            const firstStaffMeasures = staffs[0]?.measuresCount || 1;
            const totalBeats = firstStaffMeasures * beatsPerMeasure;
            const newPosition = Math.max(0, Math.min(totalBeats, (x - staffOriginX) / beatWidth));
            console.log('Beat width:', beatWidth, 'Calculated position:', newPosition);
            onPlayheadDrag(newPosition);
          }
        }
      };
      
      const handleMouseMove = (event: MouseEvent) => {
        if (isDragging) return; // Don't handle hover during drag
        
        const rect = containerDiv.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Check for bar control hovers
        let foundAddHover = null;
        let foundRemoveHover = null;
        
        staffs.forEach((staff, staffIndex) => {
          if (!staff.visible) return;
          
          const staffY = 40 + (staffIndex * (staffHeight + staffSpacing));
          const measuresPerStaff = staff.measuresCount || 1;
          const staffEndX = staffOriginX + (measuresPerStaff * fixedMeasureWidth);
          
          // Check add button hover (at end of staff)
          const addButtonX = staffEndX + 10;
          const addButtonY = staffY + (staffHeight / 2);
          const addDistance = Math.sqrt((x - addButtonX) ** 2 + (y - addButtonY) ** 2);
          
          console.log('Add button check:', { x, y, addButtonX, addButtonY, addDistance });
          
          if (addDistance < 15) { // Increased hit area
            foundAddHover = { staffId: staff.id, barIndex: 0 };
            console.log('Add button hovered!');
          }
          
          // Check remove button hover - only if more than 1 measure
          if (measuresPerStaff > 1) {
            const removeButtonX = staffEndX + 35;
            const removeButtonY = staffY + (staffHeight / 2);
            const removeDistance = Math.sqrt((x - removeButtonX) ** 2 + (y - removeButtonY) ** 2);
            
            console.log('Remove button check:', { x, y, removeButtonX, removeButtonY, removeDistance });
            
            if (removeDistance < 15) { // Increased hit area
              foundRemoveHover = { staffId: staff.id, barIndex: 0 };
              console.log('Remove button hovered!');
            }
          }
        });
        
        setHoveredAddBar(foundAddHover);
        setHoveredRemoveBar(foundRemoveHover);
        
        console.log('Hover state updated:', { foundAddHover, foundRemoveHover });
      };
      
      const handleContextMenu = (event: MouseEvent) => {
        console.log('Context menu prevented');
        event.preventDefault();
        event.stopPropagation();
      };
      
      // Add new listeners to container div
      containerDiv.addEventListener('mousedown', handleMouseDown);
      containerDiv.addEventListener('mousemove', handleMouseMove);
      containerDiv.addEventListener('contextmenu', handleContextMenu);
      
      console.log('Event listeners attached to container div');

      return () => {
        containerDiv.removeEventListener('mousedown', handleMouseDown);
        containerDiv.removeEventListener('mousemove', handleMouseMove);
        containerDiv.removeEventListener('contextmenu', handleContextMenu);
      };
    } else {
      console.log('No container div found');
    }

    return;
  }, [staffs, width, playheadPosition, selectedStaffId, darkMode, onAddBar, onRemoveBar, onPlayheadDrag, isDragging, hoveredAddBar, hoveredRemoveBar, isPlaybackMode]);

  // Separate effect for document-level drag handling - ONLY ACTIVE IN PLAYBACK MODE
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
        const firstStaffMeasures = staffs[0]?.measuresCount || 1;
        const totalBeats = firstStaffMeasures * beatsPerMeasure;
        const beatWidth = fixedMeasureWidth / beatsPerMeasure;
        const newPosition = Math.max(0, Math.min(totalBeats, (x - staffOriginX) / beatWidth));
        
        console.log('Mouse X:', x, 'Beat width:', beatWidth, 'New position:', newPosition);
        onPlayheadDrag(newPosition);
      }
    };
    
    const handleMouseUp = (event: MouseEvent) => {
      console.log('Mouse up - ending drag');
      event.preventDefault();
      setIsDragging(false);
    };
    
    // Add events to document for global drag handling
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      console.log('Cleaning up drag listeners');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onPlayheadDrag, staffs, isPlaybackMode]);
  
  // Update playhead position based on playback
  useEffect(() => {
    if (playheadPosition !== undefined) {
      const newX = (playheadPosition / 100) * (width || 800);
      setPlayheadX(newX);
      
      const { scrollPosition } = calculatePlayheadScrollState();
      setViewportScrollX(scrollPosition);
    }
  }, [playheadPosition, width, calculatePlayheadScrollState]);
  
  return (
    <div 
      className="multi-staff-canvas" 
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      style={{ 
        width: dynamicWidth,
        height: staffs.length * (staffHeight + staffSpacing) + 80,
        border: darkMode ? '1px solid #444' : '1px solid #ccc',
        backgroundColor: darkMode ? '#1a1a1a' : '#fff',
        overflow: 'auto',
        position: 'relative',
        transform: `translateX(-${viewportScrollX}px)`,
        transition: 'transform 0.1s ease-out',
        margin: 0,
        padding: 0,
        cursor: isDragging ? 'grabbing' : 'default',
        userSelect: 'none'
      }}
    />
  );
};