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
  onStaffClick?: (staffId: string, position: { x: number; y: number; pitch?: string; beat?: number }) => void;
  onNoteClick?: (noteId: string, staffId: string) => void;
  onNoteDelete?: (noteId: string, staffId: string) => void;
  onNoteMove?: (noteId: string, staffId: string, newPosition: number) => void;
}

export const MultiStaffCanvas = function(props: MultiStaffCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const [playheadX, setPlayheadX] = useState(0);
  const [viewportScrollX, setViewportScrollX] = useState(0);
  const staffHeight = 120;
  const staffSpacing = 20;
  
  const calculatePitchFromY = (y: number, staffTop: number, clef: string): string => {
    const lineSpacing = 10;
    const staffMiddle = staffTop + (lineSpacing * 2);
    const relativeY = y - staffMiddle;
    
    const treblePitchMap = [
      'F/5', 'E/5', 'D/5', 'C/5', 'B/4', 'A/4', 'G/4', 'F/4', 'E/4', 'D/4', 'C/4'
    ];
    const bassPitchMap = [
      'A/3', 'G/3', 'F/3', 'E/3', 'D/3', 'C/3', 'B/2', 'A/2', 'G/2', 'F/2', 'E/2'
    ];
    
    const pitchMap = clef === 'bass' ? bassPitchMap : treblePitchMap;
    const index = Math.max(0, Math.min(pitchMap.length - 1, Math.floor(-relativeY / (lineSpacing / 2)) + 5));
    return pitchMap[index];
  };
  
  const calculateBeatFromX = (x: number, staffStart: number, staffWidth: number, beatsPerMeasure: number = 4): number => {
    const relativeX = x - staffStart;
    const beatWidth = staffWidth / beatsPerMeasure;
    return Math.max(0, Math.floor(relativeX / beatWidth));
  };
  
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
      
      // Add staff label
      context.setFillStyle('#333');
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
        (context as any).setStrokeStyle('#007bff');
        (context as any).setLineWidth(3);
        // Draw manual selection rectangle using path methods
        (context as any).beginPath();
        (context as any).rect(8, yPosition - 5, (props.width || 800) - 16, staffHeight - 10);
        (context as any).stroke();
      }
    });
    
    // Draw playhead
    if (props.playheadPosition !== undefined) {
      const { visualPlayheadX } = calculatePlayheadScrollState();
      context.setStrokeStyle('#ff0000');
      context.setLineWidth(2);
      context.beginPath();
      context.moveTo(visualPlayheadX, 20);
      context.lineTo(visualPlayheadX, totalHeight + 20);
      context.stroke();
    }
    
    // Add click handlers
    const svgElement = containerRef.current.querySelector('svg');
    if (svgElement) {
      svgElement.addEventListener('click', (event) => {
        const rect = svgElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Determine which staff was clicked
        const clickedStaffIndex = Math.floor((y - 40) / (staffHeight + staffSpacing));
        const clickedStaff = props.staffs[clickedStaffIndex];
        
        if (clickedStaff && props.onStaffClick) {
          const staffY = 40 + (clickedStaffIndex * (staffHeight + staffSpacing));
          const pitch = calculatePitchFromY(y, staffY, clickedStaff.clef);
          const beat = calculateBeatFromX(x, 10, (props.width || 800) - 20);
          
          props.onStaffClick(clickedStaff.id, { x, y, pitch, beat });
        }
      });
    }
    
  }, [props.staffs, props.width, props.playheadPosition, props.selectedStaffId]);
  
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
      style={{ 
        width: '100%', 
        height: props.staffs.length * (staffHeight + staffSpacing) + 80,
        border: '1px solid #ccc',
        backgroundColor: '#fff',
        overflow: 'auto',
        position: 'relative',
        transform: `translateX(-${viewportScrollX}px)`,
        transition: 'transform 0.1s ease-out'
      }}
    />
  );
};