import { StaffCanvasCore } from './StaffCanvasCore';
import { StaffCanvasContainer } from './StaffCanvasContainer';
import styles from './StaffCanvas.module.css';
import type { Project } from '../../../types';
import type { EditorMode, MusicNote, NoteDuration } from '../../../types/enums';

export interface StaffCanvasProps {
  project: Project;
  mode: EditorMode;
  selectedNote: MusicNote | null;
  selectedDuration: NoteDuration;
  velocity: number;
  onNoteClick?: (note: MusicNote, barIndex: number, position: number) => void;
  onNoteAdd?: (note: MusicNote, barIndex: number, position: number) => void;
  onNoteRemove?: (barIndex: number, noteIndex: number) => void;
  onNoteEdit?: (barIndex: number, noteIndex: number, updates: Partial<any>) => void;
}

export const StaffCanvas = ({
  project,
  mode,
  selectedNote,
  selectedDuration,
  velocity,
  onNoteClick,
  onNoteAdd,
  onNoteRemove,
  onNoteEdit,
}: StaffCanvasProps) => {
  return (
    <div className={styles.staffCanvas}>
      <StaffCanvasContainer
        className={styles.container}
        mode={mode}
      >
        <StaffCanvasCore
          project={project}
          selectedNote={selectedNote}
          selectedDuration={selectedDuration}
          velocity={velocity}
          onNoteClick={onNoteClick}
          onNoteAdd={onNoteAdd}
          onNoteRemove={onNoteRemove}
          onNoteEdit={onNoteEdit}
        />
      </StaffCanvasContainer>
    </div>
  );
};