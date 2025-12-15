import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../utils/api';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
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

      // Verify token with backend
      const response = await authAPI.verify();
      
      if (response.data && response.data.success) {
        // Use user from response or from localStorage
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
      
      // Check if response has data and token
      if (response.data) {
        // Handle different response structures
        const token = response.data.token || response.data.accessToken || response.data.jwt;
        const userData = response.data.user || response.data.data;
        
        if (!token) {
          console.error('No token in response:', response.data);
          toast.error('Login failed: No token received');
          return { success: false, error: 'No token received' };
        }
        
        // Save token to localStorage
        localStorage.setItem('token', token);
        console.log('Token saved to localStorage');
        
        // Save user info if available
        if (userData) {
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
        }
        
        setIsAuthenticated(true);
        toast.success('Login successful!');
        
        // Verify the token was saved correctly
        setTimeout(() => {
          console.log('Verifying token after login:', localStorage.getItem('token'));
        }, 100);
        
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

  const logout = () => {
    clearAuthData();
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};