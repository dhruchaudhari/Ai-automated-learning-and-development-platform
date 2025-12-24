import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { useState } from 'react';

import Login from './components/Login';
import Register from './components/Register';
import UserGrid from './components/UserGrid';
import ViewUser from './components/ViewUser';
import EditUser from './components/EditUser';
import Analytics from './components/Analytics';
import Home from './components/Home';
import Sidebar from './components/Sidebar';

import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('token')
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
          {/* Animated Background Elements */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
            <div
              className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"
              style={{ animationDelay: '1s' }}
            ></div>
          </div>

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#fff',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '14px',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />

          <Routes>
            {/* 🌐 Public routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/register" element={<Register />} />

            {/* 🔐 Protected routes with Sidebar */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <div className="flex min-h-screen">
                    <Sidebar onLogout={handleLogout} />
                    <main className="flex-1 ml-0 transition-all duration-300 md:ml-64 p-4 md:p-6 overflow-x-hidden">
                      <Routes>
                        <Route path="/home" element={<Home />} />
                        <Route path="/grid" element={<UserGrid />} />
                        <Route path="/grid/view/:id" element={<ViewUser />} />
                        <Route path="/grid/edit/:id" element={<EditUser />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="*" element={<Navigate to="/home" replace />} />
                      </Routes>
                    </main>
                  </div>
                </ProtectedRoute>
              }
            />

            {/* ❌ Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;