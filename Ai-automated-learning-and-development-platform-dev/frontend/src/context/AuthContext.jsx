import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, userAPI } from '../utils/api';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // console.log('AuthProvider: Initializing...');
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }

      // Check if this is a DeptHead session (their token can't be verified via authAPI.verify)
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          if (parsed?.role?.name === 'DeptHead' || parsed?.role === 'depthead') {
            setUser(parsed);
            setIsAuthenticated(true);
            setLoading(false);
            return;
          }
        } catch (e) {
          // ignore parse errors, fall through to normal verify
        }
      }

      // Verify token with backend (for regular users / admins)
      const response = await authAPI.verify();

      if (response.data && response.data.success) {
        setUser(response.data.user || JSON.parse(userData));
        setIsAuthenticated(true);
      } else {
        clearAuthData();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', email);

      const response = await authAPI.login(email, password);
      console.log('Login response:', response.data);

      if (response.data) {
        const token = response.data.token || response.data.accessToken || response.data.jwt;
        const userData = response.data.user || response.data.data;

        if (!token) {
          console.error('No token in response:', response.data);
          toast.error('Login failed: No token received');
          return { success: false, error: 'No token received' };
        }

        localStorage.setItem('token', token);
        console.log('Token saved to localStorage');

        if (userData) {
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
        }

        setIsAuthenticated(true);
        toast.success('Login successful!');

        return { success: true };
      } else {
        console.error('Invalid response structure:', response);
        toast.error('Login failed: Invalid response');
        return { success: false, error: 'Invalid response' };
      }
    } catch (error) {
      console.error('Login error details:', error);
      console.error('Error response:', error.response?.data);

      const errorMessage = error.response?.data?.message
        || error.response?.data?.error
        || error.message
        || 'Login failed';

      toast.error(errorMessage);
      return {
        success: false,
        error: errorMessage,
        status: error.response?.status
      };
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await userAPI.logout();
      }
    } catch (error) {
      console.log('Logout API failed, but proceeding with client logout:', error);
    } finally {
      clearAuthData();
      toast.success('Logged out successfully');

      // Use window.location for hard redirect
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        checkAuth,
        isAdmin: user?.role === 'admin',
        isDeptHead: user?.role === 'depthead' || user?.role?.name === 'DeptHead'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};