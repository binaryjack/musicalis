import { RestType } from '../../../types';
import { Button } from '../../atoms/Button/Button';
import styles from './RestSelector.module.css';

interface RestSelectorProps {
  selectedRest: RestType | null;
  onSelectRest: (rest: RestType) => void;
  disabled?: boolean;
}

const REST_SYMBOLS = [
  { value: RestType.WHOLE_REST, label: '𝄻', name: 'Whole Rest' },
  { value: RestType.HALF_REST, label: '𝄼', name: 'Half Rest' },
  { value: RestType.QUARTER_REST, label: '𝄽', name: 'Quarter Rest' },
  { value: RestType.EIGHTH_REST, label: '𝄾', name: 'Eighth Rest' },
  { value: RestType.SIXTEENTH_REST, label: '𝄿', name: 'Sixteenth Rest' },
];

export const RestSelector = ({
  selectedRest,
  onSelectRest,
  disabled = false,
}: RestSelectorProps) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>Rest</div>
      <div className={styles.group}>
        {REST_SYMBOLS.map((rest) => (
          <Button
            key={rest.value}
            variant={selectedRest === rest.value ? 'primary' : 'secondary'}
            size="small"
            onClick={() => onSelectRest(rest.value)}
            disabled={disabled}
            title={rest.name}
          >
            {rest.label}
          </Button>
        ))}
      </div>
    </div>
  );
};