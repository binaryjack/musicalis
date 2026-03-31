import { useState } from 'react';
import { NoteDuration, RestType, MusicalElementType, MusicNote } from '../../../types';
import { DurationSelector } from '../DurationSelector/DurationSelector';
import { NoteSelector } from '../NoteSelector/NoteSelector';
import { RestSelector } from '../RestSelector/RestSelector';
import { Button } from '../../atoms/Button/Button';
import styles from './MusicalElementSelector.module.css';

export interface MusicalElementSelectorProps {
  selectedDuration: NoteDuration;
  selectedElementType: MusicalElementType;
  selectedNote: MusicNote | null;
  selectedRest: RestType | null;
  onSelectDuration: (duration: NoteDuration) => void;
  onSelectElementType: (type: MusicalElementType) => void;
  onSelectNote: (note: MusicNote) => void;
  onSelectRest: (rest: RestType) => void;
  disabled?: boolean;
}

export const MusicalElementSelector = ({
  selectedDuration,
  selectedElementType,
  selectedNote,
  selectedRest,
  onSelectDuration,
  onSelectElementType,
  onSelectNote,
  onSelectRest,
  disabled = false,
}: MusicalElementSelectorProps) => {
  const [isDottedEnabled, setIsDottedEnabled] = useState(false);

  return (
    <div className={styles.wrapper}>
      <div className={styles.section}>
        <div className={styles.label}>Element Type</div>
        <div className={styles.typeSelector}>
          <Button
            variant={selectedElementType === MusicalElementType.NOTE ? 'primary' : 'secondary'}
            size="small"
            onClick={() => onSelectElementType(MusicalElementType.NOTE)}
            disabled={disabled}
          >
            Note ♪
          </Button>
          <Button
            variant={selectedElementType === MusicalElementType.REST ? 'primary' : 'secondary'}
            size="small"
            onClick={() => onSelectElementType(MusicalElementType.REST)}
            disabled={disabled}
          >
            Rest 𝄽
          </Button>
        </div>
      </div>

      <div className={styles.section}>
        <DurationSelector
          selectedDuration={selectedDuration}
          onSelectDuration={onSelectDuration}
          disabled={disabled}
        />
      </div>

      {selectedElementType === MusicalElementType.NOTE && (
        <div className={styles.section}>
          <NoteSelector
            selectedNote={selectedNote}
            onSelectNote={onSelectNote}
            disabled={disabled}
          />
        </div>
      )}

      {selectedElementType === MusicalElementType.REST && (
        <div className={styles.section}>
          <RestSelector
            selectedRest={selectedRest}
            onSelectRest={onSelectRest}
            disabled={disabled}
          />
        </div>
      )}

      <div className={styles.section}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={isDottedEnabled}
            onChange={(e) => setIsDottedEnabled(e.target.checked)}
            disabled={disabled}
          />
          Dotted (.5x longer)
        </label>
      </div>
    </div>
  );
};