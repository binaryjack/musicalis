import { useRef } from 'react'
import type { MusicalTool } from '../components/organisms/MusicalPalette'
import { tickTree } from '../features/behavior-tree/lib/bt-engine'
import { defaultRegistry } from '../features/behavior-tree/lib/bt-registry'
import type { HoveredSubdivision, MouseState, TickContext } from '../features/behavior-tree/model/tick-context.types'
import { DEFAULT_TREE } from '../features/behavior-tree/store/bt-slice'
import type { StaffLayout } from '../shared/utils/music-geometry'
import type { Note, NoteDuration, Staff } from '../types/musicTypes'

interface BtEventsProps {
  layout: StaffLayout;
  staff: Staff;
  mode: 'design' | 'playback';
  zoom: number;
  height: number;
  RenderConfig: any;
  selectedDuration: NoteDuration | string;
  selectedRest: string | undefined;
  selectedTool: MusicalTool | null | undefined;
  draggedNote: any;
  setDraggedNote: (note: any) => void;
  hoveredButton: 'add' | 'remove' | null;
  setHoveredButton: (btn: 'add' | 'remove' | null) => void;
  isDraggingPlayhead: boolean;  // unused but kept as prop type temporarily
  setIsDraggingPlayhead: (d: boolean) => void;

  onAddBar?: (staffId: string, afterBarIndex: number) => void;
  onRemoveBar?: (staffId: string, barIndex: number) => void;
  onPlayheadChange?: (position: number) => void;
  onAddNote?: (staffId: string, barIndex: number, beatIndex: number, pitch: string, octave: number, duration: NoteDuration) => void;
  onRemoveNote?: (staffId: string, barIndex: number, beatIndex: number, noteId: string) => void;
  onMoveNote?: (staffId: string, sourceBarIndex: number, sourceBeatIndex: number, noteId: string, targetBarIndex: number, targetBeatIndex: number, pitch: string, octave: number) => void;
  onSelectNote?: (note: { barIndex: number, beatIndex: number, note: Note } | null) => void;

  getYToPitch: (y: number) => { pitch: string; octave: number };
  getHitNote: (x: number, y: number) => any;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  setHighlightedSubdivision: React.Dispatch<React.SetStateAction<HoveredSubdivision | null>>;
  setHoverGhost: React.Dispatch<React.SetStateAction<{ pitch: string; octave: number; duration: string; barIndex: number; beatIndex: number; subdivisionOffset: number } | null>>;
}

export const useStaffBtEvents = (props: BtEventsProps) => {
  const {
    layout, staff, mode, zoom, height, RenderConfig,
    selectedDuration, selectedRest, selectedTool,
    draggedNote, setDraggedNote,
    hoveredButton, setHoveredButton,
    setIsDraggingPlayhead,
    onAddBar, onRemoveBar, onPlayheadChange,
    onAddNote, onRemoveNote, onMoveNote, onSelectNote,
    getYToPitch, getHitNote, canvasRef,
    setHighlightedSubdivision, setHoverGhost
  } = props;

  const mouseStateRef = useRef<MouseState>({
    x: 0, y: 0,
    isDown: false, isPressed: false, isUp: false,
    isCtrlDown: false, button: null
  });

  const isDraggingRef = useRef(false);
  const dragSourceNoteIdRef = useRef<string | null>(null);

  const getGeometry = (x: number, y: number) => {
    const barStartX = layout.clefPadding;
    const staffTop = (height / 2) - (RenderConfig.staffLineSpacing * 2);
    const barHeight = RenderConfig.staffLineSpacing * 4;

    const finalBarX = layout.totalWidth;
    let hoveredBar = null;
    let hoveredSubdivision: HoveredSubdivision | null = null;

    if (x >= barStartX && x < finalBarX && y >= staffTop - 40 && y <= staffTop + barHeight + 40) {
      // Find which bar we are in
      const barBox = layout.bars.find(b => x >= b.x && x < b.x + b.width);
      
      if (barBox) {
        hoveredBar = { staffId: staff.id, barIndex: barBox.index };

        // Expand clickable inner area recursively across padding to make bars fully reachable
        const snappedX = Math.max(barBox.innerX, Math.min(x, barBox.innerX + barBox.innerWidth - 0.001));
        const beatBox = barBox.beats.find(b => snappedX >= b.x && snappedX < b.x + b.width);

          if (beatBox) {
            const durRaw = ((draggedNote && draggedNote.note.duration) || selectedTool?.duration || selectedDuration || 'quarter') as string;
            const durMap: Record<string, number> = { 'whole': 4, 'half': 2, 'quarter': 1, 'eighth': 0.5, 'sixteenth': 0.25 };
            const durBeats = durMap[durRaw] || 1;
            const targetDurValue = durBeats;

            // Find matching subdivision based on nearest allowed duration slice
            // Because subdivisions are generated strictly per sixteenths (or smaller), 
            // we match bounds:
            let selectedSubdiv = null;
            let currentBestDistX = Infinity;

            for(const s of beatBox.subdivisions) {
              if (s.offset % targetDurValue === 0) {
                 const centerX = s.x + (s.width / 2);
                 const dist = Math.abs(x - centerX);
                 if (dist < currentBestDistX) {
                    currentBestDistX = dist;
                    selectedSubdiv = s;
                 }
              }
            }

            if (!selectedSubdiv && beatBox.subdivisions.length > 0) {
               selectedSubdiv = beatBox.subdivisions[0];
            }
            if (selectedSubdiv) {
              const exactBeatIndex = beatBox.index + selectedSubdiv.offset;
              let hasNote = false;
              let hasRest = false;

              const beat = staff.bars[barBox.index]?.beats[beatBox.index];
              if (beat) {
                const noteAtPos = beat.notes.find(n => (n.subdivisionOffset || 0) === selectedSubdiv.offset);
                if (noteAtPos) {
                  if ((noteAtPos as any).type === 'rest') hasRest = true;
                  else hasNote = true;
                }
              }

              hoveredSubdivision = {
                staffId: staff.id,
                barIndex: barBox.index,
                beatIndex: exactBeatIndex,
                subdivIndex: selectedSubdiv.offset > 0 ? Math.round(selectedSubdiv.offset * 100) : 0,
                subdivOffset: selectedSubdiv.offset,
                isAllowed: true,
                hasNote,
                hasRest
              };
            }
          }
        }
    }

    return { barStartX, finalBarX, staffTop, barHeight, hoveredBar, hoveredSubdivision, beatsPerBar: layout.bars[0]?.beats.length || 4 };
  };

  const processTick = (event: React.MouseEvent<HTMLCanvasElement>, mouseEventType: 'down' | 'up' | 'move') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoom;
    const y = (event.clientY - rect.top) / zoom;
    
    // Update raw mouse state
    const prevDown = mouseStateRef.current.isDown;
    const isDown = mouseEventType === 'down' ? true : (mouseEventType === 'up' ? false : prevDown);
    mouseStateRef.current = {
      x, y,
      isDown,
      isPressed: mouseEventType === 'down',
      isUp: mouseEventType === 'up',
      isCtrlDown: event.ctrlKey || event.metaKey,
      button: isDown ? 0 : null
    };

    const geometry = getGeometry(x, y);
    const hitNote = getHitNote(x, y);
    
    // Check buttons (add/remove bar) - Handle these outside the tree for simplicity
    // unless we add them to the Tree (currently tree is "Staff Interactions")
    if (mouseEventType === 'move') {
      const addButtonRadius = (geometry.barHeight * 0.7) / 2;
      const addButtonCenterX = geometry.finalBarX + 4 + addButtonRadius;
      const addButtonCenterY = geometry.staffTop + (geometry.barHeight / 2);
      const removeButtonRadius = addButtonRadius * 0.6;
      const removeButtonCenterX = addButtonCenterX + addButtonRadius + 8;
      const removeButtonCenterY = geometry.staffTop + removeButtonRadius + 4;
      
      const distToAdd = Math.sqrt(Math.pow(x - addButtonCenterX, 2) + Math.pow(y - addButtonCenterY, 2));
      const distToRemove = Math.sqrt(Math.pow(x - removeButtonCenterX, 2) + Math.pow(y - removeButtonCenterY, 2));
      
      let hoverAdd = distToAdd <= addButtonRadius && x >= geometry.finalBarX + 4;
      let hoverRemove = staff.bars.length > 1 && distToRemove <= removeButtonRadius;
      
      setHoveredButton(hoverAdd ? 'add' : hoverRemove ? 'remove' : null);
    } else if (mouseEventType === 'down') {
      if (hoveredButton === 'add') { onAddBar?.(staff.id, staff.bars.length - 1); return; }
      if (hoveredButton === 'remove') { onRemoveBar?.(staff.id, staff.bars.length - 1); return; }
    }

    const { pitch, octave } = getYToPitch(y);

    const ctx: TickContext = {
      mouse: mouseStateRef.current,
      mode,
      selectedStaffId: staff.id,
      selectedNoteId: hitNote?.note.id || null,
      selectedElementId: null, // If there's an active global selection
      cursorPosition: x,
      hoveredBar: geometry.hoveredBar,
      hoveredSubdivision: geometry.hoveredSubdivision,
      selectedDuration: selectedTool?.duration || selectedDuration || 'quarter',
      isNoteToolActive: mode === 'design' && (!selectedRest) && (!selectedTool || selectedTool.type === 'note'),
      isDragging: isDraggingRef.current,
      dragSourceNoteId: dragSourceNoteIdRef.current,
      isSustainMode: false,
      timestamp: Date.now(),
      commands: []
    };

    // Run the behavior tree!
    tickTree(DEFAULT_TREE.root, ctx, defaultRegistry);

    // Process resulting commands
    let isSubdivHighlighted = false;
    let nextGhost: any = null;

    for (const cmd of ctx.commands) {
      switch (cmd.type) {
        case 'subdivision.highlight': {
          isSubdivHighlighted = true;
          break;
        }
        case 'note.renderGhost': {
          if (geometry.hoveredSubdivision) {
            nextGhost = {
              pitch, octave,
              duration: ctx.selectedDuration,
              barIndex: geometry.hoveredSubdivision.barIndex,
              beatIndex: geometry.hoveredSubdivision.beatIndex,
              subdivisionOffset: geometry.hoveredSubdivision.subdivOffset
            };
          }
          break;
        }
        case 'note.add': {
          if (!geometry.hoveredSubdivision) break;
          const { barIndex, beatIndex, subdivOffset } = geometry.hoveredSubdivision;
          const targetBeatIndex = beatIndex + (subdivOffset || 0);
          console.log("ADDING", mouseEventType, mouseStateRef.current.isPressed);
          onAddNote?.(staff.id, barIndex, targetBeatIndex, pitch, octave, ctx.selectedDuration as NoteDuration);
          break;
        }
        case 'rest.deleteAtPosition': {
          if (!geometry.hoveredSubdivision) break;
          // You might trigger a rest deletion event or just rely on note.add displacing it in editor-page
          break;
        }
        case 'note.beginDrag': {
          if (hitNote) {
            isDraggingRef.current = true;
            dragSourceNoteIdRef.current = hitNote.note.id;
            onSelectNote?.({ barIndex: hitNote.barIndex, beatIndex: hitNote.beatIndex, note: hitNote.note });
            setDraggedNote({
              barIndex: hitNote.barIndex, beatIndex: hitNote.beatIndex,
              note: hitNote.note, currentX: x, currentY: y
            });
          }
          break;
        }
        case 'note.commitDrag': {
          isDraggingRef.current = false;
          dragSourceNoteIdRef.current = null;
          if (draggedNote && geometry.hoveredSubdivision) {
             const targetBeatIndex = geometry.hoveredSubdivision.beatIndex + (geometry.hoveredSubdivision.subdivOffset || 0);     
             if (draggedNote.barIndex !== geometry.hoveredSubdivision.barIndex ||
                 (draggedNote.beatIndex + (draggedNote.note.subdivisionOffset||0)) !== targetBeatIndex ||
                 draggedNote.note.pitch !== pitch || draggedNote.note.octave !== octave) {
                 onMoveNote?.(staff.id, draggedNote.barIndex, draggedNote.beatIndex, draggedNote.note.id,
                              geometry.hoveredSubdivision.barIndex, targetBeatIndex, pitch, octave);
             }
          }
          setDraggedNote(null);
          break;
        }
        case 'note.cancelDrag': {
          isDraggingRef.current = false;
          dragSourceNoteIdRef.current = null;
          setDraggedNote(null);
          // Detect drop off-canvas for deletion
          if (y < geometry.staffTop - 60 || y > geometry.staffTop + geometry.barHeight + 60) {
             if (draggedNote) onRemoveNote?.(staff.id, draggedNote.barIndex, draggedNote.beatIndex, draggedNote.note.id);
          }
          break;
        }
        case 'playhead.set': {
          const totalBeats = ( (x - geometry.barStartX) / RenderConfig.barWidth) * geometry.beatsPerBar;
          onPlayheadChange?.(Math.max(0, totalBeats));
          setIsDraggingPlayhead(true);
          break;
        }
      }
    }

    // Reset pressed/up states for next frame if nothing triggered it again
    if (mouseEventType === 'down') mouseStateRef.current.isPressed = false;
    if (mouseEventType === 'up') mouseStateRef.current.isUp = false;

    // Apply transient hover states
    setHighlightedSubdivision(prev => {
        if (!isSubdivHighlighted) return null;
        if (prev && geometry.hoveredSubdivision &&
            prev.staffId === geometry.hoveredSubdivision.staffId &&
            prev.barIndex === geometry.hoveredSubdivision.barIndex &&
            prev.beatIndex === geometry.hoveredSubdivision.beatIndex &&
            prev.subdivOffset === geometry.hoveredSubdivision.subdivOffset) {
            return prev;
        }
        return geometry.hoveredSubdivision;
    });

    setHoverGhost(prev => {
        if (!nextGhost) return null;
        if (prev && prev.pitch === nextGhost.pitch && prev.octave === nextGhost.octave &&
            prev.barIndex === nextGhost.barIndex && prev.beatIndex === nextGhost.beatIndex &&
            prev.subdivisionOffset === nextGhost.subdivisionOffset && prev.duration === nextGhost.duration) {
            return prev;
        }
        return nextGhost;
    });
  };

  return {
    handleCanvasClick: () => {}, // We handle inside down/up since click is synthetic
    handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => processTick(e, 'down'),
    handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => {
      // Small fast-path for drag updates visually
      if (isDraggingRef.current && draggedNote) {
        const canvas = canvasRef.current;
        if (canvas) {
           const rect = canvas.getBoundingClientRect();
           setDraggedNote({
             ...draggedNote,
             currentX: (e.clientX - rect.left) / zoom,
             currentY: (e.clientY - rect.top) / zoom
           });
        }
      }
      processTick(e, 'move')
    },
    handleMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => processTick(e, 'up'),
    handleMouseLeave: () => {
      setHoveredButton(null);
      setIsDraggingPlayhead(false);
      if (draggedNote) setDraggedNote(null);
      isDraggingRef.current = false;
    }
  };
;
};