import React from 'react';
import { addRipple } from '../utils/animation';
import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  className = '',
  onPointerDown,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  // Ripple putih transparan dari titik klik (hanya varian primary).
  // Murni visual: tidak menyentuh onClick/logika request apa pun.
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    onPointerDown?.(e);
    if (variant !== 'primary' || isDisabled || e.button !== 0) return;

    addRipple(e.currentTarget, e.clientX, e.clientY);
  };

  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className}`}
      disabled={isDisabled}
      onPointerDown={handlePointerDown}
      {...props}
    >
      {loading ? (
        <span className="btn-loading">
          <span className="spinner" />
          <span>Loading...</span>
        </span>
      ) : (
        <>
          {icon && <span className="btn-icon">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
