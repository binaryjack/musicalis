import { Slider } from '../../atoms/Slider/Slider';
import { Input } from '../../atoms/Input/Input';
import styles from './VelocityControl.module.css';

interface VelocityControlProps {
  velocity: number;
  onVelocityChange: (velocity: number) => void;
  disabled?: boolean;
}

export const VelocityControl = ({
  velocity,
  onVelocityChange,
  disabled = false,
}: VelocityControlProps) => {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onVelocityChange(parseInt(e.currentTarget.value, 10));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.currentTarget.value, 10);
    if (!Number.isNaN(val) && val >= 0 && val <= 127) {
      onVelocityChange(val);
    }
  };

  return (
    <div className={styles.wrapper}>
      <Slider
        label="Velocity"
        min={0}
        max={127}
        value={velocity}
        onChange={handleSliderChange}
        disabled={disabled}
      />
      <div className={styles.inputGroup}>
        <Input
          label="Value"
          type="number"
          min="0"
          max="127"
          value={String(velocity)}
          onChange={handleInputChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
};
