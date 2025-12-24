import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  UsersIcon,
  ArrowLeftOnRectangleIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const [userData, setUserData] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/home',
      icon: <HomeIcon className="w-5 h-5" />,
    },
    {
      name: 'User Management',
      path: '/grid',
      icon: <UsersIcon className="w-5 h-5" />,
    },
    {
      name: 'Analytics',
      path: '/analytics',
      icon: <ChartPieIcon className="w-5 h-5" />,
    },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogoClick = () => {
    navigate('/home');
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <aside className="bg-gradient-to-b from-primary-900 via-primary-800 to-primary-900 text-white h-screen fixed w-64 flex flex-col shadow-2xl z-40 border-r border-primary-700/30">
      {/* Logo/Brand Section */}
      <div className="p-6 border-b border-primary-700/30">
        <div className="flex items-center space-x-3">
          {/* Clickable Logo Image */}
          <button
            onClick={handleLogoClick}
            className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-opacity-50"
            aria-label="Go to homepage"
          >
            <img
              src="/lavya.jpg"
              alt="Bisag1 Logo"
              className="w-full h-full rounded-lg object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<span class="text-white font-bold text-lg">B</span>';
              }}
            />
          </button>

          {/* Brand text */}
          <div className="flex flex-col">
            <button
              onClick={handleLogoClick}
              className="text-left focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-opacity-50 rounded px-1 -ml-1"
              aria-label="Go to homepage"
            >
              <h1 className="text-xl font-bold text-white hover:text-primary-200 transition-colors duration-200">
                Bisag1
              </h1>
            </button>
            <h6 className="text-primary-300 text-xs font-medium mt-0.5 whitespace-normal leading-tight">
              Lavya Workshop
            </h6>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center p-3 space-x-3 rounded-lg transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md'
                  : 'text-primary-200 hover:bg-primary-800/50 hover:text-white'
              }`}
            >
              <div className={`${isActive(item.path) ? 'text-white' : 'text-primary-300'}`}>
                {item.icon}
              </div>
              <span className="font-medium">
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto p-4 border-t border-primary-700/30">
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center p-3 space-x-3 w-full rounded-lg transition-all duration-300 bg-black hover:bg-[#6f0000] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 active:scale-[0.98]"
          aria-label="Logout"
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5 text-white" />
          <span className="font-medium text-white">
            Logout
          </span>
        </button>
        
        {/* User info */}
        {userData && (
          <div className="mt-3 pt-3 border-t border-primary-700/20">
            <p className="text-xs text-primary-400/70 text-center truncate">
              {`Signed in as ${userData.fullName || "User"}`}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;