import './Select.css';
import { ChevronDown } from 'lucide-react';

export function Select({ label, value, onChange, options = [], placeholder = 'Select...', error, disabled, className = '' }) {
  return (
    <div className={`select-field ${className}`}>
      {label && <label className="select-label">{label}</label>}
      <div className={`select-wrapper ${error ? 'select-error' : ''} ${disabled ? 'select-disabled' : ''}`}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="select-input"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown size={16} className="select-chevron" />
      </div>
      {error && <span className="select-error-text">{error}</span>}
    </div>
  );
}
