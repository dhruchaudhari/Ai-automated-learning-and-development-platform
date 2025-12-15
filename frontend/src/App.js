import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext'; // ✅ ADD THIS IMPORT
import Login from './components/Login';
import Register from './components/Register';
import UserGrid from './components/UserGrid';
import ViewUser from './components/ViewUser';
import EditUser from './components/EditUser';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider> {/* ✅ WRAP EVERYTHING WITH AuthProvider */}
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                theme: {
                  primary: 'green',
                  secondary: 'black',
                },
              },
              error: {
                duration: 4000,
              },
            }}
          />
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/grid" 
              element={
                <ProtectedRoute>
                  <UserGrid />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/grid/view/:id" 
              element={
                <ProtectedRoute>
                  <ViewUser />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/grid/edit/:id" 
              element={
                <ProtectedRoute>
                  <EditUser />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;