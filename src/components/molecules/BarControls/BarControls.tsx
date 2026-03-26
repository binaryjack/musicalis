import { Button } from '../../atoms/Button/Button';
import styles from './BarControls.module.css';

interface BarControlsProps {
  barNumber: number;
  totalBars: number;
  onAddBar: () => void;
  onRemoveBar: () => void;
  onDuplicateBar: () => void;
  disabled?: boolean;
}

export const BarControls = ({
  barNumber,
  totalBars,
  onAddBar,
  onRemoveBar,
  onDuplicateBar,
  disabled = false,
}: BarControlsProps) => {
  const canRemove = totalBars > 1;

  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>Bar {barNumber}</div>
      <div className={styles.group}>
        <Button
          variant="primary"
          size="small"
          onClick={onAddBar}
          disabled={disabled}
          title="Add a new bar after this one"
        >
          + Add
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={onDuplicateBar}
          disabled={disabled}
          title="Duplicate this bar"
        >
          ⧉ Dup
        </Button>
        <Button
          variant="danger"
          size="small"
          onClick={onRemoveBar}
          disabled={disabled || !canRemove}
          title={canRemove ? 'Remove this bar' : 'Cannot remove last bar'}
        >
          ✕ Remove
        </Button>
      </div>
    </div>
  );
};
