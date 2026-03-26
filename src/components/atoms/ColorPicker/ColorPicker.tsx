import type { InputHTMLAttributes } from 'react';
import styles from './ColorPicker.module.css';

interface ColorPickerProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  showCode?: boolean;
}

export const ColorPicker = ({ label, showCode = true, className, ...props }: ColorPickerProps) => {
  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.container}>
        <input
          type="color"
          className={`${styles.picker} ${className || ''}`}
          {...props}
        />
        {showCode && <span className={styles.code}>{props.value}</span>}
      </div>
    </div>
  );
};
