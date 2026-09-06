import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell, Settings, Grid } from 'lucide-react';
import './GlobalTopBar.css';

const ROUTE_TITLES = { '/': 'Dashboard', '/products': 'Products', '/campaigns': 'Campaigns', '/upload': 'Upload Reports', '/settings': 'Settings' };

export function TopBar({ title }) {
  const location = useLocation();
  const pageTitle = title || ROUTE_TITLES[location.pathname] || 'TverseIQ';
  const breadcrumb = `Home / ${pageTitle}`;
  
  const [showApps, setShowApps] = useState(false);
  const appRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (appRef.current && !appRef.current.contains(event.target)) setShowApps(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px' }}>
      <div className="topbar-left">
        <span className="topbar-title">{pageTitle}</span>
        <span className="topbar-breadcrumb">{breadcrumb}</span>
      </div>
      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className="topbar-search">
          <Search size={14} className="topbar-search-icon" />
          <input type="text" placeholder="Search keywords..." />
        </div>
        
        <button className="topbar-icon-btn"><Bell size={18} /></button>
        <button className="topbar-icon-btn"><Settings size={18} /></button>
        
        {/* App Switcher */}
        <div ref={appRef} style={{ position: 'relative', marginLeft: '12px' }}>
          <button 
            className="app-switcher-btn"
            onClick={() => setShowApps(!showApps)}
          >
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
              ALL PRODUCTS
            </span>
            <Grid size={16} style={{ color: 'var(--grey-500)' }} />
          </button>
          
          {showApps && (
            <div style={{
              position: 'absolute', top: '100%', right: '0', marginTop: '8px', 
              background: 'white', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', 
              border: '1px solid var(--grey-200)', width: '240px', zIndex: 100
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--grey-100)', fontWeight: 600, fontSize: '12px', color: 'var(--grey-500)', textTransform: 'uppercase' }}>
                Switch Application
              </div>
              <div style={{ padding: '8px' }}>
                <a href="http://www.tverse-erp.in/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '6px', textDecoration: 'none', color: 'var(--text-primary)' }} className="app-switcher-item">
                  <div style={{ width: '32px', height: '32px', background: 'var(--orange-100)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--orange-600)', fontWeight: 700, fontSize: '14px' }}>T</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Tverse ERP</div>
                    <div style={{ fontSize: '11px', color: 'var(--grey-500)' }}>Core Operations</div>
                  </div>
                </a>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '6px', background: 'var(--cyan-50)' }} className="app-switcher-item">
                  <div style={{ width: '32px', height: '32px', background: 'var(--cyan-100)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--cyan-600)', fontWeight: 700, fontSize: '14px' }}>IQ</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--cyan-800)' }}>TverseIQ</div>
                    <div style={{ fontSize: '11px', color: 'var(--cyan-600)' }}>Current Application</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="topbar-avatar" style={{ marginLeft: '8px' }}>A</div>
      </div>
    </header>
  );
}