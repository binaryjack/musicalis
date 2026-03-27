
import { useEffect, useRef } from 'react';
import { Stave, StaveNote, Formatter, Renderer, Voice } from 'vexflow';
import type { MusicNote, NoteDuration } from '../../types/musicTypes';
import type { ProjectData } from '../../services/projectService';

export interface StaffCanvasProps {
  project?: ProjectData | null;
  width?: number;
  height?: number;
  notes?: { pitch: MusicNote; duration: NoteDuration }[];
  onNoteClick?: (noteIndex: number) => void;
  onStaffClick?: (position: { x: number; y: number, pitch?: string, beat?: number }) => void;
  onNoteAdd?: (note: { pitch: MusicNote; duration: NoteDuration; position: number }) => void;
  onNoteDelete?: (noteIndex: number) => void;
  onNoteMove?: (noteIndex: number, newPosition: number) => void;
}

export const StaffCanvas = function(props: StaffCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const noteElementsRef = useRef<SVGElement[]>([]);
  
  // Helper function to calculate pitch from y coordinate
  const calculatePitchFromY = (y: number, staffTop: number): string => {
    // Standard treble clef line positions (approximate)
    const lineSpacing = 10; // VexFlow default line spacing
    const staffMiddle = staffTop + (lineSpacing * 2); // E4 line
    const relativeY = y - staffMiddle;
    
    // Map Y position to note pitches (simplified)
    const pitchMap = [
      'F/5', 'E/5', 'D/5', 'C/5', 'B/4', 'A/4', 'G/4', 'F/4', 'E/4', 'D/4', 'C/4'
    ];
    
    const index = Math.max(0, Math.min(pitchMap.length - 1, Math.floor(-relativeY / (lineSpacing / 2)) + 5));
    return pitchMap[index];
  };
  
  // Helper function to calculate beat position from x coordinate
  const calculateBeatFromX = (x: number, staffStart: number, staffWidth: number): number => {
    const relativeX = x - staffStart;
    const beatWidth = staffWidth / 4; // Assuming 4 beats per measure
    return Math.max(0, Math.floor(relativeX / beatWidth));
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous content
    containerRef.current.innerHTML = '';

    // Create VexFlow renderer
    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(props.width || 800, props.height || 200);
    rendererRef.current = renderer;

    const context = renderer.getContext();

    // Create a stave
    const stave = new Stave(10, 40, props.width ? props.width - 20 : 780);
    stave.addClef('treble').addTimeSignature('4/4');
    stave.setContext(context).draw();

    // Add notes if provided
    if (props.notes && props.notes.length > 0) {
      const staveNotes = props.notes.map(note => {
        // Convert our note format to VexFlow format
        const vexNote = new StaveNote({
          clef: 'treble',
          keys: [`${note.pitch.toLowerCase()}/4`],
          duration: note.duration === 'quarter' ? 'q' : 
                   note.duration === 'half' ? 'h' : 
                   note.duration === 'whole' ? 'w' : 
                   note.duration === 'eighth' ? '8' : 'q'
        });
        return vexNote;
      });

      // Create a voice and add notes (fixed API)
      const voice = new Voice({ numBeats: 4, beatValue: 4 });
      voice.addTickables(staveNotes);

      // Format and justify the notes
      new Formatter().joinVoices([voice]).format([voice], props.width ? props.width - 100 : 700);

      // Render voice
      voice.draw(context, stave);
      
      // Add data attributes to note elements for easier tracking
      if (containerRef.current) {
        const svgElement = containerRef.current.querySelector('svg');
        if (svgElement) {
          // VexFlow creates groups for notes - let's find them and add attributes
          const allGroups = Array.from(svgElement.querySelectorAll('g'));
          console.log('All groups found:', allGroups.length);
          
          // Filter groups that likely contain notes (have paths or ellipses)
          const noteGroups = allGroups.filter(group => {
            return group.querySelector('path, ellipse, rect, circle');
          });
          console.log('Note-like groups found:', noteGroups.length);
          
          // Add data attributes to help with click detection
          noteGroups.forEach((group, index) => {
            if (index < (props.notes?.length || 0)) {
              group.setAttribute('data-note-index', index.toString());
              group.style.cursor = 'pointer';
              
              // Add hover effects for better UX
              group.addEventListener('mouseenter', () => {
                group.style.opacity = '0.7';
              });
              group.addEventListener('mouseleave', () => {
                group.style.opacity = '1';
              });
            }
          });
        }
      }
      
      // Add click handlers with proper VexFlow element selection
      if (containerRef.current) {
        // VexFlow creates path elements for notes, not elements with .vf-note class
        const svgElement = containerRef.current.querySelector('svg');
        
        if (svgElement) {
          // Remove existing listeners
          const clonedSvg = svgElement.cloneNode(true);
          svgElement.parentNode?.replaceChild(clonedSvg, svgElement);
          
          const newSvg = containerRef.current.querySelector('svg');
          if (newSvg) {
            // Set cursor style
            newSvg.style.cursor = props.onStaffClick ? 'crosshair' : 'default';
            
            // Add single click handler that detects what was clicked
            newSvg.addEventListener('click', (event) => {
              const target = event.target as SVGElement;
              console.log('SVG click details:');
              console.log('- Target:', target);
              console.log('- Tag name:', target.tagName);
              
              // Check if clicked element or its parent has a data-note-index
              let noteElement = target.closest('[data-note-index]') as SVGElement;
              
              if (noteElement && props.onNoteClick) {
                const noteIndex = parseInt(noteElement.getAttribute('data-note-index') || '-1');
                console.log('- Note clicked, index:', noteIndex);
                
                if (noteIndex >= 0 && noteIndex < (props.notes?.length || 0)) {
                  event.stopPropagation();
                  props.onNoteClick(noteIndex);
                  return;
                }
              }
              
              // If not a note click and staff click is enabled
              if (props.onStaffClick) {
                const rect = newSvg.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                
                console.log('Staff click at:', x, y);
                
                // Calculate approximate pitch and beat position from click coordinates
                const pitch = calculatePitchFromY(y, stave.getYForLine(0));
                const beat = calculateBeatFromX(x, stave.getX(), stave.getWidth());
                
                props.onStaffClick({ x, y, pitch, beat });
              }
            });
            
            // Add right-click handler for note deletion
            if (props.onNoteDelete) {
              newSvg.addEventListener('contextmenu', (event) => {
                const target = event.target as SVGElement;
                console.log('Right-click on:', target.tagName);
                
                // Check if clicked element or its parent has a data-note-index
                let noteElement = target.closest('[data-note-index]') as SVGElement;
                
                if (noteElement) {
                  event.preventDefault();
                  const noteIndex = parseInt(noteElement.getAttribute('data-note-index') || '-1');
                  console.log('Note right-clicked for deletion, index:', noteIndex);
                  
                  if (noteIndex >= 0 && noteIndex < (props.notes?.length || 0)) {
                    props.onNoteDelete?.(noteIndex);
                  }
                }
              });
            }
          }
        }
      }
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current = null;
      }
      // Cleanup will be handled by DOM replacement
      noteElementsRef.current = [];
    };
  }, [props.notes, props.width, props.height, props.project]);

  return (
    <div 
      className="staff-canvas" 
      ref={containerRef}
      style={{ 
        width: props.width || '100%', 
        height: props.height || 200, 
        border: '1px solid #ccc',
        backgroundColor: '#fff'
      }}
    />
  );
};