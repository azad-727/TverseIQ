import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../services/api';
import { OverviewHeader } from '../components/overview/OverviewHeader';
import { BackgroundAurora } from '../components/ui/BackgroundAurora';
import { OverviewTopMetrics } from '../components/overview/OverviewTopMetrics';
import { OverviewMainChart } from '../components/overview/OverviewMainChart';
import { OverviewTopKeywords } from '../components/overview/OverviewTopKeywords';
import { OverviewMiniCharts } from '../components/overview/OverviewMiniCharts';
import './OverviewDashboardPage.css';

export function OverviewDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch global metrics to power the top cards
    dashboardApi.getMetrics()
      .then(data => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(e => {
        const msg = typeof e === 'string' ? e : e?.message || 'Failed to load metrics';
        setError(msg);
        setLoading(false);
      });
  }, []);

  return (
    <div className="overview-page">
      <BackgroundAurora variant="multi" />
      <OverviewHeader />
      
      {loading ? (
        <div className="overview-loading">Loading dashboard...</div>
      ) : error ? (
        <div className="overview-error">{error}</div>
      ) : (
        <div className="overview-content">
          <OverviewTopMetrics metrics={metrics} />
          
          <div className="overview-grid">
            <div className="overview-main-col">
              <OverviewMainChart metrics={metrics} />
            </div>
            <div className="overview-side-col">
              <OverviewTopKeywords />
            </div>
          </div>

          <OverviewMiniCharts metrics={metrics} />
        </div>
      )}
    </div>
  );
}
