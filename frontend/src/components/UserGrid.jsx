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
  FaLock
} from "react-icons/fa";
import ConfirmationModal from "./ConfirmationModal";

const ROWS_PER_PAGE = 10;

const UserGrid = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState({ show: false, userId: null });

  /* =========================
     FETCH USERS FROM BACKEND
  ========================= */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetching users...");
      const res = await userAPI.getAllUsers();
      console.log("✅ Users fetched:", res.data.count || res.data.data?.length);
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
      setPage(1);
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
    console.log("Token (first 50 chars):", token?.substring(0, 50) + "...");
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        console.log("Token payload:", payload);
        console.log("Token expires:", new Date(payload.exp * 1000));
        console.log("Current time:", new Date());
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
  const handleViewUser = (userId) => {
    if (!isUserSelected(userId)) {
      toast.error("Please select the user first");
      return;
    }
    console.log("📱 Clicked View for user:", userId);
    navigate(`/grid/view/${userId}`);
  };

  const handleEditUser = (userId) => {
    if (!isUserSelected(userId)) {
      toast.error("Please select the user first");
      return;
    }
    console.log("✏️ Clicked Edit for user:", userId);
    navigate(`/grid/edit/${userId}`);
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
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete user");
    } finally {
      setDeleteModal({ show: false, userId: null });
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
              <button
                onClick={fetchUsers}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Refresh
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
                            <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200">
                              <img
                                src={user.profileImage}
                                alt="Profile"
                                className={`w-full h-full object-cover transition-opacity ${
                                  isSelected ? "cursor-pointer hover:opacity-90" : "opacity-70"
                                }`}
                                onClick={() => isSelected && window.open(user.profileImage, "_blank")}
                              />
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
                            <button
                              onClick={() => isSelected && window.open(user.document, "_blank")}
                              className={`w-16 h-16 rounded-lg border-2 flex flex-col items-center justify-center transition-colors ${
                                isSelected 
                                  ? "border-gray-200 bg-red-50 hover:bg-red-100 cursor-pointer"
                                  : "border-gray-200 bg-gray-100 cursor-not-allowed opacity-70"
                              }`}
                              title={isSelected ? "View PDF" : "Select user to view PDF"}
                              disabled={!isSelected}
                            >
                              <FaFilePdf className={`w-8 h-8 mb-1 ${isSelected ? 'text-red-600' : 'text-gray-400'}`} />
                              <span className={`text-xs ${isSelected ? 'text-red-600' : 'text-gray-400'}`}>
                                View PDF
                              </span>
                            </button>
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

          {/* Pagination */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-8 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl">
            <div className="text-sm text-gray-600">
              Showing {((page - 1) * ROWS_PER_PAGE) + 1} to {Math.min(page * ROWS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
            </div>
            
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaChevronLeft />
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-lg transition-colors ${
                      page === pageNum
                        ? "bg-primary-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
              
              <button
                disabled={page === totalPages || totalPages === 0}
                onClick={() => setPage(page + 1)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <FaChevronRight />
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              Page {page} of {totalPages || 1}
            </div>
          </div>
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
    </div>
  );
};

export default UserGrid;