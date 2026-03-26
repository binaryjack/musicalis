import { Button } from '../../atoms/Button/Button';
import styles from './Header.module.css';

interface HeaderProps {
  title: string;
  onHome?: () => void;
  onSettings?: () => void;
  rightContent?: React.ReactNode;
}

export const Header = ({ title, onHome, onSettings, rightContent }: HeaderProps) => {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {onHome && (
          <Button variant="secondary" size="small" onClick={onHome}>
            ← Home
          </Button>
        )}
      </div>

      <div className={styles.center}>
        <h1 className={styles.title}>{title}</h1>
      </div>

      <div className={styles.right}>
        {rightContent && <div className={styles.content}>{rightContent}</div>}
        {onSettings && (
          <Button variant="secondary" size="small" onClick={onSettings}>
            ⚙ Settings
          </Button>
        )}
      </div>
    </header>
  );
};
