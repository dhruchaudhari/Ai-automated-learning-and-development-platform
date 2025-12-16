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

// Helper function to log FormData contents
const logFormData = (formData, endpoint) => {
  console.log(`=== FORMDATA DEBUG for ${endpoint} ===`);
  for (let pair of formData.entries()) {
    console.log(`${pair[0]}:`, 
      typeof pair[1] === 'string' ? 
      pair[1] : 
      `${pair[1].constructor.name} - ${pair[1].name || 'No name'}`
    );
  }
  console.log('==================================');
};

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
  register: async (formData) => {
    try {
      // Log FormData contents for debugging
      logFormData(formData, 'register');
      
      const response = await api.post('/users/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Add timeout to prevent hanging
        timeout: 30000,
        // Add onUploadProgress for debugging
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload Progress: ${percentCompleted}%`);
          }
        }
      });
      
      console.log('✅ Register API Success:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Register API Error:');
      console.error('  Error:', error.message);
      console.error('  Response data:', error.response?.data);
      console.error('  Response status:', error.response?.status);
      
      // Enhanced error handling
      if (error.response?.data?.message?.includes('password')) {
        throw new Error('Password field issue: ' + error.response.data.message);
      }
      
      throw error;
    }
  },
  
  getAllUsers: () => 
    api.get('/users/all'),
  
  getProfile: () => 
    api.get('/users/profile'),

  // ✅ CHANGED: Now using /users/grid/view/:id to match backend
  getUserById: (id) => 
    api.get(`/users/grid/view/${id}`),  // Changed from /users/:id
    
  // ✅ CHANGED: Now using /users/grid/edit/:id to match backend  
  updateUser: async (id, formData) => {
    try {
      logFormData(formData, `updateUser-${id}`);
      
      const response = await api.put(`/users/grid/edit/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });
      
      console.log('✅ Update User API Success:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Update User API Error:', error);
      throw error;
    }
  },

  deleteUser: (id) =>
    api.delete(`/users/${id}`),
    
  // ✅ ADDED: Logout function for user logout
  logout: async () => {
    try {
      const response = await api.post(
        '/users/logout',
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          }
        }
      );
      return response;
    } catch (error) {
      // If token is expired, try public logout
      if (error.response?.status === 401) {
        console.log('Token expired, trying public logout...');
        return await api.post('/users/public-logout');
      }
      throw error;
    }
  },
  
  // ✅ ADDED: Test endpoint to debug FormData sending
  testFormData: async (testData) => {
    try {
      const testFormData = new FormData();
      testFormData.append('testField1', 'Test Value 1');
      testFormData.append('testField2', 'Test Value 2');
      testFormData.append('password', 'TestPassword123');
      
      console.log('🧪 Testing FormData sending...');
      logFormData(testFormData, 'testFormData');
      
      const response = await api.post('/users/test-formdata', testFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response;
    } catch (error) {
      console.error('❌ FormData Test Error:', error);
      throw error;
    }
  },
};

// Health check
export const checkHealth = () => 
  api.get('/health');

// ✅ ADDED: Direct test function for backend communication
export const testBackendConnection = async () => {
  try {
    console.log('🧪 Testing backend connection...');
    const response = await api.get('/health');
    console.log('✅ Backend connection successful:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    return false;
  }
};

export default api;