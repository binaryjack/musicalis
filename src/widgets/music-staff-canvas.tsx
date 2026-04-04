import { useCallback, useEffect, useRef, useState } from 'react'
import type { MusicalTool } from '../components/organisms/MusicalPalette'
import type { HoveredSubdivision } from '../features/behavior-tree/model/tick-context.types'
import { calculateStaffLayout, getTransientLayoutCenter } from '../shared/utils/music-geometry'
import {
  getAccidentalGlyph,
  getClefGlyph,
  getFlagGlyph,
  getNoteHeadGlyph,
  getRestGlyph,
  getTimeSignatureGlyphs
} from '../shared/utils/smufl-glyphs'
import type { Note, NoteDuration, Staff } from '../types/musicTypes'
import { useStaffBtEvents } from './use-staff-bt-events'

interface MusicStaffCanvasProps {
  staff: Staff;
  mode: 'design' | 'playback';
  width?: number;
  height?: number;
  playheadPosition?: number;
  darkMode?: boolean;
  selectedDuration?: NoteDuration;
  selectedRest?: string;
  selectedTool?: MusicalTool | null;
  onAddBar?: (staffId: string, afterBarIndex: number) => void;
  onRemoveBar?: (staffId: string, barIndex: number) => void;
  onNoteClick?: (noteId: string, staffId: string) => void;
  onPlayheadChange?: (position: number) => void;
  onAddNote?: (staffId: string, barIndex: number, beatIndex: number, pitch: string, octave: number, duration: NoteDuration) => void;
  onAddRest?: (staffId: string, barIndex: number, beatIndex: number, duration: NoteDuration) => void;
  onRemoveNote?: (staffId: string, barIndex: number, beatIndex: number, noteId: string) => void;
  onMoveNote?: (staffId: string, sourceBarIndex: number, sourceBeatIndex: number, noteId: string, targetBarIndex: number, targetBeatIndex: number, pitch: string, octave: number) => void;
  selectedElementId?: string | null;
  onSelectNote?: (note: { barIndex: number, beatIndex: number, note: Note } | null) => void;
  zoom?: number;
}

const RenderConfig = {
  staffHeight: 140,
  barWidth: 280,
  staffLineSpacing: 12,
  staffLineCount: 5,
  noteRadius: 4.5,
  barLineThickness: 2,
  clefFontSize: 50,
  noteFontSize: 36,
  timeSigFontSize: 28,
  stemHeight: 40,
  stemThickness: 1.5,
};

export const MusicStaffCanvas = function(props: MusicStaffCanvasProps) {
  const {
    staff,
    mode = 'design',
    width = 1000,
    height = 180, // Better space for higher staff lines
    playheadPosition = 0,
    darkMode = false,
    selectedDuration = 'quarter',
    selectedRest,
    selectedTool,
    onAddBar,
    onRemoveBar,
    onPlayheadChange,
    onAddNote,
    onRemoveNote,
    onMoveNote,
    selectedElementId,
    onSelectNote,
    zoom = 1,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [fontLoaded, setFontLoaded] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<'add' | 'remove' | null>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [draggedNote, setDraggedNote] = useState<{
    barIndex: number;
    beatIndex: number;
    note: Note;
    currentX: number;
    currentY: number;
  } | null>(null);
  const [highlightedSubdivision, setHighlightedSubdivision] = useState<HoveredSubdivision | null>(null);
  const [hoverGhost, setHoverGhost] = useState<{ pitch: string; octave: number; duration: string; barIndex: number; beatIndex: number; subdivisionOffset: number } | null>(null);

  /**
   * Get duration value in quarter note units
   */
  const getDurationValue = (duration: NoteDuration): number => {
    const durationMap: Record<NoteDuration, number> = {
      'whole': 4,
      'half': 2,
      'quarter': 1,
      'eighth': 0.5,
      'sixteenth': 0.25,
    };
    return durationMap[duration] || 1;
  };

  /**
     * Check if a note can fit in the specified beat
     */
    
  const getNoteY = useCallback((pitch: string, octave: number): number => {
    const staffTop = (height / 2) - (RenderConfig.staffLineSpacing * 2);
    const lineSpacing = RenderConfig.staffLineSpacing;
    
    // Treble clef: lines are E5, G5, B5, D6, F6
    // Spaces are F5, A5, C6, E6
    const trebleNotes: Record<string, number> = {
      'D7': staffTop - lineSpacing * 2.5,
      'C7': staffTop - lineSpacing * 2,
      'B6': staffTop - lineSpacing * 1.5,
      'A6': staffTop - lineSpacing * 1,
      'G6': staffTop - lineSpacing * 0.5,
      'F6': staffTop,
      'E6': staffTop + lineSpacing * 0.5,
      'D6': staffTop + lineSpacing * 1,
      'C6': staffTop + lineSpacing * 1.5,
      'B5': staffTop + lineSpacing * 2,
      'A5': staffTop + lineSpacing * 2.5,
      'G5': staffTop + lineSpacing * 3,
      'F5': staffTop + lineSpacing * 3.5,
      'E5': staffTop + lineSpacing * 4,
      'D5': staffTop + lineSpacing * 4.5,
      'C5': staffTop + lineSpacing * 5,
      'B4': staffTop + lineSpacing * 5.5,
      'A4': staffTop + lineSpacing * 6,
      'G4': staffTop + lineSpacing * 6.5,
      'F4': staffTop + lineSpacing * 7,
      'E4': staffTop + lineSpacing * 7.5,
      'D4': staffTop + lineSpacing * 8,
    };
    
    const noteKey = `${pitch}${octave}`;
    return trebleNotes[noteKey] || staffTop + lineSpacing * 2; // Default to middle
  }, []);

  // Load Bravura font before rendering
  useEffect(() => {
    const loadFont = async () => {
      try {
        // Load the font using the Font Loading API
        await document.fonts.load('42px Bravura');
        await document.fonts.load('30px Bravura');
        await document.fonts.load('24px Bravura');
        setFontLoaded(true);
      } catch (error) {
        console.error('Failed to load Bravura font:', error);
        // Still allow rendering even if font load fails
        setFontLoaded(true);
      }
    };
    
    loadFont();
  }, []);

  /**
   * Draw ledger lines for notes outside the 5-line staff
   */
  const drawLedgerLines = useCallback((ctx: CanvasRenderingContext2D, centerX: number, noteY: number, color: string) => {
    const staffTop = (height / 2) - (RenderConfig.staffLineSpacing * 2);
    const lineSpacing = RenderConfig.staffLineSpacing;
    const staffBottom = staffTop + lineSpacing * 4;
    const ledgerLineLength = 24;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    // Above staff
    if (noteY < staffTop - 1) {
      for (let y = staffTop - lineSpacing; y + 1 >= noteY; y -= lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(centerX - ledgerLineLength / 2, y);
        ctx.lineTo(centerX + ledgerLineLength / 2, y);
        ctx.stroke();
      }
    }
    // Below staff
    else if (noteY > staffBottom + 1) {
      for (let y = staffBottom + lineSpacing; y - 1 <= noteY; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(centerX - ledgerLineLength / 2, y);
        ctx.lineTo(centerX + ledgerLineLength / 2, y);
        ctx.stroke();
      }
    }
  }, []);

  /**
   * Convert Y position to pitch and octave
   */
  const getYToPitch = useCallback((y: number): { pitch: string; octave: number } => {
    const staffTop = (height / 2) - (RenderConfig.staffLineSpacing * 2);
    const lineSpacing = RenderConfig.staffLineSpacing;
    
    // Map Y positions to notes (treble clef)
    const notes = [
      { y: staffTop - lineSpacing * 2.5, pitch: 'D', octave: 7 },
      { y: staffTop - lineSpacing * 2, pitch: 'C', octave: 7 },
      { y: staffTop - lineSpacing * 1.5, pitch: 'B', octave: 6 },
      { y: staffTop - lineSpacing * 1, pitch: 'A', octave: 6 },
      { y: staffTop - lineSpacing * 0.5, pitch: 'G', octave: 6 },
      { y: staffTop, pitch: 'F', octave: 6 },
      { y: staffTop + lineSpacing * 0.5, pitch: 'E', octave: 6 },
      { y: staffTop + lineSpacing * 1, pitch: 'D', octave: 6 },
      { y: staffTop + lineSpacing * 1.5, pitch: 'C', octave: 6 },
      { y: staffTop + lineSpacing * 2, pitch: 'B', octave: 5 },
      { y: staffTop + lineSpacing * 2.5, pitch: 'A', octave: 5 },
      { y: staffTop + lineSpacing * 3, pitch: 'G', octave: 5 },
      { y: staffTop + lineSpacing * 3.5, pitch: 'F', octave: 5 },
      { y: staffTop + lineSpacing * 4, pitch: 'E', octave: 5 },
      { y: staffTop + lineSpacing * 4.5, pitch: 'D', octave: 5 },
      { y: staffTop + lineSpacing * 5, pitch: 'C', octave: 5 },
      { y: staffTop + lineSpacing * 5.5, pitch: 'B', octave: 4 },
      { y: staffTop + lineSpacing * 6, pitch: 'A', octave: 4 },
      { y: staffTop + lineSpacing * 6.5, pitch: 'G', octave: 4 },
      { y: staffTop + lineSpacing * 7, pitch: 'F', octave: 4 },
      { y: staffTop + lineSpacing * 7.5, pitch: 'E', octave: 4 },
      { y: staffTop + lineSpacing * 8, pitch: 'D', octave: 4 },
    ];
    
    // Find closest note
    let closest = notes[0];
    let minDist = Math.abs(y - notes[0].y);
    
    for (const note of notes) {
      const dist = Math.abs(y - note.y);
      if (dist < minDist) {
        minDist = dist;
        closest = note;
      }
    }
    
    return { pitch: closest.pitch, octave: closest.octave };
  }, []);

  const barStartX = 130;
  const staffTop = (height / 2) - (RenderConfig.staffLineSpacing * 2);
  const layoutConfig = {
    clefPadding: barStartX,
    barPadding: 5,
    barWidth: RenderConfig.barWidth,
    staffHeight: RenderConfig.staffLineSpacing * 4,
    staffTop
  };
  const layout: ReturnType<typeof calculateStaffLayout> = calculateStaffLayout(staff, layoutConfig);
  /**
   * Draw the staff
   */
  const drawStaff = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, width, height);
    
    const bars = staff.bars;
    const finalBarX = layout.totalWidth;
    // Set colors based on theme
    const lineColor = darkMode ? '#e0e0e0' : '#333';
    const textColor = darkMode ? '#e0e0e0' : '#333';
    
    // Draw staff label
    ctx.fillStyle = textColor;
    ctx.font = '14px Arial';
    ctx.fillText(staff.name, 10, 20);
    
    // Draw the 5 staff lines
    const staffTop = (height / 2) - (RenderConfig.staffLineSpacing * 2);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    
    for (let i = 0; i < RenderConfig.staffLineCount; i++) {
      const y = staffTop + (i * RenderConfig.staffLineSpacing);
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(finalBarX, y); // Extend to final bar line
      ctx.stroke();
    }
    
    // Draw clef at the start
    ctx.fillStyle = textColor;
    ctx.font = `${RenderConfig.clefFontSize}px Bravura`;
    ctx.textBaseline = 'alphabetic'; // Use alphabetic baseline for proper positioning
    const clefGlyph = getClefGlyph(staff.clef);
    ctx.fillText(clefGlyph, 20, staffTop + 40); // Position at middle of staff
    
    // Draw time signature
    const firstBar = bars[0];
    const timeSignature = firstBar?.timeSignature || staff.timeSignature || { beatsPerMeasure: 4, beatValue: 4, display: '4/4' };
    const timeSigGlyphs = getTimeSignatureGlyphs(timeSignature.display);
    
    ctx.font = `${RenderConfig.timeSigFontSize}px Bravura`;
    ctx.textBaseline = 'alphabetic';
    if (timeSigGlyphs.bottom) {
      // Numeric time signature
      ctx.fillText(timeSigGlyphs.top, 90, staffTop + 15);
      ctx.fillText(timeSigGlyphs.bottom, 90, staffTop + 35);
    } else {
      // Common time or cut time
      ctx.fillText(timeSigGlyphs.top, 90, staffTop + 25);
    }
    
    // Draw bars and notes
    
    bars.forEach((bar, barIndex) => {
        const barBox = layout.bars[barIndex];
        const barX = barBox.x;

        // Draw bar line
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = RenderConfig.barLineThickness;
        ctx.beginPath();
        ctx.moveTo(barX, staffTop);
        ctx.lineTo(barX, staffTop + (RenderConfig.staffLineSpacing * 4));
        ctx.stroke();

        bar.beats.forEach((_beat, beatIndex) => {
          const beatBox = barBox.beats[beatIndex];
          const timeSig = barBox.timeSignature;
          const beatWidth = beatBox.width;
          // const startBarContentX = barBox.innerX;

          // Draw light beat separator lines (except for first beat which has bar line)
          if (beatIndex > 0) {
            const beatLineX = beatBox.x;
            ctx.strokeStyle = darkMode ? '#777' : '#bbb';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(beatLineX, staffTop);
            ctx.lineTo(beatLineX, staffTop + (RenderConfig.staffLineSpacing * 4));
            ctx.stroke();
          }

          // --- BT HIGHLIGHT SUBSIVISION BACKGROUND ---
        if (highlightedSubdivision && 
            highlightedSubdivision.barIndex === barIndex && 
              Math.floor(highlightedSubdivision.beatIndex) === beatIndex) {

            const durBeats = getDurationValue((selectedTool?.duration as NoteDuration) || (selectedDuration as NoteDuration) || 'quarter');
            const unitsTaken = durBeats / (4 / timeSig.beatValue);
            const bgWidth = beatWidth * unitsTaken;
            const startX = beatBox.x + (highlightedSubdivision.subdivOffset * beatWidth);
          ctx.save();
          ctx.fillStyle = darkMode ? 'rgba(74, 255, 158, 0.15)' : 'rgba(74, 255, 158, 0.2)';
          ctx.fillRect(startX, staffTop, bgWidth, RenderConfig.staffLineSpacing * 4);
          ctx.strokeStyle = darkMode ? 'rgba(74, 255, 158, 0.5)' : 'rgba(74, 255, 158, 0.7)';
          ctx.strokeRect(startX, staffTop, bgWidth, RenderConfig.staffLineSpacing * 4);
          ctx.restore();
        }

        // Draw each note/rest in this beat
        beatBox.elements.forEach(elementBox => {
          const note = elementBox.note;
          if (draggedNote && draggedNote.note.id === elementBox.id) {
            return; // don't draw original, it will be drawn at current position
          }

          ctx.save();
          ctx.fillStyle = darkMode ? 'rgba(74, 158, 255, 0.1)' : 'rgba(74, 158, 255, 0.2)';
          // Fill from left edge of this beat to the right according to proportional length
            ctx.fillRect(elementBox.x, staffTop, elementBox.width, RenderConfig.staffLineSpacing * 4);
            // Optional border to show block edges clearly
            ctx.strokeStyle = darkMode ? 'rgba(74, 158, 255, 0.3)' : 'rgba(74, 158, 255, 0.4)';
            ctx.strokeRect(elementBox.x, staffTop, elementBox.width, RenderConfig.staffLineSpacing * 4);
          ctx.restore();

            // Check if this is a rest or a note
            if (elementBox.type === 'rest') {
              // Render rest
              const restY = staffTop + 20; // Center rest on staff
              const adjustedX = elementBox.exactCenter;

            if (selectedElementId === elementBox.id) {
              ctx.shadowColor = '#4a9eff';
              ctx.shadowBlur = 10;
            }

            ctx.font = `${RenderConfig.noteFontSize}px Bravura`;
            ctx.fillStyle = textColor;
            const restGlyph = getRestGlyph(elementBox.duration as NoteDuration);
            ctx.fillText(restGlyph, adjustedX - 8, restY);

            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
          } else {
            // Render note (existing logic)
            const noteY = getNoteY(elementBox.pitch!, elementBox.octave!);
            const adjustedX = elementBox.exactCenter;
            const adjustedY = noteY + (elementBox.visualOffsetY || 0);

            if (selectedElementId === elementBox.id) {
              ctx.shadowColor = '#4a9eff';
              ctx.shadowBlur = 10;
            }

            // Draw ledger lines
            drawLedgerLines(ctx, adjustedX - 2, noteY, lineColor);

            // Draw note head
            ctx.font = `${RenderConfig.noteFontSize}px Bravura`;
            ctx.fillStyle = textColor;
            const noteHeadGlyph = getNoteHeadGlyph(elementBox.duration as NoteDuration);
            ctx.fillText(noteHeadGlyph, adjustedX - 8, adjustedY);

            // Draw stem (for quarter notes and shorter)
            if (elementBox.duration === 'quarter' || elementBox.duration === 'eighth' || elementBox.duration === 'sixteenth') {
              ctx.strokeStyle = textColor;
              ctx.lineWidth = RenderConfig.stemThickness;
              ctx.beginPath();
              ctx.moveTo(adjustedX + 4, adjustedY);
              ctx.lineTo(adjustedX + 4, adjustedY - RenderConfig.stemHeight);   
              ctx.stroke();

              // Draw flag
              const flagGlyph = getFlagGlyph(elementBox.duration, true);
              if (flagGlyph) {
                ctx.fillText(flagGlyph, adjustedX + 4, adjustedY - RenderConfig.stemHeight);
              }
            }
          
            // Draw accidental
            if (note.accidental) {
              const accidentalGlyph = getAccidentalGlyph(note.accidental);
              ctx.font = `${RenderConfig.noteFontSize}px Bravura`;
              ctx.fillText(accidentalGlyph, adjustedX - 20, adjustedY);
            }

            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
          } // Close the else block for note rendering
        });
      });
    });
    
    // Draw final bar line
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = RenderConfig.barLineThickness;
    ctx.beginPath();
    ctx.moveTo(finalBarX, staffTop);
    ctx.lineTo(finalBarX, staffTop + (RenderConfig.staffLineSpacing * 4));
    ctx.stroke();
    
    // Draw final double bar
    ctx.beginPath();
    ctx.moveTo(finalBarX + 4, staffTop);
    ctx.lineTo(finalBarX + 4, staffTop + (RenderConfig.staffLineSpacing * 4));
    ctx.stroke();

    // --- DRAW HOVER GHOST NOTE ---
      if (hoverGhost && mode === 'design') {
          const { barIndex, beatIndex, pitch, octave, duration, subdivisionOffset } = hoverGhost;
            const intBeatIndex = Math.floor(beatIndex);
            const adjustedX = getTransientLayoutCenter(layout, barIndex, intBeatIndex, subdivisionOffset, duration as any);
            const y = getNoteY(pitch, octave);

          ctx.font = `${RenderConfig.noteFontSize}px Bravura`;
          ctx.fillStyle = textColor;
          const noteHeadGlyph = getNoteHeadGlyph(duration as any);
          ctx.fillText(noteHeadGlyph, adjustedX - 8, y);

        // Draw stem (for quarter notes and shorter)
        if (duration === 'quarter' || duration === 'eighth' || duration === 'sixteenth') {
          ctx.strokeStyle = textColor;
          ctx.lineWidth = RenderConfig.stemThickness;
          ctx.beginPath();
          ctx.moveTo(adjustedX + 4, y);
          ctx.lineTo(adjustedX + 4, y - RenderConfig.stemHeight);
          ctx.stroke();

          // Draw flag
          const flagGlyph = getFlagGlyph(duration as NoteDuration, true);
          if (flagGlyph) {
            ctx.font = `${RenderConfig.noteFontSize}px Bravura`;
            ctx.fillText(flagGlyph, adjustedX + 4, y - RenderConfig.stemHeight);

          }
        }
      }
    // Calculate button dimensions
    const barHeight = RenderConfig.staffLineSpacing * 4;
    const addButtonRadius = (barHeight * 0.7) / 2; // 70% of bar height
    const addButtonCenterX = finalBarX + 4 + addButtonRadius;
    const addButtonCenterY = staffTop + (barHeight / 2);
    
    const removeButtonRadius = addButtonRadius * 0.6;
    const removeButtonCenterX = addButtonCenterX + addButtonRadius + 8;
    const removeButtonCenterY = staffTop + removeButtonRadius + 4;
    
    // Draw + button (half green circle glued to bar line)
    ctx.save();
    ctx.beginPath();
    ctx.arc(addButtonCenterX, addButtonCenterY, addButtonRadius, -Math.PI / 2, Math.PI / 2);
    ctx.fillStyle = hoveredButton === 'add' ? '#66BB6A' : '#4CAF50';
    ctx.fill();
    
    // Draw + sign
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    const plusSize = addButtonRadius * 0.5;
    ctx.beginPath();
    ctx.moveTo(addButtonCenterX, addButtonCenterY - plusSize);
    ctx.lineTo(addButtonCenterX, addButtonCenterY + plusSize);
    ctx.moveTo(addButtonCenterX - plusSize, addButtonCenterY);
    ctx.lineTo(addButtonCenterX + plusSize, addButtonCenterY);
    ctx.stroke();
    ctx.restore();
    
    // Draw - button (full red circle above + button)
    if (bars.length > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(removeButtonCenterX, removeButtonCenterY, removeButtonRadius, 0, Math.PI * 2);
      ctx.fillStyle = hoveredButton === 'remove' ? '#EF5350' : '#f44336';
      ctx.fill();
      
      // Draw - sign
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      const minusSize = removeButtonRadius * 0.5;
      ctx.beginPath();
      ctx.moveTo(removeButtonCenterX - minusSize, removeButtonCenterY);
      ctx.lineTo(removeButtonCenterX + minusSize, removeButtonCenterY);
      ctx.stroke();
      ctx.restore();
    }
    
    // Draw playhead cursor
    if (mode !== 'design' && playheadPosition >= 0) {
      // Calculate playhead X position based on beat position
      const beatsPerBar = bars[0]?.beats.length || 4;
      const barIndex = Math.floor(playheadPosition / beatsPerBar);
      const beatInBar = playheadPosition % beatsPerBar;
      const playheadX = barStartX + (barIndex * RenderConfig.barWidth) + (beatInBar * (RenderConfig.barWidth / beatsPerBar));
      
      // Draw playhead line
      ctx.save();
      ctx.strokeStyle = '#FF9800';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, staffTop - 10);
      ctx.lineTo(playheadX, staffTop + barHeight + 10);
      ctx.stroke();
      
      // Draw playhead triangle at top
      ctx.fillStyle = '#FF9800';
      ctx.beginPath();
      ctx.moveTo(playheadX, staffTop - 10);
      ctx.lineTo(playheadX - 6, staffTop - 2);
      ctx.lineTo(playheadX + 6, staffTop - 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    
    // Draw dragged note on top
    if (draggedNote) {
      const note = draggedNote.note;
      const isRest = (note as any).type === 'rest' && getYToPitch(draggedNote.currentY).pitch === 'R';
      const x = draggedNote.currentX;
      // Get closest pitch Y so it snaps visually to the staff vertically when dragging
      // But if it's way out, maybe just draw it at currentY? We'll snap it for better UX.
      const snappedNoteY = getYToPitch ? getNoteY(getYToPitch(draggedNote.currentY).pitch, getYToPitch(draggedNote.currentY).octave) : draggedNote.currentY;

      ctx.save();
      ctx.globalAlpha = 0.7; // make it slightly transparent
      
      if (!isRest && getYToPitch(draggedNote.currentY).pitch !== 'R') {
        drawLedgerLines(ctx, x - 2, snappedNoteY, lineColor);

        ctx.font = `${RenderConfig.noteFontSize}px Bravura`;
        ctx.fillStyle = textColor;
        const noteHeadGlyph = getNoteHeadGlyph(note.duration);
        ctx.fillText(noteHeadGlyph, x - 8, snappedNoteY);
        
        if (note.duration === 'quarter' || note.duration === 'eighth' || note.duration === 'sixteenth') {
          ctx.strokeStyle = textColor;
          ctx.lineWidth = RenderConfig.stemThickness;
          ctx.beginPath();
          ctx.moveTo(x + 4, snappedNoteY);
          ctx.lineTo(x + 4, snappedNoteY - RenderConfig.stemHeight);
          ctx.stroke();
          
          const flagGlyph = getFlagGlyph(note.duration, true);
          if (flagGlyph) {
            ctx.font = `${RenderConfig.noteFontSize}px Bravura`;
            ctx.fillText(flagGlyph, x + 4, snappedNoteY - RenderConfig.stemHeight);
          }
        }
        
        if (note.accidental) {
          const accidentalGlyph = getAccidentalGlyph(note.accidental);
          ctx.font = `${RenderConfig.noteFontSize}px Bravura`;
          ctx.fillText(accidentalGlyph, x - 20, snappedNoteY);
        }
      } else {
        // Draw rest
        ctx.font = `${RenderConfig.noteFontSize}px Bravura`;
        ctx.fillStyle = textColor;
        const restGlyph = getRestGlyph(note.duration);
        const staffTop = (height / 2) - (RenderConfig.staffLineSpacing * 2);
        ctx.fillText(restGlyph, x - 5, staffTop + 20); // Center staff Y
      }
      ctx.restore();
    }
  }, [staff, width, height, darkMode, getNoteY, drawLedgerLines, hoveredButton, playheadPosition, mode, draggedNote, getYToPitch, highlightedSubdivision, hoverGhost, selectedTool, selectedDuration]);

  /**
   * Render canvas
   */
  useEffect(() => {
    if (!fontLoaded) return; // Wait for font to load
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    drawStaff(ctx);
  }, [drawStaff, fontLoaded]);

  const getHitNote = useCallback((x: number, y: number) => {
    for (let barIndex = 0; barIndex < staff.bars.length; barIndex++) {
      const barBox = layout.bars[barIndex];
      for (let beatIndex = 0; beatIndex < barBox.beats.length; beatIndex++) {
        const beatBox = barBox.beats[beatIndex];

        // Search in reverse so drawn-on-top elements are hit first
        for (let i = beatBox.elements.length - 1; i >= 0; i--) {
          const element = beatBox.elements[i];
          if (element.type === 'rest') continue;

          // Pure layout bounds math, perfectly synced with visual layout
          const adjustedY = getNoteY(element.pitch!, element.octave!) + (element.visualOffsetY || 0);
          const hitRadiusY = 15;
          const noteStartX = element.x;
          const noteEndX = Math.max(element.x + element.width, element.x + 20);

          if (x >= noteStartX && x <= noteEndX && Math.abs(y - adjustedY) <= hitRadiusY) {
            return { barIndex, beatIndex, note: element.note, adjustedX: element.exactCenter, adjustedY };
          }
        }
      }
    }
    return null;
  }, [layout, getNoteY]);

  /**
   * Handle double click
   */
  const handleDoubleClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'design') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoom;
    const y = (event.clientY - rect.top) / zoom;
    
    const hitNoteInfo = getHitNote(x, y);
    if (hitNoteInfo && onRemoveNote) {
      onRemoveNote(staff.id, hitNoteInfo.barIndex, hitNoteInfo.beatIndex, hitNoteInfo.note.id);
    }
  }, [mode, staff.id, getHitNote, onRemoveNote]);

  const btEvents = useStaffBtEvents({
    layout, staff, mode, zoom, height, RenderConfig,
    selectedDuration, selectedRest, selectedTool,
    draggedNote, setDraggedNote,
    hoveredButton, setHoveredButton,
    isDraggingPlayhead, setIsDraggingPlayhead,
    onAddBar, onRemoveBar, onPlayheadChange,
    onAddNote, onRemoveNote, onMoveNote, onSelectNote,
    getYToPitch, getHitNote, canvasRef,
    setHighlightedSubdivision, setHoverGhost
  });

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={btEvents.handleCanvasClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={btEvents.handleMouseDown}
      onMouseMove={btEvents.handleMouseMove}
      onMouseUp={btEvents.handleMouseUp}
      onMouseLeave={btEvents.handleMouseLeave}
      style={{
        cursor: draggedNote ? 'grabbing' : (hoveredButton ? 'pointer' : isDraggingPlayhead ? 'grabbing' : 'default'),
        display: 'block',
        transform: `scale(${zoom})`,
        transformOrigin: 'top left'
      }}
    />
  );
};



