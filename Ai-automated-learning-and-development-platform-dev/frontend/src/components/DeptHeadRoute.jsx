import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DeptHeadRoute = () => {
    const { isAuthenticated, isDeptHead, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!isDeptHead) {
        return <Navigate to="/home" replace />;
    }

    return <Outlet />;
};

export default DeptHeadRoute;
