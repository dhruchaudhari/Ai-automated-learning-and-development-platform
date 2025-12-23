import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
});

// Custom interceptor to handle FormData properly
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Don't set Content-Type for FormData (browser will set it with boundary)
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    // Add authorization header for protected routes
    if (token && !isPublicEndpoint(config.url)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Helper to check if endpoint is public
const isPublicEndpoint = (url) => {
  const publicEndpoints = [
    '/users/login',
    '/users/register',
    '/users/verify-email',
    '/users/resend-verification-otp',
    '/users/forgot-password',
    '/users/verify-password-reset-otp',
    '/users/reset-password',
    '/users/forgot-email',
    '/users/public-logout',
    '/health',
    '/auth/verify'
  ];
  
  return publicEndpoints.some(endpoint => url.includes(endpoint));
};

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    
    // Handle 401 errors
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath === '/login' || currentPath === '/register' || currentPath === '/';
      
      if (!isAuthPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        setTimeout(() => {
          window.location.href = '/login?session=expired';
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
      (pair[0].includes('password') ? '***HIDDEN***' : pair[1].substring(0, 50)) : 
      `${pair[1].constructor.name} - ${pair[1].name || 'No name'}`
    );
  }
  console.log('==================================');
};

// ==================== AUTH API CALLS ====================
export const authAPI = {
  login: (email, password) => 
    api.post('/users/login', { email, password }),
  
  verify: () => 
    api.get('/auth/verify'),
  
  // Email verification
  verifyEmail: (email, otp) =>
    api.post('/users/verify-email', { email, otp }),
  
  resendVerificationOtp: (email) =>
    api.post('/users/resend-verification-otp', { email }),
  
  // Forgot password
  forgotPassword: (email) =>
    api.post('/users/forgot-password', { email }),
  
  // Forgot email
  forgotEmail: (mobile) =>
    api.post('/users/forgot-email', { mobile }),
  
  verifyPasswordResetOtp: (email, otp) =>
    api.post('/users/verify-password-reset-otp', { email, otp }),
  
  resetPassword: (resetToken, newPassword, confirmPassword) =>
    api.post('/users/reset-password', { resetToken, newPassword, confirmPassword }),
  
  checkVerificationStatus: (email) =>
    api.get(`/users/verification-status/${email}`)
};

// ==================== USER API CALLS ====================
export const userAPI = {
  register: async (formData) => {
    try {
      // Log FormData contents for debugging
      logFormData(formData, 'register');
      
      // Don't set Content-Type header - FormData will set it with boundary
      const response = await api.post('/users/register', formData, {
        timeout: 30000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload Progress: ${percentCompleted}%`);
          }
        }
      });
      
      console.log('Register API Success:', response.data);
      return response;
    } catch (error) {
      console.error('Register API Error:', {
        message: error.message,
        responseData: error.response?.data,
        status: error.response?.status
      });
      
      // Re-throw the error with more context
      if (error.response?.data?.message) {
        throw new Error(`Registration failed: ${error.response.data.message}`);
      }
      throw error;
    }
  },
  
  getAllUsers: () => 
    api.get('/users/all'),
  
  getProfile: () => 
    api.get('/users/profile'),

  getUserById: (id) => 
    api.get(`/users/grid/view/${id}`),
    
  updateUser: async (id, formData) => {
    try {
      logFormData(formData, `updateUser-${id}`);
      
      const response = await api.put(`/users/grid/edit/${id}`, formData, {
        timeout: 30000,
      });
      
      console.log('Update User API Success:', response.data);
      return response;
    } catch (error) {
      console.error('Update User API Error:', error);
      throw error;
    }
  },

  deleteUser: (id) =>
    api.delete(`/users/${id}`),
    
  logout: () =>
    api.post('/users/logout'),
  
  publicLogout: () =>
    api.post('/users/public-logout'),
  
  // Test function for debugging
  testConnection: () =>
    api.get('/health')
};

export default api;