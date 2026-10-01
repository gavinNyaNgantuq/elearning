import React from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  icon,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className={`input-wrapper ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <div className="input-container">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          className={`input ${error ? 'input-error' : ''} ${icon ? 'input-with-icon' : ''}`}
          {...props}
        />
      </div>
      {error && <p className="input-error-message">{error}</p>}
    </div>
  );
}
