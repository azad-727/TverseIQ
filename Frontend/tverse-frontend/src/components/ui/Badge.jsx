import './Badge.css';

export function Badge({ children, variant = 'neutral', size = 'sm', dot = false, pulse = false, className = '' }) {
  return (
    <span className={`badge badge-${variant} badge-${size} ${pulse ? 'badge-pulse' : ''} ${className}`}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}
