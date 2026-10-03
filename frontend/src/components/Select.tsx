import React from 'react';
import './Select.css';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  helperText?: string;
}

export default function Select({ 
  label, 
  options, 
  placeholder = 'Pilih...',
  error,
  helperText,
  className = '',
  id,
  ...props
}: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`select-wrapper ${error ? 'has-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="select-label">
          {label}
          {props.required && <span className="required-indicator" aria-hidden="true">*</span>}
        </label>
      )}
      <select
        id={inputId}
        className="select-input"
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="select-error">{error}</p>}
      {helperText && !error && <p className="select-helper">{helperText}</p>}
    </div>
  );
}