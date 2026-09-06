import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Megaphone, TrendingUp, ShoppingCart, DollarSign, Target, Package } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { BackgroundAurora } from '../components/ui/BackgroundAurora';
import { DiscoveryTable } from '../components/dashboard/DiscoveryTable';
import { useApi } from '../hooks/useApi';
import { campaignApi, dashboardApi } from '../services/api';
import './DetailPages.css';

export function CampaignDetailPage() {
  const { id } = useParams();
  const [dateRange, setDateRange] = useState('30days');
  const [metrics, setMetrics] = useState({ spend: 0, sales: 0, orders: 0, acos: 0 });
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  
  const { data: campaign, loading: campLoading } = useApi(() => campaignApi.getById(id), { immediate: true });

  const mappedProducts = campaign?.mappedProducts || [];
  const productIds = useMemo(() => mappedProducts.map(p => p.productId), [mappedProducts]);

  useEffect(() => {
    async function fetchCampaignMetrics() {
      if (productIds.length === 0) {
        setMetrics({ spend: 0, sales: 0, orders: 0, acos: 0 });
        setLoadingMetrics(false);
        return;
      }

      setLoadingMetrics(true);
      try {
        const d = await dashboardApi.getFilteredKeywords({ productIds }, 0, 1000);
        const keywords = Array.isArray(d) ? d : (d?.content || []);
        
        let totalSpend = 0;
        let totalSales = 0;
        let totalOrders = 0;

        keywords.forEach(kw => {
          totalSpend += (kw.spend || 0);
          totalSales += (kw.sales || 0);
          totalOrders += (kw.orders || 0);
        });

        let acos = 0;
        if (totalSales > 0) {
          acos = (totalSpend / totalSales) * 100;
        }

        setMetrics({ spend: totalSpend, sales: totalSales, orders: totalOrders, acos });
      } catch (err) {
        console.error("Failed to load metrics", err);
      }
      setLoadingMetrics(false);
    }
    
    if (id && !campLoading) {
      fetchCampaignMetrics();
    }
  }, [id, dateRange, productIds, campLoading]);

  if (campLoading) return <div style={{ padding: '40px' }}>Loading campaign details...</div>;
  if (!campaign) return <div style={{ padding: '40px' }}>Campaign not found.</div>;

  return (
    <div className="detail-page">
      <BackgroundAurora variant="purple" />
      
      <div className="detail-header">
        <Link to="/campaigns" className="back-link"><ArrowLeft size={16} /> Back to Campaigns</Link>
        <div className="detail-title-row">
          <div>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "bold", color: "var(--grey-900)" }}>{campaign.campaignName || campaign.name} <span className="title-dot" style={{ display: "inline-block", width: "8px", height: "8px", background: "#f97316", borderRadius: "50%", marginLeft: "4px" }}></span></h1>
            <span className="subtitle">
              {campaign.platform} | {campaign.targetingType} {campaign.targetingSubType ? `- ${campaign.targetingSubType}` : ''} | Budget: ₹{campaign.budget}
            </span>
          </div>
          
          <div className="date-filter">
            <Calendar size={16} />
            <select value={dateRange} onChange={e => setDateRange(e.target.value)}>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="all">Lifetime</option>
            </select>
          </div>
        </div>
      </div>

      <div className="detail-metrics-grid">
        <Card className="metric-card">
          <div className="metric-title"><DollarSign size={16} /> Campaign Spend</div>
          <div className="metric-val">{loadingMetrics ? '...' : `₹${metrics.spend.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</div>
        </Card>
        <Card className="metric-card">
          <div className="metric-title"><TrendingUp size={16} /> Campaign Sales</div>
          <div className="metric-val">{loadingMetrics ? '...' : `₹${metrics.sales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</div>
        </Card>
        <Card className="metric-card">
          <div className="metric-title"><ShoppingCart size={16} /> Orders</div>
          <div className="metric-val">{loadingMetrics ? '...' : metrics.orders}</div>
        </Card>
        <Card className="metric-card">
          <div className="metric-title"><Target size={16} /> ACoS</div>
          <div className="metric-val" style={{ color: metrics.acos <= 0 ? 'inherit' : (metrics.acos < 25 ? '#059669' : '#dc2626') }}>
            {loadingMetrics ? '...' : (metrics.acos > 0 ? `${metrics.acos.toFixed(2)}%` : '0%')}
          </div>
        </Card>
      </div>

      <div className="detail-layout" style={{ display: 'block' }}>
        <Card className="detail-section" style={{ marginBottom: '24px' }}>
          <h3>Mapped Products</h3>
          <p style={{ fontSize: '13px', color: 'var(--grey-500)', marginBottom: '16px' }}>
            Products currently attached to this campaign. Keywords will only track if products are mapped.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {mappedProducts.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: 'var(--grey-500)' }}>
                      No products mapped to this campaign yet.
                    </td>
                  </tr>
                ) : (
                  mappedProducts.map((prod) => (
                    <tr key={prod.productId}>
                      <td style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Package size={16} style={{ color: 'var(--grey-400)' }}/>
                        <Link to={`/products/${prod.productId}`} style={{ color: 'var(--orange-600)', textDecoration: 'none' }}>
                          {prod.name}
                        </Link>
                      </td>
                      <td>{prod.sku}</td>
                      <td>{prod.category || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* New Keywords Table with Pagination and all columns! */}
        <Card className="detail-section">
          <h3>Campaign Keywords</h3>
          <p style={{ fontSize: '13px', color: 'var(--grey-500)', marginBottom: '16px' }}>
            All keywords attributed to the products mapped to this campaign.
          </p>
          {productIds.length > 0 ? (
            <div style={{ margin: '-16px' }}>
              <DiscoveryTable filterRequest={{ productIds }} />
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--grey-500)' }}>
              Map products to this campaign to see keywords.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
