import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { userAPI } from "../utils/api";
import {
  FaUser,
  FaCalendar,
  FaEnvelope,
  FaPhone,
  FaCamera,
  FaFilePdf,
  FaArrowLeft,
  FaSpinner,
  FaEye,
  FaCheckCircle,
  FaTimesCircle
} from "react-icons/fa";

const ViewUser = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [docLoading, setDocLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getUserById(id);
      
      if (response.data.success && response.data.data) {
        setUser(response.data.data);
      } else {
        toast.error("User not found");
        navigate("/grid");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else if (error.response?.status === 404) {
        toast.error("User not found");
        navigate("/grid");
      } else {
        toast.error("Failed to load user details");
        navigate("/grid");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd/MMM/yyyy");
    } catch {
      return dateString;
    }
  };

  const formatMobile = (mobile) => {
    if (!mobile) return "N/A";
    // Format Indian mobile number: +91 98765-43210
    if (mobile.startsWith("+91")) {
      return mobile;
    }
    if (mobile.length === 10) {
      return `+91 ${mobile.slice(0, 5)}-${mobile.slice(5)}`;
    }
    return mobile;
  };

  const openInNewTab = (url) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
          <FaSpinner className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading User Details</h3>
          <p className="text-gray-500">Please wait while we fetch the user information...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8">
          <FaTimesCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-6">The user you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate("/grid")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Go Back to User List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 py-8 px-4 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        {/* Header - Matching registration form style */}
        <div className="text-center mb-8 animate-slide-down">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full shadow-lg mb-4">
            <FaUser className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            User Details
          </h1>
          <p className="text-gray-600">View complete user information (Read-only mode)</p>
          <div className="mt-4 inline-block bg-blue-50 text-blue-600 text-sm font-medium py-2 px-4 rounded-full">
            <FaCheckCircle className="inline mr-2" />
            User ID: {user._id?.substring(0, 8)}...
          </div>
        </div>

        {/* Main Card - Matching registration form card style */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                  <FaUser className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Personal Information</h2>
                  <p className="text-blue-100 text-sm">All user details are displayed below</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/grid")}
                className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 px-4 rounded-lg transition-all duration-300"
              >
                <FaArrowLeft />
                Back to Grid
              </button>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  Basic Information
                </h3>

                {/* Full Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <FaUser className="mr-2 text-blue-600" />
                    Full Name *
                  </label>
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed">
                    {user.fullName || "Not provided"}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <FaEnvelope className="mr-2 text-blue-600" />
                    Email Address *
                  </label>
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed">
                    {user.email || "Not provided"}
                  </div>
                  <p className="text-xs text-gray-500">Standard email format (no spaces)</p>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  Contact Information
                </h3>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <FaCalendar className="mr-2 text-blue-600" />
                    Date of Birth *
                  </label>
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed">
                    {formatDate(user.dob)}
                  </div>
                  <p className="text-xs text-gray-500">Format: DD/MMM/YYYY or DD-MM-YYYY</p>
                </div>

                {/* Mobile Number */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <FaPhone className="mr-2 text-blue-600" />
                    Mobile Number *
                  </label>
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed">
                    {formatMobile(user.mobile)}
                  </div>
                  <p className="text-xs text-gray-500">India XXXXX-XXXXX (Most start with 6, 7, 8, or 9)</p>
                </div>
              </div>
            </div>

            {/* Uploaded Files Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Uploaded Files</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Image */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <FaCamera className="mr-2 text-blue-600" />
                    Profile Image *
                  </label>
                  <div className="border-2 border-gray-300 rounded-xl p-4 bg-gray-50">
                    {user.profileImage ? (
                      <div className="flex flex-col items-center">
                        <div className="relative w-32 h-32 mb-4">
                          {imageLoading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <FaSpinner className="w-6 h-6 text-blue-600 animate-spin" />
                            </div>
                          )}
                          <img
                            src={user.profileImage}
                            alt="Profile"
                            className={`w-full h-full object-cover rounded-lg shadow-md ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                            onLoad={() => setImageLoading(false)}
                            onError={() => setImageLoading(false)}
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-gray-700 font-medium">Profile Image</p>
                          <p className="text-xs text-gray-500 mt-1">JPG, JPEG format</p>
                          <button
                            onClick={() => openInNewTab(user.profileImage)}
                            className="mt-3 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-all duration-300 text-sm"
                          >
                            <FaEye />
                            View Full Image
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center mb-3">
                          <FaCamera className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600">No profile image uploaded</p>
                        <p className="text-xs text-gray-500 mt-1">Max: 1MB, JPEG only</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Document */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <FaFilePdf className="mr-2 text-blue-600" />
                    Document *
                  </label>
                  <div className="border-2 border-gray-300 rounded-xl p-4 bg-gray-50">
                    {user.document ? (
                      <div className="flex flex-col items-center">
                        <div className="relative w-32 h-32 mb-4 bg-red-50 rounded-lg flex items-center justify-center">
                          {docLoading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <FaSpinner className="w-6 h-6 text-red-600 animate-spin" />
                            </div>
                          )}
                          <FaFilePdf className={`w-16 h-16 text-red-600 ${docLoading ? 'opacity-0' : 'opacity-100'}`} />
                        </div>
                        <div className="text-center">
                          <p className="text-gray-700 font-medium">PDF Document</p>
                          <p className="text-xs text-gray-500 mt-1">PDF format only</p>
                          <button
                            onClick={() => openInNewTab(user.document)}
                            className="mt-3 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-all duration-300 text-sm"
                          >
                            <FaEye />
                            View PDF Document
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center mb-3 bg-red-50">
                          <FaFilePdf className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600">No document uploaded</p>
                        <p className="text-xs text-gray-500 mt-1">Max: 5MB, PDF only</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">Account Created</p>
                  <p className="font-medium text-gray-800">{formatDate(user.createdAt)}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                  <p className="font-medium text-gray-800">{formatDate(user.updatedAt)}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">User Status</p>
                  <p className="font-medium text-green-600">Active</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-col md:flex-row gap-4">
                <button
                  onClick={() => navigate(`/grid/edit/${id}`)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Edit User Information
                </button>
                
                <button
                  onClick={() => navigate("/grid")}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all duration-300 border border-gray-300"
                >
                  <FaArrowLeft className="inline mr-2" />
                  Return to User Grid
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            All fields marked with * are required fields. This view is read-only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ViewUser;