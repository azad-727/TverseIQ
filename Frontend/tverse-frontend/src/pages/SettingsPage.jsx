import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { BackgroundAurora } from '../components/ui/BackgroundAurora';
import { Settings, Key, Link as LinkIcon, Server } from 'lucide-react';
import { useToast } from '../hooks/useApi';

export function SettingsPage() {
  const toast = useToast();
  const [amzConnected, setAmzConnected] = useState(false);
  const [fkConnected, setFkConnected] = useState(false);
  const [syncInterval, setSyncInterval] = useState('Every 1 hour');
  const [fetchMode, setFetchMode] = useState('Real-time Proxy');

  const handleConnectAmz = () => {
    toast.success(amzConnected ? 'Amazon Ads Disconnected' : 'Connected to Amazon Ads API');
    setAmzConnected(!amzConnected);
  };

  const handleConnectFk = () => {
    toast.success(fkConnected ? 'Flipkart Ads Disconnected' : 'Connected to Flipkart Ads API');
    setFkConnected(!fkConnected);
  };

  const handleSyncChange = (e) => {
    setSyncInterval(e.target.value);
    toast.success(`Sync interval updated to: ${e.target.value}`);
  };

  const handleFetchModeChange = (e) => {
    setFetchMode(e.target.value);
    toast.success(`Fetch mode updated to: ${e.target.value}`);
  };

  return (
    <div className="page-container" style={{ padding: '0px' }}>
      <BackgroundAurora variant="orange" />
      
      <div style={{ maxWidth: '800px', margin: '40px auto' }}>
        <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 600 }}>Application Settings <span className="title-dot" style={{ display: "inline-block", width: "8px", height: "8px", background: "#f97316", borderRadius: "50%", marginLeft: "4px" }}></span></h1>
        
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', borderBottom: '1px solid var(--grey-100)', paddingBottom: '16px' }}>
            <Server size={24} style={{ color: 'var(--orange-500)' }} />
            <h2 style={{ fontSize: '18px', margin: 0 }}>Tverse Core Integration</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--grey-700)', marginBottom: '8px' }}>API Base URL</label>
              <input 
                type="text" 
                value="https://www.tverse-erp.in/api" 
                disabled 
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--grey-300)', background: 'var(--grey-50)', color: 'var(--grey-500)' }} 
              />
              <p style={{ fontSize: '12px', color: 'var(--grey-500)', marginTop: '8px' }}>Configured in backend properties.</p>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--grey-700)', marginBottom: '8px' }}>Connection Status</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '6px', background: '#dcfce7', color: '#166534', fontWeight: 600, border: '1px solid #16653433' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#166534' }}></div>
                Connected (Active)
              </div>
            </div>
          </div>
        </Card>

        <Card style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', borderBottom: '1px solid var(--grey-100)', paddingBottom: '16px' }}>
            <Key size={24} style={{ color: 'var(--orange-500)' }} />
            <h2 style={{ fontSize: '18px', margin: 0 }}>API Key Management</h2>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--grey-600)', marginBottom: '16px' }}>
            The API Key used to authenticate with Tverse Core for background analytics syncing.
          </p>
          <div style={{ padding: '16px', background: 'var(--grey-50)', borderRadius: '8px', border: '1px solid var(--grey-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>TverseIQ Backend Key</div>
              <div style={{ fontSize: '12px', color: 'var(--grey-500)', fontFamily: 'monospace' }}>tviq_********************************</div>
            </div>
            <span style={{ fontSize: '12px', padding: '4px 8px', background: 'var(--orange-100)', color: 'var(--orange-700)', borderRadius: '12px', fontWeight: 600 }}>Active</span>
          </div>
        </Card>

        <Card style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', borderBottom: '1px solid var(--grey-100)', paddingBottom: '16px' }}>
            <Settings size={24} style={{ color: 'var(--cyan-500)' }} />
            <h2 style={{ fontSize: '18px', margin: 0 }}>Sync Preferences</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--grey-700)', marginBottom: '8px' }}>Catalog Sync Interval</label>
              <select value={syncInterval} onChange={handleSyncChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--grey-300)', background: 'white' }}>
                <option>Every 1 hour</option>
                <option>Every 6 hours</option>
                <option>Every 24 hours</option>
                <option>Manual Only</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--grey-700)', marginBottom: '8px' }}>Analytics Fetch Mode</label>
              <select value={fetchMode} onChange={handleFetchModeChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--grey-300)', background: 'white' }}>
                <option>Real-time Proxy</option>
                <option>Local Database Aggregation</option>
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', borderBottom: '1px solid var(--grey-100)', paddingBottom: '16px' }}>
            <LinkIcon size={24} style={{ color: 'var(--blue-500)' }} />
            <h2 style={{ fontSize: '18px', margin: 0 }}>External Integrations</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--grey-200)', borderRadius: '8px' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Amazon Ads API</div>
                <div style={{ fontSize: '12px', color: 'var(--grey-500)' }}>Sync ACoS, Spend, and Sales data</div>
              </div>
              <button 
                onClick={handleConnectAmz}
                style={{ padding: '6px 12px', background: amzConnected ? '#fef2f2' : 'white', color: amzConnected ? '#dc2626' : 'black', border: '1px solid var(--grey-300)', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
              >
                {amzConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--grey-200)', borderRadius: '8px' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Flipkart Ads API</div>
                <div style={{ fontSize: '12px', color: 'var(--grey-500)' }}>Sync ROAS and Campaign metrics</div>
              </div>
              <button 
                onClick={handleConnectFk}
                style={{ padding: '6px 12px', background: fkConnected ? '#fef2f2' : 'white', color: fkConnected ? '#dc2626' : 'black', border: '1px solid var(--grey-300)', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
              >
                {fkConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
