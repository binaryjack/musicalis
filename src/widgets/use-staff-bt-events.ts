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
  svgRef: React.RefObject<SVGSVGElement | null>;
  setHighlightedSubdivision: React.Dispatch<React.SetStateAction<HoveredSubdivision | null>>;
  setHoverGhost: React.Dispatch<React.SetStateAction<{ pitch: string; octave: number; duration: string; barIndex: number; beatIndex: number; subdivisionOffset: number } | null>>;
  setSustainRange: React.Dispatch<React.SetStateAction<{ barIndex: number; startX: number; endX: number } | null>>;
  onResizeDuration?: (staffId: string, barIndex: number, beatIndex: number, noteId: string, newDuration: NoteDuration) => void;
}

export const useStaffBtEvents = (props: BtEventsProps) => {
  const {
    layout, staff, mode, height, RenderConfig,
    selectedDuration, selectedRest, selectedTool,
    draggedNote, setDraggedNote,
    hoveredButton, setHoveredButton,
    setIsDraggingPlayhead,
    onAddBar, onRemoveBar, onPlayheadChange,
    onAddNote, onRemoveNote, onMoveNote, onSelectNote,
    getYToPitch, getHitNote, svgRef,
    setHighlightedSubdivision, setHoverGhost, setSustainRange, onResizeDuration,
  } = props;

  const mouseStateRef = useRef<MouseState>({
    x: 0, y: 0,
    isDown: false, isPressed: false, isUp: false,
    isCtrlDown: false, isShiftDown: false, button: null
  });

  const isDraggingRef = useRef(false);
  const dragSourceNoteIdRef = useRef<string | null>(null);
  const isSustainModeRef = useRef(false);
  const sustainSourceRef = useRef<{ barIndex: number; beatIndex: number; note: Note } | null>(null);

  const getGeometry = (x: number, y: number) => {
    const barStartX = layout.clefPadding;
    const staffTop = (height / 2) - (RenderConfig.staffLineSpacing * 2);
    const barHeight = RenderConfig.staffLineSpacing * 4;

    const finalBarX = layout.totalWidth;
    let hoveredBar = null;
    let hoveredSubdivision: HoveredSubdivision | null = null;

    if (x >= barStartX && x < finalBarX) {
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
                const noteAtPos = beat.notes.find(n =>
                  (n.subdivisionOffset || 0) === selectedSubdiv.offset &&
                  n.id !== dragSourceNoteIdRef.current
                );
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

  const processTick = (event: React.MouseEvent<SVGSVGElement>, mouseEventType: 'down' | 'up' | 'move') => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const pt = svgEl.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const ctm = svgEl.getScreenCTM();
    if (!ctm) return;
    const svgCoords = pt.matrixTransform(ctm.inverse());
    const x = svgCoords.x;
    const y = svgCoords.y;
    
    // Update raw mouse state
    const prevDown = mouseStateRef.current.isDown;
    const isDown = mouseEventType === 'down' ? true : (mouseEventType === 'up' ? false : prevDown);
    mouseStateRef.current = {
      x, y,
      isDown,
      isPressed: mouseEventType === 'down',
      isUp: mouseEventType === 'up',
      isCtrlDown: event.ctrlKey || event.metaKey,
      isShiftDown: event.shiftKey,
      button: isDown ? 0 : null
    };

    const geometry = getGeometry(x, y);
    const hitNote = getHitNote(x, y);

    // Compute bar-button hover geometry — fed into TickContext so the BT handles clicks.
    // We also call setHoveredButton for canvas visual rendering.
    const addButtonRadius = (geometry.barHeight * 0.7) / 2;
    const addButtonCenterX = geometry.finalBarX + 4 + addButtonRadius;
    const addButtonCenterY = geometry.staffTop + (geometry.barHeight / 2);
    const removeButtonRadius = addButtonRadius * 0.6;
    const removeButtonCenterX = addButtonCenterX + addButtonRadius + 8;
    const distToAdd    = Math.sqrt(Math.pow(x - addButtonCenterX, 2)    + Math.pow(y - addButtonCenterY, 2));
    const distToRemove = Math.sqrt(Math.pow(x - removeButtonCenterX, 2) + Math.pow(y - (geometry.staffTop + removeButtonRadius + 4), 2));
    const nextHoveredButton: 'add' | 'remove' | null =
      distToAdd <= addButtonRadius && x >= geometry.finalBarX + 4 ? 'add' :
      staff.bars.length > 1 && distToRemove <= removeButtonRadius ? 'remove' :
      null;
    setHoveredButton(nextHoveredButton);

    // Off-canvas: dragged note released far outside the full pitch range (C2–C8).
    // staffTop is F6; each diatonic step = ls/2. C8 = 11 steps above, C2 = 31 steps below.
    const ls = RenderConfig.staffLineSpacing;
    const highestNoteY = geometry.staffTop - 11 * (ls / 2); // C8
    const lowestNoteY  = geometry.staffTop + 31 * (ls / 2); // C2
    const isOffCanvas = isDraggingRef.current &&
      (y < highestNoteY - 60 || y > lowestNoteY + 60);

    const { pitch, octave } = getYToPitch(y);

    const ctx: TickContext = {
      mouse: mouseStateRef.current,
      mode,
      selectedStaffId: staff.id,
      selectedNoteId: hitNote?.note.id || null,
      selectedElementId: null,
      cursorPosition: x,
      hoveredBar: geometry.hoveredBar,
      hoveredSubdivision: geometry.hoveredSubdivision,
      selectedDuration: selectedTool?.duration || selectedDuration || 'quarter',
      isNoteToolActive: mode === 'design' && (!selectedRest) && (!selectedTool || selectedTool.type === 'note'),
      isDragging: isDraggingRef.current,
      dragSourceNoteId: dragSourceNoteIdRef.current,
      isSustainMode: isSustainModeRef.current,
      hoveredButton: nextHoveredButton,
      isOffCanvas,
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
        case 'bar.add': {
          onAddBar?.(staff.id, staff.bars.length - 1);
          break;
        }
        case 'bar.remove': {
          onRemoveBar?.(staff.id, staff.bars.length - 1);
          break;
        }
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
          const { barIndex, beatIndex } = geometry.hoveredSubdivision; // beatIndex already includes subdivOffset
          onAddNote?.(staff.id, barIndex, beatIndex, pitch, octave, ctx.selectedDuration as NoteDuration);
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
             const targetBeatIndex = geometry.hoveredSubdivision.beatIndex; // already includes subdivOffset
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
        case 'note.deleteDrag': {
          isDraggingRef.current = false;
          dragSourceNoteIdRef.current = null;
          if (draggedNote) onRemoveNote?.(staff.id, draggedNote.barIndex, draggedNote.beatIndex, draggedNote.note.id);
          setDraggedNote(null);
          break;
        }
        case 'note.cancelDrag': {
          isDraggingRef.current = false;
          dragSourceNoteIdRef.current = null;
          setDraggedNote(null);
          break;
        }
        case 'sustain.begin': {
          if (!isSustainModeRef.current && hitNote) {
            isSustainModeRef.current = true;
            sustainSourceRef.current = {
              barIndex: hitNote.barIndex,
              beatIndex: hitNote.beatIndex,
              note: hitNote.note,
            };
          }
          break;
        }
        case 'sustain.highlightRange': {
          if (sustainSourceRef.current) {
            const srcNote = sustainSourceRef.current.note;
            const srcBar = layout.bars[sustainSourceRef.current.barIndex];
            const srcBeat = srcBar?.beats.find(b => b.index === srcNote.beatIndex);
            const srcEl = srcBeat?.elements.find(el => el.note?.id === srcNote.id);
            if (srcEl) {
              const clampedX = Math.max(srcEl.x, Math.min(x, srcBar.x + srcBar.width));
              setSustainRange({ barIndex: sustainSourceRef.current.barIndex, startX: srcEl.x, endX: clampedX });
            }
          }
          break;
        }
        case 'sustain.commit': {
          isSustainModeRef.current = false;
          setSustainRange(null);
          if (sustainSourceRef.current && geometry.hoveredSubdivision &&
              geometry.hoveredSubdivision.barIndex === sustainSourceRef.current.barIndex) {
            const src = sustainSourceRef.current;
            const sourceBeat = src.note.beatIndex + (src.note.subdivisionOffset || 0);
            const targetBeat = geometry.hoveredSubdivision.beatIndex;
            const spanBeats = targetBeat - sourceBeat;
            if (spanBeats > 0.1) {
              const durMap: [NoteDuration, number][] = [
                ['whole', 4], ['half', 2], ['quarter', 1], ['eighth', 0.5], ['sixteenth', 0.25],
              ];
              let newDur: NoteDuration = 'quarter';
              let best = Infinity;
              for (const [d, v] of durMap) {
                const dist = Math.abs(spanBeats - v);
                if (dist < best) { best = dist; newDur = d; }
              }
              onResizeDuration?.(staff.id, src.barIndex, src.note.beatIndex, src.note.id, newDur);
            }
          }
          sustainSourceRef.current = null;
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
    handleMouseDown: (e: React.MouseEvent<SVGSVGElement>) => processTick(e, 'down'),
    handleMouseMove: (e: React.MouseEvent<SVGSVGElement>) => {
      // Fast-path: update dragged note position without full tick
      if (isDraggingRef.current && draggedNote) {
        const svgEl = svgRef.current;
        if (svgEl) {
          const pt = svgEl.createSVGPoint();
          pt.x = e.clientX; pt.y = e.clientY;
          const ctm = svgEl.getScreenCTM();
          if (ctm) {
            const { x: cx, y: cy } = pt.matrixTransform(ctm.inverse());
            setDraggedNote({ ...draggedNote, currentX: cx, currentY: cy });
          }
        }
      }
      processTick(e, 'move');
    },
    handleMouseUp: (e: React.MouseEvent<SVGSVGElement>) => processTick(e, 'up'),
    handleMouseLeave: () => {
      setHoveredButton(null);
      setIsDraggingPlayhead(false);
      if (draggedNote) setDraggedNote(null);
      isDraggingRef.current = false;
      isSustainModeRef.current = false;
      sustainSourceRef.current = null;
      setSustainRange(null);
    }
  };
;
};