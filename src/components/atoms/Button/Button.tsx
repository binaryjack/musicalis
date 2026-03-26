import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ButtonVariant, ButtonSize } from '../../../types';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: ReactNode;
}

export const Button = ({
  variant = ButtonVariant.PRIMARY,
  size = ButtonSize.MEDIUM,
  isLoading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) => {
  const baseClass = styles.button;
  const variantClass = styles[variant];
  const sizeClass = styles[size];
  const loadingClass = isLoading ? styles.loading : '';
  const disabledClass = disabled || isLoading ? styles.disabled : '';

  const combinedClassName = `${baseClass} ${variantClass} ${sizeClass} ${loadingClass} ${disabledClass} ${className || ''}`;

  return (
    <button
      className={combinedClassName}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <span className={styles.spinner} /> : children}
    </button>
  );
};
