import React, { useEffect, useState, useMemo } from "react";
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
  FaCalendarAlt,
  FaMars,
  FaVenus,
  FaTransgender,
  FaGenderless,
  FaClock,
  FaPowerOff,
  FaRedo,
  FaToggleOn,
  FaToggleOff,
  FaLock,
  FaCalendarTimes,
  FaFilter,
  FaTrashAlt,
  FaToggleOn as FaToggleOnIcon,
  FaToggleOff as FaToggleOffIcon,
  FaUsers,
  FaChartBar,
  FaArrowRight
} from "react-icons/fa";
import { format, parseISO, subDays, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import ConfirmationModal from "./ConfirmationModal";
import PreviewModal from "./PreviewModal";
import ModalContainer from "./ModalContainer";
import ViewUser from "./ViewUser";
import EditUser from "./EditUser";
import { useUserContext } from "../context/UserContext";

// Helper functions
const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = parseISO(dateString);
    return {
      date: format(date, "dd/MMM/yyyy"),
      time: format(date, "hh:mm a"),
      fullDate: date,
      iso: date.toISOString(),
      timestamp: date.getTime()
    };
  } catch {
    return { date: "Invalid Date", time: "", fullDate: null, iso: null, timestamp: null };
  }
};

const getGenderIcon = (gender) => {
  switch (gender) {
    case 'Male': return <FaMars className="text-blue-500" />;
    case 'Female': return <FaVenus className="text-pink-500" />;
    case 'Other': return <FaTransgender className="text-purple-500" />;
    default: return <FaGenderless className="text-gray-400" />;
  }
};

const getGenderDisplay = (gender) => {
  switch (gender) {
    case 'Male': return <span className="text-blue-600 font-medium">Male</span>;
    case 'Female': return <span className="text-pink-600 font-medium">Female</span>;
    case 'Other': return <span className="text-purple-600 font-medium">Other</span>;
    default: return <span className="text-gray-500">Not specified</span>;
  }
};

export const calculateActivationDuration = (activationHistory) => {
  if (!activationHistory || activationHistory.length === 0) {
    return { active: false, totalDuration: 0, sessions: 0, lastActivation: null, todayDuration: 0 };
  }
  
  const sortedHistory = [...activationHistory].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );
  
  let totalDuration = 0;
  let sessions = 0;
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  let todayDuration = 0;
  
  for (let i = 0; i < sortedHistory.length; i += 2) {
    const start = sortedHistory[i];
    const end = sortedHistory[i + 1] || { timestamp: now.toISOString() };
    
    if (start.status === 'active') {
      const startTime = new Date(start.timestamp);
      const endTime = new Date(end.timestamp);
      
      totalDuration += endTime - startTime;
      sessions++;
      
      if (startTime <= todayEnd && endTime >= todayStart) {
        const sessionStart = startTime < todayStart ? todayStart : startTime;
        const sessionEnd = endTime > todayEnd ? todayEnd : endTime;
        
        if (sessionStart < sessionEnd) {
          todayDuration += sessionEnd - sessionStart;
        }
      }
    }
  }
  
  const lastEntry = sortedHistory[sortedHistory.length - 1];
  const isActiveNow = lastEntry && lastEntry.status === 'active';
  
  if (isActiveNow && lastEntry) {
    const liveStart = new Date(lastEntry.timestamp);
    const liveDuration = now - liveStart;
    totalDuration += liveDuration;
    todayDuration += liveDuration;
  }
  
  return {
    active: isActiveNow,
    totalDuration,
    sessions,
    lastActivation: sortedHistory.length > 0 ? new Date(sortedHistory[sortedHistory.length - 1].timestamp) : null,
    todayDuration
  };
};

export const formatDuration = (milliseconds) => {
  if (!milliseconds || milliseconds <= 0) return "0s";
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

const LiveTimer = ({ startTime, className = "" }) => {
  const [elapsed, setElapsed] = useState(0);
  
  useEffect(() => {
    if (!startTime) return;
    
    const updateElapsed = () => {
      const now = new Date();
      const start = new Date(startTime);
      setElapsed(now - start);
    };
    
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  
  return (
    <span className={`font-medium ${className}`}>
      {formatDuration(elapsed)}
    </span>
  );
};

// FilterPanel Component
const FilterPanel = ({ 
  filters, 
  onFilterChange, 
  onClearFilters,
  onSortChange,
  sortBy,
  users
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const genderOptions = [
    { value: '', label: 'All Genders' },
    { value: 'Male', label: 'Male', icon: <FaMars /> },
    { value: 'Female', label: 'Female', icon: <FaVenus /> },
    { value: 'Other', label: 'Other', icon: <FaTransgender /> }
  ];

  const activationOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active', icon: <FaToggleOn /> },
    { value: 'inactive', label: 'Inactive', icon: <FaToggleOff /> }
  ];

  const sortOptions = [
    { value: 'latest', label: 'Latest First', icon: <FaChevronLeft /> },
    { value: 'oldest', label: 'Oldest First', icon: <FaChevronRight /> },
    { value: 'name-asc', label: 'Name A-Z', icon: <FaChevronLeft /> },
    { value: 'name-desc', label: 'Name Z-A', icon: <FaChevronRight /> },
    { value: 'recent-active', label: 'Recently Active', icon: <FaClock /> },
    { value: 'most-active', label: 'Most Active', icon: <FaToggleOnIcon /> }
  ];

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => calculateActivationDuration(u.activationHistory || []).active).length,
    maleUsers: users.filter(u => u.gender === 'Male').length,
    femaleUsers: users.filter(u => u.gender === 'Female').length
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <FaFilter className="text-primary-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Filters & Sorting</h3>
            <p className="text-sm text-gray-500">
              {stats.totalUsers} users • {stats.activeUsers} active • {stats.maleUsers} male • {stats.femaleUsers} female
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {isOpen ? 'Hide Filters' : 'Show Filters'}
          </button>
          
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          >
            <FaTrashAlt />
            Clear All Filters
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Gender
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {genderOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => onFilterChange('gender', option.value)}
                      className={`flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg transition-all ${
                        filters.gender === option.value
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-300 shadow-sm'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Activation Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {activationOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => onFilterChange('activationStatus', option.value)}
                      className={`flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg transition-all ${
                        filters.activationStatus === option.value
                          ? option.value === 'active'
                            ? 'bg-green-100 text-green-700 border-2 border-green-300 shadow-sm'
                            : 'bg-red-100 text-red-700 border-2 border-red-300 shadow-sm'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Sort By
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {sortOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => onSortChange(option.value)}
                      className={`flex flex-col items-center justify-center gap-1 px-2 py-3 text-xs rounded-lg transition-all ${
                        sortBy === option.value
                          ? 'bg-orange-100 text-orange-700 border-2 border-orange-300 shadow-sm'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      {option.icon}
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, rowsPerPage }) => {
  const getVisiblePages = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
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
      <div className="text-sm text-gray-600">
        Showing <span className="font-semibold">{(currentPage - 1) * rowsPerPage + 1}</span> to{' '}
        <span className="font-semibold">{Math.min(currentPage * rowsPerPage, totalItems)}</span> of{' '}
        <span className="font-semibold">{totalItems}</span> users
      </div>
      
      <div className="flex items-center gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FaChevronLeft />
          Previous
        </button>
        
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
        
        <button
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => onPageChange(currentPage + 1)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <FaChevronRight />
        </button>
      </div>
      
      <div className="text-sm text-gray-600">
        Page <span className="font-semibold text-primary-600">{currentPage}</span> of{' '}
        <span className="font-semibold">{totalPages || 1}</span>
      </div>
    </div>
  );
};

// UserGrid Component
const UserGrid = () => {
  const navigate = useNavigate();
  
  // Use the custom hook to access context
  const { users, setUsers, selectedUsers, setSelectedUsers, refreshUsers } = useUserContext();
  
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState({ show: false, userId: null });
  const [previewModal, setPreviewModal] = useState({ show: false, src: null, type: null });
  const [logoutModal, setLogoutModal] = useState(false);
  const [activationModal, setActivationModal] = useState({ show: false, userId: null, currentStatus: false, userName: null });
  const [viewModal, setViewModal] = useState({ show: false, userId: null });
  const [editModal, setEditModal] = useState({ show: false, userId: null });
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [filters, setFilters] = useState({
    gender: '',
    activationStatus: '',
    dateRange: { value: '', startDate: null, endDate: null }
  });
  const [sortBy, setSortBy] = useState('latest');
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch users on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await userAPI.getAllUsers();
        const usersWithActivation = res.data.data.map(user => ({
          ...user,
          activationHistory: user.activationHistory || []
        }));
        setUsers(usersWithActivation);
      } catch (err) {
        console.error("Error fetching users:", err);
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    
    if (users.length === 0) {
      fetchData();
    }
  }, [setUsers, users.length]);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...users];

    if (searchTerm.trim() !== "") {
      result = result.filter(user =>
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.mobile?.includes(searchTerm) ||
        user.gender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatDateTime(user.createdAt).date.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.gender) {
      result = result.filter(user => user.gender === filters.gender);
    }

    if (filters.activationStatus) {
      result = result.filter(user => {
        const activation = calculateActivationDuration(user.activationHistory);
        return filters.activationStatus === 'active' ? activation.active : !activation.active;
      });
    }

    if (filters.dateRange?.startDate && filters.dateRange?.endDate) {
      result = result.filter(user => {
        const userDate = new Date(user.createdAt);
        return isWithinInterval(userDate, {
          start: filters.dateRange.startDate,
          end: filters.dateRange.endDate
        });
      });
    }

    result.sort((a, b) => {
      const activationA = calculateActivationDuration(a.activationHistory);
      const activationB = calculateActivationDuration(b.activationHistory);
      
      switch(sortBy) {
        case 'latest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'name-asc':
          return (a.fullName || '').localeCompare(b.fullName || '');
        case 'name-desc':
          return (b.fullName || '').localeCompare(a.fullName || '');
        case 'recent-active':
          if (activationA.active && !activationB.active) return -1;
          if (!activationA.active && activationB.active) return 1;
          if (activationA.lastActivation && activationB.lastActivation) {
            return new Date(activationB.lastActivation) - new Date(activationA.lastActivation);
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'most-active':
          const durationA = activationA.totalDuration + (activationA.active ? Date.now() - new Date(activationA.lastActivation).getTime() : 0);
          const durationB = activationB.totalDuration + (activationB.active ? Date.now() - new Date(activationB.lastActivation).getTime() : 0);
          return durationB - durationA;
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    setFilteredUsers(result);
    setPage(1);
  }, [users, searchTerm, filters, sortBy]);

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
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

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
  };

  const handleClearFilters = () => {
    setFilters({
      gender: '',
      activationStatus: '',
      dateRange: { value: '', startDate: null, endDate: null }
    });
    setSortBy('latest');
    setSearchTerm('');
    toast.success('All filters cleared');
  };

  const handleViewUser = async (userId) => {
    if (!isUserSelected(userId)) {
      toast.error("Please select the user first");
      return;
    }
    
    try {
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
      
      const updatedUsers = users.filter(user => user._id !== deleteModal.userId);
      setUsers(updatedUsers);
      
      setSelectedUsers(prev => prev.filter(id => id !== deleteModal.userId));
      
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

  const handleActivationToggle = (userId) => {
    if (!isUserSelected(userId)) {
      toast.error("Please select the user first");
      return;
    }
    
    const user = users.find(u => u._id === userId);
    if (!user) return;
    
    const activation = calculateActivationDuration(user.activationHistory || []);
    setActivationModal({
      show: true,
      userId,
      currentStatus: activation.active,
      userName: user.fullName
    });
  };

  const handleActivationConfirm = async () => {
    if (!activationModal.userId) return;

    try {
      const newStatus = !activationModal.currentStatus;
      const timestamp = new Date().toISOString();
      
      const updatedUsers = users.map(user => {
        if (user._id === activationModal.userId) {
          const updatedHistory = [
            ...(user.activationHistory || []),
            {
              status: newStatus ? 'active' : 'inactive',
              timestamp
            }
          ];
          return { ...user, activationHistory: updatedHistory };
        }
        return user;
      });
      
      setUsers(updatedUsers);
      toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
      
      await userAPI.updateActivationStatus(activationModal.userId, newStatus);
      
      if (selectedUserData && selectedUserData._id === activationModal.userId) {
        const user = updatedUsers.find(u => u._id === activationModal.userId);
        setSelectedUserData(user);
      }
    } catch (error) {
      console.error("Error updating activation status:", error);
      toast.error("Failed to update activation status");
    } finally {
      setActivationModal({ show: false, userId: null, currentStatus: false });
    }
  };

  const handleLogout = async () => {
    try {
      await userAPI.logout();
    } catch (err) {
      console.log("Logout API failed, proceeding with local logout");
    }
    
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const handleRefresh = () => {
    refreshUsers();
    toast.success("User list refreshed");
  };

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

  const handleViewModalClose = () => {
    setViewModal({ show: false, userId: null });
    setSelectedUserData(null);
  };

  const handleEditModalClose = () => {
    setEditModal({ show: false, userId: null });
    setSelectedUserData(null);
  };

  const handleEditSuccess = () => {
    refreshUsers();
    setEditModal({ show: false, userId: null });
    setSelectedUserData(null);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => calculateActivationDuration(u.activationHistory || []).active).length,
    maleUsers: users.filter(u => u.gender === 'Male').length,
    femaleUsers: users.filter(u => u.gender === 'Female').length,
    otherUsers: users.filter(u => u.gender === 'Other').length
  };

  return (
    <div className="min-h-screen py-8 px-4 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 animate-slide-down">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-gray-600 text-lg">Comprehensive user management system</p>
          <div className="mt-4 text-sm text-gray-500 bg-yellow-50 inline-block px-4 py-2 rounded-lg">
            <FaLock className="inline mr-2 text-yellow-500" />
            Select users to enable actions
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
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
            </div>

            <div className="flex items-center gap-4">
              <span className={`text-sm font-medium ${selectedUsers.length > 0 ? 'text-primary-600' : 'text-gray-600'}`}>
                {selectedUsers.length} selected
              </span>
              
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Refresh user list"
              >
                <FaRedo className="text-primary-600" />
                Refresh
              </button>
              
              <button
                onClick={() => navigate("/analytics")}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                title="Go to Analytics"
              >
                <FaChartBar />
                Analytics
                <FaArrowRight />
              </button>
              
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

          <div className="flex justify-end mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            onSortChange={handleSortChange}
            sortBy={sortBy}
            users={users}
          />

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
                  <th className="py-4 px-6 text-left">Name & Details</th>
                  <th className="py-4 px-6 text-left w-48">Registration Date</th>
                  <th className="py-4 px-6 text-left w-32">Gender</th>
                  <th className="py-4 px-6 text-left w-32">Profile Image</th>
                  <th className="py-4 px-6 text-left w-32">Document</th>
                  <th className="py-4 px-6 text-left w-64">Actions</th>
                  <th className="py-4 px-6 text-left w-48">Activation Status</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mb-4" />
                        <p className="text-gray-600">Loading users...</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FaUser className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-gray-600 text-lg mb-2">No users found</p>
                        <p className="text-gray-500">
                          {searchTerm || Object.values(filters).some(f => f) ? 
                            "Try adjusting your search or filters" : 
                            "No users registered yet"}
                        </p>
                        {Object.values(filters).some(f => f) && (
                          <button
                            onClick={handleClearFilters}
                            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                          >
                            Clear All Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => {
                    const isSelected = isUserSelected(user._id);
                    const registrationDate = formatDateTime(user.createdAt);
                    const activation = calculateActivationDuration(user.activationHistory || []);
                    
                    return (
                      <tr
                        key={user._id}
                        className={`border-t border-gray-200 transition-all duration-300 hover:bg-gray-50 ${
                          isSelected ? "bg-primary-50" : ""
                        }`}
                      >
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

                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold relative ${
                              isSelected 
                                ? "bg-gradient-to-br from-primary-500 to-secondary-500 text-white"
                                : "bg-gray-200 text-gray-600"
                            } ${activation.active ? 'ring-2 ring-green-500 ring-offset-1' : ''}`}>
                              {user.fullName?.charAt(0) || "U"}
                              {activation.active && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                              )}
                            </div>
                            <div>
                              <p className={`font-medium ${isSelected ? 'text-primary-700' : 'text-gray-800'}`}>
                                {user.fullName}
                                {activation.active && (
                                  <span className="ml-2 text-xs text-green-600">● Live</span>
                                )}
                              </p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                              <p className="text-xs text-gray-400 mt-1">{user.mobile}</p>
                              {activation.sessions > 0 && (
                                <p className="text-xs text-green-600 mt-1">
                                  {activation.sessions} sessions • {formatDuration(activation.totalDuration)} total
                                </p>
                              )}
                              {activation.todayDuration > 0 && (
                                <p className="text-xs text-blue-500 mt-1">
                                  Today: {formatDuration(activation.todayDuration)}
                                  {activation.active && activation.lastActivation && (
                                    <span className="ml-1">
                                      + <LiveTimer startTime={activation.lastActivation} className="text-green-600" />
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-gray-700">
                              <FaCalendarAlt className="text-primary-500" />
                              <span className="font-medium">{registrationDate.date}</span>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {registrationDate.time}
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex flex-col items-start">
                            <div className="flex items-center gap-2 mb-1">
                              {getGenderIcon(user.gender)}
                              {getGenderDisplay(user.gender)}
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-full ${
                              user.gender === 'Male' ? 'bg-blue-100 text-blue-600' :
                              user.gender === 'Female' ? 'bg-pink-100 text-pink-600' :
                              user.gender === 'Other' ? 'bg-purple-100 text-purple-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {user.gender || 'Unknown'}
                            </div>
                          </div>
                        </td>

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

                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewUser(user._id)}
                                disabled={!isSelected}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors flex-1 ${
                                  isSelected
                                    ? "bg-green-50 text-green-600 hover:bg-green-100"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                }`}
                                title={isSelected ? "View user details" : "Select user to enable"}
                              >
                                <FaEye />
                                View
                              </button>
                              
                              <button
                                onClick={() => handleEditUser(user._id)}
                                disabled={!isSelected}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors flex-1 ${
                                  isSelected
                                    ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                }`}
                                title={isSelected ? "Edit user" : "Select user to enable"}
                              >
                                <FaEdit />
                                Edit
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                disabled={!isSelected}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors flex-1 ${
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
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-2">
                              <button
                                onClick={() => handleActivationToggle(user._id)}
                                disabled={!isSelected}
                                className={`relative inline-flex items-center h-6 w-12 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                  activation.active 
                                    ? 'bg-green-500 focus:ring-green-500' 
                                    : 'bg-gray-300 focus:ring-gray-400'
                                } ${!isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
                                  activation.active ? 'animate-pulse' : ''
                                }`}
                                title={isSelected ? 
                                  (activation.active ? 'Deactivate user' : 'Activate user') : 
                                  'Select user to enable'}
                              >
                                <span className={`inline-block w-5 h-5 transform bg-white rounded-full transition-transform ${
                                  activation.active ? 'translate-x-7' : 'translate-x-1'
                                }`} />
                              </button>
                              <span className={`font-medium text-sm ${
                                activation.active ? 'text-green-600' : 'text-gray-600'
                              }`}>
                                {activation.active ? 'Active Now' : 'Inactive'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {activation.active ? (
                                <div className="flex items-center gap-1 text-green-600">
                                  <FaClock className="w-3 h-3 animate-pulse" />
                                  <LiveTimer startTime={activation.lastActivation} />
                                </div>
                              ) : (
                                <span className="flex items-center gap-1 text-gray-500">
                                  <FaCalendarTimes className="w-3 h-3" />
                                  Not active
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={filteredUsers.length}
            rowsPerPage={rowsPerPage}
          />

          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
                  <p className="text-xs text-gray-500">In database</p>
                </div>
                <FaUsers className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.activeUsers}
                  </p>
                  <p className="text-xs text-gray-500">Currently active</p>
                </div>
                <FaToggleOn className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Male Users</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.maleUsers}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.totalUsers > 0 ? Math.round((stats.maleUsers / stats.totalUsers) * 100) : 0}%
                  </p>
                </div>
                <FaMars className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-pink-50 to-pink-100 rounded-xl p-4 border border-pink-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Female Users</p>
                  <p className="text-2xl font-bold text-pink-600">
                    {stats.femaleUsers}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.totalUsers > 0 ? Math.round((stats.femaleUsers / stats.totalUsers) * 100) : 0}%
                  </p>
                </div>
                <FaVenus className="w-8 h-8 text-pink-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

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

      <ConfirmationModal
        isOpen={activationModal.show}
        onClose={() => setActivationModal({ show: false, userId: null, currentStatus: false })}
        onConfirm={handleActivationConfirm}
        title={activationModal.currentStatus ? "Deactivate User" : "Activate User"}
        message={`Are you sure you want to ${activationModal.currentStatus ? 'deactivate' : 'activate'} ${activationModal.userName || 'this user'}?`}
        confirmText={activationModal.currentStatus ? "Deactivate" : "Activate"}
        cancelText="Cancel"
        type={activationModal.currentStatus ? "warning" : "primary"}
      />

      <ConfirmationModal
        isOpen={logoutModal}
        onClose={() => setLogoutModal(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to login again to access the dashboard."
        confirmText="Logout"
        cancelText="Cancel"
        type="danger"
      />

      {previewModal.show && (
        <PreviewModal
          preview={previewModal}
          onClose={() => setPreviewModal({ show: false, src: null, type: null })}
        />
      )}

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