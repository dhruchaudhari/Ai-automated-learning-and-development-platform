import React from 'react';
import { Link } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const Home = () => {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          Welcome to <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">Bisag1 Dashboard</span>
        </h1>
        <p className="text-gray-600">
          Manage your users and view analytics from this centralized dashboard
        </p>
      </div>

      {/* Dashboard Cards */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <div className="max-w-md mx-auto text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-primary-100 to-secondary-100 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full overflow-hidden">
              <img 
                src="/lavya.jpg" 
                alt="Bisag1 Logo" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Bisag1 Dashboard</h2>
          <h6 className="text-gray-500 text-sm mb-6">By Lavya Workshop</h6>
          
          <p className="text-gray-600 mb-8">
            Select an option from the sidebar to get started:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <Link
              to="/grid"
              className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200 hover:border-primary-300 transition-all hover:shadow-md"
            >
              <div className="flex flex-col items-center">
                <UsersIcon className="w-8 h-8 text-primary-600 mb-2" />
                <h3 className="font-semibold text-gray-800 mb-1">User Management</h3>
                <p className="text-sm text-gray-600">Manage all users</p>
              </div>
            </Link>
            
            <Link
              to="/analytics"
              className="p-4 bg-gradient-to-r from-secondary-50 to-secondary-100 rounded-xl border border-secondary-200 hover:border-secondary-300 transition-all hover:shadow-md"
            >
              <div className="flex flex-col items-center">
                <ChartBarIcon className="w-8 h-8 text-secondary-600 mb-2" />
                <h3 className="font-semibold text-gray-800 mb-1">Analytics</h3>
                <p className="text-sm text-gray-600">View insights & reports</p>
              </div>
            </Link>
            
            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <div className="flex flex-col items-center">
                <HomeIcon className="w-8 h-8 text-gray-600 mb-2" />
                <h3 className="font-semibold text-gray-800 mb-1">Dashboard</h3>
                <p className="text-sm text-gray-600">You are here</p>
              </div>
            </div>
          </div>
          
          <div className="mt-10 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need help? Contact support or refer to the documentation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;