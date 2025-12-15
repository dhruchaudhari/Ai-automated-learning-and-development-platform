import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ ADDED: Debug request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('🔑 API Request Interceptor:');
    console.log('  URL:', config.url);
    console.log('  Method:', config.method);
    console.log('  Token exists:', !!token);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('  ✅ Authorization header set');
      console.log('  Token (first 20 chars):', token.substring(0, 20) + '...');
    } else {
      console.log('  ❌ No token in localStorage');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ✅ FIXED: Response interceptor with better logic
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Error Response:');
    console.error('  URL:', error.config?.url);
    console.error('  Method:', error.config?.method);
    console.error('  Status:', error.response?.status);
    console.error('  Error message:', error.response?.data?.message);
    console.error('  Token in localStorage:', !!localStorage.getItem('token'));
    
    // Check if this is a user API call (not auth call)
    const isUserApiCall = error.config?.url?.includes('/users/');
    const isAuthCall = error.config?.url?.includes('/auth/');
    
    // Only redirect on 401 for user API calls, not for auth calls
    if (error.response?.status === 401 && isUserApiCall) {
      console.log('⚠️ 401 on user API, checking if we should redirect...');
      
      // Don't redirect if we're already on login page
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/') {
        console.log('Redirecting to login...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (email, password) => 
    api.post('/auth/login', { email, password }),
  
  logout: () => 
    api.post('/auth/logout'),
  
  verify: () => 
    api.get('/auth/verify'),
};

// User API calls - UPDATED TO MATCH BACKEND ROUTES
export const userAPI = {
  register: (formData) => 
    api.post('/users/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  getAllUsers: () => 
    api.get('/users/all'),
  
  getProfile: () => 
    api.get('/users/profile'),

  // ✅ CHANGED: Now using /users/grid/view/:id to match backend
  getUserById: (id) => 
    api.get(`/users/grid/view/${id}`),  // Changed from /users/:id
    
  // ✅ CHANGED: Now using /users/grid/edit/:id to match backend  
  updateUser: (id, formData) =>
    api.put(`/users/grid/edit/${id}`, formData, {  // Changed from /users/:id
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  deleteUser: (id) =>
    api.delete(`/users/${id}`),
};

// Health check
export const checkHealth = () => 
  api.get('/health');

export default api;