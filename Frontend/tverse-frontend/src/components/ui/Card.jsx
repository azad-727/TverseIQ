import './Card.css';

export function Card({ children, hoverable = false, padding = 'md', className = '', ...rest }) {
  return (
    <div className={`card card-pad-${padding} ${hoverable ? 'card-hoverable' : ''} ${className}`} {...rest}>
      {children}
    </div>
  );
}
