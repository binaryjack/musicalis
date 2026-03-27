export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
  height?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export const Modal = function(props: ModalProps) {
  const {
    isOpen,
    onClose,
    title,
    children,
    width = '400px',
    height = 'auto',
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEscape = true
  } = props;

  // Handle escape key
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (closeOnEscape && event.key === 'Escape') {
      onClose();
    }
  };

  // Handle overlay click
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        style={{
          backgroundColor: '#2d2d2d',
          border: '1px solid #444',
          borderRadius: '8px',
          width,
          height,
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #444',
            flexShrink: 0
          }}>
            <h3 style={{
              margin: 0,
              color: '#f0f0f0',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              {title || ''}
            </h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ccc',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#444';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#ccc';
                }}
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div style={{
          padding: '20px',
          flex: 1,
          color: '#f0f0f0'
        }}>
          {children}
        </div>
      </div>
    </div>
  );
};