export interface TimeSignatureControlProps {
  timeSignature: string;
  onChange: (timeSignature: string) => void;
}

const timeSignatureOptions = [
  { value: '2/4', label: '2/4', icon: '𝄐' },
  { value: '3/4', label: '3/4', icon: '𝄞' },
  { value: '4/4', label: '4/4', icon: '𝄢' },
  { value: '6/8', label: '6/8', icon: '𝄡' },
  { value: '9/8', label: '9/8', icon: '𝄞' },
  { value: '12/8', label: '12/8', icon: '𝄡' },
];

export const TimeSignatureControl = function(props: TimeSignatureControlProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      backgroundColor: '#444',
      border: '1px solid #666',
      borderRadius: '4px',
      padding: '0'
    }}>
      <select
        value={props.timeSignature}
        onChange={(e) => props.onChange(e.target.value)}
        style={{
          backgroundColor: 'transparent',
          color: '#f0f0f0',
          border: 'none',
          padding: '8px 12px',
          fontSize: '14px',
          cursor: 'pointer',
          outline: 'none',
          minWidth: '60px'
        }}
      >
        {timeSignatureOptions.map(option => (
          <option 
            key={option.value} 
            value={option.value}
            style={{ backgroundColor: '#444', color: '#f0f0f0' }}
          >
            {option.icon} {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};