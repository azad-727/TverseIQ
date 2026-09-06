import { TrendingUp, TrendingDown, IndianRupee, ShoppingCart, BarChart3, Target } from 'lucide-react';
import { useToast } from '../../hooks/useApi';
import './OverviewTopMetrics.css';

export function OverviewTopMetrics({ metrics }) {
  const { toast } = useToast();
  if (!metrics) return null;

  const { totalSpend, totalSales, totalOrders, roas, acos } = metrics;

  const formatMoney = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(val || 0);
  const formatNum = (val) => new Intl.NumberFormat('en-IN').format(val || 0);

  return (
    <div className="overview-top-card">
      <div className="metric-col" onClick={() => toast.info('Filtering by Total Sales')} style={{cursor: 'pointer'}}>
        <div className="metric-header">
          <IndianRupee size={16} /> Total Sales
        </div>
        <div className="metric-value">
          {formatMoney(totalSales)}
          <span className="metric-trend pos" onClick={(e) => { e.stopPropagation(); toast.info('Sales trend analysis coming soon'); }}><TrendingUp size={14} /> 12% vs last month</span>
        </div>
      </div>
      
      <div className="metric-divider" />
      
      <div className="metric-col" onClick={() => toast.info('Filtering by Total Spend')} style={{cursor: 'pointer'}}>
        <div className="metric-header">
          <BarChart3 size={16} /> Total Spend
        </div>
        <div className="metric-value">
          {formatMoney(totalSpend)}
          <span className="metric-trend pos" onClick={(e) => { e.stopPropagation(); toast.info('Spend trend analysis coming soon'); }}><TrendingUp size={14} /> 3% vs last month</span>
        </div>
      </div>

      <div className="metric-divider" />

      <div className="metric-col" onClick={() => toast.info('Filtering by Total Orders')} style={{cursor: 'pointer'}}>
        <div className="metric-header">
          <ShoppingCart size={16} /> Total Orders
        </div>
        <div className="metric-value">
          {formatNum(totalOrders)}
          <span className="metric-trend pos" onClick={(e) => { e.stopPropagation(); toast.info('Orders trend analysis coming soon'); }}><TrendingUp size={14} /> 8% vs last month</span>
        </div>
      </div>

      <div className="metric-divider" />

      <div className="metric-col" onClick={() => toast.info('Filtering by ROAS')} style={{cursor: 'pointer'}}>
        <div className="metric-header">
          <Target size={16} /> ROAS
        </div>
        <div className="metric-value">
          {roas?.toFixed(2)}x
          <span className="metric-trend neg" onClick={(e) => { e.stopPropagation(); toast.info('ROAS trend analysis coming soon'); }}><TrendingDown size={14} /> 1.2% vs last month</span>
        </div>
      </div>
    </div>
  );
}
