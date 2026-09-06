import React, { forwardRef, useState } from 'react';
import './Input.css';

export const Input = forwardRef(({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  icon: Icon,
  error,
  helperText,
  disabled,
  className = '',
  ...rest
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`tverse-input-wrapper ${className}`}>
      {label && <label className="tverse-input-label">{label}</label>}
      <div className={`tverse-input-container ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''} ${isFocused ? 'is-focused' : ''}`}>
        {Icon && <Icon size={16} className="tverse-input-icon" />}
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="tverse-input"
          onFocus={(e) => {
            setIsFocused(true);
            if (rest.onFocus) rest.onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (rest.onBlur) rest.onBlur(e);
          }}
          {...rest}
        />
      </div>
      {(helperText || error) && (
        <div className={`tverse-input-helper ${error ? 'tverse-input-helper--error' : ''}`}>
          {error || helperText}
        </div>
      )}
    </div>
  );
});
Input.displayName = 'Input';
