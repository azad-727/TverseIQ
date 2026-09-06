import './Table.css';
export function DataTable({ children, className = '' }) {
  return <table className={`data-table ${className}`}>{children}</table>;
}
