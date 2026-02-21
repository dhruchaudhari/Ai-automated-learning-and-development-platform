import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileDetails from './ProfileDetails';
import { advertisementAPI } from '../utils/api';
import { format } from 'date-fns';
import {
  HomeIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import {
  FaBullhorn,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaFilePdf
} from 'react-icons/fa';

const Home = () => {
  const { isAdmin } = useAuth();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchAds();
    }
  }, [isAdmin]);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await advertisementAPI.getAll();
      setAds(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch ads for dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  // Show ProfileDetails for regular users
  if (!isAdmin) {
    return <ProfileDetails />;
  }

  // Show Admin Dashboard for admins
  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          Welcome to <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">Bisag1 Dashboard</span>
        </h1>
        <p className="text-gray-500 font-medium">Monitoring and Management Portal</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Links & Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
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
            <h6 className="text-gray-500 text-sm mb-8">By Lavya Workshop</h6>

            <div className="grid grid-cols-1 gap-4">
              <Link
                to="/grid"
                className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200 hover:border-primary-300 transition-all hover:shadow-md flex flex-col items-center"
              >
                <UsersIcon className="w-8 h-8 text-primary-600 mb-2" />
                <h3 className="font-semibold text-gray-800">Application Screening</h3>
                <p className="text-xs text-gray-600">Verify Eligibility</p>
              </Link>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center">
                <HomeIcon className="w-8 h-8 text-gray-600 mb-2" />
                <h3 className="font-semibold text-gray-800">Mission Control</h3>
                <p className="text-xs text-gray-600">You are here</p>
              </div>
            </div>
          </div>
        </div>

        {/* Advertisements Overview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-full">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FaBullhorn className="text-primary-600" />
                Available Advertisements
              </h3>
              <Link to="/grid" className="text-primary-600 hover:underline text-sm font-semibold">
                Manage All
              </Link>
            </div>

            <div className="p-6 flex-1 overflow-y-auto max-h-[600px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                  <p className="mt-4 text-gray-500 font-medium">Loading advertisements...</p>
                </div>
              ) : ads.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <p className="text-gray-500">No advertisements found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ads.map((ad) => (
                    <div key={ad._id} className="p-4 bg-white border border-gray-100 rounded-xl hover:border-primary-200 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 mb-2">{ad.title}</h4>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <FaCalendarAlt className="text-gray-400" />
                              Deadline: {ad.lastDateToApply ? format(new Date(ad.lastDateToApply), 'dd MMM yyyy') : 'N/A'}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${ad.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                              {ad.isActive ? <FaCheckCircle /> : <FaTimesCircle />}
                              {ad.isActive ? 'Active' : 'Draft'}
                            </span>
                          </div>
                        </div>
                        <a
                          href={ad.detail}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all flex items-center gap-2 text-sm font-medium"
                        >
                          <FaFilePdf />
                          View
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <Link
                to="/grid"
                className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-primary-600 font-bold rounded-xl hover:bg-primary-50 transition-all"
              >
                Go to Job Management Center
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
