import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Package, Tag, Layers, CheckCircle, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { tverseApi } from '../../services/api';

export function TverseIntegrationCard({ sku }) {
  const [tverseData, setTverseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sku) return;
    
    let isMounted = true;
    setLoading(true);
    
    // Attempt to fetch from external Tverse API
    tverseApi.getProductDetail(sku)
      .then(data => {
        if (isMounted) {
          setTverseData(data);
          setError(null);
        }
      })
      .catch(err => {
        if (isMounted) {
          // If the actual backend is not connected yet, we show a graceful fallback/info UI
          setError(err.message || 'Failed to connect to Tverse IMS');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
      
    return () => { isMounted = false; };
  }, [sku]);

  if (!sku) return null;

  return (
    <Card padding="md" style={{ background: 'linear-gradient(to right, #f8fafc, #ffffff)', borderLeft: '4px solid #0ea5e9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color="#0ea5e9" /> 
            Tverse IMS Integration
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--grey-500)', margin: 0 }}>
            Live catalog sync for SKU: <strong style={{ color: 'var(--grey-700)' }}>{sku}</strong>
          </p>
        </div>
        <div style={{ padding: '4px 8px', borderRadius: '4px', background: '#e0f2fe', color: '#0284c7', fontSize: '11px', fontWeight: '600' }}>
          DISTRIBUTED
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>Syncing with Tverse...</div>
      ) : tverseData ? (
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '16px', alignItems: 'center' }}>
          {tverseData.imageUrl ? (
            <img src={tverseData.imageUrl} alt={tverseData.productName} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
          ) : (
            <div style={{ width: '80px', height: '80px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={24} color="#94a3b8" />
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>{tverseData.productName}</div>
            
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#475569' }}>
                <Tag size={14} /> Brand: <span style={{ fontWeight: '500' }}>{tverseData.brandName || '-'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#475569' }}>
                <Layers size={14} /> Category: <span style={{ fontWeight: '500' }}>{tverseData.categoryName || '-'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#475569' }}>
                {tverseData.isActive ? <CheckCircle size={14} color="#10b981" /> : <XCircle size={14} color="#ef4444" />}
                Status: <span style={{ fontWeight: '500' }}>{tverseData.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
            
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              HSN: {tverseData.hsnCode || '-'} | Tax: {tverseData.taxRate || 0}% | Variants: {tverseData.variants?.length || 0}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '12px', padding: '12px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '6px' }}>
          <AlertTriangle size={16} color="#d97706" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#b45309' }}>Integration Pending</div>
            <div style={{ fontSize: '12px', color: '#92400e', marginTop: '4px' }}>
              Ready to display `{sku}` details from Tverse (Images, Categories, HSN, Tax). Ensure the API URL and Authentication token are configured in `services/api.js`.
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}