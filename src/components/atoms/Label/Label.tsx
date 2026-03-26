import type { LabelHTMLAttributes } from 'react';
import styles from './Label.module.css';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = ({ required, className, children, ...props }: LabelProps) => {
  return (
    <label className={`${styles.label} ${className || ''}`} {...props}>
      {children}
      {required && <span className={styles.required}>*</span>}
    </label>
  );
};
