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
    // Only skip if it's a public endpoint AND a GET request (to allow mutations on mixed endpoints like degree-options)
    const isMutation = ['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase());
    if (token && (!isPublicEndpoint(config.url) || isMutation)) {
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
    '/users/register-enhanced',
    '/users/verify-email',
    '/users/resend-verification-otp',
    '/users/forgot-password',
    '/users/verify-password-reset-otp',
    '/users/reset-password',
    '/users/forgot-email',
    '/users/public-logout',
    '/degree-options',
    '/health',
    '/advertisements/active'
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

  registerEnhanced: async (formData) => {
    try {
      // Log FormData contents for debugging
      console.log('=== ENHANCED REGISTRATION SUBMISSION ===');
      for (let pair of formData.entries()) {
        console.log(`${pair[0]}:`,
          typeof pair[1] === 'string' ?
            (pair[0].includes('password') ? '***HIDDEN***' : pair[1].substring(0, 50)) :
            `${pair[1].constructor.name} - ${pair[1].name || 'No name'}`
        );
      }

      const response = await api.post('/users/register-enhanced', formData, {
        timeout: 30000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload Progress: ${percentCompleted}%`);
          }
        }
      });

      console.log('Enhanced Register API Success:', response.data);
      return response;
    } catch (error) {
      console.error('Enhanced Register API Error:', {
        message: error.message,
        responseData: error.response?.data,
        status: error.response?.status
      });

      if (error.response?.data?.message) {
        throw new Error(`Registration failed: ${error.response.data.message}`);
      }
      throw error;
    }
  },

  register: async (formData) => {
    try {
      // Log FormData contents for debugging
      logFormData(formData, 'register');

      // Ensure skillSets is stringified if present
      if (formData.get('skillSets') && typeof formData.get('skillSets') !== 'string') {
        const skillSetsValue = formData.get('skillSets');
        try {
          formData.set('skillSets', JSON.stringify(skillSetsValue));
        } catch (e) {
          console.warn('Failed to stringify skillSets in api.register:', e);
        }
      }

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
    api.get('/health'),

  // ==================== ADMIN API CALLS ====================

  // Get all users (admin only)
  getAdminUsers: () =>
    api.get('/users/admin/users'),

  // Get single user details (admin only)
  getAdminUserById: (id) =>
    api.get(`/users/admin/users/${id}`),

  // Approve user (admin only)
  approveUser: (id, adminNotes = '') =>
    api.put(`/users/admin/users/${id}/approve`, { adminNotes }),

  // Reject user (admin only)
  rejectUser: (id, adminNotes = '') =>
    api.put(`/users/admin/users/${id}/reject`, { adminNotes }),

  // Set user status to pending (admin only)
  setPendingUser: (id, adminNotes = '') =>
    api.put(`/users/admin/users/${id}/pending`, { adminNotes }),

  // Set user status to eligible (admin only)
  setEligibleUser: (id, adminNotes = '') =>
    api.put(`/users/admin/users/${id}/eligible`, { adminNotes }),

  // Bulk reject users (admin only)
  bulkRejectUsers: (userIds, adminNotes = '') =>
    api.post('/users/admin/users/bulk-reject', { userIds, adminNotes }),

  // Bulk eligible users (admin only)
  bulkEligibleUsers: (userIds, adminNotes = '') =>
    api.post('/users/admin/users/bulk-eligible', { userIds, adminNotes }),

  // Bulk pending users (admin only)
  bulkPendingUsers: (userIds, adminNotes = '') =>
    api.post('/users/admin/users/bulk-pending', { userIds, adminNotes }),

  // Bulk delete users (admin only)
  bulkDeleteUsers: (userIds) =>
    api.post('/users/admin/users/bulk-delete', { userIds }),

  // Assign panel to user for specific advertisement (admin only)
  assignPanel: (id, data) =>
    api.put(`/users/admin/users/${id}/assign-panel`, data)
};

// ==================== DEPARTMENT API CALLS ====================
export const departmentAPI = {
  getAll: () => api.get('/departments'),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`)
};

// ==================== JOB DESCRIPTION API CALLS ====================
export const jobDescriptionAPI = {
  getByDepartment: (departmentId) => api.get(`/job-descriptions?department=${departmentId}`),
  getAll: () => api.get('/job-descriptions'),
  create: (data) => api.post('/job-descriptions', data),
  update: (id, data) => api.put(`/job-descriptions/${id}`, data),
  delete: (id) => api.delete(`/job-descriptions/${id}`)
};

// ==================== DEGREE OPTION API CALLS ====================
export const degreeOptionAPI = {
  getAll: () => api.get('/degree-options'),
  create: (data) => api.post('/degree-options', data),
  update: (id, data) => api.put(`/degree-options/${id}`, data),
  delete: (id) => api.delete(`/degree-options/${id}`)
};

// ==================== ADVERTISEMENT API CALLS ====================
export const advertisementAPI = {
  getAll: () => api.get('/advertisements'),
  getActive: () => api.get('/advertisements/active'),
  create: (formData) => {
    // Log for debugging since it's multipart/form-data
    logFormData(formData, 'createAdvertisement');
    return api.post('/advertisements', formData);
  },
  update: (id, formData) => {
    logFormData(formData, `updateAdvertisement-${id}`);
    return api.put(`/advertisements/${id}`, formData);
  },
  delete: (id) => api.delete(`/advertisements/${id}`)
};

// ==================== PANEL API CALLS ====================
export const panelAPI = {
  getAll: () => api.get('/panels'),
  create: (data) => api.post('/panels', data),
  update: (id, data) => api.put(`/panels/${id}`, data),
  delete: (id) => api.delete(`/panels/${id}`)
};

export default api;