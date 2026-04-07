import { useCallback, useRef, useState } from 'react'
import { getNoteY, getYToPitch } from '../features/staff/utils/staff-pitch'
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

interface MusicStaffSvgProps {
  staff: Staff;
  mode: 'design' | 'playback';
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
  onResizeDuration?: (staffId: string, barIndex: number, beatIndex: number, noteId: string, newDuration: NoteDuration) => void;
  selectedElementId?: string | null;
  onSelectNote?: (note: { barIndex: number; beatIndex: number; note: Note } | null) => void;
  zoom?: number;
}

const RC = {
  staffLineSpacing: 12,
  staffLineCount: 5,
  barLineThickness: 2,
  clefFontSize: 50,
  noteFontSize: 36,
  timeSigFontSize: 28,
  stemHeight: 40,
  stemThickness: 1.5,
  barWidth: 280,
  barPadding: 5,
} as const;

/** Y positions of ledger lines needed for a note at noteY, relative to the staff. */
function getLedgerLineYs(noteY: number, staffTop: number, staffBottom: number, lineSpacing: number): number[] {
  const result: number[] = [];
  if (noteY < staffTop - 1) {
    for (let y = staffTop - lineSpacing; y + 1 >= noteY; y -= lineSpacing) result.push(y);
  } else if (noteY > staffBottom + 1) {
    for (let y = staffBottom + lineSpacing; y - 1 <= noteY; y += lineSpacing) result.push(y);
  }
  return result;
}

export const MusicStaffSvg = function(props: MusicStaffSvgProps) {
  const {
    staff,
    mode = 'design',
    height = 200,
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
    onResizeDuration,
    selectedElementId,
    onSelectNote,
    zoom = 1,
  } = props;

  const svgRef = useRef<SVGSVGElement>(null);

  const [hoveredButton, setHoveredButton] = useState<'add' | 'remove' | null>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [draggedNote, setDraggedNote] = useState<{
    barIndex: number; beatIndex: number; note: Note; currentX: number; currentY: number;
  } | null>(null);
  const [highlightedSubdivision, setHighlightedSubdivision] = useState<HoveredSubdivision | null>(null);
  const [hoverGhost, setHoverGhost] = useState<{
    pitch: string; octave: number; duration: string;
    barIndex: number; beatIndex: number; subdivisionOffset: number;
  } | null>(null);
  const [sustainRange, setSustainRange] = useState<{ barIndex: number; startX: number; endX: number } | null>(null);

  // ── Layout ──────────────────────────────────────────────────────────────────
  const barStartX = 130;
  const staffTop = (height / 2) - (RC.staffLineSpacing * 2);
  const staffBottom = staffTop + RC.staffLineSpacing * 4;
  const layout = calculateStaffLayout(staff, {
    clefPadding: barStartX,
    barPadding: RC.barPadding,
    barWidth: RC.barWidth,
    staffHeight: RC.staffLineSpacing * 4,
    staffTop,
  });
  const finalBarX = layout.totalWidth;
  const svgWidth = finalBarX + 80; // room for add/remove buttons

  // ── Theme ───────────────────────────────────────────────────────────────────
  const lineColor   = darkMode ? '#e0e0e0' : '#333';
  const textColor   = darkMode ? '#e0e0e0' : '#333';
  const beatColor   = darkMode ? '#777'    : '#bbb';
  const ghostColor  = darkMode ? 'rgba(224,224,224,0.35)' : 'rgba(51,51,51,0.35)';

  const getHitNote = useCallback((x: number, y: number) => {
    let bestMatch: { barIndex: number; beatIndex: number; note: Note; adjustedX: number; adjustedY: number } | null = null;
    let bestDist = Infinity;

    for (let bi = 0; bi < staff.bars.length; bi++) {
      const barBox = layout.bars[bi];
      for (let bti = 0; bti < barBox.beats.length; bti++) {
        const beatBox = barBox.beats[bti];
        for (const el of beatBox.elements) {
          if (el.type === 'rest') continue;
          const adjY     = getNoteY(el.pitch!, el.octave!, height) + (el.visualOffsetY || 0);
          const noteEndX = Math.max(el.x + el.width, el.x + 20);
          if (x >= el.x && x <= noteEndX && Math.abs(y - adjY) <= 15) {
            const dist = Math.abs(y - adjY);
            if (dist < bestDist) {
              bestDist = dist;
              bestMatch = { barIndex: bi, beatIndex: bti, note: el.note, adjustedX: el.exactCenter, adjustedY: adjY };
            }
          }
        }
      }
    }
    return bestMatch;
  }, [layout, height, staff.bars.length]);

  const getDurationValue = (duration: string): number => {
    const map: Record<string, number> = { whole:4, half:2, quarter:1, eighth:0.5, sixteenth:0.25 };
    return map[duration] ?? 1;
  };

  // ── BT hook ─────────────────────────────────────────────────────────────────
  const btEvents = useStaffBtEvents({
    layout, staff, mode, height, RenderConfig: RC,
    selectedDuration, selectedRest, selectedTool,
    draggedNote, setDraggedNote,
    hoveredButton, setHoveredButton,
    isDraggingPlayhead, setIsDraggingPlayhead,
    onAddBar, onRemoveBar, onPlayheadChange,
    onAddNote, onRemoveNote, onMoveNote, onSelectNote,
    getYToPitch: (y: number) => getYToPitch(y, height), getHitNote, svgRef,
    setHighlightedSubdivision, setHoverGhost, setSustainRange, onResizeDuration,
  });

  // ── Double-click removes note ────────────────────────────────────────────────
  const handleDoubleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== 'design') return;
    if (!e.altKey) return;
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const pt = svgEl.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svgEl.getScreenCTM();
    if (!ctm) return;
    const { x, y } = pt.matrixTransform(ctm.inverse());
    const hit = getHitNote(x, y);
    if (hit && onRemoveNote) onRemoveNote(staff.id, hit.barIndex, hit.beatIndex, hit.note.id);
  }, [mode, staff.id, getHitNote, onRemoveNote]);

  // ── Note rendering helper ────────────────────────────────────────────────────
  // xOffset shifts the notehead left/right for chord collision handling.
  // headOnly=true skips the stem (chord clusters draw one shared stem).
  const renderNoteGlyph = (
    key: string,
    cx: number,
    cy: number,
    duration: string,
    accidental?: '#' | 'b' | '♮',
    fill?: string,
    opacity = 1,
    xOffset = 0,
    headOnly = false,
  ) => {
    const ledgerYs = getLedgerLineYs(cy, staffTop, staffBottom, RC.staffLineSpacing);
    const headGlyph = getNoteHeadGlyph(duration);
    const hasStem   = !headOnly && (duration === 'quarter' || duration === 'eighth' || duration === 'sixteenth');
    const flagGlyph = getFlagGlyph(duration, true);
    const color = fill ?? textColor;
    const hx = cx + xOffset;
    return (
      <g key={key} opacity={opacity}>
        {ledgerYs.map(ly => (
          <line key={ly} x1={hx - 14} y1={ly} x2={hx + 10} y2={ly} stroke={lineColor} strokeWidth={1} />
        ))}
        {accidental && (
          <text x={hx - 20} y={cy} fontFamily="Bravura" fontSize={RC.noteFontSize} fill={color} dominantBaseline="alphabetic">
            {getAccidentalGlyph(accidental)}
          </text>
        )}
        <text x={hx - 8} y={cy} fontFamily="Bravura" fontSize={RC.noteFontSize} fill={color} dominantBaseline="alphabetic">
          {headGlyph}
        </text>
        {hasStem && (
          <>
            <line x1={hx + 4} y1={cy} x2={hx + 4} y2={cy - RC.stemHeight} stroke={color} strokeWidth={RC.stemThickness} />
            {flagGlyph && (
              <text x={hx + 4} y={cy - RC.stemHeight} fontFamily="Bravura" fontSize={RC.noteFontSize} fill={color} dominantBaseline="alphabetic">
                {flagGlyph}
              </text>
            )}
          </>
        )}
      </g>
    );
  };

  // ── Time signature ───────────────────────────────────────────────────────────
  const firstBar = staff.bars[0];
  const timeSig = firstBar?.timeSignature ?? staff.timeSignature ?? { beatsPerMeasure:4, beatValue:4, display:'4/4' };
  const timeSigGlyphs = getTimeSignatureGlyphs(timeSig.display);

  // ── Add/Remove button geometry (mirrors use-staff-bt-events exactly) ─────────
  const barHeight      = RC.staffLineSpacing * 4;
  const addBtnR        = (barHeight * 0.7) / 2;
  const addBtnCX       = finalBarX + 4 + addBtnR;
  const addBtnCY       = staffTop + (barHeight / 2);
  const removeBtnR     = addBtnR * 0.6;
  const removeBtnCX    = addBtnCX + addBtnR + 8;
  const removeBtnCY    = staffTop + removeBtnR + 4;
  const plusSize       = addBtnR * 0.5;
  const minusSize      = removeBtnR * 0.5;

  // ── Playhead ─────────────────────────────────────────────────────────────────
  const beatsPerBar = staff.bars[0]?.beats.length ?? 4;
  const phBarIdx    = Math.floor(playheadPosition / beatsPerBar);
  const phBeatInBar = playheadPosition % beatsPerBar;
  const phX         = barStartX + (phBarIdx * RC.barWidth) + (phBeatInBar * (RC.barWidth / beatsPerBar));

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${svgWidth} ${height}`}
      width={svgWidth * zoom}
      height={height * zoom}
      style={{
        display: 'block',
        cursor: draggedNote ? 'grabbing' : hoveredButton ? 'pointer' : isDraggingPlayhead ? 'grabbing' : 'default',
        fontFamily: 'Bravura, Arial, sans-serif',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      onMouseDown={btEvents.handleMouseDown}
      onMouseMove={btEvents.handleMouseMove}
      onMouseUp={btEvents.handleMouseUp}
      onMouseLeave={btEvents.handleMouseLeave}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => e.preventDefault()}
    >
      <defs>
        <filter id={`glow-${staff.id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Staff label */}
      <text x={10} y={20} fontFamily="Arial" fontSize={14} fill={textColor}>{staff.name}</text>

      {/* 5 staff lines */}
      {Array.from({ length: RC.staffLineCount }, (_, i) => (
        <line
          key={i}
          x1={10} y1={staffTop + i * RC.staffLineSpacing}
          x2={finalBarX} y2={staffTop + i * RC.staffLineSpacing}
          stroke={lineColor} strokeWidth={1}
        />
      ))}

      {/* Clef */}
      <text x={20} y={staffTop + 40} fontFamily="Bravura" fontSize={RC.clefFontSize} fill={textColor} dominantBaseline="alphabetic">
        {getClefGlyph(staff.clef)}
      </text>

      {/* Time signature */}
      {timeSigGlyphs.bottom ? (
        <>
          <text x={90} y={staffTop + 15} fontFamily="Bravura" fontSize={RC.timeSigFontSize} fill={textColor} dominantBaseline="alphabetic">
            {timeSigGlyphs.top}
          </text>
          <text x={90} y={staffTop + 35} fontFamily="Bravura" fontSize={RC.timeSigFontSize} fill={textColor} dominantBaseline="alphabetic">
            {timeSigGlyphs.bottom}
          </text>
        </>
      ) : (
        <text x={90} y={staffTop + 25} fontFamily="Bravura" fontSize={RC.timeSigFontSize} fill={textColor} dominantBaseline="alphabetic">
          {timeSigGlyphs.top}
        </text>
      )}

      {/* Bars */}
      {layout.bars.map((barBox, barIdx) => {
        const bTimeSig = barBox.timeSignature;
        return (
          <g key={barIdx}>
            {/* Bar line */}
            <line x1={barBox.x} y1={staffTop} x2={barBox.x} y2={staffBottom} stroke={lineColor} strokeWidth={RC.barLineThickness} />

            {barBox.beats.map((beatBox, beatIdx) => {
              const beatWidth = beatBox.width;
              return (
                <g key={beatIdx}>
                  {/* Beat separator (lighter, not first beat) */}
                  {beatIdx > 0 && (
                    <line x1={beatBox.x} y1={staffTop} x2={beatBox.x} y2={staffBottom} stroke={beatColor} strokeWidth={1} />
                  )}

                  {/* Subdivision highlight */}
                  {highlightedSubdivision &&
                   highlightedSubdivision.barIndex === barIdx &&
                   Math.floor(highlightedSubdivision.beatIndex) === beatIdx && (() => {
                    const durBeats   = getDurationValue((selectedTool?.duration as string) ?? (selectedDuration as string) ?? 'quarter');
                    const unitsTaken = durBeats / (4 / bTimeSig.beatValue);
                    const bgWidth    = beatWidth * unitsTaken;
                    const startX     = beatBox.x + (highlightedSubdivision.subdivOffset * beatWidth);
                    return (
                      <>
                        <rect
                          x={startX} y={staffTop} width={bgWidth} height={barHeight}
                          fill={darkMode ? 'rgba(74,255,158,0.15)' : 'rgba(74,255,158,0.20)'}
                        />
                        <rect
                          x={startX} y={staffTop} width={bgWidth} height={barHeight}
                          fill="none"
                          stroke={darkMode ? 'rgba(74,255,158,0.5)' : 'rgba(74,255,158,0.7)'}
                          strokeWidth={1}
                        />
                      </>
                    );
                  })()}

                  {/* Notes / rests — chord-aware rendering */}
                  {(() => {
                    // --- Separate rests from notes ---
                    const visibleEls = beatBox.elements.filter(el => !draggedNote || draggedNote.note.id !== el.id);
                    const rests = visibleEls.filter(el => el.type === 'rest');
                    const notes = visibleEls.filter(el => el.type !== 'rest');

                    // --- Group notes by subdivision slot (chord clusters) ---
                    const clusters = new Map<string, typeof notes>();
                    for (const el of notes) {
                      const key = el.subdivisionOffset.toFixed(4);
                      if (!clusters.has(key)) clusters.set(key, []);
                      clusters.get(key)!.push(el);
                    }

                    // All noteheads in a chord cluster share the same X (no horizontal offset).
                    // Pitch separation via Y is sufficient for readability in a fixed-width editor.
                    const noteOffsets = new Map<string, number>(); // id → xOffset (all zero)
                    for (const clusterNotes of clusters.values()) {
                      for (const n of clusterNotes) noteOffsets.set(n.id, 0);
                    }

                    return (
                      <>
                        {/* Rests */}
                        {rests.map(el => (
                          <g key={el.id}>
                            <rect
                              x={el.x} y={staffTop} width={el.width} height={barHeight}
                              fill={darkMode ? 'rgba(74,158,255,0.10)' : 'rgba(74,158,255,0.20)'}
                              stroke={darkMode ? 'rgba(74,158,255,0.30)' : 'rgba(74,158,255,0.40)'}
                              strokeWidth={1}
                            />
                            <text
                              x={el.exactCenter - 8} y={staffTop + 20}
                              fontFamily="Bravura" fontSize={RC.noteFontSize}
                              fill={selectedElementId === el.id ? '#4a9eff' : textColor}
                              dominantBaseline="alphabetic"
                            >
                              {getRestGlyph(el.duration)}
                            </text>
                          </g>
                        ))}

                        {/* Chord clusters */}
                        {Array.from(clusters.entries()).map(([slotKey, clusterNotes]) => {
                          const cx   = clusterNotes[0].exactCenter;
                          const dur  = clusterNotes[0].duration;
                          const hasStem = dur === 'quarter' || dur === 'eighth' || dur === 'sixteenth';
                          const flagGlyph = getFlagGlyph(dur, true);

                          // Stem spans from lowest pitch to RC.stemHeight above highest pitch
                          const ys = clusterNotes.map(n => getNoteY(n.pitch!, n.octave!, height) + (n.visualOffsetY || 0));
                          const topY    = Math.min(...ys);
                          const bottomY = Math.max(...ys);
                          const stemX   = cx + 4;
                          const stemTop = topY - RC.stemHeight;

                          return (
                            <g key={slotKey}>
                              {/* Shared background (widest element in cluster) */}
                              <rect
                                x={clusterNotes[0].x} y={staffTop}
                                width={clusterNotes[0].width} height={barHeight}
                                fill={darkMode ? 'rgba(74,158,255,0.10)' : 'rgba(74,158,255,0.20)'}
                                stroke={darkMode ? 'rgba(74,158,255,0.30)' : 'rgba(74,158,255,0.40)'}
                                strokeWidth={1}
                              />

                              {/* Shared stem (drawn once, spans full chord range) */}
                              {hasStem && (
                                <>
                                  <line
                                    x1={stemX} y1={bottomY}
                                    x2={stemX} y2={stemTop}
                                    stroke={textColor} strokeWidth={RC.stemThickness}
                                  />
                                  {flagGlyph && (
                                    <text
                                      x={stemX} y={stemTop}
                                      fontFamily="Bravura" fontSize={RC.noteFontSize}
                                      fill={textColor} dominantBaseline="alphabetic"
                                    >
                                      {flagGlyph}
                                    </text>
                                  )}
                                </>
                              )}

                              {/* Individual noteheads */}
                              {clusterNotes.map(el => {
                                const ny        = getNoteY(el.pitch!, el.octave!, height) + (el.visualOffsetY || 0);
                                const xOff      = noteOffsets.get(el.id) ?? 0;
                                const isSelected = selectedElementId === el.id;
                                return (
                                  <g key={el.id}>
                                    {isSelected && (
                                      <circle
                                        cx={cx + xOff} cy={ny} r={12}
                                        fill="none" stroke="#4a9eff" strokeWidth={2}
                                        filter={`url(#glow-${staff.id})`}
                                      />
                                    )}
                                    {renderNoteGlyph(
                                      `n-${el.id}`, cx, ny, el.duration,
                                      el.note.accidental, undefined, 1, xOff, true /* headOnly */
                                    )}
                                  </g>
                                );
                              })}
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Final double bar line */}
      <line x1={finalBarX}     y1={staffTop} x2={finalBarX}     y2={staffBottom} stroke={lineColor} strokeWidth={RC.barLineThickness} />
      <line x1={finalBarX + 4} y1={staffTop} x2={finalBarX + 4} y2={staffBottom} stroke={lineColor} strokeWidth={RC.barLineThickness} />

      {/* Hover ghost note */}
      {hoverGhost && mode === 'design' && (() => {
        const { barIndex, beatIndex, pitch, octave, duration, subdivisionOffset } = hoverGhost;
        const intBeat = Math.floor(beatIndex);
        const gx = getTransientLayoutCenter(layout, barIndex, intBeat, subdivisionOffset, duration as NoteDuration);
        const gy = getNoteY(pitch, octave, height);
        return renderNoteGlyph('ghost', gx, gy, duration, undefined, ghostColor);
      })()}

      {/* Add bar button (+) — half-circle on right side */}
      <path
        d={`M ${addBtnCX} ${addBtnCY - addBtnR} A ${addBtnR} ${addBtnR} 0 0 1 ${addBtnCX} ${addBtnCY + addBtnR} Z`}
        fill={hoveredButton === 'add' ? '#66BB6A' : '#4CAF50'}
      />
      <line x1={addBtnCX} y1={addBtnCY - plusSize} x2={addBtnCX} y2={addBtnCY + plusSize} stroke="#fff" strokeWidth={3} />
      <line x1={addBtnCX - plusSize} y1={addBtnCY} x2={addBtnCX + plusSize} y2={addBtnCY} stroke="#fff" strokeWidth={3} />

      {/* Remove bar button (−) — shown only when >1 bar */}
      {staff.bars.length > 1 && (
        <>
          <circle cx={removeBtnCX} cy={removeBtnCY} r={removeBtnR} fill={hoveredButton === 'remove' ? '#EF5350' : '#f44336'} />
          <line x1={removeBtnCX - minusSize} y1={removeBtnCY} x2={removeBtnCX + minusSize} y2={removeBtnCY} stroke="#fff" strokeWidth={2.5} />
        </>
      )}

      {/* Sustain range overlay */}
      {sustainRange && (() => {
        const rw = sustainRange.endX - sustainRange.startX;
        if (rw <= 0) return null;
        return (
          <rect
            x={sustainRange.startX} y={staffTop}
            width={rw} height={barHeight}
            fill="rgba(74,200,100,0.20)"
            stroke="rgba(74,200,100,0.55)"
            strokeWidth={1}
            pointerEvents="none"
          />
        );
      })()}

      {/* Playhead */}
      {mode !== 'design' && playheadPosition >= 0 && (
        <g>
          <line x1={phX} y1={staffTop - 10} x2={phX} y2={staffBottom + 10} stroke="#FF9800" strokeWidth={2} />
          <polygon
            points={`${phX},${staffTop - 10} ${phX - 6},${staffTop - 2} ${phX + 6},${staffTop - 2}`}
            fill="#FF9800"
          />
        </g>
      )}

      {/* Dragged note (rendered on top, semi-transparent) */}
      {draggedNote && (() => {
        const { currentX, currentY, note } = draggedNote;
        const snappedY = getNoteY(getYToPitch(currentY, height).pitch, getYToPitch(currentY, height).octave, height);
        return renderNoteGlyph('dragged', currentX, snappedY, note.duration, note.accidental, textColor, 0.7);
      })()}
    </svg>
  );
};
