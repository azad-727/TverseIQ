import { useEffect, useState } from 'react';
import { dashboardApi } from '../../services/api';
import { Skeleton } from '../ui/Skeleton';
import { IndianRupee, TrendingUp, ShoppingCart, Target } from 'lucide-react';
import './MetricsGrid.css';

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

const CARDS = [
  { key: 'totalSpend', label: 'Total Ad Spend', icon: IndianRupee, color: 'blue', fmt: formatCurrency, sub: 'Active Budget', subVal: 'Optimized' },
  { key: 'totalSales', label: 'Total Ad Sales', icon: TrendingUp, color: 'green', fmt: formatCurrency, sub: 'Attributed Revenue', subVal: 'Verified', trend: true },
  { key: 'totalOrders', label: 'Total Orders', icon: ShoppingCart, color: 'amber', fmt: (v) => (v || 0).toLocaleString(), sub: 'Avg. CPA', subValFn: (m) => formatCurrency(m.totalOrders > 0 ? m.totalSpend / m.totalOrders : 0) },
  { key: 'acos', label: 'Blended ACoS', icon: Target, color: 'orange', fmt: (v) => `${v || 0}%`, sub: 'ROAS Equivalent', subValFn: (m) => `${m.roas || 0}x` },
];

export function MetricsGrid() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    dashboardApi.getMetrics()
      .then(d => { setMetrics(d); setLoading(false); })
      .catch(e => {
        const msg = typeof e === 'string' ? e : e?.message || 'Failed to load metrics';
        setError(msg);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="metrics-grid">
        {[0,1,2,3].map(i => (
          <div key={i} className="metric-card">
            <Skeleton width="60%" height="12px" />
            <Skeleton width="50%" height="28px" />
            <Skeleton width="100%" height="1px" />
            <Skeleton width="80%" height="12px" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="metrics-grid">
        <div className="metric-card" style={{gridColumn: '1/-1', textAlign: 'center', color: 'var(--grey-500)', padding: '32px'}}>
          <p>Could not load metrics. Backend may be offline.</p>
          <button onClick={() => window.location.reload()} style={{marginTop: '8px', color: 'var(--orange-500)', fontWeight: 600, cursor: 'pointer'}}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="metrics-grid">
      {CARDS.map(card => {
        const Icon = card.icon;
        const value = card.fmt(metrics[card.key]);
        const subValue = card.subValFn ? card.subValFn(metrics) : card.subVal;
        const showTrend = card.trend;

        return (
          <div key={card.key} className="metric-card">
            <div className="metric-card-top">
              <span className="metric-card-label">{card.label}</span>
              <div className={`metric-card-icon ${card.color}`}><Icon size={16} /></div>
            </div>
            <div style={{display: 'flex', alignItems: 'flex-end', gap: '10px'}}>
              <div className="metric-card-value">{value}</div>
              {showTrend && (
                <span className={`metric-card-trend ${metrics.totalSales > metrics.totalSpend ? 'good' : 'bad'}`}>
                  {metrics.totalSales > metrics.totalSpend ? 'Target Hit' : 'Bleeding'}
                </span>
              )}
            </div>
            <div className="metric-card-bottom">
              <span className="metric-card-bottom-label">{card.sub}</span>
              <span className="metric-card-bottom-value">{subValue}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}