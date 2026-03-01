import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { userAPI, degreeOptionAPI, advertisementAPI, panelAPI, normalizationAPI } from "../utils/api";

import { toast } from "react-hot-toast";
import { calculateActivationDuration } from "../utils/durationUtils";
import { DEGREE_SPECIALIZATIONS } from "../utils/constants";

import {
  FaEye,
  FaUser,
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
  FaPowerOff,
  FaRedo,
  FaToggleOn,
  FaFilter,
  FaUsers,
  FaArrowRight,
  FaBullhorn,
  FaFileAlt,
  FaEnvelope,
  FaCheckCircle,
  FaTrashAlt,
  FaTimesCircle,
  FaClipboardList,
  FaPaperPlane,
  FaClock,
  FaInfoCircle,
  FaGraduationCap,
  FaChartLine,
  FaThList,
  FaCalendar,
  FaLightbulb,
  FaBriefcase,
  FaBuilding,
  FaUserTie,
  FaPhone,
  FaRobot
} from "react-icons/fa";
import { format, parseISO, isWithinInterval } from "date-fns";

// Stabilized Sub-components
const EmailDraftPreview = ({ user, form, selectedAdIds = [] }) => {
  if (!user) return null;

  const getAdSchedule = (adId) => {
    const adMark = user.advertisementMarks?.find(am => am.advertisementId?.toString() === adId.toString());
    return adMark?.interviewSchedule?.scheduledDate || user.interviewSchedule?.scheduledDate;
  };

  const formatDate = (date) => {
    if (!date) return 'Not scheduled';
    try {
      return new Date(date).toLocaleDateString('en-IN', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const selectedAds = (user.advertisements || [])
    .filter(ad => selectedAdIds.includes(ad._id?.toString() || ad.toString()));

  return (
    <div className="border border-indigo-100 rounded-[2.5rem] overflow-hidden bg-white flex flex-col h-full shadow-2xl shadow-indigo-200/40 sticky top-0 border-t-4 border-t-indigo-600">
      <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-indigo-800 p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/20 rounded-full -ml-12 -mb-12 blur-xl"></div>

        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 shadow-inner">
              <FaEnvelope className="text-white text-xl" />
            </div>
            <div>
              <h4 className="font-bold text-lg tracking-tight leading-none mb-1.5">Invitation Preview</h4>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-pulse"></span>
                <p className="text-[11px] text-indigo-100 font-bold tracking-wider opacity-90">Official Correspondence</p>
              </div>
            </div>
          </div>
          <span className="px-4 py-1.5 bg-white/20 backdrop-blur-xl rounded-full text-[10px] font-bold tracking-widest border border-white/20 shadow-sm">Candidate View</span>
        </div>
      </div>

      <div className="p-8 overflow-y-auto max-h-[660px] text-gray-800 text-sm leading-relaxed font-sans scrollbar-thin scrollbar-thumb-gray-200">
        <div className="text-center mb-6 relative">
          <h2 className="mt-6 font-bold text-3xl text-slate-900 tracking-tight">{user.fullName}</h2>
          <div className="flex items-center justify-center gap-3 mt-2">
            <p className="text-[11px] text-indigo-500 font-bold tracking-[0.2em]">Interview Candidate</p>
            <span className="h-[2px] w-10 bg-indigo-100 rounded-full"></span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-slate-900 font-bold text-base italic">Dear {user.fullName},</p>
            <p className="text-slate-600 leading-relaxed font-medium text-[15px]">
              We are thrilled to extend an official invitation for your upcoming interview. Your background uniquely positions you for success within our dynamic team, and we look forward to exploring your potential contributions.
            </p>
          </div>

          {selectedAds.length > 0 ? (
            <div className="bg-indigo-50/40 p-6 rounded-[2rem] border border-indigo-100 shadow-sm space-y-4">
              <h5 className="text-[11px] font-bold text-indigo-600 tracking-[0.15em] mb-4 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]"></span> Scheduled Interviews
              </h5>
              <div className="space-y-4">
                {selectedAds.map(ad => (
                  <div key={ad._id} className="flex flex-col gap-2 p-4 bg-white rounded-2xl border border-indigo-50 shadow-sm">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{ad.title}</p>
                        <p className="text-[10px] text-slate-400 font-bold tracking-wider mt-0.5">
                          {ad.deptName || ad.department?.name || 'Lavya Workshop'}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-[11px] text-indigo-600 font-black whitespace-nowrap">
                          {formatDate(getAdSchedule(ad._id))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100 text-center">
              <p className="text-rose-500 text-xs font-bold italic">Please select at least one advertisement on the left to see the schedule preview.</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="bg-white p-6 rounded-[2.5rem] border border-indigo-100 shadow-sm relative overflow-hidden group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <FaBuilding className="text-indigo-500 text-sm" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold tracking-wider mb-1 uppercase">Corporate Venue</span>
                  <div className={`text-[14px] font-bold leading-snug ${form.location ? 'text-slate-800' : 'text-rose-500/60 italic'}`}>
                    {form.location || 'Pending venue confirmation...'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-indigo-950 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group border border-indigo-900">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full -mr-20 -mb-20 blur-3xl"></div>

              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-indigo-300 tracking-widest mb-3">Concierge Support</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      <FaPhone className="text-indigo-300" />
                    </div>
                    <div>
                      <span className={`text-2xl font-bold tracking-tight block ${form.helpline ? 'text-white' : 'text-indigo-800/40 italic'}`}>
                        {form.helpline || 'Not assigned'}
                      </span>
                      <span className="text-[10px] text-indigo-400 font-bold tracking-widest mt-1 block uppercase">Primary Assistance Line</span>
                    </div>
                  </div>
                </div>
                <div className="opacity-10 group-hover:opacity-30 transition-all duration-700 -rotate-12 group-hover:rotate-0">
                  <FaLightbulb className="text-5xl" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-10 border-t border-indigo-50 text-center">
            <div className="inline-block px-6 py-2 rounded-full bg-indigo-50/50 border border-indigo-100 mb-4 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-[11px] text-indigo-600 font-bold tracking-wide">By Lavya Workshop</p>
            </div>
            <div className="flex items-center justify-center gap-6 text-[10px] text-slate-300 font-bold tracking-[0.2em] uppercase">
              <span className="hover:text-indigo-400 transition-colors cursor-default">Verified</span>
              <span className="w-1 h-1 rounded-full bg-indigo-100"></span>
              <span className="hover:text-indigo-400 transition-colors cursor-default">Encrypted</span>
              <span className="w-1 h-1 rounded-full bg-indigo-100"></span>
              <span className="hover:text-indigo-400 transition-colors cursor-default">Priority</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
import ConfirmationModal from "./ConfirmationModal";
import PreviewModal from "./PreviewModal";
import ModalContainer from "./ModalContainer";
import ViewUser from "./ViewUser";
import MeritViewDetails from "./MeritViewDetails";
import InterviewViewDetails from "./InterviewViewDetails";
import EditUser from "./EditUser";
import FilterPanel from "./FilterPanel";
import MeritFilterPanel from "./MeritFilterPanel";
import ManageDegreesModal from "./ManageDegreesModal";
import ManageAdvertisementsModal from "./ManageAdvertisementsModal";
import AdDetailsModal from "./AdDetailsModal";
import { useUserContext } from "../context/UserContext";
import { useAuth } from "../context/AuthContext";
import ManagePanelsModal from "./ManagePanelsModal";
import PanelDisplay from "./PanelDisplay";
import InterviewCalendarView from "./InterviewCalendarView";
import InterviewTimelineView from "./InterviewTimelineView";


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
    result = result.filter(user => {
      if (user.advertisements && Array.isArray(user.advertisements)) {
        return user.advertisements.some(ad => ad._id === filters.advertisement || ad === filters.advertisement);
      }
      return user.advertisement?._id === filters.advertisement || user.advertisement === filters.advertisement;
    });
  }

  // Skill Set Filters
  if (filters.skills) {
    Object.entries(filters.skills).forEach(([category, selectedSkills]) => {
      if (selectedSkills && selectedSkills.length > 0) {
        result = result.filter(user => {
          const userSkills = user.skillSets?.[category] || [];
          // If multiple skills are selected in one category, we use OR logic (does user have any of these skills?)
          return selectedSkills.some(skill => userSkills.includes(skill));
        });
      }
    });
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
  const { users, setUsers, selectedUsers, setSelectedUsers, refreshUsers, isInterviewMode, setIsInterviewMode, isMeritMode, setIsMeritMode } = useUserContext();
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
  const [panels, setPanels] = useState([]);
  const [loadingPanels, setLoadingPanels] = useState(false);
  const [managePanelModal, setManagePanelModal] = useState(false);
  const [assignPanelModal, setAssignPanelModal] = useState({ show: false, user: null });
  const [assignmentMap, setAssignmentMap] = useState({}); // { [adId]: panelId }
  const [assignmentErrors, setAssignmentErrors] = useState({}); // { [adId]: boolean }
  const [showExpertsMap, setShowExpertsMap] = useState({}); // { [adId]: boolean }

  // Interview mode modals
  const [scheduleModal, setScheduleModal] = useState({ show: false, user: null });
  const [scheduleDateInput, setScheduleDateInput] = useState("");
  const [emailConfirmModal, setEmailConfirmModal] = useState({ show: false, user: null });
  const [emailForm, setEmailForm] = useState({ location: '', helpline: '' });
  const [emailFormErrors, setEmailFormErrors] = useState({ location: '', helpline: '' });
  // Unified view modal is used instead of interviewDetailsModal
  // Merit mode modals
  const [assignMarksModal, setAssignMarksModal] = useState({ show: false, user: null, advertisement: null });
  const [marksInput, setMarksInput] = useState("");
  const [isSubmittingMarks, setIsSubmittingMarks] = useState(false);
  const [interviewViewMode, setInterviewViewMode] = useState('grid'); // 'grid' | 'calendar' | 'timeline'
  const [selectedAdsToSchedule, setSelectedAdsToSchedule] = useState([]);
  const [selectedAdsToEmail, setSelectedAdsToEmail] = useState([]);

  // Merit mode filter state
  const [meritFilters, setMeritFilters] = useState({
    advertisement: '',
    tenth: { min: '', max: '' },
    twelfth: { min: '', max: '' },
    graduation: { min: '', max: '' },
    graduationCpi: { min: '', max: '' },
    pg: { min: '', max: '' },
    pgCpi: { min: '', max: '' },
    assignedMarks: { min: '', max: '' },
    age: { min: '', max: '' },
    degree: [],
    specialization: [],
    experience: { min: '', max: '' }
  });
  const [meritSortBy, setMeritSortBy] = useState('latest');
  const [isNormalizing, setIsNormalizing] = useState(false);

  // Validation functions for Indian Context
  const validateIndiaPhone = (phone) => {
    if (!phone) return "Helpline number is required";
    if (phone.length !== 10) return "Helpline must be exactly 10 digits";
    if (!/^[6-9]/.test(phone)) return "Indian numbers must start with 6, 7, 8, or 9";
    return "";
  };

  const validateIndiaAddress = (address) => {
    if (!address) return "Interview location is required";
    if (address.length < 15) return "Address must be at least 15 characters";

    // Check for 6-digit Indian PIN code
    const pinRegex = /\b[1-9][0-9]{5}\b/;
    if (!pinRegex.test(address)) {
      return "Address must include a valid 6-digit Indian PIN code";
    }
    return "";
  };

  // Update errors as form changes
  useEffect(() => {
    if (emailConfirmModal.show) {
      setEmailFormErrors({
        location: validateIndiaAddress(emailForm.location),
        helpline: validateIndiaPhone(emailForm.helpline)
      });
    }
  }, [emailForm.location, emailForm.helpline, emailConfirmModal.show]);



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

  const fetchPanels = async () => {
    try {
      setLoadingPanels(true);
      const res = await panelAPI.getAll();
      setPanels(res.data.data || []);
    } catch (err) {
      console.error('Failed to load panels in grid', err);
    } finally {
      setLoadingPanels(false);
    }
  };

  const [filters, setFilters] = useState({
    gender: '',
    dateRange: { value: '', startDate: null, endDate: null },
    approvalStatus: '',
    passoutYear: '',
    passoutYearMode: 'exact',
    minPercentage: '',
    degree: [],
    specialization: [],
    advertisement: '',
    skills: {
      technical: [],
      creative: [],
      cognitive: [],
      tools: [],
      ethics: []
    }
  });
  const [sortBy, setSortBy] = useState('latest');
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchDegreeOptions();
    fetchAdvertisements();
  }, []);

  // Refresh users when advertisement filter changes to get AI normalization results overlay
  useEffect(() => {
    if (isMeritMode && filters.advertisement && filters.advertisement !== 'all') {
      refreshUsers(filters.advertisement);
    } else if (isMeritMode && (!filters.advertisement || filters.advertisement === 'all')) {
      refreshUsers();
    }
  }, [filters.advertisement, isMeritMode]);

  useEffect(() => {
    if (isInterviewMode) {
      fetchPanels();
    }
  }, [isInterviewMode]);

  // Scroll to top when mode changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [isInterviewMode, isMeritMode]);

  // Fetch users on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Use admin API to get all users
        const res = await userAPI.getAdminUsers();
        const rawData = res.data?.data;
        if (!Array.isArray(rawData)) {
          console.warn("Unexpected response format from admin users API in UserGrid");
          return;
        }
        const usersWithActivation = rawData
          .filter(user => user.role !== 'admin')
          .map(user => ({
            ...user,
            activationHistory: user.activationHistory || []
          }));
        setUsers(usersWithActivation);
      } catch (err) {
        console.error("Error fetching users:", err);
        if (err.response?.status !== 401) {
          toast.error("Failed to load users. You may not have admin access.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (users.length === 0) {
      fetchData();
    }
  }, [setUsers, users.length]);

  // Helper: compute user age from dob
  const computeAge = (dob) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Apply merit-specific filters on flattened merit rows
  const applyMeritFilters = (rows, mFilters) => {
    let result = [...rows];

    // Advertisement filter
    if (mFilters.advertisement) {
      result = result.filter(row => {
        const adId = (row.currentAdvertisement?._id || row.currentAdvertisement || '').toString();
        return adId === mFilters.advertisement;
      });
    }

    // Range helper
    const filterRange = (value, range) => {
      if (value === null || value === undefined) return false;
      const num = parseFloat(value);
      if (isNaN(num)) return false;
      if (range.min !== '' && num < parseFloat(range.min)) return false;
      if (range.max !== '' && num > parseFloat(range.max)) return false;
      return true;
    };

    // 10th percentage
    if (mFilters.tenth.min || mFilters.tenth.max) {
      result = result.filter(row => filterRange(row.education?.tenth?.percentage, mFilters.tenth));
    }

    // 12th percentage
    if (mFilters.twelfth.min || mFilters.twelfth.max) {
      result = result.filter(row => filterRange(row.education?.twelfth?.percentage, mFilters.twelfth));
    }

    // Graduation percentage
    if (mFilters.graduation.min || mFilters.graduation.max) {
      result = result.filter(row => filterRange(row.education?.graduation?.percentage, mFilters.graduation));
    }

    // Graduation CPI
    if (mFilters.graduationCpi.min || mFilters.graduationCpi.max) {
      result = result.filter(row => filterRange(row.education?.graduation?.cgpa, mFilters.graduationCpi));
    }

    // PG percentage
    if (mFilters.pg.min || mFilters.pg.max) {
      result = result.filter(row => filterRange(row.education?.qualifyingDegree?.percentage, mFilters.pg));
    }

    // PG CPI
    if (mFilters.pgCpi.min || mFilters.pgCpi.max) {
      result = result.filter(row => filterRange(row.education?.qualifyingDegree?.cgpa, mFilters.pgCpi));
    }

    // Assigned marks
    if (mFilters.assignedMarks.min || mFilters.assignedMarks.max) {
      result = result.filter(row => {
        const marks = row.currentAdMark?.marks ?? row.interviewMarks ?? 0;
        return filterRange(marks, mFilters.assignedMarks);
      });
    }

    // Age
    if (mFilters.age.min || mFilters.age.max) {
      result = result.filter(row => {
        const age = computeAge(row.dob);
        return filterRange(age, mFilters.age);
      });
    }

    // Degree checkbox filter
    if (mFilters.degree && mFilters.degree.length > 0) {
      result = result.filter(row => {
        const gradDegree = row.education?.graduation?.degree;
        const qualDegree = row.education?.qualifyingDegree?.degree;
        return mFilters.degree.includes(gradDegree) || mFilters.degree.includes(qualDegree);
      });
    }

    // Specialization checkbox filter
    if (mFilters.specialization && mFilters.specialization.length > 0) {
      result = result.filter(row => {
        const gradSpec = row.education?.graduation?.specialization;
        const qualSpec = row.education?.qualifyingDegree?.specialization;
        return mFilters.specialization.includes(gradSpec) || mFilters.specialization.includes(qualSpec);
      });
    }

    // Experience (placeholder — filter will pass all if user data lacks experience field)
    // In the future, if User model gets an experience field, this filter will work.

    return result;
  };

  // Apply filters and sorting
  useEffect(() => {
    let result = applyFilters(users, searchTerm, filters);

    if (isMeritMode) {
      // Flatten eligible users into multiple rows — one row per advertisement
      const flattenedResult = [];
      result.forEach(user => {
        if (user.status === 'eligible') {
          const userAds = user.advertisements || [];
          if (userAds.length > 0) {
            userAds.forEach(ad => {
              const adId = (ad._id || ad).toString();
              const adMark = user.advertisementMarks?.find(am =>
                (am.advertisementId?._id || am.advertisementId)?.toString() === adId
              );
              flattenedResult.push({
                ...user,
                currentAdvertisement: ad,
                currentAdMark: adMark || null,
                meritRowId: `${user._id}_${adId}`
              });
            });
          } else {
            // User has no advertisements — show single row
            flattenedResult.push({
              ...user,
              currentAdvertisement: null,
              currentAdMark: null,
              meritRowId: `${user._id}_no_ad`
            });
          }
        }
      });
      // Apply merit-specific filters
      result = applyMeritFilters(flattenedResult, meritFilters);

      // Merit-specific sorting
      const activeSortBy = meritSortBy;
      result.sort((a, b) => {
        switch (activeSortBy) {
          case 'latest':
            return new Date(b.createdAt) - new Date(a.createdAt);
          case 'oldest':
            return new Date(a.createdAt) - new Date(b.createdAt);
          case 'name-asc':
            return (a.fullName || '').localeCompare(b.fullName || '');
          case 'name-desc':
            return (b.fullName || '').localeCompare(a.fullName || '');
          case 'marks-high': {
            const mA = a.currentAdMark?.marks ?? a.interviewMarks ?? 0;
            const mB = b.currentAdMark?.marks ?? b.interviewMarks ?? 0;
            return mB - mA;
          }
          case 'marks-low': {
            const mA2 = a.currentAdMark?.marks ?? a.interviewMarks ?? 0;
            const mB2 = b.currentAdMark?.marks ?? b.interviewMarks ?? 0;
            return mA2 - mB2;
          }
          default:
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
      });
    } else if (isInterviewMode) {
      result = result.filter(user => user.status === 'eligible');

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
          case 'most-active': {
            const durationA = activationA.totalDuration + (activationA.active ? Date.now() - new Date(activationA.lastActivation).getTime() : 0);
            const durationB = activationB.totalDuration + (activationB.active ? Date.now() - new Date(activationB.lastActivation).getTime() : 0);
            return durationB - durationA;
          }
          default:
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
      });
    } else {
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
          case 'most-active': {
            const durationA = activationA.totalDuration + (activationA.active ? Date.now() - new Date(activationA.lastActivation).getTime() : 0);
            const durationB = activationB.totalDuration + (activationB.active ? Date.now() - new Date(activationB.lastActivation).getTime() : 0);
            return durationB - durationA;
          }
          default:
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
      });
    }

    setFilteredUsers(result);
    setPage(1);
  }, [users, searchTerm, filters, sortBy, isInterviewMode, isMeritMode, meritFilters, meritSortBy]);

  // Discover unique skills from user data
  const availableSkills = useMemo(() => {
    const skills = {
      technical: new Set(),
      creative: new Set(),
      cognitive: new Set(),
      tools: new Set(),
      ethics: new Set()
    };

    users.forEach(user => {
      if (user.skillSets) {
        Object.keys(skills).forEach(cat => {
          if (user.skillSets[cat] && Array.isArray(user.skillSets[cat])) {
            user.skillSets[cat].forEach(skill => {
              if (skill) skills[cat].add(skill);
            });
          }
        });
      }
    });

    return {
      technical: Array.from(skills.technical).sort(),
      creative: Array.from(skills.creative).sort(),
      cognitive: Array.from(skills.cognitive).sort(),
      tools: Array.from(skills.tools).sort(),
      ethics: Array.from(skills.ethics).sort()
    };
  }, [users]);

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

    // Skill facet counts
    counts.skills = {};
    Object.entries(availableSkills).forEach(([category, skillsList]) => {
      counts.skills[category] = {};
      skillsList.forEach(skill => {
        // Create a copy of current filters but with only THIS skill selected for THIS category
        // to show how many matches that specific skill has within CURRENT GLOBAL FILTERS
        counts.skills[category][skill] = applyFilters(users, searchTerm, {
          ...filters,
          skills: {
            ...filters.skills,
            [category]: [skill]
          }
        }).length;
      });
    });

    return counts;
  }, [users, searchTerm, filters, filteredUsers.length, degreeSpecMap, availableSkills]);

  // Merit filter counts for live facets
  const meritFilterCounts = useMemo(() => {
    if (!isMeritMode) return {};

    // Build the unfiltered merit list (all eligible user-ad rows)
    const baseUsers = applyFilters(users, searchTerm, filters);
    const allMeritRows = [];
    baseUsers.forEach(user => {
      if (user.status === 'eligible') {
        const userAds = user.advertisements || [];
        if (userAds.length > 0) {
          userAds.forEach(ad => {
            const adId = (ad._id || ad).toString();
            const adMark = user.advertisementMarks?.find(am =>
              (am.advertisementId?._id || am.advertisementId)?.toString() === adId
            );
            allMeritRows.push({
              ...user,
              currentAdvertisement: ad,
              currentAdMark: adMark || null,
              meritRowId: `${user._id}_${adId}`
            });
          });
        } else {
          allMeritRows.push({
            ...user,
            currentAdvertisement: null,
            currentAdMark: null,
            meritRowId: `${user._id}_no_ad`
          });
        }
      }
    });

    const counts = {
      total: filteredUsers.length
    };

    // Advertisement count
    if (meritFilters.advertisement) {
      counts.advertisement = applyMeritFilters(allMeritRows, meritFilters).length;
    }

    // Range filter counts
    const rangeKeys = ['tenth', 'twelfth', 'graduation', 'graduationCpi', 'pg', 'pgCpi', 'assignedMarks', 'age', 'experience'];
    rangeKeys.forEach(key => {
      const vals = meritFilters[key];
      if (vals && (vals.min || vals.max)) {
        counts[key] = applyMeritFilters(allMeritRows, meritFilters).length;
      }
    });

    // Degree facet counts
    const degreeNames = degreeOptions.length > 0
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
    degreeNames.forEach(d => {
      counts.degrees[d] = applyMeritFilters(allMeritRows, { ...meritFilters, degree: [d], specialization: [] }).length;
    });

    // Specialization facet counts
    counts.specializations = {};
    Object.values(degreeSpecMap).flat().forEach(s => {
      counts.specializations[s] = applyMeritFilters(allMeritRows, { ...meritFilters, specialization: [s] }).length;
    });

    return counts;
  }, [users, searchTerm, filters, isMeritMode, meritFilters, filteredUsers.length, degreeOptions, degreeSpecMap]);

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

  const isUserSelected = (userId) => selectedUsers.includes(userId);

  const selectAllVisible = () => {
    const paginatedIds = paginatedUsers.map(u => u._id);
    const allSelectedOnPage = paginatedIds.every(id => selectedUsers.includes(id));

    if (allSelectedOnPage) {
      // Unselect only the current page users
      setSelectedUsers(prev => prev.filter(id => !paginatedIds.includes(id)));
    } else {
      // Select all current page users (preserving other pages' selections)
      setSelectedUsers(prev => {
        const newSelection = [...prev];
        paginatedIds.forEach(id => {
          if (!newSelection.includes(id)) newSelection.push(id);
        });
        return newSelection;
      });
    }
  };

  const selectAllFiltered = () => {
    setSelectedUsers(filteredUsers.map(user => user._id));
  };

  const togglePageSelection = (pageIndex) => {
    const start = (pageIndex - 1) * rowsPerPage;
    const end = pageIndex * rowsPerPage;
    const pageUserIds = filteredUsers.slice(start, end).map(u => u._id);

    const allSelected = pageUserIds.every(id => selectedUsers.includes(id));

    if (allSelected) {
      // Unselect this page
      setSelectedUsers(prev => prev.filter(id => !pageUserIds.includes(id)));
    } else {
      // Select this page
      setSelectedUsers(prev => {
        const newSelection = [...prev];
        pageUserIds.forEach(id => {
          if (!newSelection.includes(id)) newSelection.push(id);
        });
        return newSelection;
      });
    }
  };

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
      advertisement: '',
      skills: {
        technical: [],
        creative: [],
        cognitive: [],
        tools: [],
        ethics: []
      }
    });
    setSortBy('latest');
    setSearchTerm('');
    if (!status || status === '') {
      toast.success('All filters cleared');
    }
  };

  const handleViewUser = async (userId, advertisementId = null) => {
    try {
      const response = await userAPI.getUserById(userId);
      setSelectedUserData(response.data.data);
      setViewModal({ show: true, userId, advertisementId });
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

  // Admin mark user as eligible
  const handleMarkEligible = async (userId) => {
    try {
      const response = await userAPI.setEligibleUser(userId);
      if (response.data.success) {
        toast.success('User marked as eligible!');
        // Update local state
        setUsers(prev => prev.map(user =>
          user._id === userId ? { ...user, status: 'eligible' } : user
        ));
      }
    } catch (err) {
      console.error('Eligible error:', err);
      toast.error('Failed to mark as eligible');
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


  const handleAssignPanelClick = (user) => {
    setAssignPanelModal({ show: true, user });

    // Initialize assignment map from user's current assignments
    const initialMap = {};
    const ads = user.advertisements && user.advertisements.length > 0
      ? user.advertisements
      : (user.advertisement ? [user.advertisement] : []);

    ads.forEach(ad => {
      const existing = user.panelAssignments?.find(pa =>
        (pa.advertisementId?._id || pa.advertisementId)?.toString() === ad._id?.toString()
      );
      initialMap[ad._id] = existing?.panelId?._id || existing?.panelId || "";
    });

    setAssignmentMap(initialMap);
    setAssignmentErrors({});
    setShowExpertsMap({});
  };

  const handlePanelChange = (adId, panelId) => {
    setAssignmentMap(prev => ({
      ...prev,
      [adId]: panelId
    }));

    // Update errors instantly: if panelId is empty, set error; otherwise clear it
    setAssignmentErrors(prev => {
      const newErrors = { ...prev };
      if (!panelId) {
        newErrors[adId] = true;
      } else {
        delete newErrors[adId];
      }
      return newErrors;
    });
  };

  const handleAssignPanel = async (userId) => {
    // Validate: every advertisement must have a panel assigned
    const newErrors = {};
    const ads = assignPanelModal.user.advertisements && assignPanelModal.user.advertisements.length > 0
      ? assignPanelModal.user.advertisements
      : (assignPanelModal.user.advertisement ? [assignPanelModal.user.advertisement] : []);

    let hasError = false;
    ads.forEach(ad => {
      if (!assignmentMap[ad._id]) {
        newErrors[ad._id] = true;
        hasError = true;
      }
    });

    if (hasError) {
      setAssignmentErrors(newErrors);
      toast.error("Please assign a panel for all advertisements");
      return;
    }

    try {
      const assignments = Object.entries(assignmentMap).map(([adId, panelId]) => ({
        advertisementId: adId,
        panelId: panelId
      }));

      const response = await userAPI.assignPanelsBulk(userId, assignments);
      if (response.data.success) {
        toast.success(response.data.message || 'Panels assigned successfully!');
        // Update user in context
        setUsers(prev => prev.map(u =>
          u._id === userId ? response.data.user : u
        ));
        setAssignPanelModal({ show: false, user: null });
      }
    } catch (err) {
      console.error('Assign panels error:', err);
      toast.error(err.response?.data?.message || 'Failed to assign panels');
    }
  };

  // Schedule interview for a user
  const handleScheduleInterview = async (userId, scheduledDate, advertisementIds = []) => {
    try {
      const response = await userAPI.scheduleInterview(userId, {
        scheduledDate,
        advertisementIds: advertisementIds.length > 0 ? advertisementIds : undefined
      });
      if (response.data.success) {
        toast.success('Interview scheduled successfully!');
        setUsers(prev => prev.map(u =>
          u._id === userId ? {
            ...u,
            interviewSchedule: response.data.user.interviewSchedule,
            advertisementMarks: response.data.user.advertisementMarks
          } : u
        ));
        setScheduleModal({ show: false, user: null });
        setScheduleDateInput("");
        setSelectedAdsToSchedule([]);
      }
    } catch (err) {
      console.error('Schedule interview error:', err);
      toast.error(err.response?.data?.message || 'Failed to schedule interview');
    }
  };

  // Send interview email
  const handleSendInterviewEmail = async (userId, location, helpline, advertisementIds = []) => {
    try {
      const response = await userAPI.sendInterviewEmail(userId, {
        location,
        helpline,
        advertisementIds: advertisementIds.length > 0 ? advertisementIds : undefined
      });
      if (response.data.success) {
        toast.success('Interview invite email sent successfully!');
        setUsers(prev => prev.map(u =>
          u._id === userId ? {
            ...u,
            interviewEmailSent: response.data.user.interviewEmailSent,
            advertisementMarks: response.data.user.advertisementMarks
          } : u
        ));
        setEmailConfirmModal({ show: false, user: null });
        setEmailForm({ location: '', helpline: '' });
        setSelectedAdsToEmail([]);
      }
    } catch (err) {
      console.error('Send interview email error:', err);
      toast.error(err.response?.data?.message || 'Failed to send interview email');
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

  // Assign marks for a user and advertisement
  const handleAssignMarks = async (userId, advertisementId, marks) => {
    try {
      setIsSubmittingMarks(true);
      const response = await userAPI.assignMarks(userId, { marks, advertisementId });
      if (response.data.success) {
        toast.success('Marks assigned successfully!');
        // Update user in local state
        setUsers(prev => prev.map(u =>
          u._id === userId ? { ...u, advertisementMarks: response.data.user.advertisementMarks, interviewMarks: response.data.user.interviewMarks } : u
        ));
        setAssignMarksModal({ show: false, user: null, advertisement: null });
        setMarksInput("");
      }
    } catch (err) {
      console.error('Assign marks error:', err);
      toast.error(err.response?.data?.message || 'Failed to assign marks');
    } finally {
      setIsSubmittingMarks(false);
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

    try {
      setLoading(true);
      const response = await userAPI.bulkPendingUsers(userIds, 'Bulk marked as pending - from filtered view');
      if (response.data.success) {
        toast.success(`${response.data.modifiedCount} users marked as pending`);
        setUsers(prev => prev.map(user =>
          userIds.includes(user._id) ? { ...user, status: 'pending' } : user
        ));
        setFilters(prev => ({ ...prev, approvalStatus: 'pending' }));
      }
    } catch (err) {
      console.error('Bulk pending error:', err);
      toast.error('Failed to bulk mark users as pending');
    } finally {
      setLoading(false);
    }
  };

  // Handle AI Normalization for Merit Mode
  const handleAiNormalization = async () => {
    const adId = meritFilters.advertisement;
    if (!adId) {
      toast.error("Please select an advertisement first");
      return;
    }

    try {
      setIsNormalizing(true);
      const response = await normalizationAPI.meritMode(adId);

      if (response.data.success) {
        toast.success(response.data.message || "AI Normalization successful!");
        // Refresh users to show updated marks
        await refreshUsers();
      }
    } catch (err) {
      console.error('AI Normalization error:', err);
      toast.error(err.response?.data?.message || "AI Normalization failed. Check server logs.");
    } finally {
      setIsNormalizing(false);
    }
  };

  // Bulk permanent delete users
  const handleBulkDelete = async (targetIds = null) => {
    const userIds = targetIds || selectedUsers;

    if (!userIds || userIds.length === 0) {
      toast.error('No users selected for deletion');
      return;
    }

    if (!window.confirm(`ARE YOU ABSOLUTELY SURE? \n\nThis will PERMANENTLY DELETE ${userIds.length} user(s) from the database. This action CANNOT be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await userAPI.bulkDeleteUsers(userIds);
      if (response.data.success) {
        toast.success(`${response.data.deletedCount} users permanently deleted`);
        setUsers(prev => prev.filter(user => !userIds.includes(user._id)));
        setSelectedUsers([]);
      }
    } catch (err) {
      console.error('Bulk delete error:', err);
      toast.error(err.response?.data?.message || 'Failed to bulk delete users');
    } finally {
      setLoading(false);
    }
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'eligible': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
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

  const meritStats = useMemo(() => {
    const eligibleUsers = users.filter(u => u.status === 'eligible');

    const isSatisfied = (user) => {
      const adMarks = user.advertisementMarks || [];
      return adMarks.some(am =>
        am.interviewSchedule?.scheduledDate && am.interviewEmailSent?.sent
      ) || (
          user.interviewSchedule?.scheduledDate && user.interviewEmailSent?.sent
        );
    };

    // candidates who satisfy BOTH conditions in the CURRENT GRID
    // Note: in isInterviewMode, filteredUsers ONLY contains eligible users already
    const satisfiedInGrid = filteredUsers.filter(u => isSatisfied(u)).length;

    // Check if ALL eligible users in the system are ready (not just filtered ones)
    const allReady = eligibleUsers.length > 0 && eligibleUsers.every(user => isSatisfied(user));

    return {
      sent: satisfiedInGrid,
      total: filteredUsers.length,
      canProceedToMerit: allReady
    };
  }, [users, filteredUsers]);

  return (
    <div className={`min-h-screen py-8 px-4 animate-fade-in transition-all duration-500 ${isNormalizing ? 'vats-processing-blur' : ''}`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 animate-slide-down">
          <h1 className="text-4xl md:text-5xl font-normal text-gray-800 mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            {isMeritMode ? "Merit list and individual fitness generation" : isInterviewMode ? "Interview Scheduling for Eligible Candidates" : "Application screening for eligibility"}
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
              onBulkDelete={handleBulkDelete}
              selectedUsers={selectedUsers}
              onSelectAllFiltered={selectAllFiltered}
              onClearSelection={() => setSelectedUsers([])}
              onTogglePageSelection={togglePageSelection}
              totalPages={totalPages}
              rowsPerPage={rowsPerPage}
              filterCounts={filterCounts}
              degreeOptions={degreeOptions}
              degreeSpecMap={degreeSpecMap}
              advertisements={advertisements}
              onManageDegrees={() => setManageDegreeModal(true)}
              isAdmin={isAdmin}
              availableSkills={availableSkills}
            />
          )}

          {isInterviewMode && (
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm animate-slide-down">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    if (isMeritMode) {
                      setIsMeritMode(false);
                    } else {
                      setIsInterviewMode(false);
                      setIsGridCollapsed(false);
                    }
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
                  {isMeritMode ? "Return" : "Return"}
                </button>
                <div className="h-8 w-px bg-blue-200 hidden md:block"></div>
                <div className="flex items-center gap-2 text-sm text-blue-800 font-normal">
                  {isMeritMode ? (
                    <>
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md border border-indigo-200 font-bold">
                        {meritStats.sent}
                      </span>
                      <span className="font-normal opacity-70">Candidates based on email</span>
                    </>
                  ) : (
                    <>
                      <span className="px-2 py-1 bg-blue-100 rounded-md border border-blue-200 font-normal">
                        {stats.totalByStatus.eligible} Eligible
                      </span>
                      <span className="font-normal opacity-70">from</span>
                      <span className="px-2 py-1 bg-white rounded-md border border-blue-100 font-normal">
                        {stats.total} Total
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!isMeritMode && (
                  <>
                    <button
                      onClick={() => setManagePanelModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-normal text-sm border-2 border-transparent shadow-md active:scale-95 cursor-pointer"
                      title="Manage Interview Panels"
                    >
                      <FaUsers />
                      Panels
                    </button>

                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-white rounded-xl border border-indigo-200 shadow-sm overflow-hidden">
                      {[
                        { key: 'grid', icon: FaThList, label: 'Grid' },
                        { key: 'calendar', icon: FaCalendar, label: 'Calendar' },
                        { key: 'timeline', icon: FaChartLine, label: 'Timeline' },
                      ].map(({ key, icon: Icon, label }) => (
                        <button
                          key={key}
                          onClick={() => {
                            setInterviewViewMode(key);
                            if (key !== 'grid') setIsGridCollapsed(false);
                          }}
                          title={`Switch to ${label} view`}
                          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-all cursor-pointer ${interviewViewMode === key
                            ? 'bg-indigo-600 text-white shadow-inner'
                            : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
                            }`}
                        >
                          <Icon className="text-xs" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Admin-only AI Normalization Button for Merit Mode */}
                {isMeritMode && isAdmin && (
                  <button
                    onClick={handleAiNormalization}
                    disabled={isNormalizing || !meritFilters.advertisement}
                    className={`
                      relative group flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 shadow-sm border border-transparent h-[42px] overflow-hidden
                      bg-gray-800
                      ${meritFilters.advertisement && !isNormalizing
                        ? 'cursor-pointer active:scale-95'
                        : 'cursor-not-allowed opacity-80'
                      }
                      focus:outline-none focus:ring-2 focus:ring-indigo-500/50
                    `}
                    title={
                      !meritFilters.advertisement
                        ? "Please select an advertisement to enable AI Normalization"
                        : isNormalizing
                          ? "vatsAi is currently analyzing candidate data and calculating features..."
                          : "Run vatsAi: Impute missing marks and normalize merit rankings"
                    }
                  >
                    {/* Hover Background Overlay */}
                    {meritFilters.advertisement && !isNormalizing && (
                      <div className="absolute inset-0 bg-gradient-to-r from-[#b8cbb8] via-[#b8cbb8] to-[#b465da] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></div>
                    )}

                    <div className="relative z-10 flex items-center gap-2">
                      {isNormalizing ? (
                        <FaRobot className="text-[#b465da] text-base vats-robot-slide" />
                      ) : (
                        <FaRobot className={`text-base transition-all duration-300 group-hover:scale-110 ${meritFilters.advertisement
                          ? 'text-[#b465da] group-hover:text-gray-800'
                          : 'text-gray-500/60'
                          }`} />
                      )}

                      <div className="relative">
                        <span className={`transition-all duration-300 text-transparent bg-clip-text bg-gradient-to-r from-[#b8cbb8] to-[#b465da] ${meritFilters.advertisement && !isNormalizing
                          ? 'group-hover:opacity-0'
                          : 'opacity-50'
                          }`}>
                          {isNormalizing ? "Processing..." : "Normalization with AI"}
                        </span>

                        {meritFilters.advertisement && !isNormalizing && (
                          <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 text-gray-800 whitespace-nowrap">
                            Normalization with AI
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )}

                {interviewViewMode === 'grid' && (
                  <button
                    onClick={() => setIsGridCollapsed(!isGridCollapsed)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary-700 rounded-lg hover:bg-primary-50 transition-all font-normal text-sm border border-primary-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer"
                  >
                    {isGridCollapsed ? <FaChevronDown /> : <FaChevronUp />}
                    {isGridCollapsed ? "Expand List" : "Collapse List"}
                  </button>
                )}
              </div>
            </div>
          )}

          {isInterviewMode && !isMeritMode && interviewViewMode === 'grid' && (
            <PanelDisplay panels={panels} loading={loadingPanels} />
          )}

          {/* Merit Mode Stats Bar */}
          {isMeritMode && (
            <div className="mb-4 p-4 bg-gradient-to-r from-indigo-50 via-white to-indigo-50 rounded-xl border border-indigo-100 shadow-sm animate-fade-in flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex items-center gap-2 text-sm text-indigo-700">
                  <FaFilter className="text-indigo-500" />
                  <span className="font-medium text-sm">
                    {filteredUsers.length}
                  </span>
                  <span className="opacity-70">candidates filtered from</span>
                  <span className="font-medium text-sm">
                    {meritStats.total}
                  </span>
                  <span className="opacity-70">eligible total</span>
                </div>
              </div>
            </div>
          )}

          {/* Merit Mode Filter Panel */}
          {isMeritMode && (
            <MeritFilterPanel
              meritFilters={meritFilters}
              onMeritFilterChange={(filterKey, value) => setMeritFilters(prev => ({ ...prev, [filterKey]: value }))}
              onMeritFiltersUpdate={(newFilters) => setMeritFilters(newFilters)}
              onClearMeritFilters={() => setMeritFilters({
                advertisement: '',
                tenth: { min: '', max: '' },
                twelfth: { min: '', max: '' },
                graduation: { min: '', max: '' },
                graduationCpi: { min: '', max: '' },
                pg: { min: '', max: '' },
                pgCpi: { min: '', max: '' },
                assignedMarks: { min: '', max: '' },
                age: { min: '', max: '' },
                degree: [],
                specialization: [],
                experience: { min: '', max: '' }
              })}
              onMeritSortChange={(newSort) => setMeritSortBy(newSort)}
              meritSortBy={meritSortBy}
              meritFilterCounts={meritFilterCounts}
              advertisements={advertisements}
              degreeOptions={degreeOptions}
              degreeSpecMap={degreeSpecMap}
              filteredUsers={filteredUsers}
            />
          )}

          {isInterviewMode && interviewViewMode === 'calendar' && (
            <InterviewCalendarView
              filteredUsers={filteredUsers}
              searchTerm={searchTerm}
              panels={panels}
              onViewUser={(user) => handleViewUser(user._id, user.advertisements?.[0]?._id || user.advertisement?._id)}
            />
          )}

          {isInterviewMode && interviewViewMode === 'timeline' && (
            <InterviewTimelineView
              filteredUsers={filteredUsers}
              searchTerm={searchTerm}
              panels={panels}
              onViewUser={(user) => handleViewUser(user._id, user.advertisements?.[0]?._id || user.advertisement?._id)}
            />
          )}

          {(!isInterviewMode || interviewViewMode === 'grid') && !isGridCollapsed && (
            <>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-primary-100 to-secondary-100">
                    <tr>
                      {isMeritMode ? (
                        <>
                          <th className="py-4 px-4 text-center w-12 font-normal">
                            <input
                              type="checkbox"
                              checked={paginatedUsers.length > 0 && paginatedUsers.every(u => isUserSelected(u._id))}
                              onChange={selectAllVisible}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                          </th>
                          <th className="py-4 px-6 text-left w-[240px] font-normal">Details</th>
                          {isMeritMode && (
                            <th className="py-4 px-6 text-left w-[220px] font-normal">Advertisement</th>
                          )}
                          <th className="py-4 px-6 text-left font-normal">10th Marks</th>
                          <th className="py-4 px-6 text-left w-[120px] font-normal">12th %</th>
                          <th className="py-4 px-6 text-left w-[180px] font-normal">Graduation % & CPI</th>
                          <th className="py-4 px-6 text-left w-[180px] font-normal">PG % & CPI</th>
                          <th className="py-4 px-6 text-left w-[150px] font-normal">Interview Marks</th>
                          <th className="py-4 px-6 text-left w-[200px] font-normal">Actions</th>
                        </>
                      ) : isInterviewMode ? (
                        <>
                          <th className="py-4 px-4 text-center w-12 font-normal">
                            <input
                              type="checkbox"
                              checked={paginatedUsers.length > 0 && paginatedUsers.every(u => isUserSelected(u._id))}
                              onChange={selectAllVisible}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                          </th>
                          <th className="py-4 px-6 text-left w-[340px] font-normal">Personal details</th>
                          <th className="py-4 px-6 text-left w-[240px] font-normal">Education</th>
                          <th className="py-4 px-6 text-left w-[240px] font-normal">Skillset</th>
                          <th className="py-4 px-6 text-left w-[240px] font-normal">Advertisement</th>
                          <th className="py-4 px-6 text-left w-[240px] font-normal">Panels</th>
                          <th className="py-4 px-6 text-left w-[260px] font-normal">Schedule & Email</th>
                          <th className="py-4 px-6 text-left w-[240px] font-normal">Actions</th>
                        </>
                      ) : (
                        <>
                          <th className="py-4 px-4 text-center w-12 font-normal">
                            <input
                              type="checkbox"
                              checked={paginatedUsers.length > 0 && paginatedUsers.every(u => isUserSelected(u._id))}
                              onChange={selectAllVisible}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                          </th>
                          <th className="py-4 px-6 text-left font-normal">Name & Details</th>
                          <th className="py-4 px-6 text-left w-48 font-normal">Registration Date</th>
                          <th className="py-4 px-6 text-left w-32 font-normal">Gender</th>
                          <th className="py-4 px-6 text-left w-32 font-normal">Profile Image</th>
                          <th className="py-4 px-6 text-left w-44 font-normal">Education</th>
                          <th className="py-4 px-6 text-left w-48 font-normal">Skillset</th>
                          <th className="py-4 px-6 text-left w-40 font-normal">Advertisement</th>
                          <th className="py-4 px-6 text-left w-32 font-normal">Status</th>
                          <th className="py-4 px-6 text-left w-80 font-normal">Actions</th>
                        </>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={isMeritMode ? 8 : (isInterviewMode ? 8 : 10)} className="py-12 text-center text-gray-500 font-normal">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <FaSpinner className="animate-spin text-primary-500 text-2xl" />
                            <span>Loading users...</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={isMeritMode ? 8 : (isInterviewMode ? 8 : 10)} className="py-12 text-center text-gray-500 font-normal">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <FaUsers className="text-gray-300 text-4xl" />
                            <p className="text-lg mb-2">No users found</p>
                            <p>
                              {searchTerm || Object.values(filters).some(f => f) ?
                                "Try adjusting your search or filters" :
                                "No users registered yet"}
                            </p>
                            {Object.values(filters).some(f => f) && (
                              <button
                                onClick={handleClearFilters}
                                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors cursor-pointer font-normal"
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
                        const rowId = isMeritMode ? user.meritRowId : user._id;
                        return (
                          <tr
                            key={rowId}
                            className="border-t border-gray-200 transition-all duration-300 hover:bg-gray-50 font-normal"
                          >
                            {/* 1. Checkbox Column */}
                            <td className="py-4 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={isUserSelected(rowId)}
                                onChange={() => toggleUserSelection(rowId)}
                                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                              />
                            </td>

                            {isMeritMode ? (
                              <>
                                {/* 1. Details */}
                                <td className="py-4 px-6 min-w-[280px]">
                                  <div className="flex items-center gap-4">
                                    <div className="relative group/avatar">
                                      {user.profileImage ? (
                                        <div
                                          onClick={() => openImagePreview(user.profileImage)}
                                          className="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-100 cursor-pointer hover:border-indigo-400 transition-all shadow-md group"
                                        >
                                          <img
                                            src={user.profileImage}
                                            alt="Profile"
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                          />
                                        </div>
                                      ) : (
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-dashed border-gray-200 flex items-center justify-center shadow-inner">
                                          <FaUser className="w-5 h-5 text-gray-300" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <p
                                        onClick={() => handleViewUser(user._id, user.currentAdvertisement?._id)}
                                        className="text-gray-900 text-sm font-bold leading-none mb-1 truncate cursor-pointer hover:text-indigo-600 transition-colors"
                                      >
                                        {user.fullName}
                                      </p>
                                      <p className="text-[10px] text-gray-500 truncate font-medium">{user.email}</p>
                                    </div>
                                  </div>
                                </td>

                                {/* 1.5 Advertisement (Merit Mode Only) */}
                                {isMeritMode && (
                                  <td className="py-4 px-6">
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold text-gray-800">
                                        {user.currentAdvertisement?.title || 'N/A'}
                                      </span>
                                      <span className="text-[10px] text-gray-500 font-medium">
                                        ID: {user.currentAdvertisement?._id?.toString().slice(-6) || 'N/A'}
                                      </span>
                                    </div>
                                  </td>
                                )}

                                {/* 2. 10th % */}
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-1">
                                    <span className={`text-sm font-medium ${user.aiImputations?.includes("10th") ? "text-amber-600 font-bold" : "text-gray-700"}`}>
                                      {user.education?.tenth?.percentage ? `${user.education.tenth.percentage}%` : 'N/A'}
                                    </span>
                                    {user.aiImputations?.includes("10th") && (
                                      <FaRobot className="text-[10px] text-amber-500" title={`AI Imputed (Original: ${user.originalEducation?.tenth?.percentage || 'N/A'}%)`} />
                                    )}
                                  </div>
                                </td>

                                {/* 3. 12th % */}
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-1">
                                    <span className={`text-sm font-medium ${user.aiImputations?.includes("12th") ? "text-amber-600 font-bold" : "text-gray-700"}`}>
                                      {user.education?.twelfth?.percentage ? `${user.education.twelfth.percentage}%` : 'N/A'}
                                    </span>
                                    {user.aiImputations?.includes("12th") && (
                                      <FaRobot className="text-[10px] text-amber-500" title={`AI Imputed (Original: ${user.originalEducation?.twelfth?.percentage || 'N/A'}%)`} />
                                    )}
                                  </div>
                                </td>

                                {/* 4. Graduation % & CPI */}
                                <td className="py-4 px-6">
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-1">
                                      <span className={`text-sm font-medium ${user.aiImputations?.includes("Grad") ? "text-amber-600 font-bold" : "text-indigo-700"}`}>
                                        {user.education?.graduation?.percentage ? `${user.education.graduation.percentage}%` : 'N/A'}
                                      </span>
                                      {user.aiImputations?.includes("Grad") && (
                                        <FaRobot className="text-[10px] text-amber-500" title={`AI Imputed (Original: ${user.originalEducation?.graduation?.percentage || 'N/A'}%)`} />
                                      )}
                                    </div>
                                    {user.education?.graduation?.cgpa && (
                                      <span className="text-[10px] text-gray-500 font-medium">CPI: {user.education.graduation.cgpa}</span>
                                    )}
                                  </div>
                                </td>

                                {/* 5. PG % & CPI */}
                                <td className="py-4 px-6">
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-1">
                                      <span className={`text-sm font-medium ${user.aiImputations?.includes("PG") ? "text-amber-600 font-bold" : "text-purple-700"}`}>
                                        {user.education?.qualifyingDegree?.percentage ? `${user.education.qualifyingDegree.percentage}%` : 'N/A'}
                                      </span>
                                      {user.aiImputations?.includes("PG") && (
                                        <FaRobot className="text-[10px] text-amber-500" title={`AI Imputed (Original: ${user.originalEducation?.qualifyingDegree?.percentage || 'N/A'}%)`} />
                                      )}
                                    </div>
                                    {user.education?.qualifyingDegree?.cgpa && (
                                      <span className="text-[10px] text-gray-500 font-medium">CPI: {user.education.qualifyingDegree.cgpa}</span>
                                    )}
                                  </div>
                                </td>

                                {/* 6. Interview Marks */}
                                <td className="py-4 px-6">
                                  <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
                                    <span className="text-sm font-bold">
                                      {user.currentAdMark?.marks !== undefined ? parseFloat(user.currentAdMark.marks).toFixed(2) : (user.interviewMarks !== undefined ? parseFloat(user.interviewMarks).toFixed(2) : "00.00")}
                                    </span>
                                    <span className="text-[10px] ml-1 opacity-70">/ 100</span>
                                  </div>
                                </td>

                                {/* 7. Actions */}
                                <td className="py-4 px-6">
                                  <div className="grid grid-cols-2 gap-2 min-w-[160px]">
                                    <button
                                      onClick={() => handleViewUser(user._id, user.currentAdvertisement?._id)}
                                      className="flex flex-col items-center justify-center gap-1 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all border border-blue-200 cursor-pointer shadow-sm group"
                                      title="View Details"
                                    >
                                      <FaEye className="size-3 group-hover:scale-110 transition-transform" />
                                      <span className="text-[10px] font-semibold tracking-tight">View</span>
                                    </button>

                                    {isMeritMode && isAdmin && (
                                      <button
                                        onClick={() => {
                                          setMarksInput(user.currentAdMark?.interviewMarks || "");
                                          setAssignMarksModal({
                                            show: true,
                                            user: user,
                                            advertisement: user.currentAdvertisement
                                          });
                                        }}
                                        className="flex flex-col items-center justify-center gap-1 py-2 bg-pink-50 text-pink-600 rounded-xl hover:bg-pink-100 transition-all border border-pink-200 cursor-pointer shadow-sm group"
                                        title="Assign Marks"
                                      >
                                        <FaClipboardList className="size-3 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-semibold tracking-tight">Assign Marks</span>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </>
                            ) : isInterviewMode ? (
                              <>
                                {/* 2. Personal Details (Interview Mode) */}
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-4">
                                    <div className="relative flex-shrink-0">
                                      {user.profileImage ? (
                                        <div
                                          onClick={() => openImagePreview(user.profileImage)}
                                          className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary-100 cursor-pointer hover:border-primary-400 transition-all shadow-md group"
                                        >
                                          <img
                                            src={user.profileImage}
                                            alt="Profile"
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                          />
                                        </div>
                                      ) : (
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-50 to-secondary-50 border-2 border-dashed border-gray-200 flex items-center justify-center shadow-inner">
                                          <FaUser className="w-6 h-6 text-gray-300" />
                                        </div>
                                      )}
                                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md border border-gray-100">
                                        {getGenderIcon(user.gender)}
                                      </div>
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <p
                                        onClick={() => handleViewUser(user._id, user.advertisements?.[0]?._id || user.advertisement?._id)}
                                        className="text-gray-900 text-base leading-none mb-1 truncate font-normal cursor-pointer hover:text-indigo-600 transition-colors"
                                      >
                                        {user.fullName}
                                      </p>
                                      <p className="text-xs text-gray-500 truncate mb-2 font-normal">{user.email}</p>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium tracking-tight">
                                          <FaCalendarAlt className="size-2.5" />
                                          <span>Reg: {registrationDate.date}</span>
                                        </div>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                        <span className="text-[10px] text-gray-400 font-medium">{user.gender}</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* 3. Education (Interview Mode) */}
                                <td className="py-4 px-6">
                                  <div className="flex flex-col items-start">
                                    <div className="inline-flex flex-col items-start min-w-[120px] bg-white p-2.5 rounded-xl border border-blue-100 shadow-sm">
                                      <span className="text-xs text-primary-700 mb-1.5 tracking-tight font-medium">
                                        {user.education?.qualifyingDegree?.degree || user.education?.graduation?.degree || 'N/A'}
                                      </span>
                                      <div className="w-full h-px bg-blue-50 mb-2"></div>
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-gray-400 font-medium tracking-wide">Class of {user.education?.graduation?.passingYear || user.education?.qualifyingDegree?.passingYear || 'N/A'}</span>
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs border border-blue-100 font-normal">
                                          {user.education?.graduation?.percentage || user.education?.qualifyingDegree?.percentage}%
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* 3b. Skillset (Interview Mode) */}
                                <td className="py-4 px-6">
                                  <div className="flex flex-col gap-2 max-w-[220px] max-h-[140px] overflow-y-auto custom-scrollbar p-1">
                                    {user.skillSets && (Object.values(user.skillSets).flat().length > 0) ? (
                                      Object.entries({
                                        technical: { label: 'Technical', labelColor: 'text-blue-600', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                                        creative: { label: 'Creative', labelColor: 'text-purple-600', color: 'bg-purple-50 text-purple-700 border-purple-100' },
                                        cognitive: { label: 'Cognitive', labelColor: 'text-indigo-600', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
                                        tools: { label: 'Tools', labelColor: 'text-amber-600', color: 'bg-amber-50 text-amber-700 border-amber-100' },
                                        ethics: { label: 'Ethics', labelColor: 'text-emerald-600', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
                                      }).map(([key, cfg]) => (
                                        user.skillSets[key]?.length > 0 && (
                                          <div key={key} className="flex flex-col gap-1">
                                            <span className={`text-[9px] font-medium tracking-tight text-gray-900`}>{cfg.label}</span>
                                            <div className="flex flex-wrap gap-1">
                                              {user.skillSets[key].map((skill, sIdx) => (
                                                <span key={`${key}-${sIdx}`} className={`px-1.5 py-0.5 rounded text-[10px] border font-medium whitespace-nowrap ${cfg.color}`}>
                                                  {skill}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )
                                      ))
                                    ) : (
                                      <span className="text-[10px] text-gray-400 italic">N/A</span>
                                    )}
                                  </div>
                                </td>

                                {/* 4. Advertisement (Interview Mode) */}
                                <td className="py-4 px-6">
                                  <div className="flex flex-col gap-2.5 max-w-[240px]">
                                    {(user.advertisements && user.advertisements.length > 0 ? user.advertisements : (user.advertisement ? [user.advertisement] : [])).map((ad, idx) => (
                                      <div key={ad._id || idx} className="flex items-start justify-between gap-2 p-2.5 rounded-xl border border-gray-100 bg-white">
                                        <p className="text-[11px] text-gray-700 leading-tight truncate-2-lines flex-1 font-normal" title={ad.title}>
                                          {ad.title}
                                        </p>
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => handleViewAd(ad)}
                                            className="p-1 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-purple-50 cursor-pointer"
                                            title="View Ad"
                                          >
                                            <FaBullhorn size={10} />
                                          </button>
                                          {ad.detail && (
                                            <button
                                              onClick={() => openDocumentPreview(ad.detail)}
                                              className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-50 cursor-pointer"
                                              title="View PDF"
                                            >
                                              <FaFilePdf size={10} />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                    {(!user.advertisements || user.advertisements.length === 0) && !user.advertisement && (
                                      <div className="text-center py-2 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                        <span className="text-[10px] text-gray-400 italic font-normal">No ad assigned</span>
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* 5. Panels (Interview Mode) */}
                                <td className="py-4 px-6">
                                  <div className="flex flex-col gap-2.5 max-w-[240px]">
                                    {(user.advertisements && user.advertisements.length > 0 ? user.advertisements : (user.advertisement ? [user.advertisement] : [])).map((ad, idx) => {
                                      const assignedPanel = user.panelAssignments?.find(pa => pa.advertisementId?.toString() === ad._id?.toString());
                                      const panelInfo = panels.find(p => p._id === assignedPanel?.panelId);

                                      return (
                                        <div key={`panel-${ad._id || idx}`} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-white min-h-[42px]">
                                          {panelInfo ? (
                                            <span className="inline-flex items-center px-1.5 py-1 rounded-md text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase font-medium tracking-tight">
                                              {panelInfo.name}
                                            </span>
                                          ) : (
                                            <span className="text-[10px] text-orange-400 italic font-medium px-1.5 py-1 bg-orange-50 rounded-md border border-orange-100">
                                              Pending
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                    {(!user.advertisements || user.advertisements.length === 0) && !user.advertisement && (
                                      <div className="h-full border border-dashed border-gray-100 rounded-xl bg-gray-50/30"></div>
                                    )}
                                  </div>
                                </td>

                                {/* 6. Schedule & Email (Interview Mode) */}
                                <td className="py-4 px-6">
                                  <div className="flex flex-col gap-2.5 max-w-[240px]">
                                    {(user.advertisements && user.advertisements.length > 0 ? user.advertisements : (user.advertisement ? [user.advertisement] : [])).map((ad, idx) => {
                                      const adMark = user.advertisementMarks?.find(am => am.advertisementId?.toString() === ad._id?.toString());
                                      const scheduledDate = adMark?.interviewSchedule?.scheduledDate || user.interviewSchedule?.scheduledDate;
                                      const emailSent = adMark?.interviewEmailSent?.sent || user.interviewEmailSent?.sent;

                                      return (
                                        <div key={`status-${ad._id || idx}`} className="flex flex-col gap-1.5 p-2 rounded-xl border border-gray-50 bg-white/50 min-h-[42px]">
                                          {/* Scheduled Date */}
                                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 ${scheduledDate
                                            ? 'bg-pink-50 border-pink-100 shadow-sm'
                                            : 'bg-slate-50 border-slate-200'
                                            }`}>
                                            <FaCalendarAlt className={`text-[9px] ${scheduledDate ? 'text-pink-500' : 'text-slate-400'}`} />
                                            <span className={`text-[9px] font-normal whitespace-nowrap ${scheduledDate ? 'text-pink-600' : 'text-black italic'}`}>
                                              {scheduledDate
                                                ? new Date(scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                                : 'Not Scheduled'
                                              }
                                            </span>
                                          </div>
                                          {/* Email Status */}
                                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 ${emailSent
                                            ? 'bg-emerald-50 border-emerald-100 shadow-sm'
                                            : 'bg-amber-50 border-amber-100'
                                            }`}>
                                            <FaEnvelope className={`text-[9px] ${emailSent ? 'text-emerald-500' : 'text-amber-500'}`} />
                                            <span className={`text-[9px] font-normal whitespace-nowrap ${emailSent ? 'text-emerald-700' : 'text-amber-700'}`}>
                                              {emailSent ? 'Email Sent ✓' : 'Email Pending'}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                    {(!user.advertisements || user.advertisements.length === 0) && !user.advertisement && (
                                      <div className="h-full border border-dashed border-gray-100 rounded-xl bg-gray-50/30"></div>
                                    )}
                                  </div>
                                </td>

                                {/* 7. Actions (Interview Mode) */}
                                <td className="py-4 px-6">
                                  <div className="grid grid-cols-2 gap-2 min-w-[180px]">
                                    <button
                                      onClick={() => handleViewUser(user._id, user.advertisements?.[0]?._id || user.advertisement?._id)}
                                      className="flex flex-col items-center justify-center gap-1 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all border border-blue-200 cursor-pointer shadow-sm group"
                                      title="View Details"
                                    >
                                      <FaInfoCircle className="size-3 group-hover:scale-110 transition-transform" />
                                      <span className="text-[10px] font-semibold tracking-tight">View Details</span>
                                    </button>

                                    {isAdmin && (
                                      <button
                                        onClick={() => handleAssignPanelClick(user)}
                                        disabled={user.advertisements?.every(ad => user.advertisementMarks?.find(am => am.advertisementId?.toString() === ad._id?.toString())?.interviewEmailSent?.sent) || user.interviewEmailSent?.sent}
                                        className={`flex flex-col items-center justify-center gap-1 py-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-all border border-purple-200 cursor-pointer shadow-sm group ${(user.advertisements?.every(ad => user.advertisementMarks?.find(am => am.advertisementId?.toString() === ad._id?.toString())?.interviewEmailSent?.sent) || user.interviewEmailSent?.sent) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title={(user.advertisements?.every(ad => user.advertisementMarks?.find(am => am.advertisementId?.toString() === ad._id?.toString())?.interviewEmailSent?.sent) || user.interviewEmailSent?.sent) ? "Cannot change panel after all emails sent" : (user.panelAssignments?.length > 0 ? "Change Panel" : "Assign Panel")}
                                      >
                                        <FaClipboardList className="size-3 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-semibold tracking-tight">
                                          {user.panelAssignments?.length > 0 ? "Change Panel" : "Assign Panel"}
                                        </span>
                                      </button>
                                    )}

                                    <button
                                      onClick={() => {
                                        setScheduleModal({ show: true, user });
                                        setScheduleDateInput(user.interviewSchedule?.scheduledDate
                                          ? new Date(user.interviewSchedule.scheduledDate).toISOString().split('T')[0]
                                          : ""
                                        );
                                        // Auto-select all ads that haven't been scheduled yet, or all ads if none scheduled
                                        const userAds = user.advertisements || (user.advertisement ? [user.advertisement] : []);
                                        setSelectedAdsToSchedule(userAds.map(ad => ad._id));
                                      }}
                                      disabled={user.advertisements?.every(ad => user.advertisementMarks?.find(am => am.advertisementId?.toString() === ad._id?.toString())?.interviewEmailSent?.sent) || user.interviewEmailSent?.sent}
                                      className={`flex flex-col items-center justify-center gap-1 py-2 bg-pink-50 text-pink-600 rounded-xl hover:bg-pink-100 transition-all border border-pink-200 cursor-pointer shadow-sm group ${(user.advertisements?.every(ad => user.advertisementMarks?.find(am => am.advertisementId?.toString() === ad._id?.toString())?.interviewEmailSent?.sent) || user.interviewEmailSent?.sent) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      title={(user.advertisements?.every(ad => user.advertisementMarks?.find(am => am.advertisementId?.toString() === ad._id?.toString())?.interviewEmailSent?.sent) || user.interviewEmailSent?.sent) ? "Cannot reschedule after all emails sent" : (user.interviewSchedule?.scheduledDate ? "Reschedule Interview" : "Schedule Interview")}
                                    >
                                      <FaClock className="size-3 group-hover:scale-110 transition-transform" />
                                      <span className="text-[10px] font-semibold tracking-tight">
                                        {user.interviewSchedule?.scheduledDate ? "Reschedule" : "Schedule"}
                                      </span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        setEmailConfirmModal({ show: true, user });
                                        const userAds = user.advertisements || (user.advertisement ? [user.advertisement] : []);
                                        // Auto-select ads that have schedule and panel but email not sent
                                        const eligibleAds = userAds.filter(ad => {
                                          const adMark = user.advertisementMarks?.find(am => am.advertisementId?.toString() === ad._id?.toString());
                                          const hasPanel = user.panelAssignments?.some(pa => pa.advertisementId?.toString() === ad._id?.toString());
                                          return adMark?.interviewSchedule?.scheduledDate && hasPanel && !adMark?.interviewEmailSent?.sent;
                                        });
                                        setSelectedAdsToEmail(eligibleAds.length > 0 ? eligibleAds.map(ad => ad._id) : userAds.map(ad => ad._id));
                                      }}
                                      disabled={(user.advertisements?.every(ad => user.advertisementMarks?.find(am => am.advertisementId?.toString() === ad._id?.toString())?.interviewEmailSent?.sent) || user.interviewEmailSent?.sent) || (!user.interviewSchedule?.scheduledDate && !user.advertisementMarks?.some(am => am.interviewSchedule?.scheduledDate)) || !user.panelAssignments?.length}
                                      className="flex flex-col items-center justify-center gap-1 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-200 cursor-pointer shadow-sm group disabled:opacity-50 disabled:cursor-not-allowed"
                                      title={
                                        (user.advertisements?.every(ad => user.advertisementMarks?.find(am => am.advertisementId?.toString() === ad._id?.toString())?.interviewEmailSent?.sent) || user.interviewEmailSent?.sent)
                                          ? "All emails already sent"
                                          : (!user.interviewSchedule?.scheduledDate && !user.advertisementMarks?.some(am => am.interviewSchedule?.scheduledDate) && !user.panelAssignments?.length
                                            ? "Assign panel and schedule interview first"
                                            : (!user.interviewSchedule?.scheduledDate && !user.advertisementMarks?.some(am => am.interviewSchedule?.scheduledDate))
                                              ? "Schedule interview first"
                                              : !user.panelAssignments?.length
                                                ? "Assign panel first"
                                                : "Send Interview Email")
                                      }
                                    >
                                      <FaPaperPlane className="size-3 group-hover:scale-110 transition-transform" />
                                      <span className="text-[10px] font-semibold tracking-tight">Send Mail</span>
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                {/* 2. Name & Details */}
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-normal bg-gradient-to-br from-primary-500 to-secondary-500 text-white">
                                      {user.fullName?.charAt(0) || "U"}
                                    </div>
                                    <div>
                                      <p
                                        onClick={() => handleViewUser(user._id, user.advertisements?.[0]?._id || user.advertisement?._id)}
                                        className="font-normal text-gray-800 cursor-pointer hover:text-primary-600 transition-colors"
                                      >
                                        {user.fullName}
                                      </p>
                                      <p className="text-sm text-gray-500 font-normal">{user.email}</p>
                                      <p className="text-xs text-gray-400 mt-1 font-normal">{user.mobile}</p>
                                    </div>
                                  </div>
                                </td>

                                {/* 3. Registration Date */}
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

                                {/* 4. Gender */}
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-2 font-normal">
                                    {getGenderIcon(user.gender)}
                                    {getGenderDisplay(user.gender)}
                                  </div>
                                </td>

                                {/* 5. Profile Image */}
                                <td className="py-4 px-6">
                                  {user.profileImage ? (
                                    <div
                                      onClick={() => openImagePreview(user.profileImage)}
                                      className="w-12 h-12 rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-primary-400 transition-all shadow-sm"
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

                                {/* 6. Education */}
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
                                  </div>
                                </td>

                                {/* 6b. Skillset (Normal Mode) */}
                                <td className="py-4 px-6">
                                  <div className="flex flex-col gap-2 max-w-[200px] max-h-[140px] overflow-y-auto custom-scrollbar p-1">
                                    {user.skillSets && (Object.values(user.skillSets).flat().length > 0) ? (
                                      Object.entries({
                                        technical: { label: 'Technical', labelColor: 'text-blue-600', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                                        creative: { label: 'Creative', labelColor: 'text-purple-600', color: 'bg-purple-50 text-purple-700 border-purple-100' },
                                        cognitive: { label: 'Cognitive', labelColor: 'text-indigo-600', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
                                        tools: { label: 'Tools', labelColor: 'text-amber-600', color: 'bg-amber-50 text-amber-700 border-amber-100' },
                                        ethics: { label: 'Ethics', labelColor: 'text-emerald-600', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
                                      }).map(([key, cfg]) => (
                                        user.skillSets[key]?.length > 0 && (
                                          <div key={key} className="flex flex-col gap-1">
                                            <span className={`text-[9px] font-medium tracking-tight text-gray-900`}>{cfg.label}</span>
                                            <div className="flex flex-wrap gap-1">
                                              {user.skillSets[key].map((skill, sIdx) => (
                                                <span key={`${key}-${sIdx}`} className={`px-1.5 py-0.5 rounded text-[10px] border font-medium whitespace-nowrap ${cfg.color}`}>
                                                  {skill}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )
                                      ))
                                    ) : (
                                      <span className="text-xs text-gray-400 italic">No skills</span>
                                    )}
                                  </div>
                                </td>

                                {/* 7. Advertisement */}
                                <td className="py-4 px-6">
                                  <div className="max-w-[240px] max-h-[120px] overflow-y-auto custom-scrollbar space-y-2">
                                    {(user.advertisements && user.advertisements.length > 0
                                      ? user.advertisements
                                      : (user.advertisement ? [user.advertisement] : [])
                                    ).map((ad, idx) => (
                                      <div key={ad._id || idx} className="flex items-center justify-between gap-2 p-1.5 bg-primary-50 rounded-lg border border-primary-100 group">
                                        <p className="text-[10px] font-bold text-primary-700 truncate flex-1" title={ad.title || 'N/A'}>
                                          {ad.title || 'N/A'}
                                        </p>
                                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                          <button
                                            onClick={() => handleViewAd(ad)}
                                            className="p-1 text-primary-600 hover:bg-white rounded transition-colors shadow-sm"
                                            title="View Ad Details"
                                          >
                                            <FaBullhorn size={10} />
                                          </button>
                                          {ad.detail && (
                                            <button
                                              onClick={() => openDocumentPreview(ad.detail)}
                                              className="p-1 text-red-600 hover:bg-white rounded transition-colors shadow-sm"
                                              title="View Ad PDF"
                                            >
                                              <FaFilePdf size={10} />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                    {(!user.advertisements || user.advertisements.length === 0) && !user.advertisement && (
                                      <span className="text-xs text-gray-400 italic">N/A</span>
                                    )}
                                  </div>
                                </td>

                                {/* 8. Status */}
                                <td className="py-4 px-6">
                                  <span className={`px-2 py-1 rounded-full text-xs font-normal border shadow-sm ${getStatusBadge(user.status)}`}>
                                    {user.status || 'pending'}
                                  </span>
                                </td>

                                {/* 9. Actions */}
                                <td className="py-4 px-6">
                                  <div className="grid grid-cols-2 gap-2 min-w-[160px]">
                                    <button
                                      onClick={() => handleViewUser(user._id, user.advertisements?.[0]?._id || user.advertisement?._id)}
                                      className="flex flex-col items-center justify-center gap-1 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all border border-blue-200 cursor-pointer shadow-sm group"
                                      title="View Profile"
                                    >
                                      <FaEye className="size-3 group-hover:scale-110 transition-transform" />
                                      <span className="text-[10px] font-semibold tracking-tight">View</span>
                                    </button>

                                    <button
                                      onClick={() => handleMarkEligible(user._id)}
                                      className="flex flex-col items-center justify-center gap-1 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-200 cursor-pointer shadow-sm group"
                                      title="Mark Eligible"
                                    >
                                      <FaCheckCircle className="size-3 group-hover:scale-110 transition-transform" />
                                      <span className="text-[10px] font-semibold tracking-tight">Eligible</span>
                                    </button>

                                    <button
                                      onClick={() => handleRejectUser(user._id)}
                                      className="flex flex-col items-center justify-center gap-1 py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all border border-rose-200 cursor-pointer shadow-sm group"
                                      title="Reject Candidate"
                                    >
                                      <FaTimesCircle className="size-3 group-hover:scale-110 transition-transform" />
                                      <span className="text-[10px] font-semibold tracking-tight">Reject</span>
                                    </button>

                                    <button
                                      onClick={() => handleDeleteUser(user._id)}
                                      className="flex flex-col items-center justify-center gap-1 py-2 bg-red-50 text-[#8b0000] rounded-xl hover:bg-red-100 transition-all border border-red-200 cursor-pointer shadow-sm group"
                                      title="Delete Candidate"
                                    >
                                      <FaTrashAlt className="size-3 group-hover:scale-110 transition-transform" />
                                      <span className="text-[10px] font-semibold tracking-tight">Delete</span>
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
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

          {isInterviewMode && !isMeritMode && (
            <div className="mt-8 flex flex-col items-center gap-4 animate-slide-up">
              <div className="flex flex-col items-center gap-2">
                <div
                  className="flex items-center gap-2 text-sm text-gray-500 font-normal cursor-help"
                  title="Based on the email send"
                >
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100 font-normal">
                    {meritStats.sent} Candidates
                  </span>
                  <span className="font-normal">from</span>
                  <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-md border border-gray-100 font-normal">
                    {meritStats.total} Total
                  </span>
                </div>
              </div>

              {isAdmin && (
                <div className="mt-4 flex flex-col items-center gap-4">

                  <button
                    disabled={!meritStats.canProceedToMerit}
                    onClick={() => {
                      setIsMeritMode(true);
                      setIsGridCollapsed(false);
                    }}
                    className={`
                        px-8 py-3 rounded-xl transition-all duration-300 font-normal shadow-lg hover:shadow-xl active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2
                        ${meritStats.canProceedToMerit
                        ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:from-purple-600 hover:to-pink-600 cursor-pointer focus:ring-pink-500'
                        : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed grayscale'
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
                    title={!meritStats.canProceedToMerit ? 'All eligible candidates must have interview scheduled and email sent for at least one advertisement' : 'Proceed to Merit Procedure'}
                  >
                    Merit Procedure
                  </button>
                </div>
              )}
            </div>
          )}

          {!isInterviewMode && isAdmin && (
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
                    setIsGridCollapsed(false);
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

        <ManagePanelsModal
          isOpen={managePanelModal}
          onClose={() => setManagePanelModal(false)}
          onRefresh={fetchPanels}
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
          title={isMeritMode ? "Merit Candidate Details" : isInterviewMode ? "Interview Candidate Details" : "User Details"}
          size="large"
        >
          {selectedUserData && (
            isMeritMode ? (
              <MeritViewDetails
                user={selectedUserData}
                advertisementId={viewModal.advertisementId}
                onClose={handleViewModalClose}
                onViewDocument={openDocumentPreview}
                onViewImage={openImagePreview}
              />
            ) : isInterviewMode ? (
              <InterviewViewDetails
                user={selectedUserData}
                advertisementId={viewModal.advertisementId}
                onClose={handleViewModalClose}
                onViewDocument={openDocumentPreview}
                onViewImage={openImagePreview}
                onAssignPanel={isAdmin ? () => {
                  handleViewModalClose();
                  handleAssignPanelClick(selectedUserData);
                } : null}
                onSchedule={isAdmin ? () => {
                  handleViewModalClose();
                  setScheduleModal({ show: true, user: selectedUserData });
                  setScheduleDateInput(selectedUserData.interviewSchedule?.scheduledDate
                    ? new Date(selectedUserData.interviewSchedule.scheduledDate).toISOString().split('T')[0]
                    : ""
                  );
                } : null}
                isAdmin={isAdmin}
                panels={panels}
              />
            ) : (
              <ViewUser
                user={selectedUserData}
                advertisementId={viewModal.advertisementId}
                onClose={handleViewModalClose}
                onApprove={handleApproveUser}
                onReject={handleRejectUser}
                onViewDocument={openDocumentPreview}
                onViewImage={openImagePreview}
                onAssignPanel={isAdmin ? () => {
                  handleViewModalClose();
                  handleAssignPanelClick(selectedUserData);
                } : null}
              />
            )
          )}
        </ModalContainer>

        <ModalContainer
          isOpen={editModal.show}
          onClose={handleEditModalClose}
          title="Edit User"
          size="large"
          footer={null}
        >
          {selectedUserData && (
            <EditUser
              user={selectedUserData}
              onClose={handleEditModalClose}
              onSuccess={handleEditSuccess}
            />
          )}
        </ModalContainer>

        <ModalContainer
          isOpen={assignPanelModal.show}
          onClose={() => setAssignPanelModal({ show: false, user: null })}
          title="Assign Interview Panels"
          size="large"
          footer={
            <div className="flex justify-end gap-3 items-center w-full">
              <div className="flex-1 hidden md:flex items-center gap-3">
                {Object.values(assignmentMap).filter(Boolean).length > 0 && (
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-white font-bold shadow-sm shadow-emerald-100">
                    {Object.values(assignmentMap).filter(Boolean).length}
                  </div>
                )}
                <p className="text-xs text-gray-500 font-medium">
                  {Object.values(assignmentMap).filter(Boolean).length === (assignPanelModal.user?.advertisements?.length || (assignPanelModal.user?.advertisement ? 1 : 0))
                    ? "✓ All panels assigned"
                    : `Assign panels to all ${(assignPanelModal.user?.advertisements?.length || (assignPanelModal.user?.advertisement ? 1 : 0))} ads.`
                  }
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleAssignPanel(assignPanelModal.user._id)}
                  disabled={Object.values(assignmentMap).filter(Boolean).length !== (assignPanelModal.user?.advertisements?.length || (assignPanelModal.user?.advertisement ? 1 : 0))}
                  className="px-10 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-bold hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm shadow-lg shadow-primary-100"
                >
                  Assign
                </button>
                <button
                  onClick={() => setAssignPanelModal({ show: false, user: null })}
                  className="px-8 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all cursor-pointer text-sm border-2 border-transparent"
                >
                  Close
                </button>
              </div>
            </div>
          }
        >
          {assignPanelModal.user && (
            <div className="p-0 flex flex-col max-h-[85vh]">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-4">
                  {assignPanelModal.user.profileImage ? (
                    <img
                      src={assignPanelModal.user.profileImage}
                      alt="Profile"
                      className="w-14 h-14 rounded-2xl object-cover shadow-lg shadow-primary-100 border-2 border-white"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-primary-100">
                      {assignPanelModal.user.fullName?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{assignPanelModal.user.fullName}</h3>
                    <p className="text-sm text-gray-500 font-medium">{assignPanelModal.user.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <FaBriefcase className="text-primary-500" />
                    Advertisements for Selection
                  </h4>
                  <span className="px-3 py-1 rounded-full bg-primary-50 text-xs font-bold text-primary-600 border border-primary-100">
                    {(assignPanelModal.user.advertisements?.length || (assignPanelModal.user.advertisement ? 1 : 0))} Total Ads
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {(assignPanelModal.user.advertisements && assignPanelModal.user.advertisements.length > 0
                    ? assignPanelModal.user.advertisements
                    : (assignPanelModal.user.advertisement ? [assignPanelModal.user.advertisement] : [])
                  ).map(ad => (
                    <div
                      key={ad._id}
                      className={`group relative flex flex-col md:flex-row gap-6 p-5 rounded-2xl border-2 transition-all duration-300 ${assignmentErrors[ad._id]
                        ? "border-rose-200 bg-rose-50/30 ring-4 ring-rose-50"
                        : assignmentMap[ad._id]
                          ? "border-emerald-100 bg-emerald-50/10"
                          : "border-gray-100 bg-white hover:border-primary-100"
                        }`}
                    >
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                          <FaBullhorn className={`mt-1 flex-shrink-0 ${assignmentErrors[ad._id] ? "text-rose-500" : "text-primary-500"}`} />
                          <h5 className="font-bold text-gray-800 leading-tight">
                            {ad.title}
                          </h5>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase">
                            <FaCalendarAlt className="text-gray-400" />
                            Deadline: <span className="text-gray-700">{ad.lastDateToApply ? new Date(ad.lastDateToApply).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleViewAd(ad); }}
                              className="text-[10px] px-2 py-1 rounded-md bg-primary-50 text-primary-600 font-bold hover:bg-primary-100 transition-colors flex items-center gap-1"
                            >
                              <FaInfoCircle className="size-2.5" /> Details
                            </button>
                            {ad.detail && (
                              <button
                                onClick={(e) => { e.stopPropagation(); openDocumentPreview(ad.detail, 'pdf'); }}
                                className="text-[10px] px-2 py-1 rounded-md bg-amber-50 text-amber-600 font-bold hover:bg-amber-100 transition-colors flex items-center gap-1"
                              >
                                <FaFilePdf className="size-2.5" /> PDF
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-bold uppercase">
                            ID: {ad._id.slice(-6)}
                          </span>
                          {ad.department && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 font-bold uppercase">
                              {ad.department}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="w-full md:w-[320px] flex flex-col gap-2">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide ml-1">
                          Select Interview Panel
                        </label>
                        <div className="relative group/select">
                          <select
                            value={assignmentMap[ad._id] || ""}
                            onChange={(e) => handlePanelChange(ad._id, e.target.value)}
                            className={`w-full h-12 pl-4 pr-10 py-2.5 rounded-xl text-sm font-medium border-2 appearance-none transition-all outline-none cursor-pointer ${assignmentErrors[ad._id]
                              ? "border-rose-300 bg-white text-rose-600 focus:border-rose-500"
                              : assignmentMap[ad._id]
                                ? "border-emerald-200 bg-white text-emerald-700 focus:border-emerald-500"
                                : "border-gray-200 bg-gray-50/50 text-gray-700 hover:border-primary-300 focus:border-primary-500 focus:bg-white"
                              }`}
                          >
                            <option value="">-- Choose a Panel --</option>
                            {panels.map((panel) => (
                              <option key={panel._id} value={panel._id}>
                                {panel.name} ({panel.experts?.length || 0} Experts)
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover/select:text-primary-500 transition-colors">
                            <FaChevronDown className="size-3" />
                          </div>
                        </div>
                        {assignmentErrors[ad._id] && (
                          <p className="text-[10px] font-bold text-rose-500 mt-1 flex items-center gap-1.5 ml-1">
                            <FaTimesCircle className="size-2.5" />
                            Requires panel assignment
                          </p>
                        )}

                        {/* View Experts Toggle */}
                        {assignmentMap[ad._id] && (
                          <div className="mt-3 ml-1">
                            <button
                              onClick={() => setShowExpertsMap(prev => ({ ...prev, [ad._id]: !prev[ad._id] }))}
                              className={`flex items-center gap-2 text-[11px] font-medium transition-all outline-none text-pink-500 hover:text-red-600 active:text-emerald-600 focus:text-emerald-600 ${showExpertsMap[ad._id] ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}
                            >
                              <FaUsers className="size-3" />
                              {showExpertsMap[ad._id] ? 'Hide expert details' : 'View expert details'}
                              {showExpertsMap[ad._id] ? <FaChevronUp className="size-2.5" /> : <FaChevronDown className="size-2.5" />}
                            </button>

                            {/* Expert Info Display */}
                            {showExpertsMap[ad._id] && (() => {
                              const selectedPanel = panels.find(p => p._id === assignmentMap[ad._id]);
                              if (!selectedPanel) return null;

                              return (
                                <div className="mt-3 space-y-3 animate-slide-down">
                                  <div className="grid grid-cols-1 gap-2.5">
                                    {selectedPanel.experts?.map((expert, eIdx) => (
                                      <div key={eIdx} className="bg-gray-50/50 rounded-xl p-3.5 border border-gray-100 flex items-start gap-3.5 hover:bg-white hover:shadow-md hover:border-primary-100 transition-all duration-300 group/expert">
                                        <div className="w-9 h-9 rounded-xl bg-white border border-primary-50 flex items-center justify-center text-primary-500 shrink-0 shadow-sm group-hover/expert:bg-primary-500 group-hover/expert:text-white transition-all duration-300">
                                          <FaUserTie className="size-4.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex justify-between items-center mb-1">
                                            <p className="text-[13px] font-semibold text-gray-800 truncate">{expert.name}</p>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 font-medium whitespace-nowrap border border-primary-100">
                                              {expert.seniority} years experience
                                            </span>
                                          </div>
                                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                                            <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                              <FaBriefcase className="size-3 text-gray-400" />
                                              {expert.role || 'N/A'}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                              <FaBuilding className="size-3 text-gray-400" />
                                              {expert.department?.name || expert.department || 'N/A'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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

        {/* Assign Marks Modal */}
        {assignMarksModal.show && (
          <ModalContainer
            isOpen={assignMarksModal.show}
            onClose={() => { setAssignMarksModal({ show: false, user: null, advertisement: null }); setMarksInput(""); }}
            title="Assign Interview Marks"
            size="medium"
            footer={
              assignMarksModal.user && (
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => handleAssignMarks(assignMarksModal.user._id, assignMarksModal.advertisement?._id, marksInput)}
                    disabled={isSubmittingMarks || marksInput === "" || isNaN(parseFloat(marksInput))}
                    className="flex-1 py-3 bg-gradient-to-r from-pink-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmittingMarks ? <FaSpinner className="animate-spin inline mr-2" /> : <FaClipboardList className="inline mr-2" />}
                    Save Marks
                  </button>
                  <button
                    onClick={() => { setAssignMarksModal({ show: false, user: null, advertisement: null }); setMarksInput(""); }}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )
            }
          >
            {assignMarksModal.user && (
              <div className="p-6">
                <div className="mb-6 flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  {assignMarksModal.user.profileImage ? (
                    <img
                      src={assignMarksModal.user.profileImage}
                      alt="Profile"
                      className="w-12 h-12 rounded-full object-cover shadow-md border-2 border-white"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
                      {assignMarksModal.user.fullName?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-gray-900">{assignMarksModal.user.fullName}</h3>
                    <p className="text-sm text-gray-500">{assignMarksModal.user.email}</p>
                    {assignMarksModal.advertisement && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">
                        {assignMarksModal.advertisement.title || assignMarksModal.advertisement.advtNo}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Interview Marks (0-100)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={marksInput}
                        onChange={(e) => setMarksInput(e.target.value)}
                        placeholder="Enter marks"
                        className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all font-bold text-lg text-primary-900"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                        / 100
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 italic">
                      * Marks will be assigned specifically for the {assignMarksModal.advertisement?.title || 'selected'} advertisement.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </ModalContainer>
        )}



        {/* Schedule Interview Modal */}
        {scheduleModal.show && (
          <ModalContainer
            isOpen={scheduleModal.show}
            onClose={() => { setScheduleModal({ show: false, user: null }); setScheduleDateInput(""); }}
            title="Schedule Interview"
            size="medium"
            footer={
              scheduleModal.user && (
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => handleScheduleInterview(scheduleModal.user._id, scheduleDateInput, selectedAdsToSchedule)}
                    disabled={!scheduleDateInput || selectedAdsToSchedule.length === 0}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {scheduleModal.user.interviewSchedule?.scheduledDate ? "Update Schedule" : "Confirm Schedule"}
                  </button>
                  <button
                    onClick={() => { setScheduleModal({ show: false, user: null }); setScheduleDateInput(""); }}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )
            }
          >
            {scheduleModal.user && (
              <div className="p-6">
                <div className="mb-6 flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  {scheduleModal.user.profileImage ? (
                    <img
                      src={scheduleModal.user.profileImage}
                      alt="Profile"
                      className="w-12 h-12 rounded-full object-cover shadow-md border-2 border-white"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
                      {scheduleModal.user.fullName?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-gray-900">{scheduleModal.user.fullName}</h3>
                    <p className="text-sm text-gray-500">{scheduleModal.user.email}</p>
                  </div>
                </div>

                {(() => {
                  const ads = scheduleModal.user.advertisements || [];
                  if (ads.length > 0) {
                    const latestDeadline = new Date(Math.max(...ads.map(ad => new Date(ad.lastDateToApply).getTime())));
                    return (
                      <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="text-xs text-amber-700">
                          <strong>Note:</strong> Interview date must be at least 5 days after the last advertisement deadline:
                          <span className="font-bold ml-1">{latestDeadline.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Interview Date</label>
                    <input
                      type="date"
                      value={scheduleDateInput}
                      onChange={(e) => setScheduleDateInput(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      min={(() => {
                        const ads = scheduleModal.user.advertisements || [];
                        if (ads.length > 0) {
                          const latestDeadline = new Date(Math.max(...ads.map(ad => new Date(ad.lastDateToApply).getTime())));
                          const minDate = new Date(latestDeadline);
                          minDate.setDate(minDate.getDate() + 5); // Minimum 5 days after deadline
                          return minDate.toISOString().split('T')[0];
                        }
                        return new Date().toISOString().split('T')[0];
                      })()}
                    />
                  </div>

                  {/* Advertisement Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
                      <span>Select Advertisements to Schedule</span>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">Required</span>
                    </label>
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto p-1 custom-scrollbar">
                      {(scheduleModal.user.advertisements || (scheduleModal.user.advertisement ? [scheduleModal.user.advertisement] : [])).map((ad) => {
                        const isSelected = selectedAdsToSchedule.includes(ad._id);
                        const adMark = scheduleModal.user.advertisementMarks?.find(am => am.advertisementId?.toString() === ad._id?.toString());
                        const currentSchedule = adMark?.interviewSchedule?.scheduledDate;

                        return (
                          <div
                            key={ad._id}
                            onClick={() => {
                              setSelectedAdsToSchedule(prev =>
                                prev.includes(ad._id)
                                  ? prev.filter(id => id !== ad._id)
                                  : [...prev, ad._id]
                              );
                            }}
                            className={`group flex items-center gap-4 p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${isSelected
                              ? 'bg-indigo-50/50 border-indigo-200'
                              : 'bg-white border-gray-100 hover:border-indigo-100 shadow-sm'
                              }`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                              ? 'bg-indigo-600 border-indigo-600'
                              : 'border-gray-200 group-hover:border-indigo-300'
                              }`}>
                              {isSelected && <FaCheckCircle className="text-white text-[10px]" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-bold text-gray-800 truncate leading-snug group-hover:text-indigo-600 transition-colors">{ad.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">{ad.advtNo}</span>
                                {currentSchedule && (
                                  <>
                                    <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                    <span className="text-[10px] text-indigo-500 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                                      Scheduled: {new Date(currentSchedule).toLocaleDateString('en-IN')}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ModalContainer>
        )}

        {/* Send Email Confirmation Modal */}
        {emailConfirmModal.show && (
          <ModalContainer
            isOpen={emailConfirmModal.show}
            onClose={() => {
              setEmailConfirmModal({ show: false, user: null });
              setEmailForm({ location: '', helpline: '' });
              setEmailFormErrors({ location: '', helpline: '' });
            }}
            title="Send Interview Invitation Email"
            size="large"
            footer={
              emailConfirmModal.user && (
                <div className="flex gap-4 justify-end px-8 py-6 bg-white border-t border-indigo-50">
                  <button
                    onClick={() => {
                      setEmailConfirmModal({ show: false, user: null });
                      setEmailForm({ location: '', helpline: '' });
                      setEmailFormErrors({ location: '', helpline: '' });
                    }}
                    className="px-6 py-3 bg-slate-50 text-slate-500 rounded-2xl font-bold border border-slate-100 hover:bg-slate-100 transition-all cursor-pointer shadow-sm active:scale-95 text-sm"
                  >
                    Cancel Draft
                  </button>
                  <button
                    onClick={() => handleSendInterviewEmail(emailConfirmModal.user._id, emailForm.location, emailForm.helpline, selectedAdsToEmail)}
                    disabled={emailFormErrors.location || emailFormErrors.helpline || !emailForm.location || !emailForm.helpline || selectedAdsToEmail.length === 0}
                    className="px-8 py-3 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl font-bold hover:shadow-[0_10px_30px_rgba(79,70,229,0.3)] hover:-translate-y-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-200/50 text-sm"
                  >
                    <FaPaperPlane className="text-[11px]" /> Dispatch Invitation
                  </button>
                </div>
              )
            }
          >
            {emailConfirmModal.user && (
              <div className="flex flex-col lg:flex-row h-full overflow-hidden min-h-[550px] bg-white">
                {/* Left Column: Form Section */}
                <div className="lg:w-1/2 p-0 lg:border-r border-indigo-50 overflow-y-auto bg-white/50 backdrop-blur-sm scrollbar-thin scrollbar-thumb-indigo-100">
                  <div className="p-10 space-y-10">
                    {/* Refined Candidate Profile Card */}
                    <div className="relative p-8 bg-gradient-to-br from-indigo-500/10 via-white to-indigo-50/30 rounded-[2.5rem] border border-indigo-100 shadow-sm overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform duration-700"></div>

                      <div className="flex items-center gap-8 relative z-10">
                        <div className="relative shrink-0">
                          {emailConfirmModal.user.profileImage ? (
                            <img
                              src={emailConfirmModal.user.profileImage.startsWith('http') ? emailConfirmModal.user.profileImage : `http://localhost:5000${emailConfirmModal.user.profileImage}`}
                              alt={emailConfirmModal.user.fullName}
                              className="w-20 h-20 rounded-[1.8rem] border-4 border-white object-cover shadow-xl group-hover:rotate-3 transition-all duration-500 shadow-indigo-100"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-[1.8rem] bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold text-3xl border-4 border-white shadow-xl">
                              {emailConfirmModal.user.fullName?.charAt(0)}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-indigo-50">
                            <FaCheckCircle className="text-emerald-500 text-lg" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1.5">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/80 border border-indigo-50 rounded-lg shadow-sm">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                              <span className="text-[9px] text-slate-500 font-bold tracking-wider">Interview Status</span>
                            </div>
                          </div>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight truncate leading-tight mb-1">{emailConfirmModal.user.fullName}</h3>
                          <div className="flex items-center gap-2 text-slate-500 font-bold text-[13px] opacity-80 overflow-hidden">
                            <FaEnvelope className="text-indigo-400 shrink-0 text-xs" />
                            <span className="truncate">{emailConfirmModal.user.email}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Advertisement Selection for Email */}
                    <div>
                      <label className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-slate-700 tracking-wide flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Target Advertisements
                        </span>
                        <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                          Select for Mailing
                        </span>
                      </label>
                      <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {(emailConfirmModal.user.advertisements || (emailConfirmModal.user.advertisement ? [emailConfirmModal.user.advertisement] : [])).map((ad) => {
                          const isSelected = selectedAdsToEmail.includes(ad._id);
                          const adMark = emailConfirmModal.user.advertisementMarks?.find(am => am.advertisementId?.toString() === ad._id?.toString());
                          const hasSchedule = !!adMark?.interviewSchedule?.scheduledDate;
                          const hasPanel = emailConfirmModal.user.panelAssignments?.some(pa => pa.advertisementId?.toString() === ad._id?.toString());
                          const emailSent = !!adMark?.interviewEmailSent?.sent;
                          const isEligible = hasSchedule && hasPanel;

                          return (
                            <div
                              key={ad._id}
                              onClick={() => {
                                if (!isEligible) return;
                                setSelectedAdsToEmail(prev =>
                                  prev.includes(ad._id)
                                    ? prev.filter(id => id !== ad._id)
                                    : [...prev, ad._id]
                                );
                              }}
                              className={`group relative p-4 rounded-[2rem] border-2 transition-all duration-300 ${isEligible
                                ? (isSelected ? 'bg-indigo-50/30 border-indigo-200 shadow-md' : 'bg-white border-slate-50 hover:border-indigo-100 cursor-pointer shadow-sm')
                                : 'bg-slate-50/50 border-slate-100 opacity-60 cursor-not-allowed'
                                }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${isSelected
                                  ? 'bg-indigo-600 border-indigo-600'
                                  : 'bg-white border-slate-200 group-hover:border-indigo-300'
                                  }`}>
                                  {isSelected && <FaCheckCircle className="text-white text-xs" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className={`text-sm font-bold truncate ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>{ad.title}</p>
                                    {emailSent && (
                                      <span className="shrink-0 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-lg border border-emerald-200">SENT</span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    {!hasSchedule && (
                                      <span className="text-[9px] text-rose-500 font-bold flex items-center gap-1"><FaClock className="text-[8px]" /> Missing Schedule</span>
                                    )}
                                    {!hasPanel && (
                                      <span className="text-[9px] text-amber-500 font-bold flex items-center gap-1"><FaUsers className="text-[8px]" /> Panel Pending</span>
                                    )}
                                    {hasSchedule && (
                                      <span className="text-[9px] text-indigo-500 font-bold flex items-center gap-1">
                                        <FaCalendarAlt className="text-[8px]" /> {new Date(adMark.interviewSchedule.scheduledDate).toLocaleDateString('en-IN')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Interview Location */}
                    <div>
                      <label className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-700 tracking-wide flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Interview Location / Venue
                        </span>
                        {emailForm.location && !emailFormErrors.location && (
                          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100/50 px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-100 shadow-sm">
                            <FaCheckCircle className="text-[9px]" /> India Standard Address
                          </span>
                        )}
                      </label>
                      <div className="relative group">
                        <textarea
                          placeholder="Enter precise office/venue address including 6-digit PIN code..."
                          value={emailForm.location}
                          onChange={(e) => setEmailForm(prev => ({ ...prev, location: e.target.value }))}
                          className={`w-full px-5 py-5 rounded-3xl border-2 transition-all duration-300 outline-none text-[15px] min-h-[140px] resize-none leading-relaxed shadow-sm ${emailFormErrors.location && emailForm.location ? 'border-rose-100 bg-rose-50/20 focus:border-rose-500' : 'border-indigo-50 bg-indigo-50/10 focus:border-indigo-500 focus:bg-white focus:shadow-indigo-100/50'
                            }`}
                        />
                        <div className="absolute right-5 top-5 text-indigo-200 group-focus-within:text-indigo-500 transition-colors">
                          <FaBuilding className="text-lg" />
                        </div>
                      </div>
                      {emailFormErrors.location && emailForm.location ? (
                        <p className="mt-3 text-[11px] text-rose-500 font-bold border-l-2 border-rose-500 pl-3 animate-shake">
                          {emailFormErrors.location}
                        </p>
                      ) : (
                        <div className="mt-3 flex items-start gap-2 text-[10px] text-slate-400 font-medium bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                          <FaInfoCircle className="text-indigo-300 text-xs mt-0.5 shrink-0" />
                          <p>Please specify Floor No. and Building properly. Example: Sector 2, Gandhinagar 382010</p>
                        </div>
                      )}
                    </div>

                    {/* Support Helpline */}
                    <div>
                      <label className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-700 tracking-wide flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Support Helpline Number
                        </span>
                        {emailForm.helpline && !emailFormErrors.helpline && (
                          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100/50 px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-100 shadow-sm">
                            <FaCheckCircle className="text-[9px]" /> Verified Format
                          </span>
                        )}
                      </label>
                      <div className="relative group">
                        <input
                          type="text"
                          placeholder="9XXXXXXXXX (10 Digit Mobile)"
                          value={emailForm.helpline}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setEmailForm(prev => ({ ...prev, helpline: val }));
                          }}
                          className={`w-full px-5 py-5 rounded-full border-2 transition-all duration-300 outline-none text-[15px] shadow-sm ${emailFormErrors.helpline && emailForm.helpline ? 'border-rose-100 bg-rose-50/20 focus:border-rose-500' : 'border-indigo-50 bg-indigo-50/10 focus:border-indigo-500 focus:bg-white focus:shadow-indigo-100/50'
                            }`}
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-indigo-200 group-focus-within:text-indigo-500 transition-colors">
                          <FaPhone />
                        </div>
                      </div>
                      {!emailForm.helpline && (
                        <div className="mt-3 flex items-start gap-2 text-[10px] text-slate-400 font-medium bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                          <FaInfoCircle className="text-indigo-300 text-xs mt-0.5 shrink-0" />
                          <p>Enter a 10-digit Indian number. It will be displayed as the primary support line.</p>
                        </div>
                      )}
                      {emailFormErrors.helpline && emailForm.helpline && (
                        <p className="mt-3 text-[11px] text-rose-500 font-bold border-l-2 border-rose-500 pl-3 animate-shake">
                          {emailFormErrors.helpline}
                        </p>
                      )}
                    </div>

                    {/* Resend Warning */}
                    {emailConfirmModal.user.interviewEmailSent?.sent && (
                      <div className="p-5 bg-amber-50 rounded-[1.5rem] border border-amber-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full -mr-8 -mt-8"></div>
                        <div className="flex items-center gap-4 relative">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-200 shadow-sm">
                            <FaInfoCircle className="text-amber-600 text-lg" />
                          </div>
                          <div>
                            <p className="text-sm text-amber-900 font-bold">Resending Invitation</p>
                            <p className="text-[11px] text-amber-700/80 font-bold mt-0.5">
                              Last transmission detected: {new Date(emailConfirmModal.user.interviewEmailSent.at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Live Preview Section */}
                <div className="lg:w-1/2 p-8 bg-slate-50/50 overflow-y-auto max-h-[750px] scrollbar-none">
                  <EmailDraftPreview user={emailConfirmModal.user} form={emailForm} selectedAdIds={selectedAdsToEmail} />
                </div>
              </div>
            )}
          </ModalContainer>
        )}

      </div>

    </div>
  )
};

export default UserGrid;