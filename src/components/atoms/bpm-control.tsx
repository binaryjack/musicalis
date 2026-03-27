import { useState, useEffect } from 'react';

export interface BpmControlProps {
  bpm: number;
  onChange: (bpm: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const BpmControl = ({ bpm, onChange, min = 60, max = 200, step = 5 }: BpmControlProps) => {
  const [inputValue, setInputValue] = useState(bpm.toString());

  useEffect(() => {
    setInputValue(bpm.toString());
  }, [bpm]);

  const decrease = () => {
    const newBpm = Math.max(min, bpm - step);
    onChange(newBpm);
  };

  const increase = () => {
    const newBpm = Math.min(max, bpm + step);
    onChange(newBpm);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
  };

  const handleInputBlur = () => {
    const numValue = parseInt(inputValue);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(max, numValue));
      onChange(clampedValue);
      setInputValue(clampedValue.toString());
    } else {
      setInputValue(bpm.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      backgroundColor: '#444',
      borderRadius: '4px',
      border: '1px solid #555'
    }}>
      <button
        onClick={decrease}
        style={{
          padding: '6px 8px',
          backgroundColor: 'transparent',
          color: '#fff',
          border: 'none',
          borderRadius: '4px 0 0 4px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        ◀
      </button>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        style={{
          padding: '6px 8px',
          color: '#fff',
          fontSize: '14px',
          width: '50px',
          textAlign: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          borderLeft: '1px solid #555',
          borderRight: '1px solid #555',
          outline: 'none'
        }}
      />
      <button
        onClick={increase}
        style={{
          padding: '6px 8px',
          backgroundColor: 'transparent',
          color: '#fff',
          border: 'none',
          borderRadius: '0 4px 4px 0',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        ▶
      </button>
    </div>
  );
};