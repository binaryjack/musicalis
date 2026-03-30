import { useCallback, useEffect, useRef, useState } from 'react';
import type { Staff, NoteDuration } from '../../types/musicTypes';
import { 
  getClefGlyph, 
  getNoteHeadGlyph, 
  getFlagGlyph,
  getTimeSignatureGlyphs,
  getAccidentalGlyph 
} from '../../shared/utils/smufl-glyphs';

export interface MusicStaffCanvasProps {
  staff: Staff;
  width?: number;
  height?: number;
  playheadPosition?: number;
  darkMode?: boolean;
  selectedDuration?: NoteDuration;
  selectedRest?: string;
  onAddBar?: (staffId: string, afterBarIndex: number) => void;
  onRemoveBar?: (staffId: string, barIndex: number) => void;
  onNoteClick?: (noteId: string, staffId: string) => void;
  onPlayheadChange?: (position: number) => void;
  onAddNote?: (staffId: string, barIndex: number, beatIndex: number, pitch: string, octave: number, duration: NoteDuration) => void;
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
    width = 1000,
    height = 200,
    playheadPosition = 0,
    darkMode = false,
    selectedDuration = 'quarter',
    selectedRest,
    onAddBar,
    onRemoveBar,
    onPlayheadChange,
    onAddNote,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<'add' | 'remove' | null>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

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
  const getRemainingDuration = (barIndex: number, beatIndex: number): number => {
    const bar = staff.bars[barIndex];
    if (!bar) return 1;
    
    const beat = bar.beats[beatIndex];
    if (!beat) return 1;
    
    // Calculate total duration used in this beat (in quarter notes)
    const usedDuration = beat.notes.reduce((sum, note) => {
      return sum + getDurationValue(note.duration);
    }, 0);
    
    // Each beat is worth 1 quarter note
    return 1 - usedDuration;
  };

  /**
   * Check if a note can fit in the specified beat
   */
  const canFitNote = (barIndex: number, beatIndex: number, duration: NoteDuration): boolean => {
    const remainingDuration = getRemainingDuration(barIndex, beatIndex);
    const noteDuration = getDurationValue(duration);
    return noteDuration <= remainingDuration;
  };

  /**
   * Get subdivision snap position based on duration
   */
  const getSubdivisionSnap = (xInBeat: number, beatWidth: number, duration: NoteDuration): number => {
    const durationValue = getDurationValue(duration);
    
    // Calculate number of subdivisions based on smallest note currently possible
    const subdivisions = Math.max(1, Math.floor(1 / durationValue));
    const subdivisionWidth = beatWidth / subdivisions;
    
    // Snap to nearest subdivision
    const subdivisionIndex = Math.round(xInBeat / subdivisionWidth);
    return subdivisionIndex * subdivisionWidth;
  };

  /**
   * Get Y position for a note on the staff
   */
  const getNoteY = useCallback((pitch: string, octave: number): number => {
    const staffTop = 40;
    const lineSpacing = RenderConfig.staffLineSpacing;
    
    // Treble clef: lines are E5, G5, B5, D6, F6
    // Spaces are F5, A5, C6, E6
    const trebleNotes: Record<string, number> = {
      'F6': staffTop,                           // Above staff
      'E6': staffTop + lineSpacing * 0.5,       // Top space
      'D6': staffTop + lineSpacing * 1,         // Top line
      'C6': staffTop + lineSpacing * 1.5,       // 2nd space
      'B5': staffTop + lineSpacing * 2,         // 2nd line
      'A5': staffTop + lineSpacing * 2.5,       // 3rd space
      'G5': staffTop + lineSpacing * 3,         // Middle line
      'F5': staffTop + lineSpacing * 3.5,       // 4th space
      'E5': staffTop + lineSpacing * 4,         // Bottom line
      'D5': staffTop + lineSpacing * 4.5,       // Below staff
      'C5': staffTop + lineSpacing * 5,
      'B4': staffTop + lineSpacing * 5.5,
      'A4': staffTop + lineSpacing * 6,
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
        
        // Draw each note in this beat
        beat.notes.forEach(note => {
          const noteY = getNoteY(note.pitch, note.octave);
          const adjustedX = beatX + (note.visualOffsetX || 0);
          const adjustedY = noteY + (note.visualOffsetY || 0);
          
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
    if (playheadPosition >= 0) {
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
    
  }, [staff, width, height, darkMode, getNoteY, hoveredButton, playheadPosition]);

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

  /**
   * Handle canvas click
   */
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
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
    if (x >= barStartX && x < finalBarX && y >= staffTop - 20 && y <= staffTop + barHeight + 20) {
      const beatsPerBar = staff.bars[0]?.beats.length || 4;
      const relativeX = x - barStartX;
      const barIndex = Math.floor(relativeX / RenderConfig.barWidth);
      const xInBar = relativeX % RenderConfig.barWidth;
      const beatWidth = RenderConfig.barWidth / beatsPerBar;
      const beatIndex = Math.floor(xInBar / beatWidth);
      
      // If clicked near staff lines (within staff area), add a note
      if (y >= staffTop && y <= staffTop + barHeight && onAddNote) {
        // Check if we're within valid bar/beat range
        if (barIndex >= 0 && barIndex < staff.bars.length && beatIndex >= 0 && beatIndex < beatsPerBar) {
          // Check if note can fit in this beat
          if (!canFitNote(barIndex, beatIndex, selectedDuration)) {
            console.warn(`Cannot fit ${selectedDuration} note in beat ${beatIndex} - already full`);
            return;
          }
          
          // Calculate snap position within beat for subdivision (for future use)
          // const xInBeat = xInBar % beatWidth;
          // const snappedXOffset = getSubdivisionSnap(xInBeat, beatWidth, selectedDuration);
          
          // Determine pitch based on Y position
          const { pitch, octave } = getYToPitch(y);
          
          onAddNote(staff.id, barIndex, beatIndex, pitch, octave, selectedDuration);
          return;
        }
      }
      
      // Otherwise, set playhead position
      const totalBeats = (relativeX / RenderConfig.barWidth) * beatsPerBar;
      onPlayheadChange?.(Math.max(0, totalBeats));
    }
  }, [staff, onAddBar, onRemoveBar, onPlayheadChange, onAddNote, selectedDuration, canFitNote, getSubdivisionSnap]);
  
  /**
   * Convert Y position to pitch and octave
   */
  const getYToPitch = (y: number): { pitch: string; octave: number } => {
    const staffTop = 40;
    const lineSpacing = RenderConfig.staffLineSpacing;
    
    // Map Y positions to notes (treble clef)
    const notes = [
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
  };

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
    
    // Handle playhead dragging
    if (isDraggingPlayhead) {
      const barStartX = 130;
      const finalBarX = barStartX + (staff.bars.length * RenderConfig.barWidth);
      
      if (x >= barStartX && x < finalBarX) {
        const beatsPerBar = staff.bars[0]?.beats.length || 4;
        const relativeX = x - barStartX;
        const totalBeats = (relativeX / RenderConfig.barWidth) * beatsPerBar;
        onPlayheadChange?.(Math.max(0, totalBeats));
      }
    }
  }, [staff, hoveredButton, isDraggingPlayhead, onPlayheadChange]);

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const barStartX = 130;
    const finalBarX = barStartX + (staff.bars.length * RenderConfig.barWidth);
    const staffTop = 40;
    const barHeight = RenderConfig.staffLineSpacing * 4;
    
    // Check if mousedown on playhead area (staff region)
    if (x >= barStartX && x < finalBarX && y >= staffTop - 20 && y <= staffTop + barHeight + 20) {
      setIsDraggingPlayhead(true);
    }
  }, [staff]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingPlayhead(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredButton(null);
    setIsDraggingPlayhead(false);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: hoveredButton ? 'pointer' : isDraggingPlayhead ? 'grabbing' : 'default', display: 'block' }}
    />
  );
};
