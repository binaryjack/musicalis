
import { Button } from "../atoms/button";
import { Slider } from "../atoms/slider";

export interface PlaybackBarProps {
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
  playbackRate?: number;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onSeek?: (time: number) => void;
  onRateChange?: (rate: number) => void;
}

export const PlaybackBar = function(props: PlaybackBarProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="playback-bar">
      <div className="playback-controls">
        {!props.isPlaying ? (
          <Button onClick={props.onPlay} variant="primary">▶️ Play</Button>
        ) : (
          <Button onClick={props.onPause} variant="secondary">⏸️ Pause</Button>
        )}
        <Button onClick={props.onStop} variant="secondary">⏹️ Stop</Button>
      </div>
      
      <div className="time-display">
        {formatTime(props.currentTime || 0)} / {formatTime(props.duration || 0)}
      </div>
      
      {props.onSeek && (
        <Slider 
          min={0}
          max={props.duration || 100} 
          value={props.currentTime || 0}
          onChange={props.onSeek}
          className="seek-bar"
        />
      )}
      
      {props.onRateChange && (
        <div className="playback-rate">
          <label>Speed: </label>
          <select 
            value={props.playbackRate || 1} 
            onChange={(e) => props.onRateChange!(Number(e.target.value))}
          >
            <option value={0.5}>0.5x</option>
            <option value={0.75}>0.75x</option>
            <option value={1}>1x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>
        </div>
      )}
    </div>
  );
};