import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
};

// Tanks API
export const tanksAPI = {
  getAll: () => api.get('/tanks'),
  getOne: (id) => api.get(`/tanks/${id}`),
  create: (data) => api.post('/tanks', data),
  update: (id, data) => api.put(`/tanks/${id}`, data),
  delete: (id) => api.delete(`/tanks/${id}`),
  getStats: (id) => api.get(`/tanks/${id}/stats`),
};

// Sensors API
export const sensorsAPI = {
  getAll: (params) => api.get('/sensors', { params }),
  getOne: (id) => api.get(`/sensors/${id}`),
  create: (data) => api.post('/sensors', data),
  update: (id, data) => api.put(`/sensors/${id}`, data),
  delete: (id) => api.delete(`/sensors/${id}`),
  postReading: (id, value) => api.post(`/sensors/${id}/readings`, { value }),
  getReadings: (id, params) => api.get(`/sensors/${id}/readings`, { params }),
  getAggregatedReadings: (id, params) => api.get(`/sensors/${id}/readings/aggregate`, { params }),
};

// Alerts API
export const alertsAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  getOne: (id) => api.get(`/alerts/${id}`),
  resolve: (id, resolvedBy) => api.put(`/alerts/${id}/resolve`, { resolved_by: resolvedBy }),
  getThresholds: (params) => api.get('/alerts/thresholds/all', { params }),
  createThreshold: (data) => api.post('/alerts/thresholds', data),
  deleteThreshold: (id) => api.delete(`/alerts/thresholds/${id}`),
};

// Inventory API
export const inventoryAPI = {
  getItems: (params) => api.get('/inventory/items', { params }),
  getItem: (id) => api.get(`/inventory/items/${id}`),
  createItem: (data) => api.post('/inventory/items', data),
  updateItem: (id, data) => api.put(`/inventory/items/${id}`, data),
  deleteItem: (id) => api.delete(`/inventory/items/${id}`),
  getTransactions: (params) => api.get('/inventory/transactions', { params }),
  createTransaction: (data) => api.post('/inventory/transactions', data),
  getCategories: () => api.get('/inventory/categories'),
  createCategory: (data) => api.post('/inventory/categories', data),
  getSuppliers: () => api.get('/inventory/suppliers'),
  createSupplier: (data) => api.post('/inventory/suppliers', data),
  updateSupplier: (id, data) => api.put(`/inventory/suppliers/${id}`, data),
};

// Reports API
export const reportsAPI = {
  getAll: (params) => api.get('/reports', { params }),
  generateSensorReport: (data) => api.post('/reports/sensor-data', data),
  generateInventoryReport: (data) => api.post('/reports/inventory', data),
  generateAlertsReport: (data) => api.post('/reports/alerts', data),
};

export default api;
