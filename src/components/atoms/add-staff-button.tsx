export interface AddStaffButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const AddStaffButton = ({ onClick, disabled }: AddStaffButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '6px 12px',
        backgroundColor: disabled ? '#333' : '#28a745',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}
    >
      <span style={{ fontSize: '16px' }}>+</span>
      Staff
    </button>
  );
};