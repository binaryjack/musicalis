import { useState } from 'react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: string;
}

export interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const Dropdown = ({ options, value, onChange, placeholder, disabled }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedOption = options.find(opt => opt.value === value);
  
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          padding: '6px 12px',
          backgroundColor: disabled ? '#333' : '#444',
          color: disabled ? '#666' : '#fff',
          border: '1px solid #555',
          borderRadius: '4px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          minWidth: '120px',
          justifyContent: 'space-between'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {selectedOption?.icon && <span>{selectedOption.icon}</span>}
          {selectedOption?.label || placeholder}
        </span>
        <span style={{ fontSize: '10px' }}>▼</span>
      </button>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          backgroundColor: '#333',
          border: '1px solid #555',
          borderRadius: '4px',
          zIndex: 1000,
          minWidth: '100%',
          marginTop: '2px',
          maxHeight: '400px',
          overflowY: 'auto',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}>
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: option.value === value ? '#4a9eff' : 'transparent',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                if (option.value !== value) {
                  e.currentTarget.style.backgroundColor = '#555';
                }
              }}
              onMouseLeave={(e) => {
                if (option.value !== value) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {option.icon && <span>{option.icon}</span>}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};