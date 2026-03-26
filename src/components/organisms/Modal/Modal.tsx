import { Button } from '../../atoms/Button/Button';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  actions?: Array<{
    id: string;
    label: string;
    variant?: 'primary' | 'secondary' | 'danger';
    onClick: () => void;
  }>;
}

export const Modal = ({ isOpen, title, onClose, children, actions }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <Button
            variant="secondary"
            size="small"
            onClick={onClose}
            className={styles.closeBtn}
          >
            ✕
          </Button>
        </div>

        <div className={styles.content}>{children}</div>

        {actions && actions.length > 0 && (
          <div className={styles.footer}>
            {actions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant || 'primary'}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
