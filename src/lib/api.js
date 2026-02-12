import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  // console.log('Interceptor Token:', token); // Removed debug log
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add interceptor to handle 401 (Unauthorized) responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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

export default api;
