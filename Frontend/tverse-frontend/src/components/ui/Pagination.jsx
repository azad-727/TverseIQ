import React from 'react';
import { Button } from './Button';

export function Pagination({ currentPage, totalPages, onPageChange, pageSize, onPageSizeChange }) {
  if (totalPages <= 1 && (!pageSize || totalPages === 0)) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
      
      {/* Page Size Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {pageSize && onPageSizeChange && (
          <>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Rows per page:</span>
            <select 
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#334155', outline: 'none', cursor: 'pointer' }}
            >
              {[50, 100, 120, 250].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Pagination Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Button 
          variant="ghost" 
          disabled={currentPage === 0} 
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
          Page {currentPage + 1} of {Math.max(1, totalPages)}
        </span>
        <Button 
          variant="ghost" 
          disabled={currentPage >= totalPages - 1} 
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
