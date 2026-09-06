import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Package, TrendingUp, ShoppingCart, DollarSign, Target, Megaphone, Activity, CheckCircle, ExternalLink } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { BackgroundAurora } from '../components/ui/BackgroundAurora';
import { DiscoveryTable } from '../components/dashboard/DiscoveryTable';
import { useApi } from '../hooks/useApi';
import { productApi, dashboardApi, campaignApi, mappingApi, tverseApi } from '../services/api';
import { TverseIntegrationCard } from '../components/dashboard/TverseIntegrationCard';
import './DetailPages.css';

export function ProductDetailPage() {
  const { id } = useParams();
  const [dateRange, setDateRange] = useState('30days');
  const [metrics, setMetrics] = useState({ spend: 0, sales: 0, orders: 0, acos: 0 });
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  
  const { data: product, loading: prodLoading } = useApi(() => productApi.getById(id), { immediate: true });
  const { data: allCampaigns = [], loading: campLoading } = useApi(campaignApi.getAll, { immediate: true });
  const { data: mappings = [] } = useApi(mappingApi.getAll, { immediate: true });
  const { data: abcData = [] } = useApi(tverseApi.getAbcAnalytics, { immediate: true });
  const [returnRateData, setReturnRateData] = useState(null);

  const mappedCampaigns = (allCampaigns || []).filter(camp => {
    return (camp.mappedProducts || []).some(p => p.productId === Number(id));
  });

  const productId = Number(id);

  useEffect(() => {
    if (product?.sku) {
      tverseApi.getReturnRate(product.sku).then(data => setReturnRateData(data)).catch(console.error);
    }
  }, [product?.sku]);

  useEffect(() => {
    async function fetchProductMetrics() {
      setLoadingMetrics(true);
      try {
        const d = await dashboardApi.getFilteredKeywords({ productIds: [productId] }, 0, 1000);
        const kws = Array.isArray(d) ? d : (d?.content || []);
        
        let totalSpend = 0;
        let totalSales = 0;
        let totalOrders = 0;

        kws.forEach(kw => {
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
        console.error("Failed to load product metrics", err);
      }
      setLoadingMetrics(false);
    }
    
    if (productId) {
      fetchProductMetrics();
    }
  }, [productId, dateRange]);

  if (prodLoading) return <div style={{ padding: '40px' }}>Loading product details...</div>;
  if (!product) return <div style={{ padding: '40px' }}>Product not found.</div>;

  let abcBadge = null;
  const abcObj = abcData?.find(d => d.metricKey === product.sku);
  if (abcObj) {
    try {
      const parsed = JSON.parse(abcObj.metricValue);
      const category = parsed.category;
      const symbols = {
        'A': { icon: '⭐', label: 'Best Seller (A)' },
        'B': { icon: '🔵', label: 'Moderate (B)' },
        'C': { icon: '🔻', label: 'Dead Stock (C)' }
      };
      const styling = symbols[category];
      if (styling) {
        abcBadge = (
          <span title={styling.label} style={{ fontSize: '20px', marginLeft: '12px', cursor: 'help' }}>
            {styling.icon}
          </span>
        );
      }
    } catch (e) {}
  }

  return (
    <div className="detail-page">
      <BackgroundAurora variant="cyan" />
      
      <div className="detail-header">
        <Link to="/products" className="back-link"><ArrowLeft size={16} /> Back to Products</Link>
        <div className="detail-title-row">
          <div>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "bold", color: "var(--grey-900)" }}>{product.name} {abcBadge} <span className="title-dot" style={{ display: "inline-block", width: "8px", height: "8px", background: "#f97316", borderRadius: "50%", marginLeft: "4px" }}></span></h1>
            <span className="subtitle">
              SKU: {product.sku} | 
              <span style={{ display: 'inline-flex', gap: '8px', marginLeft: '8px', flexWrap: 'wrap' }}>
                {product.mappedPlatforms?.map(platform => {
                  const mapping = mappings?.find(m => m.product?.productId === product.productId && m.platform === platform);
                  const url = platform === 'AMAZON' 
                    ? `https://www.amazon.in/dp/${mapping?.channelProductId || ''}`
                    : `https://www.flipkart.com/product/p/itm?pid=${mapping?.channelProductId || ''}`;
                  const logoMap = {
                    'AMAZON': '/logos/amazon.png',
                    'FLIPKART': '/logos/flipkart.png',
                    'MYNTRA': '/logos/myntra.png',
                    'MEESHO': '/logos/meesho.jpg'
                  };
                  const logoSrc = logoMap[platform] || '/logos/amazon.png';
                  
                  return (
                    <a 
                      href={mapping?.channelProductId ? url : '#'} 
                      target="_blank" 
                      rel="noreferrer"
                      key={platform} 
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '32px', height: '32px', borderRadius: '50%',
                        border: '1px solid var(--grey-200)', background: 'white',
                        textDecoration: 'none',
                        cursor: mapping?.channelProductId ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        overflow: 'hidden'
                      }}
                      title={mapping?.channelProductId ? `Open on ${platform}` : platform}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--grey-400)'}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--grey-200)'}
                    >
                      <img src={logoSrc} alt={platform} style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                    </a>
                  );
                })}
              </span>
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
          <div className="metric-title"><DollarSign size={16} /> Total Ad Spend</div>
          <div className="metric-val">{loadingMetrics ? '...' : `₹${metrics.spend.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</div>
        </Card>
        <Card className="metric-card">
          <div className="metric-title"><TrendingUp size={16} /> Attributed Sales</div>
          <div className="metric-val">{loadingMetrics ? '...' : `₹${metrics.sales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</div>
        </Card>
        <Card className="metric-card">
          <div className="metric-title"><ShoppingCart size={16} /> Total Orders</div>
          <div className="metric-val">{loadingMetrics ? '...' : metrics.orders}</div>
        </Card>
        <Card className="metric-card">
          <div className="metric-title"><Activity size={16} /> Return Rate</div>
          <div className="metric-val" style={{ color: (returnRateData?.returnRatePct > 15) ? '#dc2626' : 'inherit' }}>
            {!returnRateData ? '...' : `${returnRateData.returnRatePct}%`}
            {returnRateData && <div style={{fontSize: '11px', color: '#64748b', fontWeight: 'normal', marginTop: '4px'}}>{returnRateData.totalReturns} returns</div>}
          </div>
        </Card>
        <Card className="metric-card">
          <div className="metric-title"><Target size={16} /> ACoS</div>
          <div className="metric-val" style={{ color: metrics.acos <= 0 ? 'inherit' : (metrics.acos < 25 ? '#059669' : '#dc2626') }}>
            {loadingMetrics ? '...' : (metrics.acos > 0 ? `${metrics.acos.toFixed(2)}%` : '0%')}
          </div>
        </Card>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <TverseIntegrationCard sku={product.sku} />
      </div>

      <div className="detail-layout">
        {/* Left Column: Keywords */}
        <Card className="detail-section detail-main-col">
          <h3>Product Keywords</h3>
          <p style={{ fontSize: '13px', color: 'var(--grey-500)', marginBottom: '16px' }}>
            All keywords attributed directly to this product.
          </p>
          <div style={{ margin: '-16px' }}>
            <DiscoveryTable filterRequest={{ productIds: [productId] }} />
          </div>
        </Card>

        {/* Right Column: Active Campaigns */}
        <Card className="detail-section detail-side-col">
          <h3>Active Campaigns</h3>
          <div className="campaign-list">
            {campLoading ? <div>Loading campaigns...</div> : 
             mappedCampaigns.length === 0 ? <div style={{color: 'var(--grey-500)', fontSize: '13px'}}>Product is not mapped to any campaigns.</div> :
             mappedCampaigns.map((camp, i) => (
              <div key={i} className="campaign-list-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Megaphone size={16} style={{ color: 'var(--orange-500)' }} />
                  <Link to={`/campaigns/${camp.campaignId}`} style={{ fontWeight: 500, color: 'var(--text-primary)', textDecoration: 'none' }}>
                    {camp.campaignName || camp.name}
                  </Link>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--grey-500)', marginTop: '4px' }}>
                  {camp.platform} | {camp.targetingType}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
