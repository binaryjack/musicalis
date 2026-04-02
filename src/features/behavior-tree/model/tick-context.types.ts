export interface MouseState {
  x: number;
  y: number;
  isDown: boolean;
  isPressed: boolean;
  button: number | null;
}

export interface HoveredBar {
  staffId: string;
  barIndex: number;
}

export interface TickContext {
  mouse: MouseState;
  mode: 'design' | 'playback';
  selectedStaffId: string | null;
  selectedNoteId: string | null;
  selectedElementId: string | null;
  cursorPosition: number;
  hoveredBar: HoveredBar | null;
  selectedDuration: string;
  timestamp: number;
}

export const emptyTickContext = (): TickContext => ({
  mouse: { x: 0, y: 0, isDown: false, isPressed: false, button: null },
  mode: 'design',
  selectedStaffId: null,
  selectedNoteId: null,
  selectedElementId: null,
  cursorPosition: 0,
  hoveredBar: null,
  selectedDuration: 'quarter',
  timestamp: 0,
});
