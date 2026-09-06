import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Maximize2, MoreHorizontal, IndianRupee } from 'lucide-react';
import { useToast } from '../../hooks/useApi';
import './OverviewMainChart.css';

export function OverviewMainChart({ metrics }) {
  const { toast } = useToast();
  const [hideThisMonth, setHideThisMonth] = useState(false);
  const [hideLastMonth, setHideLastMonth] = useState(false);

  // Generate realistic mock time-series data proportional to the total metrics
  const chartData = useMemo(() => {
    if (!metrics) return [];
    
    const baseValue = (metrics.totalSales || 10000) / 30;
    const data = [];
    
    // Simulate 30 days of data
    for (let i = 1; i <= 30; i++) {
      const day = i < 10 ? `Feb 0${i}` : `Feb ${i}`;
      
      // Random walk simulation for 'This Month'
      const noise1 = (Math.random() - 0.3) * baseValue * 0.4;
      let thisMonth = baseValue + noise1 + (Math.sin(i / 3) * baseValue * 0.2);
      
      // Random walk simulation for 'Last Month'
      const noise2 = (Math.random() - 0.5) * baseValue * 0.4;
      let lastMonth = (baseValue * 0.9) + noise2 + (Math.cos(i / 4) * baseValue * 0.2);
      
      data.push({
        name: day,
        thisMonth: Math.max(0, thisMonth),
        lastMonth: Math.max(0, lastMonth)
      });
    }
    return data;
  }, [metrics]);

  const formatMoney = (val) => new Intl.NumberFormat('en-IN', { notation: "compact", compactDisplay: "short", style: 'currency', currency: 'INR' }).format(val);

  return (
    <div className="overview-chart-card">
      <div className="chart-header">
        <div className="chart-header-left">
          <div className="chart-title"><IndianRupee size={16} /> Total Sales History</div>
          <div className="chart-value">
            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(metrics?.totalSales || 0)}
            <span className="chart-trend pos">↑ 9% vs last month</span>
          </div>
        </div>
        <div className="chart-header-right">
          <div className="chart-legend">
            <span 
              className={`legend-item ${hideThisMonth ? 'inactive' : ''}`} 
              onClick={() => setHideThisMonth(!hideThisMonth)}
              style={{ cursor: 'pointer' }}
            >
              <span className="legend-dot this" /> This month
            </span>
            <span 
              className={`legend-item ${hideLastMonth ? 'inactive' : ''}`} 
              onClick={() => setHideLastMonth(!hideLastMonth)}
              style={{ cursor: 'pointer' }}
            >
              <span className="legend-dot last" /> Last month
            </span>
          </div>
          <div className="chart-actions">
            <button className="action-btn" onClick={() => toast.info('Detailed report modal opened')}>View More</button>
            <button className="icon-btn" onClick={() => {
              const el = document.querySelector('.overview-chart-card');
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else if (el) {
                el.requestFullscreen().catch(() => toast.info('Fullscreen view unavailable'));
              }
            }}><Maximize2 size={14}/></button>
            <button className="icon-btn" onClick={() => toast.info('Export data options menu opened')}><MoreHorizontal size={14}/></button>
          </div>
        </div>
      </div>
      
      <div className="chart-body">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorThisMonth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F97316" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} dy={10} minTickGap={20} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} tickFormatter={formatMoney} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              itemStyle={{ fontSize: '13px', fontWeight: 500 }}
              labelStyle={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}
              formatter={(value) => formatMoney(value)}
            />
            {!hideLastMonth && <Area type="monotone" dataKey="lastMonth" stroke="#E5E7EB" strokeWidth={2} fill="none" />}
            {!hideThisMonth && <Area type="monotone" dataKey="thisMonth" stroke="#F97316" strokeWidth={2} fillOpacity={1} fill="url(#colorThisMonth)" />}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
