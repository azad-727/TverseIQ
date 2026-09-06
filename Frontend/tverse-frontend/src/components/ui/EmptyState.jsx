import './EmptyState.css';

export function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`empty-state ${className}`}>
      {Icon && <Icon size={48} className="empty-state-icon" />}
      {title && <h3 className="empty-state-title">{title}</h3>}
      {description && <p className="empty-state-desc">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
