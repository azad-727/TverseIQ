import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, Plus, Search, Link as LinkIcon, CheckSquare, Square, Edit, Trash2, Download } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { BackgroundAurora } from '../components/ui/BackgroundAurora';
import { Pagination } from '../components/ui/Pagination';
import { useApi, useToast } from '../hooks/useApi';
import { campaignApi, productApi } from '../services/api';
import { downloadAsCsv } from '../utils/exportUtils';
import './CampaignsPage.css';

export function CampaignsPage() {
  const toast = useToast();
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  
  // Selection State
  const [selectedRows, setSelectedRows] = useState(new Set());
  
  // Campaign Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState({ 
    name: '', platform: 'AMAZON', budget: 0, budgetType: 'DAILY', targetingType: 'AUTO', targetingSubType: 'KEYWORD', matchTypes: [] 
  });
  
  // List State
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mapping State
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // API Hooks
  const { data: campaigns = [], loading, execute: fetchCampaigns } = useApi(campaignApi.getAll, { immediate: true });
  const { data: products = [], execute: fetchProducts } = useApi(productApi.getAll, { immediate: false });
  const { loading: saving, execute: saveCampaignApi } = useApi(isEditMode ? campaignApi.update : campaignApi.create);
  const { execute: deleteCampaignApi } = useApi(campaignApi.delete);
  const { loading: mapping, execute: mapProductsApi } = useApi(campaignApi.mapProducts);

  // Safely fallback arrays from APIs that might return null initially
  const safeProducts = products || [];
  const safeCampaigns = campaigns || [];

  useEffect(() => {
    setCurrentPage(0);
  }, [pageSize]);

  // Fetch products only once when opening the map modal
  useEffect(() => {
    if (isMapModalOpen && safeProducts.length === 0) {
      fetchProducts();
    }
  }, [isMapModalOpen, fetchProducts, safeProducts.length]);

  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...activeCampaign,
        name: activeCampaign.campaignName || activeCampaign.name,
        matchTypes: activeCampaign.matchTypes.join(',')
      };

      if (isEditMode) {
        await saveCampaignApi(activeCampaign.campaignId, payload);
        toast.success('Campaign updated successfully');
      } else {
        await saveCampaignApi(payload);
        toast.success('Campaign created successfully');
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchCampaigns();
    } catch (err) {
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the campaign "${name}"?`)) return;
    try {
      await deleteCampaignApi(id);
      toast.success('Campaign deleted successfully');
      fetchCampaigns();
    } catch (err) {
      toast.error(err.message || 'Failed to delete campaign');
    }
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (campaign) => {
    setIsEditMode(true);
    setActiveCampaign({
      ...campaign,
      name: campaign.campaignName || campaign.name,
      matchTypes: campaign.matchTypes ? (typeof campaign.matchTypes === 'string' ? campaign.matchTypes.split(',') : campaign.matchTypes) : []
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setActiveCampaign({ name: '', platform: 'AMAZON', budget: 0, budgetType: 'DAILY', targetingType: 'AUTO', targetingSubType: 'KEYWORD', matchTypes: [] });
  };

  const openMapModal = (campaign) => {
    setSelectedCampaign(campaign);
    // Parse existing mapped products
    const initialSelected = [];
    if (campaign.mappings) {
      initialSelected.push(...campaign.mappings.filter(m => m.status === 'ACTIVE').map(m => m.product?.productId));
    } else if (campaign.mappedProducts) {
      initialSelected.push(...campaign.mappedProducts.map(p => p.productId));
    }
    setSelectedProductIds(initialSelected);
    setIsMapModalOpen(true);
  };

  const handleUpdateMappingStatus = async (productId, status) => {
    try {
      await campaignApi.updateMappingStatus(selectedCampaign.campaignId, productId, status);
      toast.success(`Mapping status updated to ${status}`);
      // Refresh campaign data in background
      fetchCampaigns();
      // Update local state for immediate feedback
      setSelectedCampaign(prev => {
        if (!prev || !prev.mappings) return prev;
        return {
          ...prev,
          mappings: prev.mappings.map(m => m.product?.productId === productId ? { ...m, status } : m)
        };
      });
    } catch (err) {
      toast.error('Failed to update mapping status');
    }
  };

  const toggleProductSelection = (productId) => {
    setSelectedProductIds(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const toggleMatchType = (type) => {
    setActiveCampaign(prev => {
      const exists = prev.matchTypes.includes(type);
      return {
        ...prev,
        matchTypes: exists ? prev.matchTypes.filter(t => t !== type) : [...prev.matchTypes, type]
      };
    });
  };

  const handleSaveMapping = async () => {
    if (!selectedCampaign) return;
    try {
      await mapProductsApi(selectedCampaign.campaignId, selectedProductIds);
      toast.success('Products successfully mapped to campaign!');
      setIsMapModalOpen(false);
      fetchCampaigns();
    } catch (err) {
      toast.error(err.message || 'Failed to map products');
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile) return;
    setIsUploading(true);
    try {
      await campaignApi.bulkMapProducts(bulkFile);
      toast.success('Bulk mapping uploaded successfully!');
      setIsBulkModalOpen(false);
      setBulkFile(null);
      fetchCampaigns();
    } catch (err) {
      toast.error('Bulk mapping failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      { 'Campaign Name': 'Summer Sale 2024', 'SKU': 'TSH-BLK-OS', 'Status': 'ACTIVE' },
      { 'Campaign Name': 'Summer Sale 2024', 'SKU': 'TSH-WHT-OS', 'Status': 'PAUSED' }
    ];
    downloadAsCsv(templateData, 'campaign_mapping_template.csv');
  };

  const filteredCampaigns = safeCampaigns.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.campaignName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCampaigns.length / pageSize);
  const paginatedCampaigns = filteredCampaigns.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(new Set(filteredCampaigns.map(c => c.campaignId)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id, checked) => {
    const newSet = new Set(selectedRows);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedRows(newSet);
  };

  const handleExport = () => {
    const dataToExport = filteredCampaigns.filter(c => selectedRows.has(c.campaignId)).map(c => ({
      'Campaign Name': c.campaignName || c.name,
      'Platform': c.platform,
      'Targeting': c.targetingType,
      'Budget': `₹${c.budget} (${c.budgetType})`,
      'Match Types': c.matchTypes,
      'Products Mapped': c.mappedProducts?.length || 0
    }));
    downloadAsCsv(dataToExport, 'campaigns_export.csv');
  };

  const filteredProducts = safeProducts.filter(p => 
    p.name?.toLowerCase().includes(productSearchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  return (
    <div className="campaigns-page">
      <BackgroundAurora variant="purple" />
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="page-title-section">
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "bold", color: "var(--grey-900)" }}>Campaigns <span className="title-dot" style={{ display: "inline-block", width: "8px", height: "8px", background: "#f97316", borderRadius: "50%", marginLeft: "4px" }}></span></h1>
          </div>
          <p className="page-subtitle">Manage your ad campaigns and target strategies</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="ghost" onClick={() => setIsBulkModalOpen(true)} style={{ border: '1px solid #e2e8f0', background: 'white' }}>
            Bulk Map (Excel)
          </Button>
          <Button variant="primary" icon={Plus} onClick={openCreateModal}>
            Create Campaign
          </Button>
        </div>
      </div>

      <Card className="p-4" style={{ marginBottom: '1.5rem' }}>
        <Input 
          icon={Search} 
          placeholder="Search campaigns by name..." 
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
        />
      </Card>

      <Card>
        
        {/* Table Action Toolbar */}
        <div style={{ background: '#fff', borderBottom: '1px solid var(--grey-200)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--grey-700)', flex: 1 }}>
            {selectedRows.size > 0 ? `${selectedRows.size} ${selectedRows.size === 1 ? 'campaign' : 'campaigns'} selected` : 'Campaign List'}
          </span>
          <button 
            onClick={handleExport}
            disabled={selectedRows.size === 0}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', 
              padding: '6px 16px', borderRadius: '6px', 
              border: '1px solid #e2e8f0', background: '#fff', 
              color: selectedRows.size > 0 ? '#3b82f6' : '#94a3b8', 
              fontWeight: 500, fontSize: '13px', cursor: selectedRows.size > 0 ? 'pointer' : 'not-allowed',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <Download size={14} /> Export
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ width: '40px', padding: '12px 16px', textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={filteredCampaigns.length > 0 && selectedRows.size === filteredCampaigns.length}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer', accentColor: 'var(--orange-500)' }}
                  />
                </th>
                <th style={{ padding: '12px 16px', color: '#64748b' }}>Campaign Name</th>
                <th style={{ padding: '12px 16px', color: '#64748b' }}>Platform</th>
                <th style={{ padding: '12px 16px', color: '#64748b' }}>Targeting</th>
                <th style={{ padding: '12px 16px', color: '#64748b' }}>Budget</th>
                <th style={{ padding: '12px 16px', color: '#64748b', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ padding: '24px', textAlign: 'center' }}>Loading campaigns...</td></tr>
              ) : paginatedCampaigns.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                    <Megaphone size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p>No campaigns found.</p>
                  </td>
                </tr>
              ) : (
                paginatedCampaigns.map(campaign => (
                  <tr key={campaign.campaignId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ textAlign: 'center', padding: '16px' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedRows.has(campaign.campaignId)}
                        onChange={(e) => handleSelectRow(campaign.campaignId, e.target.checked)}
                        style={{ cursor: 'pointer', accentColor: 'var(--orange-500)' }}
                      />
                    </td>
                    <td style={{ padding: '16px', fontWeight: '500' }}>
                      <Link to={`/campaigns/${campaign.campaignId}`} style={{ color: 'var(--orange-600)', textDecoration: 'none', fontWeight: 500 }}>
                        {campaign.campaignName || campaign.name}
                      </Link>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600',
                        backgroundColor: campaign.platform === 'AMAZON' ? '#fff4e5' : '#e0f2fe',
                        color: campaign.platform === 'AMAZON' ? '#ed6c02' : '#0284c7'
                      }}>
                        {campaign.platform}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--grey-800)', fontWeight: 500 }}>{campaign.targetingType}</div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-500)' }}>{campaign.targetingSubType}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>₹{campaign.budget || 0}</div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-500)' }}>{campaign.budgetType}</div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <Button variant="ghost" icon={LinkIcon} size="sm" onClick={() => openMapModal(campaign)}>
                          Map
                        </Button>
                        <Button variant="ghost" icon={Edit} size="sm" onClick={() => openEditModal(campaign)} style={{ color: '#0284c7' }}>
                          Edit
                        </Button>
                        <Button variant="ghost" icon={Trash2} size="sm" onClick={() => handleDelete(campaign.campaignId, campaign.campaignName || campaign.name)} style={{ color: '#ef4444' }}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
      </Card>

      {/* CREATE/EDIT CAMPAIGN MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit Campaign" : "Create New Campaign"}>
        <form onSubmit={handleSaveCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <Input 
            label="Campaign Name" 
            placeholder="e.g. Summer Sale 2026" 
            value={activeCampaign.campaignName || activeCampaign.name}
            onChange={e => setActiveCampaign({...activeCampaign, name: e.target.value, campaignName: e.target.value})}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>Platform</label>
              <select 
                value={activeCampaign.platform}
                onChange={e => setActiveCampaign({...activeCampaign, platform: e.target.value})}
                style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '4px', border: '1px solid #e2e8f0', backgroundColor: '#fff', fontSize: '14px', outline: 'none' }}
              >
                <option value="AMAZON">Amazon</option>
                <option value="FLIPKART">Flipkart</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>Budget Type</label>
              <select 
                value={activeCampaign.budgetType}
                onChange={e => setActiveCampaign({...activeCampaign, budgetType: e.target.value})}
                style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '4px', border: '1px solid #e2e8f0', backgroundColor: '#fff', fontSize: '14px', outline: 'none' }}
              >
                <option value="DAILY">Daily</option>
                <option value="TOTAL">Total</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>Targeting Type</label>
              <select 
                value={activeCampaign.targetingType}
                onChange={e => setActiveCampaign({...activeCampaign, targetingType: e.target.value, targetingSubType: e.target.value === 'AUTO' ? 'N/A' : 'KEYWORD'})}
                style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '4px', border: '1px solid #e2e8f0', backgroundColor: '#fff', fontSize: '14px', outline: 'none' }}
              >
                <option value="AUTO">Automatic</option>
                <option value="MANUAL">Manual</option>
              </select>
            </div>

            {activeCampaign.targetingType === 'MANUAL' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>Targeting Sub-Type</label>
                <select 
                  value={activeCampaign.targetingSubType}
                  onChange={e => setActiveCampaign({...activeCampaign, targetingSubType: e.target.value})}
                  style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '4px', border: '1px solid #e2e8f0', backgroundColor: '#fff', fontSize: '14px', outline: 'none' }}
                >
                  <option value="KEYWORD">Keyword Targeting</option>
                  <option value="PRODUCT">Product Targeting</option>
                </select>
              </div>
            )}
          </div>

          {activeCampaign.targetingType === 'MANUAL' && activeCampaign.targetingSubType === 'KEYWORD' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Keyword Match Types</label>
              <div style={{ display: 'flex', gap: '16px' }}>
                {['EXACT', 'PHRASE', 'BROAD'].map(type => {
                  const isChecked = activeCampaign.matchTypes.includes(type);
                  return (
                    <div key={type} onClick={() => toggleMatchType(type)} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <div style={{ color: isChecked ? '#f97316' : '#94a3b8' }}>
                        {isChecked ? <CheckSquare size={16} /> : <Square size={16} />}
                      </div>
                      <span style={{ fontSize: '13px', color: '#475569' }}>{type}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Input 
            label="Budget Amount (₹)" 
            type="number"
            placeholder="0.00" 
            value={activeCampaign.budget}
            onChange={e => setActiveCampaign({...activeCampaign, budget: e.target.value})}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={saving}>{isEditMode ? 'Save Changes' : 'Create Campaign'}</Button>
          </div>
        </form>
      </Modal>

      {/* MAP PRODUCTS MODAL */}
      <Modal isOpen={isMapModalOpen} onClose={() => setIsMapModalOpen(false)} title={`Map Products to "${selectedCampaign?.campaignName || selectedCampaign?.name}"`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ fontSize: '14px', color: '#64748b' }}>
            Manage the products mapped to this campaign. You can add new ones, or change the status of existing ones to Paused/Aborted.
          </div>

          <Input 
            icon={Search} 
            placeholder="Search products by Name or SKU..." 
            value={productSearchTerm}
            onChange={(e) => setProductSearchTerm(e.target.value)}
          />

          <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
            {filteredProducts.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                No products found in catalog.
              </div>
            ) : (
              filteredProducts.map(product => {
                const isSelected = selectedProductIds.includes(product.productId);
                const existingMapping = selectedCampaign?.mappings?.find(m => m.product?.productId === product.productId);

                return (
                  <div 
                    key={product.productId} 
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', 
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: isSelected ? '#f8fafc' : 'white',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <div onClick={() => toggleProductSelection(product.productId)} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 }}>
                      <div style={{ color: isSelected ? '#f97316' : '#94a3b8' }}>
                        {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>{product.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>SKU: {product.sku}</div>
                      </div>
                    </div>

                    {existingMapping && (
                      <select 
                        value={existingMapping.status}
                        onChange={(e) => handleUpdateMappingStatus(product.productId, e.target.value)}
                        style={{ 
                          padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', 
                          fontSize: '12px', backgroundColor: existingMapping.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                          color: existingMapping.status === 'ACTIVE' ? '#166534' : '#475569',
                          cursor: 'pointer', outline: 'none'
                        }}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="PAUSED">Paused</option>
                        <option value="ABORTED">Aborted</option>
                      </select>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
              {selectedProductIds.length} product(s) marked for Active mapping
            </span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button type="button" variant="ghost" onClick={() => setIsMapModalOpen(false)}>Cancel</Button>
              <Button type="button" variant="primary" loading={mapping} onClick={handleSaveMapping}>Save active mappings</Button>
            </div>
          </div>

        </div>
      </Modal>

      {/* BULK MAP MODAL */}
      <Modal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} title="Bulk Map Campaigns">
        <form onSubmit={handleBulkUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '14px', color: '#64748b' }}>
              Upload an Excel file with the following columns to map products in bulk:<br/><br/>
              <strong>1. Campaign Name</strong><br/>
              <strong>2. SKU</strong><br/>
              <strong>3. Status</strong> (Optional, defaults to ACTIVE)<br/>
            </div>
            <Button type="button" variant="ghost" icon={Download} onClick={handleDownloadTemplate} style={{ fontSize: '13px' }}>
              Download Template
            </Button>
          </div>

          <div style={{ padding: '24px', border: '2px dashed #cbd5e1', borderRadius: '8px', textAlign: 'center' }}>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv"
              onChange={(e) => setBulkFile(e.target.files[0])}
              style={{ display: 'block', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button type="button" variant="ghost" onClick={() => setIsBulkModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={isUploading} disabled={!bulkFile}>Upload File</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
