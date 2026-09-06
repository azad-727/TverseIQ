import React, { useState } from 'react';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { DiscoveryTable } from '../components/dashboard/DiscoveryTable';
import { BackgroundAurora } from '../components/ui/BackgroundAurora';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import './KeywordIntelligencePage.css';

export function KeywordIntelligencePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  const [filters, setFilters] = useState({
    presetReadyToGraduate: false,
    presetBleeding: false,
    presetHighTrafficZeroCart: false,
    presetProfitableButStarved: false,
    matchTypes: [],
    minSpend: '',
    maxSpend: '',
    minAcos: '',
    maxAcos: '',
    minCvr: '',
    maxCpc: '',
    minOrders: ''
  });

  const handleCheckboxChange = (field) => {
    setFilters(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleMatchTypeChange = (type) => {
    setFilters(prev => {
      const isSelected = prev.matchTypes.includes(type);
      return {
        ...prev,
        matchTypes: isSelected 
          ? prev.matchTypes.filter(t => t !== type)
          : [...prev.matchTypes, type]
      };
    });
  };

  const handleInputChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="kw-intel-page">
      <BackgroundAurora variant="orange" />
      
      <div className="kw-header-title" style={{ position: 'absolute', top: '-10px', left: '24px' }}>
        <h1 className="overview-greeting" style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
          Keyword Intelligence <span className="title-dot" style={{ display: 'inline-block', width: '8px', height: '8px', background: '#f97316', borderRadius: '50%' }}></span>
        </h1>
        <p className="overview-date" style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>Advanced keyword analysis and discovery</p>
      </div>

      {/* LEFT SIDEBAR: AMAZON STYLE FILTERS */}
      <aside className="kw-sidebar" style={{ marginTop: '60px' }}>
        <div className="kw-sidebar-header">
          <SlidersHorizontal size={18} />
          <h2>Filters</h2>
        </div>
        
        <div className="kw-filter-group">
          <h3>Strategic Presets</h3>
          <label className="kw-checkbox-label">
            <input type="checkbox" checked={filters.presetReadyToGraduate} onChange={() => handleCheckboxChange('presetReadyToGraduate')} />
            Ready to Graduate
          </label>
          <label className="kw-checkbox-label">
            <input type="checkbox" checked={filters.presetBleeding} onChange={() => handleCheckboxChange('presetBleeding')} />
            Bleeding Keywords
          </label>
          <label className="kw-checkbox-label">
            <input type="checkbox" checked={filters.presetHighTrafficZeroCart} onChange={() => handleCheckboxChange('presetHighTrafficZeroCart')} />
            High Traffic, Zero Cart
          </label>
          <label className="kw-checkbox-label">
            <input type="checkbox" checked={filters.presetProfitableButStarved} onChange={() => handleCheckboxChange('presetProfitableButStarved')} />
            Profitable but Starved
          </label>
        </div>

        <div className="kw-filter-group">
          <h3>Match Types</h3>
          {['BROAD', 'PHRASE', 'EXACT'].map(type => (
            <label key={type} className="kw-checkbox-label">
              <input type="checkbox" checked={filters.matchTypes.includes(type)} onChange={() => handleMatchTypeChange(type)} />
              {type}
            </label>
          ))}
        </div>

        <div className="kw-filter-group">
          <h3>Ad Spend (₹)</h3>
          <div className="kw-range-inputs">
            <input type="number" placeholder="Min" value={filters.minSpend} onChange={e => handleInputChange('minSpend', e.target.value)} />
            <span>-</span>
            <input type="number" placeholder="Max" value={filters.maxSpend} onChange={e => handleInputChange('maxSpend', e.target.value)} />
          </div>
        </div>

        <div className="kw-filter-group">
          <h3>ACoS (%)</h3>
          <div className="kw-range-inputs">
            <input type="number" placeholder="Min" value={filters.minAcos} onChange={e => handleInputChange('minAcos', e.target.value)} />
            <span>-</span>
            <input type="number" placeholder="Max" value={filters.maxAcos} onChange={e => handleInputChange('maxAcos', e.target.value)} />
          </div>
        </div>

        <div className="kw-filter-group">
          <h3>Performance</h3>
          <div className="kw-single-input">
            <label>Min Orders</label>
            <input type="number" placeholder="0" value={filters.minOrders} onChange={e => handleInputChange('minOrders', e.target.value)} />
          </div>
          <div className="kw-single-input">
            <label>Min CVR (%)</label>
            <input type="number" placeholder="0" value={filters.minCvr} onChange={e => handleInputChange('minCvr', e.target.value)} />
          </div>
          <div className="kw-single-input">
            <label>Max CPC (₹)</label>
            <input type="number" placeholder="0" value={filters.maxCpc} onChange={e => handleInputChange('maxCpc', e.target.value)} />
          </div>
        </div>

      </aside>

      {/* RIGHT MAIN CONTENT */}
      <main className="kw-main" style={{ marginTop: '60px' }}>
        <div className="kw-topbar">
          <div className="kw-search-wrapper">
            <select 
              className="kw-category-select"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              <option value="EXACT">Exact Match</option>
              <option value="BROAD">Broad Match</option>
            </select>
            <div className="kw-search-divider"></div>
            <div style={{ flex: 1 }}>
              <Input 
                icon={Search} 
                placeholder="Search keywords..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ border: 'none', boxShadow: 'none', borderRadius: '0 4px 4px 0', height: '100%' }}
              />
            </div>
          </div>
        </div>

        <div className="kw-table-container">
          <DiscoveryTable filterRequest={filters} searchQuery={searchQuery} />
        </div>
      </main>

    </div>
  );
}
