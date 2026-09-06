import React, { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { Maximize2, MoreHorizontal, FileText, PieChart, Activity } from 'lucide-react';
import { useToast } from '../../hooks/useApi';
import './OverviewMiniCharts.css';

export function OverviewMiniCharts({ metrics }) {
  const { toast } = useToast();
  // Generate mock mini-chart data
  const miniData = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => ({
      name: `Day ${i+1}`,
      aov: 20 + Math.random() * 15,
      acos: 10 + Math.random() * 25,
      roas: 1 + Math.random() * 4
    }));
  }, []);

  const avgOrderValue = metrics && metrics.totalOrders ? (metrics.totalSales / metrics.totalOrders) : 0;
  const acos = metrics?.acos || 0;
  
  const formatMoney = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(v);

  return (
    <div className="overview-mini-grid">
      
      {/* Average Order Value (Bar Chart) */}
      <div className="mini-card" id="card-aov">
        <div className="mini-header">
          <div className="mini-title"><FileText size={16} /> Average Order Value</div>
          <div className="mini-actions">
            <button onClick={() => {
              const el = document.getElementById('card-aov');
              if (document.fullscreenElement) document.exitFullscreen();
              else if (el) el.requestFullscreen().catch(()=>toast.info('Fullscreen unavailable'));
            }}><Maximize2 size={12} /></button>
            <button onClick={() => toast.info('AOV export options opened')}><MoreHorizontal size={12} /></button>
          </div>
        </div>
        <div className="mini-body">
          <div className="mini-val-row">
            <span className="mini-val">{formatMoney(avgOrderValue)}</span>
            <span className="mini-trend pos" onClick={() => toast.info('AOV trend details opened')} style={{cursor: 'pointer'}}>↑ 2.4% vs last month</span>
          </div>
          <div className="mini-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={miniData}>
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{fontSize: 12}} />
                <Bar dataKey="aov" fill="#FDBA74" radius={[2, 2, 0, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ACOS (Line Chart) */}
      <div className="mini-card" id="card-acos">
        <div className="mini-header">
          <div className="mini-title"><PieChart size={16} /> ACOS</div>
          <div className="mini-actions">
            <button onClick={() => {
              const el = document.getElementById('card-acos');
              if (document.fullscreenElement) document.exitFullscreen();
              else if (el) el.requestFullscreen().catch(()=>toast.info('Fullscreen unavailable'));
            }}><Maximize2 size={12} /></button>
            <button onClick={() => toast.info('ACOS export options opened')}><MoreHorizontal size={12} /></button>
          </div>
        </div>
        <div className="mini-body">
          <div className="mini-val-row">
            <span className="mini-val">{acos.toFixed(2)}%</span>
            <span className="mini-trend pos" onClick={() => toast.info('ACOS trend details opened')} style={{cursor: 'pointer'}}>↓ 1.34% vs last month</span>
          </div>
          <div className="mini-legend">
            <span><span className="dot this"/> This month</span>
            <span><span className="dot last"/> Last month</span>
          </div>
          <div className="mini-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={miniData}>
                <Tooltip contentStyle={{fontSize: 12}} />
                <Line type="monotone" dataKey="acos" stroke="#F97316" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROAS (Activity/Radial or just Bar) */}
      <div className="mini-card" id="card-roas">
        <div className="mini-header">
          <div className="mini-title"><Activity size={16} /> ROAS Trend</div>
          <div className="mini-actions">
            <button onClick={() => {
              const el = document.getElementById('card-roas');
              if (document.fullscreenElement) document.exitFullscreen();
              else if (el) el.requestFullscreen().catch(()=>toast.info('Fullscreen unavailable'));
            }}><Maximize2 size={12} /></button>
            <button onClick={() => toast.info('ROAS export options opened')}><MoreHorizontal size={12} /></button>
          </div>
        </div>
        <div className="mini-body">
          <div className="mini-val-row">
            <span className="mini-val">{metrics?.roas?.toFixed(2) || 0}x</span>
            <span className="mini-trend pos" onClick={() => toast.info('ROAS trend details opened')} style={{cursor: 'pointer'}}>↑ 5.2% vs last month</span>
          </div>
          <div className="mini-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={miniData}>
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{fontSize: 12}} />
                <Bar dataKey="roas" fill="#EA580C" radius={[2, 2, 0, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
