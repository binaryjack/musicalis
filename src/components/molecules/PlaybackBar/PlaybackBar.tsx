import { Slider } from '../../atoms/Slider/Slider';
import { Select } from '../../atoms/Select/Select';
import styles from './PlaybackBar.module.css';

interface PlaybackBarProps {
  currentTime: number;
  duration: number;
  playbackRate: number;
  onSeek: (time: number) => void;
  onRateChange: (rate: number) => void;
  disabled?: boolean;
}

const PLAYBACK_RATES = [
  { value: '0.5', label: '0.5x' },
  { value: '0.75', label: '0.75x' },
  { value: '1', label: '1x (Normal)' },
  { value: '1.25', label: '1.25x' },
  { value: '1.5', label: '1.5x' },
  { value: '2', label: '2x' },
];

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const PlaybackBar = ({
  currentTime,
  duration,
  playbackRate,
  onSeek,
  onRateChange,
  disabled = false,
}: PlaybackBarProps) => {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(parseFloat(e.currentTarget.value));
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onRateChange(parseFloat(e.currentTarget.value));
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.timeDisplay}>
        <span>{formatTime(currentTime)}</span>
        <span className={styles.separator}>/</span>
        <span>{formatTime(duration)}</span>
      </div>

      <Slider
        min="0"
        max={String(duration || 1)}
        value={String(currentTime)}
        onChange={handleSliderChange}
        disabled={disabled}
      />

      <div className={styles.controls}>
        <Select
          value={String(playbackRate)}
          onChange={handleRateChange}
          options={PLAYBACK_RATES}
          disabled={disabled}
        />
      </div>
    </div>
  );
};
