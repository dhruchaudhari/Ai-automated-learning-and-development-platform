import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../utils/api";
import { toast } from "react-hot-toast";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaUser,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaSpinner,
  FaSearch,
  FaTimes,
  FaImage,
  FaFilePdf,
  FaBug,
  FaLock,
  FaTimesCircle,
  FaDownload,
  FaExpand,
  FaSignOutAlt,
  FaRedo,
  FaPowerOff,
  FaArrowLeft
} from "react-icons/fa";
import ConfirmationModal from "./ConfirmationModal";
import ViewUser from "./ViewUser";
import EditUser from "./EditUser";

const ROWS_PER_PAGE = 5; // Changed from 10 to 5

// Preview Modal Component
const PreviewModal = ({ preview, onClose }) => {
  const [loading, setLoading] = useState(true);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
          <div className="flex items-center gap-3">
            {preview.type === "image" ? (
              <FaImage className="w-5 h-5" />
            ) : (
              <FaFilePdf className="w-5 h-5" />
            )}
            <h3 className="text-lg font-semibold">
              {preview.type === "image" ? "Profile Image Preview" : "Document Preview"}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.open(preview.src, "_blank")}
              className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all"
              title="Open in new tab"
            >
              <FaExpand className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all"
            >
              <FaTimesCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 bg-gray-50">
          {preview.type === "image" ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <FaSpinner className="w-8 h-8 text-primary-600 animate-spin" />
                </div>
              )}
              <img
                src={preview.src}
                alt="Preview"
                className={`max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg ${loading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setLoading(false)}
                onError={() => setLoading(false)}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <FaSpinner className="w-8 h-8 text-primary-600 animate-spin" />
                </div>
              )}
              <iframe
                src={`${preview.src}#view=fitH`}
                title="PDF Preview"
                className={`w-full h-[70vh] border-0 rounded-lg shadow-lg ${loading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setLoading(false)}
              />
              <div className="mt-4 flex items-center gap-4">
                <button
                  onClick={() => window.open(preview.src, "_blank")}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <FaDownload />
                  View PDF in Another Tab
                </button>
                <p className="text-sm text-gray-600">
                  Note: Some PDFs may require download for full functionality
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {preview.type === "image" ? "JPEG Image" : "PDF Document"}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal Container for View/Edit
const ModalContainer = ({ isOpen, onClose, title, children, size = "large" }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    large: "max-w-6xl max-h-[90vh]",
    medium: "max-w-4xl max-h-[85vh]",
    small: "max-w-2xl max-h-[80vh]"
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[90] p-4 animate-fade-in">
      <div className={`relative w-full ${sizeClasses[size]} bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col`}>
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all"
              title="Close"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange, totalItems }) => {
  const getVisiblePages = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show limited pages with ellipsis
      if (currentPage <= 3) {
        // Near the beginning
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl">
      {/* Page Info */}
      <div className="text-sm text-gray-600">
        Showing <span className="font-semibold">{(currentPage - 1) * ROWS_PER_PAGE + 1}</span> to{' '}
        <span className="font-semibold">{Math.min(currentPage * ROWS_PER_PAGE, totalItems)}</span> of{' '}
        <span className="font-semibold">{totalItems}</span> users
      </div>
      
      {/* Page Navigation */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FaChevronLeft />
          Previous
        </button>
        
        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {visiblePages.map((pageNum, index) => (
            pageNum === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                ...
              </span>
            ) : (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-10 h-10 rounded-lg transition-colors flex items-center justify-center ${
                  currentPage === pageNum
                    ? "bg-primary-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {pageNum}
              </button>
            )
          ))}
        </div>
        
        {/* Next Button */}
        <button
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => onPageChange(currentPage + 1)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <FaChevronRight />
        </button>
      </div>
      
      {/* Page Indicator */}
      <div className="text-sm text-gray-600">
        Page <span className="font-semibold text-primary-600">{currentPage}</span> of{' '}
        <span className="font-semibold">{totalPages || 1}</span>
      </div>
    </div>
  );
};

const UserGrid = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState({ show: false, userId: null });
  const [previewModal, setPreviewModal] = useState({ show: false, src: null, type: null });
  const [logoutModal, setLogoutModal] = useState(false);
  
  // New state for modals
  const [viewModal, setViewModal] = useState({ show: false, userId: null });
  const [editModal, setEditModal] = useState({ show: false, userId: null });
  const [selectedUserData, setSelectedUserData] = useState(null);

  /* =========================
     FETCH USERS FROM BACKEND
  ========================= */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userAPI.getAllUsers();
      setUsers(res.data.data);
      setFilteredUsers(res.data.data);
    } catch (err) {
      console.error("❌ Error fetching users:", err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.mobile?.includes(searchTerm)
      );
      setFilteredUsers(filtered);
      setPage(1); // Reset to first page when searching
    }
  }, [searchTerm, users]);

  const totalPages = Math.ceil(filteredUsers.length / ROWS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE
  );

  const toggleUserSelection = (id) => {
    setSelectedUsers(prev =>
      prev.includes(id)
        ? prev.filter(userId => userId !== id)
        : [...prev, id]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(paginatedUsers.map(user => user._id));
    }
  };

  const isUserSelected = (userId) => selectedUsers.includes(userId);

  /* =========================
     DEBUG TOKEN STATUS
  ========================= */
  const checkTokenStatus = () => {
    console.log("=== TOKEN STATUS CHECK ===");
    const token = localStorage.getItem("token");
    console.log("Token exists:", !!token);
    console.log("Token length:", token?.length);
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        console.log("Token payload:", payload);
        console.log("Token expires:", new Date(payload.exp * 1000));
        console.log("Is token expired?", payload.exp * 1000 < Date.now());
      } catch (e) {
        console.error("Failed to decode token:", e);
      }
    }
    
    userAPI.getAllUsers()
      .then(res => console.log("✅ API test successful:", res.data.success))
      .catch(err => console.error("❌ API test failed:", err.response?.status));
  };

  /* =========================
     ACTION HANDLERS
  ========================= */
  const handleViewUser = async (userId) => {
    if (!isUserSelected(userId)) {
      toast.error("Please select the user first");
      return;
    }
    
    try {
      // Fetch user data for the modal
      const response = await userAPI.getUserById(userId);
      setSelectedUserData(response.data.data);
      setViewModal({ show: true, userId });
    } catch (error) {
      console.error("Error fetching user for view:", error);
      toast.error("Failed to load user details");
    }
  };

  const handleEditUser = async (userId) => {
    if (!isUserSelected(userId)) {
      toast.error("Please select the user first");
      return;
    }
    
    try {
      // Fetch user data for the modal
      const response = await userAPI.getUserById(userId);
      setSelectedUserData(response.data.data);
      setEditModal({ show: true, userId });
    } catch (error) {
      console.error("Error fetching user for edit:", error);
      toast.error("Failed to load user details");
    }
  };

  const handleDeleteUser = (userId) => {
    if (!isUserSelected(userId)) {
      toast.error("Please select the user first");
      return;
    }
    setDeleteModal({ show: true, userId });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.userId) return;

    try {
      await userAPI.deleteUser(deleteModal.userId);
      toast.success("User deleted successfully");
      fetchUsers();
      setSelectedUsers(prev => prev.filter(id => id !== deleteModal.userId));
      
      // Close modals if they were open for this user
      if (viewModal.userId === deleteModal.userId) {
        setViewModal({ show: false, userId: null });
      }
      if (editModal.userId === deleteModal.userId) {
        setEditModal({ show: false, userId: null });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete user");
    } finally {
      setDeleteModal({ show: false, userId: null });
    }
  };

  /* =========================
     LOGOUT HANDLER
  ========================= */
  const handleLogout = async () => {
    try {
      // Try to call logout API (if token is valid)
      await userAPI.logout();
    } catch (err) {
      // If token is expired, we can still logout locally
      console.log("Logout API failed (token might be expired), proceeding with local logout");
    }
    
    // Always clear local storage and redirect
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    toast.success("Logged out successfully");
    navigate("/login");
  };

  /* =========================
     REFRESH HANDLER
  ========================= */
  const handleRefresh = () => {
    fetchUsers();
    toast.success("User list refreshed");
  };

  /* =========================
     PREVIEW HANDLERS
  ========================= */
  const openImagePreview = (imageUrl) => {
    setPreviewModal({
      show: true,
      src: imageUrl,
      type: "image"
    });
  };

  const openDocumentPreview = (docUrl) => {
    setPreviewModal({
      show: true,
      src: docUrl,
      type: "pdf"
    });
  };

  /* =========================
     MODAL HANDLERS
  ========================= */
  const handleViewModalClose = () => {
    setViewModal({ show: false, userId: null });
    setSelectedUserData(null);
  };

  const handleEditModalClose = () => {
    setEditModal({ show: false, userId: null });
    setSelectedUserData(null);
  };

  const handleEditSuccess = () => {
    fetchUsers(); // Refresh the user list
    setEditModal({ show: false, userId: null });
    setSelectedUserData(null);
  };

  /* =========================
     PAGE CHANGE HANDLER
  ========================= */
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      // Scroll to top of table when changing pages
      const tableElement = document.querySelector('.overflow-x-auto');
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 animate-slide-down">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-gray-600 text-lg">Manage and view all registered users</p>
          <div className="mt-4 text-sm text-gray-500 bg-yellow-50 inline-block px-4 py-2 rounded-lg">
            <FaLock className="inline mr-2 text-yellow-500" />
            Select users to enable actions (View, Edit, Delete)
          </div>
        </div>

        <div className="card backdrop-blur-xl shadow-2xl">
          {/* Action Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name, email, or mobile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64 md:w-80"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
              
              <button
                onClick={checkTokenStatus}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                title="Check token status"
              >
                <FaBug />
                Debug Token
              </button>
            </div>

            <div className="flex items-center gap-4">
              <span className={`text-sm font-medium ${selectedUsers.length > 0 ? 'text-primary-600' : 'text-gray-600'}`}>
                {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
              </span>
              
              {/* Refresh Button with Icon */}
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Refresh user list"
              >
                <FaRedo className="text-primary-600" />
                Refresh
              </button>
              
              {/* Logout Button */}
              <button
                onClick={() => setLogoutModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                title="Logout from application"
              >
                <FaPowerOff />
                Logout
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-primary-100 to-secondary-100">
                <tr>
                  <th className="py-4 px-6 text-left w-16">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paginatedUsers.length > 0 && selectedUsers.length === paginatedUsers.length}
                        onChange={selectAllUsers}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                    </label>
                  </th>
                  <th className="py-4 px-6 text-left">Name</th>
                  <th className="py-4 px-6 text-left w-32">Image</th>
                  <th className="py-4 px-6 text-left w-32">Document</th>
                  <th className="py-4 px-6 text-left w-48">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mb-4" />
                        <p className="text-gray-600">Loading users...</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FaUser className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-gray-600 text-lg mb-2">No users found</p>
                        <p className="text-gray-500">
                          {searchTerm ? "Try adjusting your search" : "No users registered yet"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => {
                    const isSelected = isUserSelected(user._id);
                    return (
                      <tr
                        key={user._id}
                        className={`border-t border-gray-200 transition-all duration-300 hover:bg-gray-50 ${
                          isSelected ? "bg-primary-50" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-4 px-6">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleUserSelection(user._id)}
                              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                            />
                            {isSelected && (
                              <FaCheckCircle className="ml-2 text-primary-600" />
                            )}
                          </label>
                        </td>

                        {/* Name */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                              isSelected 
                                ? "bg-gradient-to-br from-primary-500 to-secondary-500 text-white"
                                : "bg-gray-200 text-gray-600"
                            }`}>
                              {user.fullName?.charAt(0) || "U"}
                            </div>
                            <div>
                              <p className={`font-medium ${isSelected ? 'text-primary-700' : 'text-gray-800'}`}>
                                {user.fullName}
                              </p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Image Preview */}
                        <td className="py-4 px-6">
                          {user.profileImage ? (
                            <div className="relative">
                              <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200">
                                <img
                                  src={user.profileImage}
                                  alt="Profile"
                                  className={`w-full h-full object-cover transition-all ${
                                    isSelected ? "cursor-pointer hover:opacity-90 hover:scale-105" : "opacity-70"
                                  }`}
                                  onClick={() => isSelected && openImagePreview(user.profileImage)}
                                />
                              </div>
                              {isSelected && (
                                <button
                                  onClick={() => openImagePreview(user.profileImage)}
                                  className="absolute -top-1 -right-1 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-primary-600 transition-colors"
                                  title="Preview Image"
                                >
                                  <FaEye />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                              <FaImage className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </td>

                        {/* Document Preview */}
                        <td className="py-4 px-6">
                          {user.document ? (
                            <div className="relative">
                              <button
                                onClick={() => isSelected && openDocumentPreview(user.document)}
                                className={`w-16 h-16 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                                  isSelected 
                                    ? "border-gray-200 bg-red-50 hover:bg-red-100 cursor-pointer hover:scale-105"
                                    : "border-gray-200 bg-gray-100 cursor-not-allowed opacity-70"
                                }`}
                                title={isSelected ? "Preview PDF" : "Select user to preview PDF"}
                                disabled={!isSelected}
                              >
                                <FaFilePdf className={`w-8 h-8 mb-1 ${isSelected ? 'text-red-600' : 'text-gray-400'}`} />
                                <span className={`text-xs ${isSelected ? 'text-red-600' : 'text-gray-400'}`}>
                                  View PDF
                                </span>
                              </button>
                              {isSelected && (
                                <button
                                  onClick={() => openDocumentPreview(user.document)}
                                  className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                                  title="Preview Document"
                                >
                                  <FaEye />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                              <FaFilePdf className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {/* View Button */}
                            <button
                              onClick={() => handleViewUser(user._id)}
                              disabled={!isSelected}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                isSelected
                                  ? "bg-green-50 text-green-600 hover:bg-green-100"
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
                              title={isSelected ? "View user details" : "Select user to enable"}
                            >
                              <FaEye />
                              View
                            </button>
                            
                            {/* Edit Button */}
                            <button
                              onClick={() => handleEditUser(user._id)}
                              disabled={!isSelected}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                isSelected
                                  ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
                              title={isSelected ? "Edit user" : "Select user to enable"}
                            >
                              <FaEdit />
                              Edit
                            </button>
                            
                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              disabled={!isSelected}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                isSelected
                                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
                              title={isSelected ? "Delete user" : "Select user to enable"}
                            >
                              <FaTrash />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Component */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={filteredUsers.length}
          />
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, userId: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={logoutModal}
        onClose={() => setLogoutModal(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to login again to access the dashboard."
        confirmText="Logout"
        cancelText="Cancel"
        type="danger"
        icon={<FaSignOutAlt className="text-red-600 mb-4" />}
      />

      {/* Preview Modal */}
      {previewModal.show && (
        <PreviewModal
          preview={previewModal}
          onClose={() => setPreviewModal({ show: false, src: null, type: null })}
        />
      )}

      {/* View User Modal */}
      <ModalContainer
        isOpen={viewModal.show}
        onClose={handleViewModalClose}
        title="User Details"
        size="large"
      >
        {selectedUserData && (
          <ViewUser user={selectedUserData} onClose={handleViewModalClose} />
        )}
      </ModalContainer>

      {/* Edit User Modal */}
      <ModalContainer
        isOpen={editModal.show}
        onClose={handleEditModalClose}
        title="Edit User"
        size="large"
      >
        {selectedUserData && (
          <EditUser 
            user={selectedUserData} 
            onClose={handleEditModalClose}
            onSuccess={handleEditSuccess}
          />
        )}
      </ModalContainer>
    </div>
  );
};

export default UserGrid;