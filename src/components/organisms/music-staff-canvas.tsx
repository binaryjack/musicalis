import { useCallback, useEffect, useRef, useState } from 'react';
import {
    getAccidentalGlyph,
    getClefGlyph,
    getFlagGlyph,
    getNoteHeadGlyph,
    getRestGlyph,
    getTimeSignatureGlyphs
} from '../../shared/utils/smufl-glyphs';
import type { Note, NoteDuration, Staff } from '../../types/musicTypes';
import type { MusicalTool } from './MusicalPalette';
import { MusicalElementType } from '../../types';

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
}

const RenderConfig = {
  staffHeight: 120,
  barWidth: 200,
  staffLineSpacing: 10,
  staffLineCount: 5,
  noteRadius: 4,
  barLineThickness: 2,
  clefFontSize: 42,
  noteFontSize: 30,
  timeSigFontSize: 24,
  stemHeight: 35,
  stemThickness: 1.5,
};

export const MusicStaffCanvas = function(props: MusicStaffCanvasProps) {
  const {
    staff,
    mode = 'design',
    width = 1000,
    height = 200,
    playheadPosition = 0,
    darkMode = false,
    selectedDuration = 'quarter',
    selectedTool,
    onAddBar,
    onRemoveBar,
    onPlayheadChange,
    onAddNote,
    onAddRest,
    onRemoveNote,
    onMoveNote,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingNoteRef = useRef(false);
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
   * Calculate remaining duration available in a beat
   */
  const getRemainingDuration = useCallback((): number => {
    return 1;
  }, []);

  /**
   * Check if a note can fit in the specified beat
   */
    const canFitNote = useCallback((_barIndex: number, _beatIndex: number, duration: NoteDuration): boolean => {
      const remainingDuration = getRemainingDuration();
      const noteDuration = getDurationValue(duration);
      return noteDuration <= remainingDuration;
    }, [getRemainingDuration]);

  const getNoteY = useCallback((pitch: string, octave: number): number => {
    const staffTop = 40;
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
    const staffTop = 40;
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
    const staffTop = 40;
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

  /**
   * Draw the staff
   */
  const drawStaff = useCallback((ctx: CanvasRenderingContext2D) => {
    const bars = staff.bars;
    const barStartX = 130;
    const finalBarX = barStartX + (bars.length * RenderConfig.barWidth);
    
    ctx.clearRect(0, 0, width, height);
    
    // Set colors based on theme
    const lineColor = darkMode ? '#e0e0e0' : '#333';
    const textColor = darkMode ? '#e0e0e0' : '#333';
    
    // Draw staff label
    ctx.fillStyle = textColor;
    ctx.font = '14px Arial';
    ctx.fillText(staff.name, 10, 20);
    
    // Draw the 5 staff lines
    const staffTop = 40;
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
      const barX = barStartX + (barIndex * RenderConfig.barWidth);
      
      // Draw bar line
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = RenderConfig.barLineThickness;
      ctx.beginPath();
      ctx.moveTo(barX, staffTop);
      ctx.lineTo(barX, staffTop + (RenderConfig.staffLineSpacing * 4));
      ctx.stroke();
      
      // Draw beats in this bar
      const beatsCount = bar.beats.length;
      const beatWidth = RenderConfig.barWidth / beatsCount;
      
      bar.beats.forEach((beat, beatIndex) => {
        // Draw light beat separator lines (except for first beat which has bar line)
        if (beatIndex > 0) {
          const beatLineX = barX + (beatIndex * beatWidth);
          ctx.strokeStyle = darkMode ? '#777' : '#bbb';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(beatLineX, staffTop);
          ctx.lineTo(beatLineX, staffTop + (RenderConfig.staffLineSpacing * 4));
          ctx.stroke();
        }
        
        const beatX = barX + (beatIndex * beatWidth) + (beatWidth / 2);
        
        // Draw each note/rest in this beat
        beat.notes.forEach(note => {
          if (draggedNote && draggedNote.note.id === note.id) {
            return; // don't draw original, it will be drawn at current position
          }

          // Check if this is a rest or a note
          if ((note as any).type === 'rest') {
            // Render rest
            const restY = staffTop + 20; // Center rest on staff
            const adjustedX = beatX + (note.visualOffsetX || 0);
            
            ctx.font = `${RenderConfig.noteFontSize}px Bravura`;
            ctx.fillStyle = textColor;
            const restGlyph = getRestGlyph(note.duration);
            ctx.fillText(restGlyph, adjustedX - 8, restY);
          } else {
            // Render note (existing logic)
            const noteY = getNoteY(note.pitch, note.octave);
            const adjustedX = beatX + (note.visualOffsetX || 0);
            const adjustedY = noteY + (note.visualOffsetY || 0);
            
            // Draw ledger lines
            drawLedgerLines(ctx, adjustedX - 2, noteY, lineColor);

            // Draw note head
            ctx.font = `${RenderConfig.noteFontSize}px Bravura`;
            ctx.fillStyle = textColor;
            const noteHeadGlyph = getNoteHeadGlyph(note.duration);
            ctx.fillText(noteHeadGlyph, adjustedX - 8, adjustedY);
            
            // Draw stem (for quarter notes and shorter)
            if (note.duration === 'quarter' || note.duration === 'eighth' || note.duration === 'sixteenth') {
              ctx.strokeStyle = textColor;
            ctx.lineWidth = RenderConfig.stemThickness;
            ctx.beginPath();
            ctx.moveTo(adjustedX + 4, adjustedY);
            ctx.lineTo(adjustedX + 4, adjustedY - RenderConfig.stemHeight);
            ctx.stroke();
            
            // Draw flag
            const flagGlyph = getFlagGlyph(note.duration, true);
            if (flagGlyph) {
              ctx.font = `${RenderConfig.noteFontSize}px Bravura`;
              ctx.fillText(flagGlyph, adjustedX + 4, adjustedY - RenderConfig.stemHeight);
            }
          }
          
          // Draw accidental
          if (note.accidental) {
            const accidentalGlyph = getAccidentalGlyph(note.accidental);
            ctx.font = `${RenderConfig.noteFontSize}px Bravura`;
            ctx.fillText(accidentalGlyph, adjustedX - 20, adjustedY);
          }
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
      const x = draggedNote.currentX;
      // Get closest pitch Y so it snaps visually to the staff vertically when dragging
      // But if it's way out, maybe just draw it at currentY? We'll snap it for better UX.
      const snappedNoteY = getYToPitch ? getNoteY(getYToPitch(draggedNote.currentY).pitch, getYToPitch(draggedNote.currentY).octave) : draggedNote.currentY;

      ctx.save();
      ctx.globalAlpha = 0.7; // make it slightly transparent
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
      ctx.restore();
    }
  }, [staff, width, height, darkMode, getNoteY, drawLedgerLines, hoveredButton, playheadPosition, mode, draggedNote, getYToPitch]);

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
    const barStartX = 130;
    
    for (let barIndex = 0; barIndex < staff.bars.length; barIndex++) {
      const bar = staff.bars[barIndex];
      const barX = barStartX + (barIndex * RenderConfig.barWidth);
      const beatsCount = bar.beats.length;
      const beatWidth = RenderConfig.barWidth / beatsCount;
      
      for (let beatIndex = 0; beatIndex < bar.beats.length; beatIndex++) {
        const beat = bar.beats[beatIndex];
        const beatX = barX + (beatIndex * beatWidth) + (beatWidth / 2);
        
        for (const note of beat.notes) {
          const noteY = getNoteY(note.pitch, note.octave);
          const adjustedX = beatX + (note.visualOffsetX || 0);
          const adjustedY = noteY + (note.visualOffsetY || 0);
          
          // Hit detection radius (approx size of note head + leeway)
          const hitRadiusX = 15;
          const hitRadiusY = 15;
          
          if (Math.abs(x - adjustedX) <= hitRadiusX && Math.abs(y - adjustedY) <= hitRadiusY) {
            return { barIndex, beatIndex, note, adjustedX, adjustedY };
          }
        }
      }
    }
    return null;
  }, [staff, getNoteY]);

  /**
   * Handle double click
   */
  const handleDoubleClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'design') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const hitNoteInfo = getHitNote(x, y);
    if (hitNoteInfo && onRemoveNote) {
      onRemoveNote(staff.id, hitNoteInfo.barIndex, hitNoteInfo.beatIndex, hitNoteInfo.note.id);
    }
  }, [mode, staff.id, getHitNote, onRemoveNote]);

  /**
   * Handle canvas click
   */
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingNoteRef.current) {
      isDraggingNoteRef.current = false;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const barStartX = 130;
    const finalBarX = barStartX + (staff.bars.length * RenderConfig.barWidth);
    const staffTop = 40;
    const barHeight = RenderConfig.staffLineSpacing * 4;
    
    // Calculate button positions (same as in drawStaff)
    const addButtonRadius = (barHeight * 0.7) / 2;
    const addButtonCenterX = finalBarX + 4 + addButtonRadius;
    const addButtonCenterY = staffTop + (barHeight / 2);
    
    const removeButtonRadius = addButtonRadius * 0.6;
    const removeButtonCenterX = addButtonCenterX + addButtonRadius + 8;
    const removeButtonCenterY = staffTop + removeButtonRadius + 4;
    
    // Check if clicked on + button (circular hit detection)
    const distToAdd = Math.sqrt(
      Math.pow(x - addButtonCenterX, 2) + Math.pow(y - addButtonCenterY, 2)
    );
    if (distToAdd <= addButtonRadius && x >= finalBarX + 4) { // Only right half
      onAddBar?.(staff.id, staff.bars.length - 1);
      return;
    }
    
    // Check if clicked on - button (circular hit detection)
    if (staff.bars.length > 1) {
      const distToRemove = Math.sqrt(
        Math.pow(x - removeButtonCenterX, 2) + Math.pow(y - removeButtonCenterY, 2)
      );
      if (distToRemove <= removeButtonRadius) {
        onRemoveBar?.(staff.id, staff.bars.length - 1);
        return;
      }
    }
    
    // Check if clicked on staff area to add note or set playhead position
    if (x >= barStartX && x < finalBarX && y >= staffTop - 40 && y <= staffTop + barHeight + 40) {
      const beatsPerBar = staff.bars[0]?.beats.length || 4;
      const relativeX = x - barStartX;
      const barIndex = Math.floor(relativeX / RenderConfig.barWidth);
      const xInBar = relativeX % RenderConfig.barWidth;
      const beatWidth = RenderConfig.barWidth / beatsPerBar;
      const beatIndex = Math.floor(xInBar / beatWidth);

      // If clicked near staff lines (within staff area), add a note or rest
      if (mode === 'design' && y >= staffTop - 40 && y <= staffTop + barHeight + 40) {
        
        // Prevent adding note/rest if we clicked on an existing note
        if (getHitNote(x, y)) {
          return;
        }

        // Check if we're within valid bar/beat range
        if (barIndex >= 0 && barIndex < staff.bars.length && beatIndex >= 0 && beatIndex < beatsPerBar) {
          const durationToUse = selectedTool?.duration || selectedDuration;
          
          // Check if note/rest can fit in this beat
          if (!canFitNote(barIndex, beatIndex, durationToUse)) {
            console.warn(`Cannot fit ${durationToUse} ${selectedTool?.type || 'note'} in beat ${beatIndex} - already full`);
            return;
          }
          
          // Handle based on selected tool type
          if (selectedTool?.type === MusicalElementType.REST && onAddRest) {
            // Add rest - rests don't need pitch/octave
            onAddRest(staff.id, barIndex, beatIndex, durationToUse);
            return;
          } else if ((selectedTool?.type === MusicalElementType.NOTE || !selectedTool) && onAddNote) {
            // Add note - determine pitch based on Y position
            const { pitch, octave } = getYToPitch(y);
            onAddNote(staff.id, barIndex, beatIndex, pitch, octave, durationToUse);
            return;
          }
        }
      }
      
      // Otherwise, set playhead position
      if (mode !== 'design') {
        const totalBeats = (relativeX / RenderConfig.barWidth) * beatsPerBar;
        onPlayheadChange?.(Math.max(0, totalBeats));
      }
    }
  }, [staff, mode, onAddBar, onRemoveBar, onPlayheadChange, onAddNote, onAddRest, selectedDuration, selectedTool, canFitNote, getYToPitch, getHitNote]);

  /**
   * Handle mouse move for hover effects
   */
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const barStartX = 130;
    const finalBarX = barStartX + (staff.bars.length * RenderConfig.barWidth);
    const staffTop = 40;
    const barHeight = RenderConfig.staffLineSpacing * 4;
    
    // Calculate button positions
    const addButtonRadius = (barHeight * 0.7) / 2;
    const addButtonCenterX = finalBarX + 4 + addButtonRadius;
    const addButtonCenterY = staffTop + (barHeight / 2);
    
    const removeButtonRadius = addButtonRadius * 0.6;
    const removeButtonCenterX = addButtonCenterX + addButtonRadius + 8;
    const removeButtonCenterY = staffTop + removeButtonRadius + 4;
    
    // Check hover state for + button
    const distToAdd = Math.sqrt(
      Math.pow(x - addButtonCenterX, 2) + Math.pow(y - addButtonCenterY, 2)
    );
    const isHoveringAdd = distToAdd <= addButtonRadius && x >= finalBarX + 4;
    
    // Check hover state for - button
    let isHoveringRemove = false;
    if (staff.bars.length > 1) {
      const distToRemove = Math.sqrt(
        Math.pow(x - removeButtonCenterX, 2) + Math.pow(y - removeButtonCenterY, 2)
      );
      isHoveringRemove = distToRemove <= removeButtonRadius;
    }
    
    // Update hover state
    const newHoverState = isHoveringAdd ? 'add' : isHoveringRemove ? 'remove' : null;
    if (newHoverState !== hoveredButton) {
      setHoveredButton(newHoverState);
    }
    
    // Handle note dragging
    if (draggedNote && mode === 'design') {
      isDraggingNoteRef.current = true;
      setDraggedNote({
        ...draggedNote,
        currentX: x,
        currentY: y
      });
      return;
    }

    // Handle playhead dragging
    if (isDraggingPlayhead && mode !== 'design') {
      const barStartX = 130;
      const finalBarX = barStartX + (staff.bars.length * RenderConfig.barWidth);
      
      if (x >= barStartX && x < finalBarX) {
        const beatsPerBar = staff.bars[0]?.beats.length || 4;
        const relativeX = x - barStartX;
        const totalBeats = (relativeX / RenderConfig.barWidth) * beatsPerBar;
        onPlayheadChange?.(Math.max(0, totalBeats));
      }
    }
  }, [staff, mode, hoveredButton, isDraggingPlayhead, onPlayheadChange, draggedNote]);

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (mode === 'design') {
      const hitNoteInfo = getHitNote(x, y);
      if (hitNoteInfo) {
        isDraggingNoteRef.current = false;
        setDraggedNote({
          barIndex: hitNoteInfo.barIndex,
          beatIndex: hitNoteInfo.beatIndex,
          note: hitNoteInfo.note,
          currentX: x,
          currentY: y
        });
        return;
      }
    }

    const barStartX = 130;
    const finalBarX = barStartX + (staff.bars.length * RenderConfig.barWidth);
    const staffTop = 40;
    const barHeight = RenderConfig.staffLineSpacing * 4;

    // Check if mousedown on playhead area (staff region)
    if (x >= barStartX && x < finalBarX && y >= staffTop - 40 && y <= staffTop + barHeight + 40) {
      if (mode !== 'design') {
        setIsDraggingPlayhead(true);
      }
    }
  }, [staff, mode, getHitNote]);

  const handleMouseUp = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedNote && mode === 'design') {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const staffTop = 40;
        const barHeight = RenderConfig.staffLineSpacing * 4;
        
        // If dragged outside staff, treat as remove target or just ignore? User requested "dragging them out" to remove.
        if (y < staffTop - 60 || y > staffTop + barHeight + 60) {
          if (onRemoveNote) {
            onRemoveNote(staff.id, draggedNote.barIndex, draggedNote.beatIndex, draggedNote.note.id);
          }
        } else {
          // Calculate new bar, beat, pitch
          const barStartX = 130;
          const relativeX = x - barStartX;
          
          if (relativeX >= 0) {
            const beatsPerBar = staff.bars[0]?.beats.length || 4;
            const barIndex = Math.floor(relativeX / RenderConfig.barWidth);
            const xInBar = relativeX % RenderConfig.barWidth;
            const beatWidth = RenderConfig.barWidth / beatsPerBar;
            const beatIndex = Math.floor(xInBar / beatWidth);

            if (barIndex >= 0 && barIndex < staff.bars.length && beatIndex >= 0 && beatIndex < beatsPerBar) {
              const { pitch, octave } = getYToPitch(y);
              
              // Only move if it actually changed position (or pitch/octave) to prevent unnecessary updates
              // BUT we also need to consider if it moved within the same beat but changed pitch
              if (onMoveNote && (
                  draggedNote.barIndex !== barIndex || 
                  draggedNote.beatIndex !== beatIndex || 
                  draggedNote.note.pitch !== pitch || 
                  draggedNote.note.octave !== octave)) {
                onMoveNote(
                  staff.id, 
                  draggedNote.barIndex, 
                  draggedNote.beatIndex, 
                  draggedNote.note.id, 
                  barIndex, 
                  beatIndex, 
                  pitch, 
                  octave
                );
              }
            }
          }
        }
      }
      setDraggedNote(null);
    }
    
    setIsDraggingPlayhead(false);
  }, [draggedNote, mode, staff, onRemoveNote, onMoveNote, getYToPitch]);

  const handleMouseLeave = useCallback(() => {
    setHoveredButton(null);
    setIsDraggingPlayhead(false);
    if (draggedNote) {
      setDraggedNote(null); // Cancel drag if left canvas
    }
  }, [draggedNote]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleCanvasClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: draggedNote ? 'grabbing' : (hoveredButton ? 'pointer' : isDraggingPlayhead ? 'grabbing' : 'default'), display: 'block' }}
    />
  );
};
