import React, { useState, useEffect } from 'react';
import { Award, HelpCircle } from 'lucide-react';
import { dashboardApi } from '../../services/api';
import { useToast } from '../../hooks/useApi';
import './OverviewTopKeywords.css';

export function OverviewTopKeywords() {
  const [keywords, setKeywords] = useState([]);
  const { toast } = useToast();
  
  useEffect(() => {
    // Fetch top keywords by passing a default filter
    dashboardApi.getFilteredKeywords({})
      .then(data => {
        if (data && data.length > 0) {
          // Sort by spend descending and take top 5
          const sorted = data.sort((a, b) => Number(b.spend) - Number(a.spend)).slice(0, 5);
          setKeywords(sorted);
        }
      })
      .catch(() => {});
  }, []);

  const formatMoney = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  
  // Calculate max for progress bars
  const maxSpend = Math.max(...keywords.map(k => Number(k.spend) || 0), 100);

  // Gradient colors based on position, matching grey-orange theme
  const colors = [
    'linear-gradient(90deg, #EA580C 0%, #F97316 100%)', // Bright Orange
    'linear-gradient(90deg, #F97316 0%, #FDBA74 100%)', // Orange Light
    'linear-gradient(90deg, #9CA3AF 0%, #D1D5DB 100%)', // Grey
    'linear-gradient(90deg, #D1D5DB 0%, #E5E7EB 100%)', // Light Grey
    'linear-gradient(90deg, #E5E7EB 0%, #F3F4F6 100%)'  // Lighter Grey
  ];

  return (
    <div className="overview-keywords-card">
      <div className="kw-header">
        <div className="kw-title">
          <Award size={16} /> Top Keywords 
          <HelpCircle size={14} className="icon-help" onClick={() => toast.info('Shows keywords with the highest spend')} style={{cursor: 'pointer'}} />
        </div>
      </div>
      
      <div className="kw-list">
        {keywords.length > 0 ? keywords.map((kw, idx) => {
          const spend = Number(kw.spend) || 0;
          const percent = Math.min(100, (spend / maxSpend) * 100);
          
          return (
            <div key={idx} className="kw-item">
              <div className="kw-item-header">
                <span className="kw-name">{kw.keyword || 'Unknown'}</span>
                <span className="kw-val">{formatMoney(spend)}</span>
              </div>
              <div className="kw-progress-bg">
                <div 
                  className="kw-progress-fill" 
                  style={{ width: `${percent}%`, background: colors[idx] || colors[4] }} 
                />
              </div>
            </div>
          );
        }) : (
          <div className="kw-empty">No keywords data available</div>
        )}
      </div>
      
      <div className="kw-footer">
        <div className="kw-scale">
          <span>0</span>
          <span>| 2K</span>
          <span>| 4K</span>
        </div>
      </div>
    </div>
  );
}
