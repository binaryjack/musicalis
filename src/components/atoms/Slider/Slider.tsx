import type { InputHTMLAttributes } from 'react';
import styles from './Slider.module.css';

interface SliderProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  showValue?: boolean;
}

export const Slider = ({ label, showValue = false, className, type = 'range', ...props }: SliderProps) => {
  return (
    <div className={styles.wrapper}>
      {label && (
        <div className={styles.header}>
          <label className={styles.label}>{label}</label>
          {showValue && <span className={styles.value}>{props.value}</span>}
        </div>
      )}
      <input
        type={type}
        className={`${styles.slider} ${className || ''}`}
        {...props}
      />
    </div>
  );
};
