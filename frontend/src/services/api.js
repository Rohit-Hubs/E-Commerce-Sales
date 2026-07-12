const API_BASE_URL = 'http://localhost:8000';

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });
  const str = query.toString();
  return str ? `?${str}` : '';
};

export const api = {
  health: async () => {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error('API server is offline');
    return res.json();
  },

  uploadSales: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(errData.detail || 'Upload failed');
    }
    return res.json();
  },

  getSales: async (params = {}) => {
    const res = await fetch(`${API_BASE_URL}/sales${buildQueryString(params)}`);
    if (!res.ok) throw new Error('Failed to fetch sales records');
    return res.json();
  },

  getFilterOptions: async () => {
    const res = await fetch(`${API_BASE_URL}/filters`);
    if (!res.ok) throw new Error('Failed to fetch filter options');
    return res.json();
  },

  getKPIs: async (params = {}) => {
    const res = await fetch(`${API_BASE_URL}/analytics/kpis${buildQueryString(params)}`);
    if (!res.ok) throw new Error('Failed to fetch KPIs');
    return res.json();
  },

  getMonthlySales: async (params = {}) => {
    const res = await fetch(`${API_BASE_URL}/analytics/monthly-sales${buildQueryString(params)}`);
    if (!res.ok) throw new Error('Failed to fetch monthly sales');
    return res.json();
  },

  getCategorySales: async (params = {}) => {
    const res = await fetch(`${API_BASE_URL}/analytics/category-sales${buildQueryString(params)}`);
    if (!res.ok) throw new Error('Failed to fetch category sales');
    return res.json();
  },

  getCategoryProfit: async (params = {}) => {
    const res = await fetch(`${API_BASE_URL}/analytics/category-profit${buildQueryString(params)}`);
    if (!res.ok) throw new Error('Failed to fetch category profit');
    return res.json();
  },

  getTopProducts: async (params = {}) => {
    const res = await fetch(`${API_BASE_URL}/analytics/top-products${buildQueryString(params)}`);
    if (!res.ok) throw new Error('Failed to fetch top products');
    return res.json();
  },

  getTopCustomers: async (params = {}) => {
    const res = await fetch(`${API_BASE_URL}/analytics/top-customers${buildQueryString(params)}`);
    if (!res.ok) throw new Error('Failed to fetch top customers');
    return res.json();
  },

  getRegionSales: async (params = {}) => {
    const res = await fetch(`${API_BASE_URL}/analytics/region-sales${buildQueryString(params)}`);
    if (!res.ok) throw new Error('Failed to fetch region sales');
    return res.json();
  },

  getSegmentSales: async (params = {}) => {
    const res = await fetch(`${API_BASE_URL}/analytics/segment-sales${buildQueryString(params)}`);
    if (!res.ok) throw new Error('Failed to fetch segment sales');
    return res.json();
  },

  getDiscountImpact: async (params = {}) => {
    const res = await fetch(`${API_BASE_URL}/analytics/discount-impact${buildQueryString(params)}`);
    if (!res.ok) throw new Error('Failed to fetch discount impact');
    return res.json();
  },

  getMonthlyGrowth: async (params = {}) => {
    const res = await fetch(`${API_BASE_URL}/analytics/monthly-growth${buildQueryString(params)}`);
    if (!res.ok) throw new Error('Failed to fetch monthly growth');
    return res.json();
  },

  getInsights: async (params = {}) => {
    const res = await fetch(`${API_BASE_URL}/analytics/insights${buildQueryString(params)}`);
    if (!res.ok) throw new Error('Failed to fetch insights');
    return res.json();
  }
};
