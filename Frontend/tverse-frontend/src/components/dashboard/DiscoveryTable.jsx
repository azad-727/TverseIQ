import { useState, useEffect, useMemo } from 'react';
import { dashboardApi } from '../../services/api';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { ArrowUpDown, GraduationCap, Search, AlertTriangle, Download } from 'lucide-react';
import { Pagination } from '../ui/Pagination';
import { Button } from '../ui/Button';
import { downloadAsCsv } from '../../utils/exportUtils';
import '../ui/Table.css';
import './DiscoveryTable.css';

const COLS = [
  { key: 'keyword', label: 'Keyword', align: 'left' },
  { key: 'matchType', label: 'Match Type', align: 'left' },
  { key: 'attributionType', label: 'Attribution', align: 'left' },
  { key: 'confidenceScore', label: 'Confidence', align: 'right' },
  { key: 'orders', label: 'Orders', align: 'right' },
  { key: 'clicks', label: 'Clicks', align: 'right' },
  { key: 'impressions', label: 'Views (Impr.)', align: 'right' },
  { key: 'purchaseRate', label: 'CVR %', align: 'right' },
  { key: 'cpc', label: 'CPC', align: 'right' },
  { key: 'spend', label: 'Spend', align: 'right' },
  { key: 'sales', label: 'Sales', align: 'right' },
  { key: 'acos', label: 'ACoS %', align: 'right' },
  { key: 'roi', label: 'ROI (ROAS)', align: 'right' },
];

function fmt(key, val, row) {
  switch (key) {
    case 'purchaseRate': case 'avgCtr': return Number(val || 0).toFixed(2) + '%';
    case 'confidenceScore': return Number(val || 0).toFixed(2);
    case 'spend': case 'sales': case 'avgCpc': case 'costPerPurchase':
      return '₹' + Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    case 'orders': case 'clicks': case 'impressions':
      return Number(val || 0).toLocaleString();
    case 'cpc':
      if (row.clicks > 0) return '₹' + (row.spend / row.clicks).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return '₹0.00';
    case 'acos':
      if (row.sales > 0) return ((row.spend / row.sales) * 100).toFixed(2) + '%';
      return '0.00%';
    case 'roi':
      if (row.spend > 0) return (row.sales / row.spend).toFixed(2) + 'x';
      return '0.00x';
    default: return val == null || val === '' ? '-' : String(val);
  }
}

export function DiscoveryTable({ filterRequest = {}, searchQuery = '' }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortKey, setSortKey] = useState('spend');
  const [sortDir, setSortDir] = useState('desc');
  
  // Server-side pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Selection state
  const [selectedRows, setSelectedRows] = useState(new Set());

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSelectedRows(new Set()); // Clear selection on fetch

    const cleanRequest = Object.entries(filterRequest || {}).reduce((acc, [key, value]) => {
      if (value !== '' && value !== false && value !== null && (Array.isArray(value) ? value.length > 0 : true)) {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    // Pass searchQuery to backend if available
    if (searchQuery) {
      cleanRequest.keyword = searchQuery;
    }

    dashboardApi.getFilteredKeywords(cleanRequest, currentPage, pageSize)
      .then(d => { 
        const content = Array.isArray(d) ? d : (d?.content || []);
        setRows(content);
        setTotalPages(d?.totalPages || 1);
        setLoading(false); 
      })
      .catch(e => {
        const msg = typeof e === 'string' ? e : e?.message || 'Failed to load keywords';
        setError(msg);
        setRows([]);
        setLoading(false);
      });
  }, [filterRequest, currentPage, pageSize, searchQuery]);

  // Reset to page 0 when page size changes
  useEffect(() => {
    setCurrentPage(0);
  }, [pageSize]);

  const filtered = useMemo(() => {
    let list = [...rows];
    
    // Fallback client-side filter
    if (searchQuery && list.length <= pageSize) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => r.keyword?.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      const getVal = (row, k) => {
        if (k === 'cpc') return row.clicks > 0 ? row.spend / row.clicks : 0;
        if (k === 'acos') return row.sales > 0 ? (row.spend / row.sales) * 100 : 0;
        if (k === 'roi') return row.spend > 0 ? row.sales / row.spend : 0;
        return row[k];
      };
      
      const av = getVal(a, sortKey);
      const bv = getVal(b, sortKey);
      const cmp = typeof av === 'string' ? (av || '').localeCompare(bv || '') : Number(av || 0) - Number(bv || 0);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [rows, searchQuery, sortKey, sortDir]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allKeys = new Set(filtered.map(r => r.keyword + r.matchType));
      setSelectedRows(allKeys);
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (row, checked) => {
    const key = row.keyword + row.matchType;
    const newSet = new Set(selectedRows);
    if (checked) newSet.add(key);
    else newSet.delete(key);
    setSelectedRows(newSet);
  };

  const handleExport = () => {
    const dataToExport = filtered.filter(r => selectedRows.has(r.keyword + r.matchType)).map(row => {
      const exportedRow = {};
      COLS.forEach(col => {
        exportedRow[col.label] = fmt(col.key, row[col.key], row).replace('₹', '');
      });
      return exportedRow;
    });
    downloadAsCsv(dataToExport, 'keywords_export.csv');
  };

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  if (error) {
    return (
      <div className="discovery-container" style={{padding: '40px', textAlign: 'center'}}>
        <EmptyState icon={AlertTriangle} title="Could not load keyword data" description={error} />
      </div>
    );
  }

  return (
    <div className="discovery-container" style={{ display: 'flex', flexDirection: 'column' }}>
      
      {/* Table Action Toolbar */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--grey-200)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--grey-700)', flex: 1 }}>
          {selectedRows.size > 0 ? `${selectedRows.size} ${selectedRows.size === 1 ? 'keyword' : 'keywords'} selected` : 'Keyword Insights'}
        </span>
        <button 
          onClick={handleExport}
          disabled={selectedRows.size === 0}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '6px', 
            padding: '6px 16px', borderRadius: '6px', 
            border: '1px solid #e2e8f0', background: '#fff', 
            color: selectedRows.size > 0 ? '#3b82f6' : '#94a3b8', 
            fontWeight: 500, fontSize: '13px', cursor: selectedRows.size > 0 ? 'pointer' : 'not-allowed',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          <Download size={14} /> Export
        </button>
      </div>

      <div className="discovery-scroll">
        <table className="data-table discovery-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={filtered.length > 0 && selectedRows.size === filtered.length}
                  onChange={handleSelectAll}
                  style={{ cursor: 'pointer', accentColor: 'var(--orange-500)' }}
                />
              </th>
              {COLS.map(col => (
                <th key={col.key} className={col.align === 'right' ? 'col-right' : ''}
                  onClick={() => toggleSort(col.key)} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <span className="discovery-th-inner">
                    {col.label}
                    <ArrowUpDown size={12} className={`discovery-sort-icon ${sortKey === col.key ? 'discovery-sort-active' : ''}`} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={COLS.length + 1}><Skeleton width={`${60 + Math.random() * 30}%`} /></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={COLS.length + 1}>
                <EmptyState icon={Search} title="No keywords found" description="Adjust your filters or upload more reports" />
              </td></tr>
            ) : (
              filtered.map((row, i) => (
                <tr key={`${row.keyword}-${row.matchType}-${i}`} className={row.isReadyToGraduate ? 'discovery-row-grad' : row.isBleeding ? 'discovery-row-bleed' : ''}>
                  <td style={{ textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedRows.has(row.keyword + row.matchType)}
                      onChange={(e) => handleSelectRow(row, e.target.checked)}
                      style={{ cursor: 'pointer', accentColor: 'var(--orange-500)' }}
                    />
                  </td>
                  {COLS.map(col => (
                    <td key={col.key} className={`${col.align === 'right' ? 'col-right' : ''} ${col.key === 'keyword' ? 'col-keyword' : ''}`}>
                      {col.key === 'attributionType' ? (
                        <Badge variant={row.attributionType === 'CONFIRMED' ? 'success' : 'warning'} size="sm">
                          {row.attributionType || '-'}
                        </Badge>
                      ) : col.key === 'keyword' && row.isReadyToGraduate ? (
                        <span className="discovery-grad-keyword">
                          <GraduationCap size={14} className="discovery-grad-icon" />
                          {row.keyword}
                        </span>
                      ) : col.key === 'keyword' && row.isBleeding ? (
                        <span className="discovery-bleed-keyword">
                          <AlertTriangle size={14} className="discovery-bleed-icon" />
                          {row.keyword}
                        </span>
                      ) : fmt(col.key, row[col.key], row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={setCurrentPage} 
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}