export interface TransportBarProps {
  isPlaying: boolean;
  currentPosition: number;
  duration: number;
  onGoToStart: () => void;
  onStepBackward: () => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onStepForward: () => void;
  onGoToEnd: () => void;
}

export const TransportBar = ({
  isPlaying,
  currentPosition,
  duration,
  onGoToStart,
  onStepBackward,
  onPlay,
  onPause,
  onStop,
  onStepForward,
  onGoToEnd
}: TransportBarProps) => {
  const buttonStyle = {
    padding: '8px 12px',
    backgroundColor: '#444',
    color: '#fff',
    border: '1px solid #555',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '40px',
    height: '40px'
  };

  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#4a9eff',
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
      justifyContent: 'center'
    }}>
      <button
        onClick={onGoToStart}
        style={{
          ...buttonStyle,
          borderRadius: '4px 0 0 4px'
        }}
        title="Go to beginning"
      >
        ⏮
      </button>
      
      <button
        onClick={onStepBackward}
        style={buttonStyle}
        title="Step backward"
      >
        ⏪
      </button>
      
      <button
        onClick={isPlaying ? onPause : onPlay}
        style={isPlaying ? activeButtonStyle : buttonStyle}
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
      
      <button
        onClick={onStop}
        style={buttonStyle}
        title="Stop"
      >
        ⏹
      </button>
      
      <button
        onClick={onStepForward}
        style={buttonStyle}
        title="Step forward"
      >
        ⏩
      </button>
      
      <button
        onClick={onGoToEnd}
        style={{
          ...buttonStyle,
          borderRadius: '0 4px 4px 0'
        }}
        title="Go to end"
      >
        ⏭
      </button>
      
      <div style={{
        marginLeft: '16px',
        color: '#ccc',
        fontSize: '12px',
        minWidth: '80px'
      }}>
        {Math.floor(currentPosition / 60)}:{(currentPosition % 60).toString().padStart(2, '0')} / {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
      </div>
    </div>
  );
};