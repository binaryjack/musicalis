import { MusicNote } from '../../../types';
import { Button } from '../../atoms/Button/Button';
import styles from './NoteSelector.module.css';

interface NoteSelectorProps {
  selectedNote: MusicNote | null;
  onSelectNote: (note: MusicNote) => void;
  disabled?: boolean;
}

const NOTES = Object.values(MusicNote);

export const NoteSelector = ({ selectedNote, onSelectNote, disabled = false }: NoteSelectorProps) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>Note</div>
      <div className={styles.grid}>
        {NOTES.map((note) => (
          <Button
            key={note}
            variant={selectedNote === note ? 'primary' : 'secondary'}
            size="small"
            onClick={() => onSelectNote(note)}
            disabled={disabled}
          >
            {note}
          </Button>
        ))}
      </div>
    </div>
  );
};
