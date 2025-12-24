import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/home',
      icon: <HomeIcon className="w-6 h-6" />,
    },
    {
      name: 'User Management',
      path: '/grid',
      icon: <UsersIcon className="w-6 h-6" />,
    },
    {
      name: 'Analytics',
      path: '/analytics',
      icon: <ChartBarIcon className="w-6 h-6" />,
    },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside
      className={`bg-gradient-to-b from-primary-900 to-primary-800 text-white h-screen fixed transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      } flex flex-col shadow-xl z-40`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-white text-primary-700 rounded-full p-1 shadow-lg hover:bg-gray-100 transition-colors z-10"
      >
        {isCollapsed ? (
          <ChevronRightIcon className="w-5 h-5" />
        ) : (
          <ChevronLeftIcon className="w-5 h-5" />
        )}
      </button>

      {/* Logo/Brand Section */}
<div className="p-6 border-b border-primary-700">
  <div className="flex items-center space-x-3">
    <div className="bg-white p-2 rounded-lg">
      <img
        src="/lavya.jpg"
        alt="Bisag1 Logo"
        className="w-12 h-12 rounded-lg object-cover"
      />
    </div>

    {!isCollapsed && (
      <div>
        <h1 className="text-xl font-bold text-white">Bisag1</h1>
        <h6 className="text-primary-200 text-xs mt-1">
          By Lavya Workshop
        </h6>
      </div>
    )}
  </div>
</div>


      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className={`${isCollapsed ? 'space-y-4' : 'space-y-2'}`}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center ${
                isCollapsed ? 'justify-center p-3' : 'p-3 space-x-3'
              } rounded-lg transition-all duration-200 hover:bg-primary-700 ${
                isActive(item.path)
                  ? 'bg-primary-600 shadow-md'
                  : 'bg-transparent'
              }`}
            >
              <div
                className={`${
                  isActive(item.path)
                    ? 'text-white'
                    : 'text-primary-200'
                }`}
              >
                {item.icon}
              </div>
              {!isCollapsed && (
                <span className="font-medium">
                  {item.name}
                </span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Logout Section */}
      <div className="p-4 border-t border-primary-700">
        <button
          onClick={logout}
          className={`flex items-center ${
            isCollapsed ? 'justify-center p-3' : 'p-3 space-x-3 w-full'
          } rounded-lg transition-all duration-200 hover:bg-red-900/30 hover:text-red-200 text-primary-200`}
        >
          <ArrowLeftOnRectangleIcon className="w-6 h-6" />
          {!isCollapsed && (
            <span className="font-medium">
              Logout
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;