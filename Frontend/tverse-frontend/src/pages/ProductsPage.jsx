import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Plus, Search, CheckCircle, XCircle, Link as LinkIcon, Download, RefreshCw, ExternalLink } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { BackgroundAurora } from '../components/ui/BackgroundAurora';
import { Pagination } from '../components/ui/Pagination';
import { useApi, useToast } from '../hooks/useApi';
import { productApi, mappingApi, tverseApi } from '../services/api';
import { downloadAsCsv } from '../utils/exportUtils';
import './ProductsPage.css';

export function ProductsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ sku: '', name: '', category: '' });
  
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mappingData, setMappingData] = useState({ platform: 'AMAZON', channelProductId: '' });

  const [isBulkChannelModalOpen, setIsBulkChannelModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [mappingFilter, setMappingFilter] = useState(''); 
  const [categoryFilter, setCategoryFilter] = useState('');
  const [abcFilter, setAbcFilter] = useState('');
  const toast = useToast();

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  
  const [selectedRows, setSelectedRows] = useState(new Set());

  const { data: products = [], loading, execute: fetchProducts } = useApi(productApi.getAll, { immediate: false });
  const { data: mappings = [], execute: fetchMappings } = useApi(mappingApi.getAll, { immediate: true });
  const { data: abcData = [], execute: fetchAbc } = useApi(tverseApi.getAbcAnalytics, { immediate: true });
  
  const { loading: creating, execute: createProduct } = useApi(productApi.create);
  const { loading: mapping, execute: createMapping } = useApi(mappingApi.create);

  const safeProducts = products || [];

  useEffect(() => {
    fetchProducts(mappingFilter || null);
    fetchMappings();
    fetchAbc();
  }, [mappingFilter, fetchProducts, fetchMappings, fetchAbc]);

  useEffect(() => {
    setCurrentPage(0);
  }, [pageSize]);

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncCatalog = async () => {
    if (!window.confirm('This will pull all products from Tverse and update the local database. Continue?')) return;
    setIsSyncing(true);
    try {
      const response = await tverseApi.syncCatalog();
      toast.success(response.message || 'Sync complete');
      fetchProducts(mappingFilter || null);
    } catch (err) {
      toast.error('Sync failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBulkChannelUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile) return;
    setIsUploading(true);
    try {
      await productApi.bulkMapChannels(bulkFile);
      toast.success('Bulk channel mapping uploaded successfully!');
      setIsBulkChannelModalOpen(false);
      setBulkFile(null);
      fetchProducts(mappingFilter || null);
    } catch (err) {
      toast.error('Bulk mapping failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadChannelTemplate = () => {
    const templateData = [
      { 'SKU': 'TSH-BLK-OS', 'Platform': 'AMAZON', 'Channel Product ID': 'B08XXXXXXX' },
      { 'SKU': 'TSH-BLK-OS', 'Platform': 'FLIPKART', 'Channel Product ID': 'FSNXXXXXXX' }
    ];
    downloadAsCsv(templateData, 'channel_mapping_template.csv');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createProduct(newProduct);
      toast.success('Product created successfully');
      setIsModalOpen(false);
      setNewProduct({ sku: '', name: '', category: '' });
      fetchProducts(mappingFilter || null);
    } catch (err) {
      toast.error('Failed to create product: ' + err.message);
    }
  };

  const handleOpenMapping = (product) => {
    setSelectedProduct(product);
    setMappingData({ platform: 'AMAZON', channelProductId: '' });
    setIsMapModalOpen(true);
  };

  const handleSaveMapping = async (e) => {
    e.preventDefault();
    try {
      await createMapping({
        productId: selectedProduct.productId,
        channelProductId: mappingData.channelProductId,
        platform: mappingData.platform
      });
      toast.success('Channel mapped successfully');
      setIsMapModalOpen(false);
      fetchProducts(mappingFilter || null);
    } catch (err) {
      toast.error('Failed to map channel: ' + err.message);
    }
  };

  const filteredProducts = (products || []).filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter ? p.category === categoryFilter : true;
    
    let matchesAbc = true;
    if (abcFilter) {
      const abcObj = abcData?.find(d => d.metricKey === p.sku);
      if (abcObj) {
        try {
          matchesAbc = JSON.parse(abcObj.metricValue).category === abcFilter;
        } catch(e) {
          matchesAbc = false;
        }
      } else {
        matchesAbc = false;
      }
    }
    
    let matchesMapping = true;
    if (mappingFilter === 'MAPPED') matchesMapping = p.mapped;
    if (mappingFilter === 'UNMAPPED') matchesMapping = !p.mapped;

    return matchesSearch && matchesCategory && matchesAbc && matchesMapping;
  });

  // Calculate unique categories for the filter dropdown
  const uniqueCategories = [...new Set((products || []).map(p => p.category).filter(Boolean))].sort();

  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(new Set(filteredProducts.map(r => r.productId)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (productId, checked) => {
    const newSet = new Set(selectedRows);
    if (checked) newSet.add(productId);
    else newSet.delete(productId);
    setSelectedRows(newSet);
  };

  const handleExport = () => {
    const dataToExport = filteredProducts.filter(r => selectedRows.has(r.productId)).map(row => ({
      'SKU': row.sku,
      'Product Name': row.name,
      'Category': row.category || '-',
      'Mapping Status': row.mapped ? 'MAPPED' : 'UNMAPPED'
    }));
    downloadAsCsv(dataToExport, 'products_export.csv');
  };

  return (
    <div className="page-container">
      <BackgroundAurora variant="orange" />
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="page-title-section">
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "bold", color: "var(--grey-900)" }}>Master Catalog <span className="title-dot" style={{ display: "inline-block", width: "8px", height: "8px", background: "#f97316", borderRadius: "50%", marginLeft: "4px" }}></span></h1>
          </div>
          <p className="page-subtitle">Manage your universal product definitions and channel mappings.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="ghost" onClick={() => setIsBulkChannelModalOpen(true)} style={{ border: '1px solid #e2e8f0', background: 'white' }}>
            Bulk Map Channels
          </Button>
          <Button variant="ghost" icon={RefreshCw} onClick={handleSyncCatalog} loading={isSyncing} style={{ border: '1px solid #e2e8f0', background: 'white' }}>
            Sync from Tverse
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>Add Product</Button>
        </div>
      </div>

      <Card className="filter-bar" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <Input 
              icon={Search} 
              placeholder="Search products by Name or SKU..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
            />
          </div>
          
          <select 
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(0); }}
            style={{ height: '40px', padding: '0 12px', borderRadius: '4px', border: '1px solid var(--grey-200)', background: 'white', color: 'var(--text-primary)', outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          >
            <option value="">All Categories</option>
            {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <select 
            value={abcFilter}
            onChange={(e) => { setAbcFilter(e.target.value); setCurrentPage(0); }}
            style={{ height: '40px', padding: '0 12px', borderRadius: '4px', border: '1px solid var(--grey-200)', background: 'white', color: 'var(--text-primary)', outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          >
            <option value="">All ABC Tiers</option>
            <option value="A">⭐ Best Sellers (A)</option>
            <option value="B">🔵 Moderate (B)</option>
            <option value="C">🔻 Dead Stock (C)</option>
          </select>

          <select 
            value={mappingFilter}
            onChange={(e) => { setMappingFilter(e.target.value); setCurrentPage(0); }}
            style={{ height: '40px', padding: '0 12px', borderRadius: '4px', border: '1px solid var(--grey-200)', background: 'white', color: 'var(--text-primary)', outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          >
            <option value="">All Mappings</option>
            <option value="MAPPED">Mapped Only</option>
            <option value="UNMAPPED">Unmapped Only</option>
          </select>
        </div>
        
        {/* ABC Legend */}
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--grey-500)', borderTop: '1px solid var(--grey-100)', paddingTop: '12px', marginTop: '4px' }}>
          <span style={{ fontWeight: 600 }}>ABC Category Legend:</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>⭐ Best Seller (Top 70% Revenue)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>🔵 Moderate (Next 20% Revenue)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>🔻 Dead Stock (Bottom 10% Revenue)</span>
        </div>
      </Card>

      <Card>
        
        {/* Table Action Toolbar */}
        <div style={{ background: '#fff', borderBottom: '1px solid var(--grey-200)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--grey-700)', flex: 1 }}>
            {selectedRows.size > 0 ? `${selectedRows.size} ${selectedRows.size === 1 ? 'product' : 'products'} selected` : 'Product List'}
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
                    checked={filteredProducts.length > 0 && selectedRows.size === filteredProducts.length}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer', accentColor: 'var(--orange-500)' }}
                  />
                </th>
                <th style={{ padding: '12px 16px', color: '#64748b' }}>SKU</th>
                <th style={{ padding: '12px 16px', color: '#64748b' }}>Product Name</th>
                <th style={{ padding: '12px 16px', color: '#64748b' }}>Category</th>
                <th style={{ padding: '12px 16px', color: '#64748b' }}>Mapping Status</th>
                <th style={{ padding: '12px 16px', color: '#64748b', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ padding: '24px', textAlign: 'center' }}>Loading products...</td></tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                    <Package size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p>No products found.</p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map(product => (
                  <tr key={product.productId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ textAlign: 'center', padding: '16px' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedRows.has(product.productId)}
                        onChange={(e) => handleSelectRow(product.productId, e.target.checked)}
                        style={{ cursor: 'pointer', accentColor: 'var(--orange-500)' }}
                      />
                    </td>
                    <td style={{ padding: '16px', fontWeight: '500' }}>{product.sku}</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link to={`/products/${product.productId}`} style={{ color: 'var(--orange-600)', textDecoration: 'none', fontWeight: 500 }}>
                          {product.name}
                        </Link>
                        
                        {(() => {
                          const abcObj = abcData?.find(d => d.metricKey === product.sku);
                          if (!abcObj) return null;
                          try {
                            const parsed = JSON.parse(abcObj.metricValue);
                            const category = parsed.category; // 'A', 'B', 'C'
                            const symbols = {
                              'A': { icon: '⭐', label: 'Best Seller (A)' },
                              'B': { icon: '🔵', label: 'Moderate (B)' },
                              'C': { icon: '🔻', label: 'Dead Stock (C)' }
                            };
                            const styling = symbols[category];
                            if (!styling) return null;
                            
                            return (
                              <span title={styling.label} style={{ fontSize: '14px', cursor: 'help' }}>
                                {styling.icon}
                              </span>
                            );
                          } catch (e) {
                            return null;
                          }
                        })()}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>{product.category || '-'}</td>
                    <td style={{ padding: '16px' }}>
                      {product.mapped ? (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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
                                    width: '28px', height: '28px', borderRadius: '50%',
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
                                  <img src={logoSrc} alt={platform} style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                                </a>
                              );
                          })}
                        </div>
                      ) : (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600',
                          backgroundColor: '#fef2f2', color: '#ef4444'
                        }}>
                          <XCircle size={12} />
                          UNMAPPED
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <Button variant="ghost" icon={LinkIcon} size="sm" onClick={() => handleOpenMapping(product)}>
                        {product.mapped ? 'Update Mapping' : 'Map Channel'}
                      </Button>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Product">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input 
            label="SKU" 
            placeholder="e.g. B08N5WRWNW" 
            value={newProduct.sku}
            onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
            required
          />
          <Input 
            label="Product Name" 
            placeholder="e.g. Wireless Noise Cancelling Headphones" 
            value={newProduct.name}
            onChange={e => setNewProduct({...newProduct, name: e.target.value})}
            required
          />
          <Input 
            label="Category" 
            placeholder="e.g. Electronics" 
            value={newProduct.category}
            onChange={e => setNewProduct({...newProduct, category: e.target.value})}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={creating}>Create Product</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isMapModalOpen} onClose={() => setIsMapModalOpen(false)} title={`Map Channel to ${selectedProduct?.name}`}>
        <form onSubmit={handleSaveMapping} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Enter the exact ASIN (Amazon) or FSN (Flipkart) so that uploaded advertising reports can automatically match back to this master product.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>Platform</label>
            <select 
              value={mappingData.platform}
              onChange={e => setMappingData({...mappingData, platform: e.target.value})}
              style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '4px', border: '1px solid #e2e8f0', backgroundColor: '#fff', fontSize: '14px', outline: 'none' }}
            >
              <option value="AMAZON">Amazon</option>
              <option value="FLIPKART">Flipkart</option>
            </select>
          </div>

          <Input 
            label="Channel SKU / ASIN / FSN" 
            placeholder={mappingData.platform === 'AMAZON' ? "e.g. B08N5WRWNW" : "e.g. FSN123456789"}
            value={mappingData.channelProductId}
            onChange={e => setMappingData({...mappingData, channelProductId: e.target.value})}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button type="button" variant="ghost" onClick={() => setIsMapModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={mapping}>Save Mapping</Button>
          </div>
        </form>
      </Modal>

      {/* BULK CHANNEL MAP MODAL */}
      <Modal isOpen={isBulkChannelModalOpen} onClose={() => setIsBulkChannelModalOpen(false)} title="Bulk Map Channels (Excel)">
        <form onSubmit={handleBulkChannelUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '14px', color: '#64748b' }}>
              Upload an Excel file with the following columns to map products to channels in bulk:<br/><br/>
              <strong>1. SKU</strong><br/>
              <strong>2. Platform</strong> (e.g., AMAZON, FLIPKART)<br/>
              <strong>3. Channel Product ID</strong> (e.g., B08XXXXXXX)<br/>
            </div>
            <Button type="button" variant="ghost" icon={Download} onClick={handleDownloadChannelTemplate} style={{ fontSize: '13px' }}>
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
            <Button type="button" variant="ghost" onClick={() => setIsBulkChannelModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={isUploading} disabled={!bulkFile}>Upload File</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
