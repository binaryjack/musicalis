import { BpmControl } from '../../../components/atoms/bpm-control'
import { TimeSignatureControl } from '../../../components/atoms/time-signature-control'
import { TransportBar } from '../../../components/molecules/transport-bar'

interface EditorFooterProps {
  timeSignature: string;
  onTimeSignatureChange: (sig: string) => void;
  isPlaying: boolean;
  cursorPosition: number;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  onPlay: () => Promise<void>;
  onPause: () => void;
  onStop: () => void;
  onGoToStart: () => void;
  onStepBackward: () => void;
  onStepForward: () => void;
  onGoToEnd: () => void;
  zoom: number;
  setZoom: (z: number) => void;
}

export const EditorFooter = function({ timeSignature, onTimeSignatureChange, isPlaying, cursorPosition, bpm, onBpmChange, onPlay, onPause, onStop, onGoToStart, onStepBackward, onStepForward, onGoToEnd, zoom, setZoom }: EditorFooterProps) {
  return (
    <div style={{ height: '60px', backgroundColor: '#2d2d2d', borderTop: '1px solid #444', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '16px', padding: '0 16px', flexShrink: 0 }}>
      <TimeSignatureControl timeSignature={timeSignature} onChange={onTimeSignatureChange} />
      <TransportBar
        isPlaying={isPlaying}
        currentPosition={Math.floor(cursorPosition * 100) / 100}
        duration={0}
        onPlay={onPlay}
        onPause={onPause}
        onStop={onStop}
        onGoToStart={onGoToStart}
        onStepBackward={onStepBackward}
        onStepForward={onStepForward}
        onGoToEnd={onGoToEnd}
      />
      <BpmControl bpm={bpm} onChange={onBpmChange} />
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label htmlFor="zoom-slider" style={{ fontSize: '12px' }}>Zoom:</label>
        <input type="range" id="zoom-slider" min="0.5" max="3" step="0.1" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} />
        <span>{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
};
