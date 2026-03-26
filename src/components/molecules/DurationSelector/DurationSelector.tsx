import { NoteDuration } from '../../../types';
import { Button } from '../../atoms/Button/Button';
import styles from './DurationSelector.module.css';

interface DurationSelectorProps {
  selectedDuration: NoteDuration | null;
  onSelectDuration: (duration: NoteDuration) => void;
  disabled?: boolean;
}

const DURATIONS = [
  { value: NoteDuration.WHOLE, label: '𝅝' },
  { value: NoteDuration.HALF, label: '𝅗𝅥' },
  { value: NoteDuration.QUARTER, label: '♩' },
  { value: NoteDuration.EIGHTH, label: '♪' },
  { value: NoteDuration.SIXTEENTH, label: '𝅘𝅥𝅘𝅥' },
];

export const DurationSelector = ({
  selectedDuration,
  onSelectDuration,
  disabled = false,
}: DurationSelectorProps) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>Duration</div>
      <div className={styles.group}>
        {DURATIONS.map((dur) => (
          <Button
            key={dur.value}
            variant={selectedDuration === dur.value ? 'primary' : 'secondary'}
            size="small"
            onClick={() => onSelectDuration(dur.value)}
            disabled={disabled}
            title={dur.value}
          >
            {dur.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
