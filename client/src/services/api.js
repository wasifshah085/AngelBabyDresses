import axios from 'axios';
import { useAuthStore } from '../store/useStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  updatePassword: (data) => api.put('/auth/password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
  getWishlist: () => api.get('/auth/wishlist'),
  toggleWishlist: (productId) => api.post(`/auth/wishlist/${productId}`),
  getAddresses: () => api.get('/auth/me').then(res => res.data.data.addresses),
  addAddress: (data) => api.post('/auth/addresses', data),
  updateAddress: (id, data) => api.put(`/auth/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/auth/addresses/${id}`)
};

// Products API
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getBySlug: (slug) => api.get(`/products/${slug}`),
  getFeatured: (limit = 8) => api.get('/products/featured', { params: { limit } }),
  getNewArrivals: (limit = 8) => api.get('/products/new-arrivals', { params: { limit } }),
  getBestSellers: (limit = 8) => api.get('/products/best-sellers', { params: { limit } }),
  getSale: (limit = 12) => api.get('/products/sale', { params: { limit } }),
  search: (query, params) => api.get('/products/search', { params: { q: query, ...params } }),
  getByCategory: (slug, params) => api.get(`/products/category/${slug}`, { params }),
  getRelated: (slug, limit = 4) => api.get(`/products/${slug}/related`, { params: { limit } })
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getAllFlat: () => api.get('/categories/all'),
  getBySlug: (slug) => api.get(`/categories/${slug}`)
};

// Settings API (public)
export const settingsAPI = {
  get: () => api.get('/settings')
};

// Cart API
export const cartAPI = {
  get: () => api.get('/cart'),
  add: (data) => api.post('/cart/add', data),
  update: (data) => api.put('/cart/update', data),
  remove: (itemId) => api.delete(`/cart/remove/${itemId}`),
  clear: () => api.delete('/cart/clear'),
  applyCoupon: (code) => api.post('/cart/coupon', { code }),
  removeCoupon: () => api.delete('/cart/coupon')
};

// Orders API
export const ordersAPI = {
  create: (data) => {
    // If FormData (with screenshot), send as multipart
    if (data instanceof FormData) {
      return api.post('/orders', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.post('/orders', data);
  },
  getMyOrders: () => api.get('/orders/my-orders'),
  getById: (id) => api.get(`/orders/${id}`),
  track: (orderNumber) => api.get(`/orders/track/${orderNumber}`),
  cancel: (id) => api.put(`/orders/${id}/cancel`),
  getPaymentAccounts: () => api.get('/orders/payment-accounts'),
  submitAdvancePayment: (id, screenshot) => {
    const formData = new FormData();
    formData.append('screenshot', screenshot);
    return api.post(`/orders/${id}/advance-payment`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  submitFinalPayment: (id, screenshot) => {
    const formData = new FormData();
    formData.append('screenshot', screenshot);
    return api.post(`/orders/${id}/final-payment`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// Custom Design API
export const customDesignAPI = {
  create: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'images' && data[key]) {
        data[key].forEach(file => formData.append('images', file));
      } else if (typeof data[key] === 'object') {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    });
    return api.post('/custom-design', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getMyDesigns: () => api.get('/custom-design/my-designs'),
  getById: (id) => api.get(`/custom-design/${id}`),
  addMessage: (id, data) => {
    const formData = new FormData();
    formData.append('message', data.message);
    if (data.attachments) {
      data.attachments.forEach(file => formData.append('attachments', file));
    }
    return api.post(`/custom-design/${id}/message`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  acceptQuote: (id, data) => api.post(`/custom-design/${id}/accept`, data),
  cancel: (id) => api.put(`/custom-design/${id}/cancel`)
};

// Reviews API
export const reviewsAPI = {
  getByProduct: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  markHelpful: (id) => api.post(`/reviews/${id}/helpful`),
  getMyReviews: () => api.get('/reviews/my-reviews')
};

// Payments API
export const paymentsAPI = {
  initiateJazzCash: (orderId) => api.post('/payments/jazzcash/initiate', { orderId }),
  initiateEasypaisa: (orderId) => api.post('/payments/easypaisa/initiate', { orderId }),
  getStatus: (orderId) => api.get(`/payments/status/${orderId}`)
};

// Dashboard/Management API
export const managementAPI = {
  getDashboard: () => api.get('/admin/dashboard'),

  // Products
  getProducts: (params) => api.get('/admin/products', { params }),
  createProduct: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      const value = data[key];
      // Skip undefined and null values
      if (value === undefined || value === null) return;
      if (key === 'images' && value && Array.isArray(value)) {
        value.forEach(file => formData.append('images', file));
      } else if (typeof value === 'object' && value !== null) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });
    return api.post('/admin/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  updateProduct: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      const value = data[key];
      // Skip undefined and null values
      if (value === undefined || value === null) return;
      if (key === 'images' && value && Array.isArray(value)) {
        value.forEach(file => formData.append('images', file));
      } else if (typeof value === 'object' && value !== null) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });
    return api.put(`/admin/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),

  // Categories
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      const value = data[key];
      // Skip undefined and null values
      if (value === undefined || value === null) return;
      if (key === 'image' && value) {
        formData.append('image', value);
      } else if (typeof value === 'object' && value !== null) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });
    return api.post('/admin/categories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  updateCategory: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      const value = data[key];
      // Skip undefined and null values
      if (value === undefined || value === null) return;
      if (key === 'image' && value) {
        formData.append('image', value);
      } else if (typeof value === 'object' && value !== null) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });
    return api.put(`/admin/categories/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),

  // Orders
  getOrders: (params) => api.get('/admin/orders', { params }),
  getOrderById: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),
  approveAdvancePayment: (id) => api.put(`/admin/orders/${id}/approve-advance`),
  rejectAdvancePayment: (id, reason) => api.put(`/admin/orders/${id}/reject-advance`, { reason }),
  approveFinalPayment: (id) => api.put(`/admin/orders/${id}/approve-final`),
  rejectFinalPayment: (id, reason) => api.put(`/admin/orders/${id}/reject-final`, { reason }),
  requestFinalPayment: (id) => api.put(`/admin/orders/${id}/request-final-payment`),

  // Custom Designs
  getCustomDesigns: (params) => api.get('/admin/custom-designs', { params }),
  updateCustomDesign: (id, data) => api.put(`/admin/custom-designs/${id}`, data),
  addDesignMessage: (id, data) => {
    const formData = new FormData();
    formData.append('message', data.message);
    if (data.attachments) {
      data.attachments.forEach(file => formData.append('attachments', file));
    }
    return api.post(`/admin/custom-designs/${id}/message`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Customers
  getCustomers: (params) => api.get('/admin/customers', { params }),
  getCustomerDetails: (id) => api.get(`/admin/customers/${id}`),

  // Sales
  getSales: () => api.get('/admin/sales'),
  createSale: (data) => api.post('/admin/sales', data),
  updateSale: (id, data) => api.put(`/admin/sales/${id}`, data),
  deleteSale: (id) => api.delete(`/admin/sales/${id}`),

  // Coupons
  getCoupons: () => api.get('/admin/coupons'),
  createCoupon: (data) => api.post('/admin/coupons', data),
  updateCoupon: (id, data) => api.put(`/admin/coupons/${id}`, data),
  deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`),

  // Reviews
  getReviews: (params) => api.get('/admin/reviews', { params }),
  updateReview: (id, data) => api.put(`/admin/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),

  // Settings
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if ((key === 'logo' || key === 'favicon') && data[key]) {
        formData.append(key, data[key]);
      } else if (typeof data[key] === 'object') {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    });
    return api.put('/admin/settings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export default api;
