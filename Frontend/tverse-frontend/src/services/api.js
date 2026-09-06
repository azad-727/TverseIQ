import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Request interceptor (Inject Token) ---
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tverse_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor ────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tverse_token');
      localStorage.removeItem('tverse_user');
      window.location.href = '/login';
    }
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    console.error('[API Error]', error.response?.status, message);
    return Promise.reject({ message, status: error.response?.status });
  }
);


// ═══════════════════════════════════════════════════════════════
// Dashboard — /api/v1/dashboard
//
// Backend endpoints (DashboardController.java):
//   GET  /api/v1/dashboard/global-metrics  → GlobalMetricsDto
//   POST /api/v1/dashboard/discovery       → List<KeywordDeepDiveDto>
//        Body: KeywordFilterRequest (all fields optional)
// ═══════════════════════════════════════════════════════════════

export const authApi = {
  login: (credentials) => api.post('/api/v1/tverse/login', credentials).then(r => r.data)
};

export const dashboardApi = {
  /**
   * Get global KPI metrics (Redis cached).
   * Returns: { totalSpend, totalSales, totalOrders, roas, acos }
   */
  getMetrics: () =>
    api.get('/api/v1/dashboard/global-metrics').then(r => r.data),

  /**
   * Discovery grid — POST with filter request body.
   * filterRequest fields (all optional):
   *   presetReadyToGraduate, presetBleeding, presetHighTrafficZeroCart,
   *   presetProfitableButStarved, minSpend, maxSpend, minAcos, maxAcos,
   *   minCvr, maxCpc, minOrders, minConsistencyDays, lifecycleStage,
   *   marketplace, matchTypes[], campaignIds[]
   *
   * Returns: KeywordDeepDiveDto[] with fields:
   *   keyword, matchType, impressions, clicks, orders, spend, sales,
   *   avgCpc, avgCtr, costPerPurchase, purchaseRate, consistencyIndex,
   *   searchIntentScore, attributionType, confidenceScore,
   *   isReadyToGraduate, isBleeding
   */
  getAllKeywords: (page = 0, size = 50) =>
    api.post('/api/v1/dashboard/discovery', {}, { params: { page, size } }).then(r => r.data),

  getFilteredKeywords: (filterRequest = {}, page = 0, size = 50) =>
    api.post('/api/v1/dashboard/discovery', filterRequest, { params: { page, size } }).then(r => r.data),

  getGraduationCandidates: (page = 0, size = 50) =>
    api.post('/api/v1/dashboard/discovery', { presetReadyToGraduate: true }, { params: { page, size } }).then(r => r.data),

  getBleedingKeywords: (page = 0, size = 50) =>
    api.post('/api/v1/dashboard/discovery', { presetBleeding: true }, { params: { page, size } }).then(r => r.data),
};


// ═══════════════════════════════════════════════════════════════
// Reports / Upload — /api/v1/reports
//
// Backend endpoints (ReportUploadController.java):
//   POST /api/v1/reports/upload → { message, uploadId, status }
//        Params: file (MultipartFile), platform (enum), periodStart,
//                periodEnd, hasAsinColumn (boolean)
//
// NOTE: No GET endpoint for upload history exists in the backend.
//       We provide a stub that returns an empty array.
// ═══════════════════════════════════════════════════════════════

export const reportApi = {
  upload: (file, platform, periodStart, periodEnd, hasAsinColumn) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('platform', platform);
    formData.append('periodStart', periodStart);
    formData.append('periodEnd', periodEnd);
    formData.append('hasAsinColumn', hasAsinColumn);

    return api.post('/api/v1/reports/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    }).then(r => r.data);
  },
  
  getHistory: () => api.get('/api/v1/reports/uploads').then(r => r.data),
  
  undoUpload: (uploadId) => api.post(`/api/v1/reports/uploads/${uploadId}/undo`).then(r => r.data)
};


// ═══════════════════════════════════════════════════════════════
// Omni-Channel Mappings — /api/v1/mappings
//
// Backend endpoints (MappingController.java):
//   GET  /api/v1/mappings/all    → List<ChannelSkuMap>
//   POST /api/v1/mappings/create → { message }
//        Body: { productId, channelProductId, platform }
// ═══════════════════════════════════════════════════════════════

export const mappingApi = {
  getAll: () => api.get('/api/v1/mappings/all').then(r => r.data),
  create: (data) => api.post('/api/v1/mappings/create', data).then(r => r.data),
};


// ==========================================
// Products - /api/v1/products
// ==========================================

export const productApi = {
  getAll: (mappingStatus) => api.get('/api/v1/products', { params: { mappingStatus } }).then(r => r.data),
  getById: (id) => api.get(`/api/v1/products/${id}`).then(r => r.data),
  create: (data) => api.post('/api/v1/products', data).then(r => r.data),
  update: (id, data) => api.put(`/api/v1/products/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/api/v1/products/${id}`).then(r => r.data),
  bulkMapChannels: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/v1/products/bulk-map-channel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data);
  }
};


// ==========================================
// Campaigns - /api/v1/campaigns
// ==========================================

export const campaignApi = {
  getAll: () => api.get('/api/v1/campaigns').then(r => r.data),
  getById: (id) => api.get(`/api/v1/campaigns/${id}`).then(r => r.data),
  create: (data) => api.post('/api/v1/campaigns', data).then(r => r.data),
  update: (id, data) => api.put(`/api/v1/campaigns/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/api/v1/campaigns/${id}`).then(r => r.data),
  mapProducts: (campaignId, productIds) => api.post(`/api/v1/campaigns/${campaignId}/map-products`, productIds).then(r => r.data),
  updateMappingStatus: (campaignId, productId, status) => api.put(`/api/v1/campaigns/${campaignId}/mapping/${productId}/status?status=${status}`).then(r => r.data),
  bulkMapProducts: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/v1/campaigns/bulk-map', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data);
  }
};


export default api;

// ==========================================
// Tverse Catalog Integration (via secure backend proxy)
// The API key is stored server-side in TverseIQ backend — never exposed to the browser.
// ==========================================
export const tverseApi = {
  getProductDetail: (sku) => api.get(`/api/v1/tverse/catalog/${sku}`).then(r => r.data),
  syncCatalog: () => api.post('/api/v1/tverse/sync-catalog').then(r => r.data),
  getAbcAnalytics: () => api.get('/api/v1/tverse/analytics/abc').then(r => r.data),
  // Now hitting the local TverseIQ database instead of the proxy
  getReturnRate: (sku) => api.get(`/api/v1/products/analytics/returns/${encodeURIComponent(sku)}`).then(r => r.data)
};
