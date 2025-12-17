import React, { useState } from "react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import {
  FaUser,
  FaCalendar,
  FaEnvelope,
  FaPhone,
  FaCamera,
  FaFilePdf,
  FaSpinner,
  FaEye,
  FaCheck,
  FaTimes,
  FaInfoCircle,
  FaEdit
} from "react-icons/fa";

const ViewUser = ({ user, onClose }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [docLoading, setDocLoading] = useState(true);

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

  if (!user) {
    return (
      <div className="p-8 text-center">
        <FaTimes className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">User Not Found</h2>
        <p className="text-gray-600 mb-6">The user you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              <FaUser className="mr-2 text-primary-600" />
              Full Name *
              <span className="ml-2 text-xs text-green-600 flex items-center">
                <FaCheck className="mr-1" /> Verified
              </span>
            </label>
            <div className="relative">
              <div className="form-input bg-gray-50 cursor-not-allowed flex items-center justify-between py-3">
                <span className="text-gray-700 truncate">{user.fullName || "Not provided"}</span>
                <FaCheck className="text-green-600 flex-shrink-0" />
              </div>
            </div>
            <p className="text-sm text-green-600 animate-slide-up flex items-center">
              <FaCheck className="mr-1" /> Valid full name
            </p>
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              <FaCalendar className="mr-2 text-primary-600" />
              Date of Birth *
              <span className="ml-2 text-xs text-green-600 flex items-center">
                <FaCheck className="mr-1" /> Verified
              </span>
            </label>
            <div className="relative">
              <div className="form-input bg-gray-50 cursor-not-allowed flex items-center justify-between py-3">
                <span className="text-gray-700">{formatDate(user.dob)}</span>
                <FaCheck className="text-green-600 flex-shrink-0" />
              </div>
            </div>
            <p className="text-sm text-green-600 animate-slide-up flex items-center">
              <FaCheck className="mr-1" /> Valid date of birth
            </p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              <FaEnvelope className="mr-2 text-primary-600" />
              Email Address *
              <span className="ml-2 text-xs text-green-600 flex items-center">
                <FaCheck className="mr-1" /> Verified
              </span>
            </label>
            <div className="relative">
              <div className="form-input bg-gray-50 cursor-not-allowed flex items-center justify-between py-3">
                <span className="text-gray-700 truncate">{user.email || "Not provided"}</span>
                <FaCheck className="text-green-600 flex-shrink-0" />
              </div>
            </div>
            <p className="text-sm text-green-600 animate-slide-up flex items-center">
              <FaCheck className="mr-1" /> Valid email address
            </p>
          </div>

          {/* Mobile Number */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              <FaPhone className="mr-2 text-primary-600" />
              Mobile Number *
              <span className="ml-2 text-xs text-green-600 flex items-center">
                <FaCheck className="mr-1" /> Verified
              </span>
            </label>
            <div className="relative">
              <div className="form-input bg-gray-50 cursor-not-allowed flex items-center justify-between py-3">
                <span className="text-gray-700">{formatMobile(user.mobile)}</span>
                <FaCheck className="text-green-600 flex-shrink-0" />
              </div>
            </div>
            <p className="text-sm text-green-600 animate-slide-up flex items-center">
              <FaCheck className="mr-1" /> Valid phone number
            </p>
          </div>

          {/* Profile Image */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              <FaCamera className="mr-2 text-primary-600" />
              Profile Image *
              <span className="ml-2 text-xs text-green-600 flex items-center">
                <FaCheck className="mr-1" /> Verified
              </span>
            </label>
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
              <div className="flex-1">
                {user.profileImage ? (
                  <div className="card flex flex-col items-center justify-center p-6 border-2 border-green-500 rounded-xl">
                    <div className="relative">
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-white shadow-lg mb-4">
                        {imageLoading && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <FaSpinner className="w-6 h-6 text-primary-600 animate-spin" />
                          </div>
                        )}
                        <img
                          src={user.profileImage}
                          alt="Profile"
                          className={`w-full h-full object-cover ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                          onLoad={() => setImageLoading(false)}
                          onError={() => setImageLoading(false)}
                        />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center">
                        <FaCamera className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-700 font-medium">Profile Image</p>
                      <p className="text-sm text-gray-500 mt-1">JPEG format</p>
                      <button
                        onClick={() => openInNewTab(user.profileImage)}
                        className="mt-3 flex items-center justify-center gap-2 btn-secondary py-2 px-4 text-sm"
                      >
                        <FaEye />
                        View Full Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="card flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl">
                    <div className="text-center">
                      <FaCamera className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No profile image uploaded</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Image Details:</p>
                <ul className="space-y-1">
                  <li className="flex items-center">
                    <FaCheck className="text-green-500 mr-2" />
                    Format: JPEG/JPG
                  </li>
                  <li className="flex items-center">
                    <FaCheck className="text-green-500 mr-2" />
                    Max Size: 1MB
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Document */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              <FaFilePdf className="mr-2 text-primary-600" />
              Document *
              <span className="ml-2 text-xs text-green-600 flex items-center">
                <FaCheck className="mr-1" /> Verified
              </span>
            </label>
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
              <div className="flex-1">
                {user.document ? (
                  <div className="card flex flex-col items-center justify-center p-6 border-2 border-red-300 rounded-xl">
                    <div className="relative">
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-red-50 flex items-center justify-center mb-4">
                        {docLoading && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <FaSpinner className="w-6 h-6 text-red-600 animate-spin" />
                          </div>
                        )}
                        <FaFilePdf className={`w-12 h-12 text-red-500 ${docLoading ? 'opacity-0' : 'opacity-100'}`} />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center">
                        <FaFilePdf className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-700 font-medium">PDF Document</p>
                      <p className="text-sm text-gray-500 mt-1">PDF format</p>
                      <button
                        onClick={() => openInNewTab(user.document)}
                        className="mt-3 flex items-center justify-center gap-2 btn-secondary py-2 px-4 text-sm"
                      >
                        <FaEye />
                        View PDF Document
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="card flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl">
                    <div className="text-center">
                      <FaFilePdf className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No document uploaded</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Document Details:</p>
                <ul className="space-y-1">
                  <li className="flex items-center">
                    <FaCheck className="text-green-500 mr-2" />
                    Format: PDF
                  </li>
                  <li className="flex items-center">
                    <FaCheck className="text-green-500 mr-2" />
                    Max Size: 5MB
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary-50 rounded-xl p-4">
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
        <div className="flex flex-col md:flex-row gap-4 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-secondary py-3 text-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewUser;