import './Skeleton.css';

export function Skeleton({ variant = 'text', width, height, borderRadius, count = 1, className = '' }) {
  const items = Array.from({ length: count }, (_, i) => i);
  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;
  if (borderRadius) style.borderRadius = borderRadius;

  return (
    <>
      {items.map((i) => (
        <div key={i} className={`skeleton skeleton-${variant} ${className}`} style={style} />
      ))}
    </>
  );
}
