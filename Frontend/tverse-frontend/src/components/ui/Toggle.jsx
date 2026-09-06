import './Toggle.css';

export function Toggle({ checked, onChange, disabled = false, label, className = '' }) {
  return (
    <label className={`toggle-wrapper ${disabled ? 'toggle-disabled' : ''} ${className}`}>
      {label && <span className="toggle-label">{label}</span>}
      <button type="button" role="switch" aria-checked={checked} disabled={disabled}
        className={`toggle-track ${checked ? 'toggle-checked' : ''}`}
        onClick={() => onChange(!checked)}>
        <span className="toggle-knob" />
      </button>
    </label>
  );
}
