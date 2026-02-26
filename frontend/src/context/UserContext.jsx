// context/UserContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { userAPI } from '../utils/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Create the context
export const UserContext = createContext();

// Create a custom hook to use the UserContext
export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserContextProvider');
  }
  return context;
};

export const UserContextProvider = ({ children }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Get token from localStorage
  const getToken = () => {
    return localStorage.getItem('token');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const refreshUsers = async (silent = false) => {
    const token = getToken();

    if (!token) {
      console.log("No token available, skipping user refresh");
      return;
    }

    try {
      if (!silent) setLoading(true);
      const res = await userAPI.getAdminUsers();
      const usersData = res.data?.data;
      if (!Array.isArray(usersData)) {
        console.warn("Unexpected response format from admin users API");
        if (!silent) toast.error("Unexpected response from server");
        return;
      }
      const usersWithActivation = usersData
        .filter(user => user.role !== 'admin')
        .map(user => ({
          ...user,
          activationHistory: user.activationHistory || []
        }));
      setUsers(usersWithActivation);
      setLastUpdate(Date.now());
    } catch (err) {
      console.error("Error refreshing users:", err);

      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        logout();
      } else if (!silent) {
        toast.error("Failed to refresh users");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const updateUser = (userId, updates) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user._id === userId ? { ...user, ...updates } : user
      )
    );
    setLastUpdate(Date.now());
  };

  const deleteUser = (userId) => {
    setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
    setSelectedUsers(prev => prev.filter(id => id !== userId));
    setLastUpdate(Date.now());
  };

  const updateActivationHistory = (userId, status) => {
    const timestamp = new Date().toISOString();
    setUsers(prevUsers =>
      prevUsers.map(user => {
        if (user._id === userId) {
          const updatedHistory = [
            ...(user.activationHistory || []),
            {
              status,
              timestamp
            }
          ];
          return { ...user, activationHistory: updatedHistory };
        }
        return user;
      })
    );
    setLastUpdate(Date.now());
  };

  useEffect(() => {
    const token = getToken();
    if (token) {
      refreshUsers(); // Initial load — non-silent, shows errors
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (token) {
      const interval = setInterval(() => {
        refreshUsers(true); // Background poll — silent, suppresses error toasts
      }, 30000);

      return () => clearInterval(interval);
    }
  }, []);

  const [isInterviewMode, setIsInterviewMode] = useState(false);
  const [isMeritMode, setIsMeritMode] = useState(false);

  return (
    <UserContext.Provider value={{
      users,
      setUsers,
      selectedUsers,
      setSelectedUsers,
      refreshUsers,
      updateUser,
      deleteUser,
      updateActivationHistory,
      loading,
      lastUpdate,
      isInterviewMode,
      setIsInterviewMode,
      isMeritMode,
      setIsMeritMode
    }}>
      {children}
    </UserContext.Provider>
  );
};