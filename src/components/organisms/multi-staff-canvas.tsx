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
}

export const MultiStaffCanvas = function(props: MultiStaffCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const [playheadX, setPlayheadX] = useState(0);
  const [viewportScrollX, setViewportScrollX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const staffHeight = 120;
  const staffSpacing = 20;
  
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
    
    containerRef.current.innerHTML = '';
    
    const totalHeight = props.staffs.length * (staffHeight + staffSpacing);
    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(props.width || 800, totalHeight + 40);
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
      const stave = new Stave(10, yPosition, (props.width || 800) - 20);
      
      // Add clef and time signature
      stave.addClef(staff.clef).addTimeSignature(staff.timeSignature);
      if (staff.keySignature !== 'C') {
        stave.addKeySignature(staff.keySignature);
      }
      
      stave.setContext(context).draw();
      
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
        
        const voice = new Voice({ numBeats: 4, beatValue: 4 });
        voice.addTickables(vexNotes);
        
        new Formatter().joinVoices([voice]).format([voice], (props.width || 800) - 100);
        voice.draw(context, stave);
      }
      
      // Add staff selection highlight
      if (props.selectedStaffId === staff.id) {
        (context as any).setStrokeStyle(props.darkMode ? '#4a9eff' : '#007bff');
        (context as any).setLineWidth(3);
        // Draw manual selection rectangle using path methods
        (context as any).beginPath();
        (context as any).rect(8, yPosition - 5, (props.width || 800) - 16, staffHeight - 10);
        (context as any).stroke();
      }
    });
    
    // Draw playhead
    if (props.playheadPosition !== undefined) {
      // Get time signature from first staff or default to 4/4
      const timeSignature = props.staffs[0]?.timeSignature || '4/4';
      const [beatsPerMeasure] = timeSignature.split('/').map(Number);
      
      const measureWidth = (props.width || 800) - 40; // Account for margins
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
        console.log('Current playhead position:', props.playheadPosition);
        
        // Start dragging on any click in the staff area
        if (props.playheadPosition !== undefined) {
          console.log('Starting drag mode');
          setIsDragging(true);
          // Calculate position properly using time signature and staff width
          if (props.onPlayheadDrag) {
            const timeSignature = props.staffs[0]?.timeSignature || '4/4';
            const [beatsPerMeasure] = timeSignature.split('/').map(Number);
            const measureWidth = (props.width || 800) - 40; // Account for margins (same as playhead drawing)
            const beatWidth = measureWidth / beatsPerMeasure;
            const newPosition = Math.max(0, (x - 20) / beatWidth); // Convert mouse x to beat position
            console.log('Beat width:', beatWidth, 'Calculated position:', newPosition);
            props.onPlayheadDrag(newPosition);
          }
        }
      };
      
      const handleContextMenu = (event: MouseEvent) => {
        console.log('Context menu prevented');
        event.preventDefault();
        event.stopPropagation();
      };
      
      // Remove any existing listeners first
      containerDiv.removeEventListener('mousedown', handleMouseDown as any);
      containerDiv.removeEventListener('contextmenu', handleContextMenu as any);
      
      // Add new listeners to container div
      containerDiv.addEventListener('mousedown', handleMouseDown);
      containerDiv.addEventListener('contextmenu', handleContextMenu);
      
      console.log('Event listeners attached to container div');
    } else {
      console.log('No container div found');
    }
    
  }, [props.staffs, props.width, props.playheadPosition, props.selectedStaffId, isDragging]);

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
        
        // Calculate position properly using time signature and staff width
        const timeSignature = props.staffs[0]?.timeSignature || '4/4';
        const [beatsPerMeasure] = timeSignature.split('/').map(Number);
        const measureWidth = (props.width || 800) - 40; // Account for margins
        const beatWidth = measureWidth / beatsPerMeasure;
        const newPosition = Math.max(0, Math.min(beatsPerMeasure * 4, (x - 20) / beatWidth)); // Limit to 4 measures
        
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
        width: '100%', 
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