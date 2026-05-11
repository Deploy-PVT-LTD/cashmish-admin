import axios from 'axios';

// Priority List
const BACKEND_URLS = [
  'https://cashmish-backend.onrender.com'

];

export const getActiveURL = () => {
  if (typeof window === 'undefined') return BACKEND_URLS[0];
  const saved = sessionStorage.getItem('activeBackendURL');
  if (saved && BACKEND_URLS.includes(saved)) {
    return saved;
  }
  return BACKEND_URLS[0];
};

export const API_BASE_URL = `${getActiveURL()}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'X-Admin-Request': 'true',
  },
  timeout: 8000, // 8s timeout to trigger failover
});

// Helper to switch URL
export const switchToFallback = () => {
  const current = getActiveURL();
  const currentIndex = BACKEND_URLS.indexOf(current);
  const nextIndex = (currentIndex + 1) % BACKEND_URLS.length;
  const nextURL = BACKEND_URLS[nextIndex];
  sessionStorage.setItem('activeBackendURL', nextURL);
  return nextURL;
};

// Add interceptor to attach token and handle dynamic baseURL
api.interceptors.request.use((config) => {
  const currentBase = getActiveURL();
  config.baseURL = `${currentBase}/api`;

  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add interceptor to handle 401 (Unauthorized) responses and Failover
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle Network Errors or Timeouts for Failover
    if ((error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') && !originalRequest._retry) {
      originalRequest._retry = true;
      const nextURL = switchToFallback();
      console.warn(`Backend unreachable. Switching to: ${nextURL}`);
      originalRequest.baseURL = `${nextURL}/api`;
      return api(originalRequest);
    }

    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Fetch Wrapper for native fetch calls
export const fetchWithFallback = async (url, options = {}) => {
  const currentBase = getActiveURL();
  const fullUrl = url.startsWith('http') ? url : `${currentBase}${url}`;

  try {
    const response = await fetch(fullUrl, options);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response;
  } catch (error) {
    console.warn(`Fetch failed at ${fullUrl}. Attempting fallback...`);
    const nextURL = switchToFallback();
    const fallbackUrl = url.startsWith('http') ? url.replace(currentBase, nextURL) : `${nextURL}${url}`;
    return fetch(fallbackUrl, options);
  }
};

// Mobile APIs
export const mobileApi = {
  // Get all mobiles
  getAll: async (params) => {
    const response = await api.get('/mobiles', { params });
    return response.data;
  },

  // Get mobile by ID
  getById: async (id) => {
    const response = await api.get(`/mobiles/${id}`);
    return response.data;
  },

  // Get mobiles by brand
  getByBrand: async (brand) => {
    const response = await api.get('/mobiles/brand', { params: { brand } });
    return response.data;
  },

  // Add new mobile
  create: async (mobileData) => {
    const response = await api.post('/mobiles', mobileData);
    return response.data;
  },

  // Update mobile
  update: async (id, mobileData) => {
    const response = await api.put(`/mobiles/${id}`, mobileData);
    return response.data;
  },

  // Delete mobile
  delete: async (id) => {
    const response = await api.delete(`/mobiles/${id}`);
    return response.data;
  },

  // Mobile Requests (Super Admin)
  getRequests: async () => {
    const response = await api.get('/mobiles/requests');
    return response.data;
  },
  approveRequest: async (requestId) => {
    const response = await api.post(`/mobiles/requests/${requestId}/approve`);
    return response.data;
  },
  rejectRequest: async (requestId, reason) => {
    const response = await api.post(`/mobiles/requests/${requestId}/reject`, { reason });
    return response.data;
  }
};

// Form/Submission APIs
export const formApi = {
  // Get dashboard stats
  getStats: async () => {
    const response = await api.get('/forms/stats');
    return response.data;
  },

  // Get all forms/submissions
  getAll: async (params) => {
    const response = await api.get('/forms', { params });
    return response.data;
  },

  // Get form by ID
  getById: async (id) => {
    const response = await api.get(`/forms/${id}`);
    return response.data;
  },

  // Create new form (with images)
  create: async (formData) => {
    const response = await api.post('/forms', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update form
  update: async (id, formData) => {
    const response = await api.put(`/forms/${id}`, formData);
    return response.data;
  },

  // Delete form
  delete: async (id) => {
    const response = await api.delete(`/forms/${id}`);
    return response.data;
  },

  // Place bid on form
  placeBid: async (id, bidData) => {
    const response = await api.put(`/forms/${id}`, bidData);
    return response.data;
  },
};

// Auth/User APIs
export const authApi = {
  // Login user
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Create new user (signup)
  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  // Get all users
  getAll: async (params) => {
    const response = await api.get('/auth/', { params });
    return response.data;
  },

  // Update user
  update: async (id, userData) => {
    const response = await api.put(`/auth/${id}`, userData);
    return response.data;
  },

  // Delete user
  delete: async (id) => {
    const response = await api.delete(`/auth/${id}`);
    return response.data;
  },
};

// Dashboard Stats API
export const dashboardApi = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};

// Inventory API
export const inventoryApi = {
  // Get all inventory items
  getAll: async (params) => {
    const response = await api.get('/inventory', { params });
    return response.data;
  },

  // Create new inventory item
  create: async (itemData) => {
    const response = await api.post('/inventory', itemData);
    return response.data;
  },

  // Update inventory item
  update: async (id, itemData) => {
    const response = await api.put(`/inventory/${id}`, itemData);
    return response.data;
  },

  // Delete inventory item
  delete: async (id) => {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  },
};

// Bank Details API
export const bankDetailsApi = {
  // Get all bank details
  getAll: async () => {
    const response = await api.get('/bankDetails');
    return response.data;
  },

  // Update bank detail (e.g. status)
  update: async (id, data) => {
    const response = await api.put(`/bankDetails/${id}`, data);
    return response.data;
  },

  // Delete bank detail
  delete: async (id) => {
    const response = await api.delete(`/bankDetails/${id}`);
    return response.data;
  }
};

// Coupon API
export const couponApi = {
  // Get all coupons
  getAll: async () => {
    const response = await api.get('/coupons');
    return response.data;
  },

  // Create new coupon
  create: async (couponData) => {
    const response = await api.post('/coupons', couponData);
    return response.data;
  },

  // Update coupon
  update: async (id, couponData) => {
    const response = await api.put(`/coupons/${id}`, couponData);
    return response.data;
  },

  // Delete coupon
  delete: async (id) => {
    const response = await api.delete(`/coupons/${id}`);
    return response.data;
  }
};

// Chat API
export const chatApi = {
  // Get all active sessions
  getSessions: async () => {
    const response = await api.get('/chat/sessions');
    return response.data;
  },

  // Get chat history by session ID
  getSessionHistory: async (sessionId) => {
    const response = await api.get(`/chat/${sessionId}`);
    return response.data;
  },

  // Resolve (Close) chat session
  resolveSession: async (sessionId) => {
    const response = await api.put(`/chat/${sessionId}/status`, { status: 'closed' });
    return response.data;
  },

  // Delete chat session
  deleteSession: async (sessionId) => {
    const response = await api.delete(`/chat/${sessionId}`);
    return response.data;
  }
};

// Traffic API
export const trafficApi = {
  getStats: async () => {
    const response = await api.get('/traffic/stats');
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get('/traffic/history');
    return response.data;
  }
};

export default api;
