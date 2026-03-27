import { Modal } from './modal';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: string;
}

export const ConfirmModal = function(props: ConfirmModalProps) {
  const {
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmButtonColor = '#dc3545'
  } = props;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      width="350px"
      closeOnOverlayClick={false}
      closeOnEscape={true}
    >
      <div style={{ marginBottom: '24px', lineHeight: '1.5' }}>
        {message}
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px'
      }}>
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            backgroundColor: '#444',
            color: '#f0f0f0',
            border: '1px solid #666',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            minWidth: '80px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#555';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#444';
          }}
        >
          {cancelText}
        </button>
        
        <button
          onClick={handleConfirm}
          style={{
            padding: '8px 16px',
            backgroundColor: confirmButtonColor,
            color: '#fff',
            border: `1px solid ${confirmButtonColor}`,
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            minWidth: '80px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};