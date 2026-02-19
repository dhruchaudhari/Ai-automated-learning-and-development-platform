import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { userAPI, degreeOptionAPI, advertisementAPI } from "../utils/api";
import { toast } from "react-hot-toast";
import { calculateActivationDuration, formatDuration } from "../utils/durationUtils";
import { DEGREE_SPECIALIZATIONS } from "../utils/constants";

import {
  FaEye,
  FaEdit,
  FaTrash,
  FaUser,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaChevronUp,
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
  FaUsers,
  FaChartBar,
  FaArrowRight,
  FaTimesCircle,
  FaGraduationCap,
  FaCog,
  FaBullhorn,
  FaFileAlt
} from "react-icons/fa";
import { format, parseISO, subDays, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import ConfirmationModal from "./ConfirmationModal";
import PreviewModal from "./PreviewModal";
import ModalContainer from "./ModalContainer";
import ViewUser from "./ViewUser";
import EditUser from "./EditUser";
import FilterPanel from "./FilterPanel";
import ManageDegreesModal from "./ManageDegreesModal";
import ManageAdvertisementsModal from "./ManageAdvertisementsModal";
import AdDetailsModal from "./AdDetailsModal";
import { useUserContext } from "../context/UserContext";
import { useAuth } from "../context/AuthContext";

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



// Filter Helper Function
const applyFilters = (users, searchTerm, filters) => {
  let result = [...users].filter(user => user.role !== 'admin');

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

  if (filters.dateRange?.startDate && filters.dateRange?.endDate) {
    result = result.filter(user => {
      const userDate = new Date(user.createdAt);
      return isWithinInterval(userDate, {
        start: filters.dateRange.startDate,
        end: filters.dateRange.endDate
      });
    });
  }

  if (filters.approvalStatus && !filters.ignoreStatusInBase) {
    result = result.filter(user => (user.status || 'pending') === filters.approvalStatus);
  }

  if (filters.passoutYear) {
    const targetYear = parseInt(filters.passoutYear);
    const mode = filters.passoutYearMode || 'exact';
    result = result.filter(user => {
      const gradYear = user.education?.graduation?.passingYear;
      if (!gradYear) return false;
      const year = parseInt(gradYear);
      if (mode === 'before') return year < targetYear;
      if (mode === 'after') return year > targetYear;
      return year === targetYear;
    });
  }

  if (filters.minPercentage) {
    const minPct = parseFloat(filters.minPercentage);
    result = result.filter(user => {
      const gradPct = user.education?.graduation?.percentage;
      return gradPct && parseFloat(gradPct) >= minPct;
    });
  }

  if (filters.degree && filters.degree.length > 0) {
    result = result.filter(user => {
      const gradDegree = user.education?.graduation?.degree;
      const qualDegree = user.education?.qualifyingDegree?.degree;
      return filters.degree.includes(gradDegree) || filters.degree.includes(qualDegree);
    });
  }

  if (filters.specialization && filters.specialization.length > 0) {
    result = result.filter(user => {
      const gradSpec = user.education?.graduation?.specialization;
      const qualSpec = user.education?.qualifyingDegree?.specialization;
      return filters.specialization.includes(gradSpec) || filters.specialization.includes(qualSpec);
    });
  }

  if (filters.advertisement) {
    result = result.filter(user => user.advertisement?._id === filters.advertisement || user.advertisement === filters.advertisement);
  }

  return result;
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
                className={`w-10 h-10 rounded-lg transition-colors flex items-center justify-center ${currentPage === pageNum
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
  const { users, setUsers, selectedUsers, setSelectedUsers, refreshUsers, isInterviewMode, setIsInterviewMode } = useUserContext();
  const { isAdmin } = useAuth();

  const [filteredUsers, setFilteredUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isGridCollapsed, setIsGridCollapsed] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, userId: null });
  const [previewModal, setPreviewModal] = useState({ show: false, src: null, type: null });
  const [logoutModal, setLogoutModal] = useState(false);
  const [activationModal, setActivationModal] = useState({ show: false, userId: null, currentStatus: false, userName: null });
  const [viewModal, setViewModal] = useState({ show: false, userId: null });
  const [editModal, setEditModal] = useState({ show: false, userId: null });
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [manageDegreeModal, setManageDegreeModal] = useState(false);
  const [manageAdModal, setManageAdModal] = useState(false);
  const [adViewModal, setAdViewModal] = useState({ show: false, ad: null });
  const [degreeOptions, setDegreeOptions] = useState([]);
  const [advertisements, setAdvertisements] = useState([]);

  // Dynamic degree specialization map
  const degreeSpecMap = useMemo(() => {
    const map = {};
    degreeOptions.forEach(opt => {
      map[opt.name] = opt.specializations || [];
    });
    // Fallback to constants if no degrees in DB yet
    return Object.keys(map).length > 0 ? map : DEGREE_SPECIALIZATIONS;
  }, [degreeOptions]);

  const fetchDegreeOptions = async () => {
    try {
      const res = await degreeOptionAPI.getAll();
      setDegreeOptions(res.data.data || []);
    } catch (err) {
      console.error('Failed to load degree options in grid', err);
    }
  };

  const fetchAdvertisements = async () => {
    try {
      const res = await advertisementAPI.getAll();
      setAdvertisements(res.data.data || []);
    } catch (err) {
      console.error('Failed to load advertisements in grid', err);
    }
  };

  useEffect(() => {
    fetchDegreeOptions();
    fetchAdvertisements();
  }, []);
  const [filters, setFilters] = useState({
    gender: '',
    dateRange: { value: '', startDate: null, endDate: null },
    approvalStatus: '',
    passoutYear: '',
    passoutYearMode: 'exact',
    minPercentage: '',
    degree: [],
    specialization: [],
    advertisement: ''
  });
  const [sortBy, setSortBy] = useState('latest');
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch users on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Use admin API to get all users
        const res = await userAPI.getAdminUsers();
        const usersWithActivation = res.data.data
          .filter(user => user.role !== 'admin')
          .map(user => ({
            ...user,
            activationHistory: user.activationHistory || []
          }));
        setUsers(usersWithActivation);
      } catch (err) {
        console.error("Error fetching users:", err);
        toast.error("Failed to load users. You may not have admin access.");
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
    let result = applyFilters(users, searchTerm, filters);

    if (isInterviewMode) {
      result = result.filter(user => user.status === 'eligible');
    }

    result.sort((a, b) => {
      const activationA = calculateActivationDuration(a.activationHistory);
      const activationB = calculateActivationDuration(b.activationHistory);

      switch (sortBy) {
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
  }, [users, searchTerm, filters, sortBy, isInterviewMode]);

  // Qualification matched users (ignores the approval status filter)
  // This is used for bulk actions to ensure they affect the intended set of users
  const qualificationMatchedUsers = useMemo(() => {
    return applyFilters(users, searchTerm, { ...filters, ignoreStatusInBase: true });
  }, [users, searchTerm, filters]);

  // Calculate filter counts for each option
  const filterCounts = useMemo(() => {
    if (users.length === 0) return {};

    const counts = {
      gender: {},
      approvalStatus: {},
      total: filteredUsers.length
    };

    // Gender counts (facet)
    ['', 'Male', 'Female', 'Other'].forEach(g => {
      counts.gender[g] = applyFilters(users, searchTerm, { ...filters, gender: g }).length;
    });

    // Approval status counts (facet)
    ['', 'pending', 'approved', 'eligible', 'rejected'].forEach(s => {
      counts.approvalStatus[s] = applyFilters(users, searchTerm, { ...filters, approvalStatus: s }).length;
    });

    // Degree facet counts
    const optionsToCount = degreeOptions.length > 0
      ? degreeOptions.map(d => d.name)
      : [
        "Bachelor Technology / Bachelor Engineering",
        "Bachelor of Computer Applications (BCA)",
        "Bachelor of Science",
        "Master of Technology / Master of Engineering (M.Tech / M.E.)",
        "Master of Computer Applications (MCA)",
        "Master of Science (M.Sc.)"
      ];

    counts.degrees = {};
    optionsToCount.forEach(d => {
      // Calculate count if this was the ONLY degree selected (facet style)
      counts.degrees[d] = applyFilters(users, searchTerm, { ...filters, degree: [d] }).length;
    });

    // Specialization facet counts
    counts.specializations = {};
    Object.values(degreeSpecMap).flat().forEach(s => {
      // Calculate count if this was the ONLY specialization selected (facet style)
      counts.specializations[s] = applyFilters(users, searchTerm, { ...filters, specialization: [s] }).length;
    });

    // Advertisement counts
    if (filters.advertisement) {
      counts.advertisement = applyFilters(users, searchTerm, filters).length;
    }

    return counts;
  }, [users, searchTerm, filters, filteredUsers.length, degreeSpecMap]);

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

  const handleClearFilters = (newStatus = '') => {
    // If called directly as an event handler, newStatus will be an event object
    const status = (typeof newStatus === 'string') ? newStatus : '';

    setFilters({
      gender: '',
      dateRange: { value: '', startDate: null, endDate: null },
      approvalStatus: status,
      passoutYear: '',
      passoutYearMode: 'exact',
      minPercentage: '',
      degree: [],
      specialization: [],
      advertisement: ''
    });
    setSortBy('latest');
    setSearchTerm('');
    if (!status || status === '') {
      toast.success('All filters cleared');
    }
  };

  const handleViewUser = async (userId) => {
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

  const handleViewAd = (ad) => {
    setAdViewModal({ show: true, ad });
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

  // Admin approve user
  const handleApproveUser = async (userId) => {
    try {
      const response = await userAPI.approveUser(userId);
      if (response.data.success) {
        toast.success('User approved successfully!');
        // Update local state
        setUsers(prev => prev.map(user =>
          user._id === userId ? { ...user, status: 'approved' } : user
        ));
      }
    } catch (err) {
      console.error('Approve error:', err);
      toast.error('Failed to approve user');
    }
  };

  // Admin reject user
  const handleRejectUser = async (userId) => {
    try {
      const response = await userAPI.rejectUser(userId);
      if (response.data.success) {
        toast.success('User rejected');
        // Update local state
        setUsers(prev => prev.map(user =>
          user._id === userId ? { ...user, status: 'rejected' } : user
        ));
      }
    } catch (err) {
      console.error('Reject error:', err);
      toast.error('Failed to reject user');
    }
  };

  // Admin set user to pending
  const handleSetPending = async (userId) => {
    try {
      const response = await userAPI.setPendingUser(userId);
      if (response.data.success) {
        toast.success('User status set to pending');
        // Update local state
        setUsers(prev => prev.map(user =>
          user._id === userId ? { ...user, status: 'pending' } : user
        ));
      }
    } catch (err) {
      console.error('Set pending error:', err);
      toast.error('Failed to set user status to pending');
    }
  };

  // Admin set user to eligible
  const handleSetEligible = async (userId) => {
    try {
      const response = await userAPI.setEligibleUser(userId);
      if (response.data.success) {
        toast.success('User marked as eligible!');
        setUsers(prev => prev.map(user =>
          user._id === userId ? { ...user, status: 'eligible' } : user
        ));
      }
    } catch (err) {
      console.error('Set eligible error:', err);
      toast.error('Failed to mark user as eligible');
    }
  };

  // Bulk reject users not matching qualification filters
  const handleBulkReject = async () => {
    // Get users not in qualification matched list (non-matching qualifications)
    const matchedIds = new Set(qualificationMatchedUsers.map(u => u._id));
    // Filter out admins and those who are already rejected (optional, but cleaner)
    const nonMatchingUsers = users.filter(u => !matchedIds.has(u._id) && u.role !== 'admin' && u.status !== 'rejected');

    if (nonMatchingUsers.length === 0) {
      toast.error('No non-matching users found to reject');
      return;
    }

    const userIds = nonMatchingUsers.map(u => u._id);

    try {
      const response = await userAPI.bulkRejectUsers(userIds, 'Bulk rejected - did not meet filter criteria');
      if (response.data.success) {
        toast.success(`${response.data.modifiedCount} users rejected`);
        // Update local state
        setUsers(prev => prev.map(user =>
          userIds.includes(user._id) ? { ...user, status: 'rejected' } : user
        ));
        // SWITCH to rejected status filter but KEEP other active filters
        setFilters(prev => ({ ...prev, approvalStatus: 'rejected' }));
      }
    } catch (err) {
      console.error('Bulk reject error:', err);
      toast.error('Failed to bulk reject users');
    }
  };

  // Bulk mark filtered users as eligible
  const handleBulkEligible = async () => {
    if (filteredUsers.length === 0) {
      toast.error('No users found in current filtered view to mark as eligible');
      return;
    }

    // Filter out admins and those already eligible
    const targetUsers = filteredUsers.filter(u => u.role !== 'admin' && u.status !== 'eligible');
    if (targetUsers.length === 0) {
      toast.error('All filtered users are already eligible or are admins');
      return;
    }

    const userIds = targetUsers.map(u => u._id);

    try {
      const response = await userAPI.bulkEligibleUsers(userIds, 'Bulk marked as eligible - from filtered view');
      if (response.data.success) {
        toast.success(`${response.data.modifiedCount} users marked as eligible`);
        // Update local state
        setUsers(prev => prev.map(user =>
          userIds.includes(user._id) ? { ...user, status: 'eligible' } : user
        ));
        // SWITCH to eligible status filter but KEEP other active filters
        setFilters(prev => ({ ...prev, approvalStatus: 'eligible' }));
      }
    } catch (err) {
      console.error('Bulk eligible error:', err);
      toast.error('Failed to bulk mark users as eligible');
    }
  };

  // Bulk mark filtered users as pending
  const handleBulkPending = async () => {
    // We only target users currently displayed in the filteredView (filteredUsers)
    // and filter out those who are already pending or are admins
    const targetUsers = filteredUsers.filter(u => u.role !== 'admin' && (u.status || 'pending') !== 'pending');

    if (targetUsers.length === 0) {
      if (filteredUsers.some(u => (u.status || 'pending') === 'pending')) {
        toast.error('All users in this filtered view are already pending');
      } else {
        toast.error('No users found in current filtered view to mark as pending');
      }
      return;
    }

    const userIds = targetUsers.map(u => u._id);
    console.log(`Bulk pending: targetting ${userIds.length} users out of ${filteredUsers.length} filtered users`);

    try {
      const response = await userAPI.bulkPendingUsers(userIds, 'Bulk marked as pending - from filtered view');
      if (response.data.success) {
        const modifiedCount = response.data.modifiedCount || userIds.length;
        toast.success(`${modifiedCount} users marked as pending`);

        // Update local state for ONLY the affected users
        setUsers(prev => prev.map(user =>
          userIds.includes(user._id) ? { ...user, status: 'pending' } : user
        ));

        // SWITCH to pending status filter but KEEP other active filters
        // This provides better feedback as users see the rows update but stay in view
        setFilters(prev => ({ ...prev, approvalStatus: 'pending' }));
      }
    } catch (err) {
      console.error('Bulk pending error:', err);
      toast.error('Failed to bulk mark users as pending');
    }
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'eligible':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const stats = useMemo(() => {
    const allNonAdmin = users.filter(u => u.role !== 'admin');
    const total = allNonAdmin.length;
    const filtered = filteredUsers.length;

    const countByStatus = (list) => ({
      eligible: list.filter(u => u.status === 'eligible').length,
      approved: list.filter(u => u.status === 'approved').length,
      pending: list.filter(u => !u.status || u.status === 'pending').length,
      rejected: list.filter(u => u.status === 'rejected').length,
    });

    return {
      total,
      filtered,
      totalByStatus: countByStatus(allNonAdmin),
      filteredByStatus: countByStatus(filteredUsers),
      activeUsers: allNonAdmin.filter(u => calculateActivationDuration(u.activationHistory || []).active).length,
    };
  }, [users, filteredUsers]);

  return (
    <div className="min-h-screen py-8 px-4 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 animate-slide-down">
          <h1 className="text-4xl md:text-5xl font-normal text-gray-800 mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            {isInterviewMode ? "Interview Scheduling for Eligible Candidates" : "Application screening for eligibility"}
          </h1>
          {/* <p className="text-gray-600 text-lg">Application screening for eligibility</p> */}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          {!isInterviewMode && (
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64 md:w-80 font-normal"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => handleClearFilters('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-normal"
                  title="Refresh user list"
                >
                  <FaRedo className="text-primary-600" />
                  Refresh
                </button>

                {isAdmin && (
                  <button
                    onClick={() => setManageAdModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-normal"
                    title="Manage Advertisements"
                  >
                    <FaFileAlt />
                    Advertisements
                  </button>
                )}

                <button
                  onClick={() => setLogoutModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-normal"
                  title="Logout from application"
                >
                  <FaPowerOff />
                  Logout
                </button>
              </div>
            </div>
          )}

          {!isInterviewMode && (
            <div className="flex justify-end mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-normal">Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-normal"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
          )}

          {!isInterviewMode && (
            <div className="mb-4 p-4 bg-gradient-to-r from-slate-50 via-white to-slate-50 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <FaFilter className="text-primary-500" />
                  <span className="font-normal text-gray-800 text-base">
                    {stats.filtered}
                  </span>
                  <span className="text-gray-500 font-normal">filtered from</span>
                  <span className="font-normal text-gray-800 text-base">
                    {stats.total}
                  </span>
                  <span className="text-gray-500 font-normal">total</span>
                </div>

                <div className="hidden sm:block w-px h-6 bg-gray-300" />

                {[
                  { key: 'eligible', label: 'Eligible', color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200' },
                  { key: 'approved', label: 'Approved', color: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' },
                  { key: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200' },
                  { key: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' },
                ].map(({ key, label, color }) => (
                  <button
                    key={key}
                    onClick={() => handleClearFilters(key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal border transition-all active:scale-95 ${color}`}
                    title={`View all ${label} users`}
                  >
                    {label}
                    <span className="font-normal">{stats.filteredByStatus[key]}</span>
                    <span className="text-[10px] font-normal opacity-70">/ {stats.totalByStatus[key]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isInterviewMode && (
            <FilterPanel
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              onSortChange={handleSortChange}
              sortBy={sortBy}
              users={users}
              filteredUsers={filteredUsers}
              qualificationMatchedUsers={qualificationMatchedUsers}
              onBulkReject={handleBulkReject}
              onBulkEligible={handleBulkEligible}
              onBulkPending={handleBulkPending}
              filterCounts={filterCounts}
              degreeOptions={degreeOptions}
              degreeSpecMap={degreeSpecMap}
              advertisements={advertisements}
              onManageDegrees={() => setManageDegreeModal(true)}
              isAdmin={isAdmin}
            />
          )}

          {isInterviewMode && (
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm animate-slide-down">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setIsInterviewMode(false);
                    setIsGridCollapsed(false);
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all duration-200 font-normal text-sm shadow-md focus:outline-none focus:ring-4 focus:ring-red-500/20 active:scale-95 border-2 border-transparent select-none cursor-pointer"
                  style={{
                    backgroundColor: '#8b0000',
                    color: '#ffffff'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ff0000';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#8b0000';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#ff0000';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <FaArrowRight className="rotate-180" />
                  Return
                </button>
                <div className="h-8 w-px bg-blue-200 hidden md:block"></div>
                <div className="flex items-center gap-2 text-sm text-blue-800 font-normal">
                  <span className="px-2 py-1 bg-blue-100 rounded-md border border-blue-200 font-normal">
                    {stats.totalByStatus.eligible} Eligible
                  </span>
                  <span className="font-normal opacity-70">from</span>
                  <span className="px-2 py-1 bg-white rounded-md border border-blue-100 font-normal">
                    {stats.total} Total
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsGridCollapsed(!isGridCollapsed)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary-700 rounded-lg hover:bg-primary-50 transition-all font-normal text-sm border border-primary-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                {isGridCollapsed ? <FaChevronDown /> : <FaChevronUp />}
                {isGridCollapsed ? "Expand List" : "Collapse List"}
              </button>
            </div>
          )}

          {!isGridCollapsed && (
            <>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-primary-100 to-secondary-100">
                    <tr>
                      <th className="py-4 px-6 text-left font-normal">Name & Details</th>
                      <th className="py-4 px-6 text-left w-48 font-normal">Registration Date</th>
                      <th className="py-4 px-6 text-left w-32 font-normal">Gender</th>
                      <th className="py-4 px-6 text-left w-32 font-normal">Profile Image</th>
                      <th className="py-4 px-6 text-left w-44 font-normal">Education</th>
                      <th className="py-4 px-6 text-left w-40 font-normal">Advertisement</th>
                      <th className="py-4 px-6 text-left w-32 font-normal">Status</th>
                      <th className="py-4 px-6 text-left w-80 font-normal">Actions</th>
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
                        const registrationDate = formatDateTime(user.createdAt);

                        return (
                          <tr
                            key={user._id}
                            className="border-t border-gray-200 transition-all duration-300 hover:bg-gray-50 font-normal"
                          >
                            {/* Name & Details */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center font-normal bg-gradient-to-br from-primary-500 to-secondary-500 text-white">
                                  {user.fullName?.charAt(0) || "U"}
                                </div>
                                <div>
                                  <p className="font-normal text-gray-800">{user.fullName}</p>
                                  <p className="text-sm text-gray-500 font-normal">{user.email}</p>
                                  <p className="text-xs text-gray-400 mt-1 font-normal">{user.mobile}</p>
                                </div>
                              </div>
                            </td>

                            {/* Registration Date */}
                            <td className="py-4 px-6">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2 text-gray-700">
                                  <FaCalendarAlt className="text-primary-500" />
                                  <span className="font-normal">{registrationDate.date}</span>
                                </div>
                                <div className="text-sm text-gray-500 mt-1 font-normal">
                                  {registrationDate.time}
                                </div>
                              </div>
                            </td>

                            {/* Gender */}
                            <td className="py-4 px-6">
                              <div className="flex flex-col items-start">
                                <div className="flex items-center gap-2 mb-1 font-normal">
                                  {getGenderIcon(user.gender)}
                                  {getGenderDisplay(user.gender)}
                                </div>
                              </div>
                            </td>

                            {/* Profile Image */}
                            <td className="py-4 px-6">
                              {user.profileImage ? (
                                <div
                                  onClick={() => openImagePreview(user.profileImage)}
                                  className="w-12 h-12 rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-primary-400 transition-all"
                                >
                                  <img
                                    src={user.profileImage}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                  <FaImage className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                            </td>

                            {/* Education Display */}
                            <td className="py-4 px-6">
                              <div className="flex flex-col">
                                <span className="text-sm font-normal text-primary-700">
                                  {user.education?.qualifyingDegree?.degree || user.education?.graduation?.degree || 'N/A'}
                                </span>
                                {user.education?.graduation?.passingYear && (
                                  <span className="text-[11px] text-gray-500 font-normal">
                                    Passout: {user.education.graduation.passingYear}
                                  </span>
                                )}
                                {user.education?.graduation?.percentage && (
                                  <span className="text-[11px] text-gray-500 font-normal">
                                    Percentage: {user.education.graduation.percentage}%
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Advertisement */}
                            <td className="py-4 px-6">
                              {user.advertisement ? (
                                <div className="flex flex-col gap-1">
                                  <p className="text-xs font-normal text-purple-700 truncate max-w-[150px] tracking-wider" title={user.advertisement.title}>
                                    {user.advertisement.title}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleViewAd(user.advertisement)}
                                      className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 hover:bg-purple-200 cursor-pointer border border-purple-200 transition-all shadow-sm"
                                      title="View Advertisement Details"
                                    >
                                      <FaBullhorn size={14} />
                                    </button>
                                    {user.advertisement.detail && (
                                      <button
                                        onClick={() => openDocumentPreview(user.advertisement.detail)}
                                        className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600 hover:bg-red-200 cursor-pointer border border-red-200 transition-all shadow-sm"
                                        title="View Advertisement PDF"
                                      >
                                        <FaFilePdf size={14} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[10px] text-gray-400 font-normal tracking-widest italic">Not Assigned</span>
                              )}
                            </td>

                            {/* Status Badge */}
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1 rounded-full text-xs font-normal border shadow-sm ${getStatusBadge(user.status)}`}>
                                {(user.status || 'pending')}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-6">
                              <div className="flex flex-wrap gap-2">
                                {(!user.status || user.status === 'pending') && (
                                  <>
                                    <button
                                      onClick={() => handleApproveUser(user._id)}
                                      className="px-3 py-1.5 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors font-normal"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleRejectUser(user._id)}
                                      className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors font-normal"
                                    >
                                      Reject
                                    </button>
                                    <button
                                      onClick={() => handleSetEligible(user._id)}
                                      className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors font-normal"
                                    >
                                      Eligible
                                    </button>
                                  </>
                                )}
                                {user.status === 'approved' && (
                                  <>
                                    <button
                                      onClick={() => handleSetPending(user._id)}
                                      className="px-3 py-1.5 bg-yellow-500 text-white text-xs rounded-lg hover:bg-yellow-600 transition-colors font-normal"
                                    >
                                      Set Pending
                                    </button>
                                    <button
                                      onClick={() => handleRejectUser(user._id)}
                                      className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors font-normal"
                                    >
                                      Reject
                                    </button>
                                    <button
                                      onClick={() => handleSetEligible(user._id)}
                                      className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors font-normal"
                                    >
                                      Eligible
                                    </button>
                                  </>
                                )}
                                {user.status === 'rejected' && (
                                  <>
                                    <button
                                      onClick={() => handleSetPending(user._id)}
                                      className="px-3 py-1.5 bg-yellow-500 text-white text-xs rounded-lg hover:bg-yellow-600 transition-colors font-normal"
                                    >
                                      Set Pending
                                    </button>
                                    <button
                                      onClick={() => handleApproveUser(user._id)}
                                      className="px-3 py-1.5 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors font-normal"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleSetEligible(user._id)}
                                      className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors font-normal"
                                    >
                                      Eligible
                                    </button>
                                  </>
                                )}
                                {user.status === 'eligible' && (
                                  <>
                                    <button
                                      onClick={() => handleApproveUser(user._id)}
                                      className="px-3 py-1.5 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors font-normal"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleRejectUser(user._id)}
                                      className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors font-normal"
                                    >
                                      Reject
                                    </button>
                                    <button
                                      onClick={() => handleSetPending(user._id)}
                                      className="px-3 py-1.5 bg-yellow-500 text-white text-xs rounded-lg hover:bg-yellow-600 transition-colors font-normal"
                                    >
                                      Set Pending
                                    </button>
                                  </>
                                )}
                                {user.document && (
                                  <button
                                    onClick={() => openDocumentPreview(user.document)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600 transition-colors font-normal"
                                    title="View Resume"
                                  >
                                    <FaFilePdf /> Resume
                                  </button>
                                )}
                                <button
                                  onClick={() => handleViewUser(user._id)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors font-normal"
                                >
                                  <FaEye /> Preview
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

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={filteredUsers.length}
                rowsPerPage={rowsPerPage}
              />
            </>
          )}

          {!isInterviewMode && (
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 font-normal">
                <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md border border-blue-100 font-normal">
                  {stats.totalByStatus.eligible} Eligible
                </span>
                <span className="font-normal">from</span>
                <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-md border border-gray-100 font-normal">
                  {stats.total} Total
                </span>
              </div>

              <button
                onClick={() => {
                  if (!isInterviewMode) {
                    setIsInterviewMode(true);
                    setIsGridCollapsed(true);
                  } else {
                    setIsInterviewMode(false);
                    setIsGridCollapsed(false);
                  }
                }}
                className={`
                    px-8 py-3 rounded-xl transition-all duration-300 font-normal shadow-lg hover:shadow-xl active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2
                    ${isInterviewMode
                    ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-blue-600 hover:to-blue-700 focus:ring-pink-500'
                    : 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:from-blue-600 hover:to-blue-700 focus:ring-pink-500'
                  }
                  `}
                style={{
                  border: '1px solid transparent'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#8b0000';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'transparent';
                }}
              >
                {isInterviewMode ? "Return to Screening" : "Confirm for Eligibility"}
              </button>
            </div>
          )}
        </div>
      </div >

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

      {
        previewModal.show && (
          <PreviewModal
            preview={previewModal}
            onClose={() => setPreviewModal({ show: false, src: null, type: null })}
          />
        )
      }

      <ModalContainer
        isOpen={viewModal.show}
        onClose={handleViewModalClose}
        title="User Details"
        size="large"
      >
        {selectedUserData && (
          <ViewUser
            user={selectedUserData}
            onClose={handleViewModalClose}
            onApprove={handleApproveUser}
            onReject={handleRejectUser}
            onViewDocument={openDocumentPreview}
            onViewImage={openImagePreview}
          />
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

      <ManageDegreesModal
        isOpen={manageDegreeModal}
        onClose={() => setManageDegreeModal(false)}
        onRefresh={fetchDegreeOptions}
      />

      <ManageAdvertisementsModal
        isOpen={manageAdModal}
        onClose={() => setManageAdModal(false)}
      />

      <AdDetailsModal
        isOpen={adViewModal.show}
        onClose={() => setAdViewModal({ show: false, ad: null })}
        advertisement={adViewModal.ad}
        onViewDocument={openDocumentPreview}
      />
    </div >
  );
};

export default UserGrid;