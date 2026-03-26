import { Button } from '../../atoms/Button/Button';
import styles from './ColorPreview.module.css';

interface ColorPreviewProps {
  colors: Array<{ id: string; name: string; hex: string }>;
  selectedColorId: string | null;
  onSelectColor: (colorId: string) => void;
  onAddColor: () => void;
  onRemoveColor: (colorId: string) => void;
  disabled?: boolean;
}

export const ColorPreview = ({
  colors,
  selectedColorId,
  onSelectColor,
  onAddColor,
  onRemoveColor,
  disabled = false,
}: ColorPreviewProps) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3 className={styles.title}>Color Mapping</h3>
        <Button
          variant="primary"
          size="small"
          onClick={onAddColor}
          disabled={disabled}
        >
          + Add
        </Button>
      </div>

      <div className={styles.grid}>
        {colors.map((color) => (
          <div
            key={color.id}
            className={`${styles.colorItem} ${selectedColorId === color.id ? styles.active : ''}`}
            onClick={() => !disabled && onSelectColor(color.id)}
          >
            <div
              className={styles.swatch}
              style={{ backgroundColor: color.hex }}
            />
            <div className={styles.info}>
              <div className={styles.name}>{color.name}</div>
              <div className={styles.hex}>{color.hex}</div>
            </div>
            <Button
              variant="danger"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveColor(color.id);
              }}
              disabled={disabled}
            >
              ✕
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
