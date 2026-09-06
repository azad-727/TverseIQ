import React from 'react';
import './Button.css';

export const Button = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading,
  disabled,
  fullWidth,
  className = '',
  ...rest
}) => {
  const baseClass = 'tverse-btn';
  const classes = [
    baseClass,
    `${baseClass}--${variant}`,
    `${baseClass}--${size}`,
    fullWidth ? `${baseClass}--full-width` : '',
    loading ? `${baseClass}--loading` : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <svg className="tverse-btn__spinner" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!loading && Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} className="tverse-btn__icon" />}
      <span className="tverse-btn__content">{children}</span>
      {!loading && IconRight && <IconRight size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} className="tverse-btn__icon-right" />}
    </button>
  );
};
