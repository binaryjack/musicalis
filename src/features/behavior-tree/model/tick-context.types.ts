export interface MouseState {
  x: number;
  y: number;
  isDown: boolean;
  /** true on the first frame of a mouse-down */
  isPressed: boolean;
  /** true on the first frame of a mouse-up (release) */
  isUp: boolean;
  isCtrlDown: boolean;
  button: number | null;
}

export interface HoveredBar {
  staffId: string;
  barIndex: number;
}

/**
 * A hovered subdivision cell — the exact "string × beat" slot the cursor is over.
 * `hasNote` / `hasRest` reflect the current content of that slot.
 */
export interface HoveredSubdivision {
  staffId: string;
  barIndex: number;
  beatIndex: number;
  subdivIndex: number;
  subdivOffset: number;
  /** True when this slot is a legal drop target for the selected duration */
  isAllowed: boolean;
  hasNote: boolean;
  hasRest: boolean;
}

export interface TickCommand {
  type: string;
  payload?: Record<string, unknown>;
}

export interface TickContext {
  mouse: MouseState;
  mode: 'design' | 'playback';
  selectedStaffId: string | null;
  selectedNoteId: string | null;
  selectedElementId: string | null;
  cursorPosition: number;
  hoveredBar: HoveredBar | null;
  /** Fine-grained subdivision hover — null when cursor is not over any staff cell */
  hoveredSubdivision: HoveredSubdivision | null;
  selectedDuration: string;
  /** True when the note tool is active, meaning clicking drops a note */
  isNoteToolActive: boolean;
  /** True from beginDrag until commitDrag / cancelDrag */
  isDragging: boolean;
  dragSourceNoteId: string | null;
  /** True while a ctrl+drag sustain/beam operation is in progress */
  isSustainMode: boolean;
  timestamp: number;
  /** Queue of commands resulting from behavior tree actions */
  commands: TickCommand[];
}

export const emptyTickContext = (): TickContext => ({
  mouse: { x: 0, y: 0, isDown: false, isPressed: false, isUp: false, isCtrlDown: false, button: null },
  mode: 'design',
  selectedStaffId: null,
  selectedNoteId: null,
  selectedElementId: null,
  cursorPosition: 0,
  hoveredBar: null,
  hoveredSubdivision: null,
  selectedDuration: 'quarter',
  isNoteToolActive: false,
  isDragging: false,
  dragSourceNoteId: null,
  isSustainMode: false,
  timestamp: 0,
  commands: [],
});
