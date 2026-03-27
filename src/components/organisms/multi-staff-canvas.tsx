import { useEffect, useRef, useState } from 'react';
import { Stave, StaveNote, Formatter, Renderer, Voice } from 'vexflow';
import type { PianoStaff } from '../../types/musicTypes';
import type { ProjectData } from '../../services/projectService';

export interface MultiStaffCanvasProps {
  project?: ProjectData | null;
  staffs: PianoStaff[];
  width?: number;
  height?: number;
  playheadPosition?: number;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const [dynamicWidth, setDynamicWidth] = useState(props.width || 800);
  const [playheadX, setPlayheadX] = useState(0);
  const [viewportScrollX, setViewportScrollX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredAddBar, setHoveredAddBar] = useState<{staffId: string, barIndex: number} | null>(null);
  const [hoveredRemoveBar, setHoveredRemoveBar] = useState<{staffId: string, barIndex: number} | null>(null);
  const staffHeight = 120;
  const staffSpacing = 20;
  const fixedMeasureWidth = 180; // Fixed width per measure
  
  const calculatePlayheadScrollState = () => {
    const contentWidth = (props.width || 800) * 2; // Assuming 2x width for scrolling
    const viewportWidth = props.width || 800;
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
  };
  
  useEffect(() => {
    if (!containerRef.current || !props.staffs.length) return;
    
    // Calculate the maximum width needed for all staffs (considering different time signatures)
    let maxWidth = 0;
    props.staffs.forEach(staff => {
      const measuresCount = staff.measuresCount || 4;
      const [beatsPerMeasure] = staff.timeSignature.split('/').map(Number);
      const measureWidth = fixedMeasureWidth * (beatsPerMeasure / 4);
      const staffWidth = 40 + (measuresCount * measureWidth) + 100;
      maxWidth = Math.max(maxWidth, staffWidth);
    });
    
    const calculatedWidth = maxWidth;
    const totalHeight = props.staffs.length * (staffHeight + staffSpacing);
    
    console.log('Dynamic canvas dimensions:', calculatedWidth, 'x', totalHeight + 40);
    setDynamicWidth(calculatedWidth);
    
    containerRef.current.innerHTML = '';
    
    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(calculatedWidth, totalHeight + 40);
    rendererRef.current = renderer;
    
    const context = renderer.getContext();
    
    // Apply dark mode styling
    if (props.darkMode) {
      // Set dark background for the entire canvas
      const svg = containerRef.current.querySelector('svg');
      if (svg) {
        svg.style.backgroundColor = '#1a1a1a';
      }
      
      // Set light colors for staff lines and symbols
      context.setStrokeStyle('#e0e0e0');
      context.setFillStyle('#f0f0f0');
    }
    
    props.staffs.forEach((staff, staffIndex) => {
      if (!staff.visible) return;
      
      const yPosition = 40 + (staffIndex * (staffHeight + staffSpacing));
      const measuresPerStaff = staff.measuresCount || 4; // Use staff's measure count
      // Calculate measure width based on time signature
      const [beatsInMeasure] = staff.timeSignature.split('/').map(Number);
      const adjustedMeasureWidth = fixedMeasureWidth * (beatsInMeasure / 4); // Adjust width based on beats per measure
      const staffWidth = 20 + (measuresPerStaff * adjustedMeasureWidth); // Dynamic staff width based on measures
      const stave = new Stave(10, yPosition, staffWidth);
      
      // Add clef and time signature
      stave.addClef(staff.clef).addTimeSignature(staff.timeSignature);
      if (staff.keySignature !== 'C') {
        stave.addKeySignature(staff.keySignature);
      }
      
      stave.setContext(context).draw();
      
      // Draw bar lines to separate measures (removed old beat separator code)
      const [beatsInThisMeasure] = staff.timeSignature.split('/').map(Number);
      const thisMeasureWidth = fixedMeasureWidth * (beatsInThisMeasure / 4); // Adjust for time signature
      
      context.setStrokeStyle(props.darkMode ? '#e0e0e0' : '#000');
      context.setLineWidth(1);
      
      // Only draw measure separators, not beat separators
      for (let measureIndex = 1; measureIndex < measuresPerStaff; measureIndex++) {
        const barLineX = 20 + (measureIndex * thisMeasureWidth);
        context.beginPath();
        context.moveTo(barLineX, yPosition);
        context.lineTo(barLineX, yPosition + 80);
        context.stroke();
      }
      
      // Add staff label with dark mode support
      context.setFillStyle(props.darkMode ? '#e0e0e0' : '#333');
      context.setFont('12px Arial');
      context.fillText(staff.name, 15, yPosition - 10);
      
      // Render notes for this staff
      const staffNotes = staff.notes.filter(note => !note.colorId || staff.colorMapping.colors.find(c => c.id === note.colorId));
      
      if (staffNotes.length > 0) {
        const vexNotes = staffNotes.map(note => {
          const vexNote = new StaveNote({
            clef: staff.clef,
            keys: [`${note.pitch.toLowerCase()}/4`],
            duration: note.duration === 'quarter' ? 'q' :
                     note.duration === 'half' ? 'h' :
                     note.duration === 'whole' ? 'w' :
                     note.duration === 'eighth' ? '8' : 'q'
          });
          
          // Apply color if mapped
          const colorRule = note.colorId ? staff.colorMapping.colors.find(c => c.id === note.colorId) : null;
          if (colorRule) {
            vexNote.setStyle({ fillStyle: colorRule.hex, strokeStyle: colorRule.hex });
          } else if (props.darkMode) {
            // Default light color for dark mode
            vexNote.setStyle({ fillStyle: '#f0f0f0', strokeStyle: '#f0f0f0' });
          }
          
          return vexNote;
        });
        
        const voice = new Voice({ 
          numBeats: parseInt(staff.timeSignature.split('/')[0]), 
          beatValue: parseInt(staff.timeSignature.split('/')[1]) 
        });
        voice.addTickables(vexNotes);
        
        new Formatter().joinVoices([voice]).format([voice], (props.width || 800) - 100);
        voice.draw(context, stave);
      }
      
      // Staff selection indication removed (no thick border)

      // Draw measure bar lines (vertical lines separating complete measures, not beats)
      (context as any).setStrokeStyle(props.darkMode ? '#888' : '#444');
      (context as any).setLineWidth(1);
      
      // Draw bar lines between measures (not between beats)
      for (let measureIndex = 1; measureIndex < measuresPerStaff; measureIndex++) {
        const barLineX = 20 + (measureIndex * fixedMeasureWidth);
        (context as any).beginPath();
        (context as any).moveTo(barLineX, yPosition + 20);
        (context as any).lineTo(barLineX, yPosition + 80);
        (context as any).stroke();
      }
      
      // Draw final bar line (double line at the end of all measures)
      const finalBarX = 20 + (measuresPerStaff * fixedMeasureWidth);
      (context as any).setLineWidth(2);
      (context as any).beginPath();
      (context as any).moveTo(finalBarX - 1, yPosition + 20);
      (context as any).lineTo(finalBarX - 1, yPosition + 80);
      (context as any).stroke();

      // Draw measure controls at the END of the entire staff (not per beat)
      const staffEndX = 20 + (measuresPerStaff * fixedMeasureWidth);
      
      console.log('Rendering buttons for staff:', staff.id, 'at staffEndX:', staffEndX, 'yPosition:', yPosition);
      
      // Add measure button (+ at end of staff)
      const isAddHovered = hoveredAddBar?.staffId === staff.id;
      const addButtonSize = isAddHovered ? 16 : 12;
      const addButtonX = staffEndX + 10;
      const addButtonY = yPosition + (staffHeight / 2);
      
      console.log('Add button at:', addButtonX, addButtonY, 'size:', addButtonSize, 'hovered:', isAddHovered);
      
      context.setFillStyle(props.darkMode ? (isAddHovered ? '#4a9eff' : '#666') : (isAddHovered ? '#007bff' : '#999'));
      context.beginPath();
      (context as any).arc(addButtonX, addButtonY, addButtonSize / 2, 0, Math.PI * 2);
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
        
        context.setFillStyle(props.darkMode ? (isRemoveHovered ? '#ff6b6b' : '#666') : (isRemoveHovered ? '#dc3545' : '#999'));
        context.beginPath();
        (context as any).arc(removeButtonX, removeButtonY, removeButtonSize / 2, 0, Math.PI * 2);
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
    
    // Draw playhead
    if (props.playheadPosition !== undefined) {
      // Get time signature from first staff or default to 4/4
      const timeSignature = props.staffs[0]?.timeSignature || '4/4';
      const [beatsPerMeasure] = timeSignature.split('/').map(Number);
      
      const measureWidth = fixedMeasureWidth;
      const beatWidth = measureWidth / beatsPerMeasure;
      const playheadX = 20 + (props.playheadPosition * beatWidth);
      
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
      (context as any).arc(playheadX, 15, 5, 0, Math.PI * 2);
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
        
        props.staffs.forEach((staff, staffIndex) => {
          if (!staff.visible || handleByBarControl) return;
          
          const staffY = 40 + (staffIndex * (staffHeight + staffSpacing));
          const measuresPerStaff = staff.measuresCount || 4;
          const staffEndX = 20 + (measuresPerStaff * fixedMeasureWidth);
          
          // Check add button click (at end of staff)
          const addButtonX = staffEndX + 10;
          const addButtonY = staffY + (staffHeight / 2);
          const addDistance = Math.sqrt((x - addButtonX) ** 2 + (y - addButtonY) ** 2);
          
          console.log('Add button click check:', { x, y, addButtonX, addButtonY, addDistance });
          
          if (addDistance < 15 && props.onAddBar) { // Increased hit area
            console.log('Add measure clicked for staff:', staff.id);
            props.onAddBar(staff.id, measuresPerStaff - 1); // Add after the last measure
            handleByBarControl = true;
            return;
          }
          
          // Check remove button click (only if more than 1 measure)
          if (measuresPerStaff > 1) {
            const removeButtonX = staffEndX + 35;
            const removeButtonY = staffY + (staffHeight / 2);
            const removeDistance = Math.sqrt((x - removeButtonX) ** 2 + (y - removeButtonY) ** 2);
            
            console.log('Remove button click check:', { x, y, removeButtonX, removeButtonY, removeDistance });
            
            if (removeDistance < 15 && props.onRemoveBar) { // Increased hit area
              console.log('Remove measure clicked for staff:', staff.id);
              props.onRemoveBar(staff.id, measuresPerStaff - 1); // Remove the last measure
              handleByBarControl = true;
              return;
            }
          }
        });
        
        // If bar control was clicked, don't handle as drag/staff click
        if (handleByBarControl) {
          return;
        }
        
        // Handle playhead dragging
        if (props.playheadPosition !== undefined) {
          console.log('Starting drag mode');
          setIsDragging(true);
          // Calculate position properly using time signature and dynamic staff width
          if (props.onPlayheadDrag) {
            const timeSignature = props.staffs[0]?.timeSignature || '4/4';
            const [beatsPerMeasure] = timeSignature.split('/').map(Number);
            const firstStaffMeasures = props.staffs[0]?.measuresCount || 4;
            const totalBeats = firstStaffMeasures * beatsPerMeasure;
            const beatWidth = fixedMeasureWidth / beatsPerMeasure;
            const newPosition = Math.max(0, Math.min(totalBeats, (x - 20) / beatWidth));
            console.log('Beat width:', beatWidth, 'Calculated position:', newPosition);
            props.onPlayheadDrag(newPosition);
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
        
        props.staffs.forEach((staff, staffIndex) => {
          if (!staff.visible) return;
          
          const staffY = 40 + (staffIndex * (staffHeight + staffSpacing));
          const measuresPerStaff = staff.measuresCount || 4;
          const staffEndX = 20 + (measuresPerStaff * fixedMeasureWidth);
          
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
      
      // Remove any existing listeners first
      containerDiv.removeEventListener('mousedown', handleMouseDown as any);
      containerDiv.removeEventListener('mousemove', handleMouseMove as any);
      containerDiv.removeEventListener('contextmenu', handleContextMenu as any);
      
      // Add new listeners to container div
      containerDiv.addEventListener('mousedown', handleMouseDown);
      containerDiv.addEventListener('mousemove', handleMouseMove);
      containerDiv.addEventListener('contextmenu', handleContextMenu);
      
      console.log('Event listeners attached to container div');
    } else {
      console.log('No container div found');
    }
    
  }, [props.staffs, props.width, props.playheadPosition, props.selectedStaffId, isDragging, hoveredAddBar, hoveredRemoveBar]);

  // Separate effect for document-level drag handling
  useEffect(() => {
    if (!isDragging) {
      console.log('Not dragging, skipping drag setup');
      return;
    }
    
    console.log('Setting up drag listeners');

    const handleMouseMove = (event: MouseEvent) => {
      console.log('Mouse move during drag:', event.clientX, event.clientY);
      
      const containerDiv = containerRef.current;
      if (containerDiv && props.onPlayheadDrag) {
        const rect = containerDiv.getBoundingClientRect();
        const x = event.clientX - rect.left;
        
        // Calculate position properly using time signature and dynamic staff width
        const timeSignature = props.staffs[0]?.timeSignature || '4/4';
        const [beatsPerMeasure] = timeSignature.split('/').map(Number);
        const firstStaffMeasures = props.staffs[0]?.measuresCount || 4;
        const totalBeats = firstStaffMeasures * beatsPerMeasure;
        const beatWidth = fixedMeasureWidth / beatsPerMeasure;
        const newPosition = Math.max(0, Math.min(totalBeats, (x - 20) / beatWidth));
        
        console.log('Mouse X:', x, 'Beat width:', beatWidth, 'New position:', newPosition);
        props.onPlayheadDrag(newPosition);
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
  }, [isDragging, props.onPlayheadDrag]);
  
  // Update playhead position based on playback
  useEffect(() => {
    if (props.playheadPosition !== undefined) {
      const newX = (props.playheadPosition / 100) * (props.width || 800);
      setPlayheadX(newX);
      
      const { scrollPosition } = calculatePlayheadScrollState();
      setViewportScrollX(scrollPosition);
    }
  }, [props.playheadPosition, props.width]);
  
  return (
    <div 
      className="multi-staff-canvas" 
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      style={{ 
        width: dynamicWidth,
        height: props.staffs.length * (staffHeight + staffSpacing) + 80,
        border: props.darkMode ? '1px solid #444' : '1px solid #ccc',
        backgroundColor: props.darkMode ? '#1a1a1a' : '#fff',
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