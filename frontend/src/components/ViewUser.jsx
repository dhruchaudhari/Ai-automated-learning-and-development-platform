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
  FaEye
} from "react-icons/fa";

const ViewUser = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

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
      return format(new Date(dateString), "dd-MMM-yyyy");
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">User not found</h2>
          <button
            onClick={() => navigate("/grid")}
            className="btn-secondary mt-4"
          >
            Go back to user list
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 animate-slide-down">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            User Details
          </h1>
          <p className="text-gray-600 text-lg">View user information (Read-only)</p>
        </div>

        <div className="card backdrop-blur-xl shadow-2xl">
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information Section */}
              <div className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <FaUser className="mr-2 text-primary-600" />
                    Full Name
                  </label>
                  <div className="form-input bg-gray-50 cursor-not-allowed">
                    {user.fullName}
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <FaCalendar className="mr-2 text-primary-600" />
                    Date of Birth
                  </label>
                  <div className="form-input bg-gray-50 cursor-not-allowed">
                    {formatDate(user.dob)}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <FaEnvelope className="mr-2 text-primary-600" />
                    Email Address
                  </label>
                  <div className="form-input bg-gray-50 cursor-not-allowed">
                    {user.email}
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <FaPhone className="mr-2 text-primary-600" />
                    Mobile Number
                  </label>
                  <div className="form-input bg-gray-50 cursor-not-allowed">
                    {user.mobile}
                  </div>
                </div>
              </div>

              {/* Profile Image */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FaCamera className="mr-2 text-primary-600" />
                  Profile Image
                </label>
                <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                  <div className="flex-1">
                    {user.profileImage ? (
                      <div className="card flex flex-col items-center justify-center p-8 border-2 border-gray-300 rounded-2xl">
                        <div className="relative">
                          <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-lg mb-4">
                            <img
                              src={user.profileImage}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-600">Profile Image</p>
                          <p className="text-sm text-gray-500 mt-1">JPEG format</p>
                        </div>
                      </div>
                    ) : (
                      <div className="card flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-2xl">
                        <div className="text-center">
                          <FaCamera className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600">No profile image uploaded</p>
                          <p className="text-sm text-gray-500 mt-1">JPEG format</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {user.profileImage && (
                    <button
                      onClick={() => window.open(user.profileImage, "_blank")}
                      className="btn-secondary flex items-center justify-center gap-2"
                    >
                      <FaEye />
                      View Image
                    </button>
                  )}
                </div>
              </div>

              {/* Document */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FaFilePdf className="mr-2 text-primary-600" />
                  Document
                </label>
                <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                  <div className="flex-1">
                    {user.document ? (
                      <div className="card flex flex-col items-center justify-center p-8 border-2 border-gray-300 rounded-2xl">
                        <FaFilePdf className="w-16 h-16 text-red-600 mb-4" />
                        <div className="text-center">
                          <p className="text-gray-600">PDF Document</p>
                          <p className="text-sm text-gray-500 mt-1">PDF format</p>
                        </div>
                      </div>
                    ) : (
                      <div className="card flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-2xl">
                        <div className="text-center">
                          <FaFilePdf className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600">No document uploaded</p>
                          <p className="text-sm text-gray-500 mt-1">PDF format</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {user.document && (
                    <button
                      onClick={() => window.open(user.document, "_blank")}
                      className="btn-secondary flex items-center justify-center gap-2"
                    >
                      <FaEye />
                      View Document
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Created/Updated Info */}
            <div className="pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <span className="font-medium">Created At: </span>
                  {formatDate(user.createdAt)}
                </div>
                {user.updatedAt && (
                  <div>
                    <span className="font-medium">Last Updated: </span>
                    {formatDate(user.updatedAt)}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={() => navigate(`/grid/edit/${id}`)}
                className="btn-primary flex-1 py-4 text-lg"
              >
                Edit User
              </button>
              
              <button
                onClick={() => navigate("/grid")}
                className="btn-secondary py-4 text-lg"
              >
                <FaArrowLeft className="inline mr-2" />
                Back to Grid
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewUser;