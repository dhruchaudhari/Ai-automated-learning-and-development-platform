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
  FaBug,
  FaLock,
  FaTimesCircle,
  FaDownload,
  FaExpand,
  FaSignOutAlt,
  FaRedo,
  FaPowerOff,
  FaCalendarAlt,
  FaMars,
  FaVenus,
  FaTransgender,
  FaFilter,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaSortAmountDown,
  FaSortAmountUp,
  FaToggleOn,
  FaToggleOff,
  FaHistory,
  FaCalendar,
  FaClock,
  FaCalendarCheck,
  FaCalendarTimes,
  FaGenderless,
  FaSortNumericDown,
  FaSortNumericUp,
  FaChevronDown,
  FaChevronUp,
  FaTrashAlt,
  FaChartBar,
  FaChartPie,
  FaChartLine,
  FaUsers,
  FaChartArea,
  FaTable,
  FaList,
  FaTh,
  FaCogs,
  FaArrowUp,
  FaArrowDown,
  FaInfoCircle,
  FaExclamationTriangle
} from "react-icons/fa";
import { 
  format, 
  parseISO, 
  differenceInDays, 
  differenceInHours, 
  formatDistanceToNow,
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
  eachDayOfInterval,
  eachMonthOfInterval,
  subMonths,
  subYears,
  addDays,
  addMonths,
  addYears,
  isValid,
  isSameDay,
  isSameMonth,
  isSameYear
} from "date-fns";
import ConfirmationModal from "./ConfirmationModal";
import ViewUser from "./ViewUser";
import EditUser from "./EditUser";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from "recharts";

const ROWS_PER_PAGE = 5;

// Format date for display
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

// Get gender icon with color
const getGenderIcon = (gender) => {
  switch (gender) {
    case 'Male':
      return <FaMars className="text-blue-500" />;
    case 'Female':
      return <FaVenus className="text-pink-500" />;
    case 'Other':
      return <FaTransgender className="text-purple-500" />;
    default:
      return <FaGenderless className="text-gray-400" />;
  }
};

// Get gender display text with color
const getGenderDisplay = (gender) => {
  switch (gender) {
    case 'Male':
      return <span className="text-blue-600 font-medium">Male</span>;
    case 'Female':
      return <span className="text-pink-600 font-medium">Female</span>;
    case 'Other':
      return <span className="text-purple-600 font-medium">Other</span>;
    default:
      return <span className="text-gray-500">Not specified</span>;
  }
};

// Enhanced activation duration calculation
const calculateActivationDuration = (activationHistory, specificDate = null) => {
  if (!activationHistory || activationHistory.length === 0) {
    return { 
      totalDays: 0, 
      totalHours: 0, 
      totalMinutes: 0,
      active: false,
      totalDuration: 0,
      sessions: 0,
      avgSessionDuration: 0,
      lastActivation: null,
      firstActivation: null
    };
  }
  
  // Sort history by date
  const sortedHistory = [...activationHistory].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );
  
  let totalDuration = 0;
  let isCurrentlyActive = false;
  let sessions = 0;
  let sessionDurations = [];
  
  // Calculate total active time
  for (let i = 0; i < sortedHistory.length; i += 2) {
    const start = sortedHistory[i];
    const end = sortedHistory[i + 1] || { status: 'inactive', timestamp: new Date().toISOString() };
    
    if (start.status === 'active') {
      const startTime = new Date(start.timestamp);
      const endTime = new Date(end.timestamp);
      
      // If specific date is provided, only count time on that date
      if (specificDate) {
        const specificDateStart = startOfDay(specificDate);
        const specificDateEnd = endOfDay(specificDate);
        
        const sessionStart = startTime < specificDateStart ? specificDateStart : startTime;
        const sessionEnd = endTime > specificDateEnd ? specificDateEnd : endTime;
        
        if (sessionStart < sessionEnd) {
          const sessionDuration = sessionEnd - sessionStart;
          totalDuration += sessionDuration;
          sessionDurations.push(sessionDuration);
          sessions++;
        }
      } else {
        const sessionDuration = endTime - startTime;
        totalDuration += sessionDuration;
        sessionDurations.push(sessionDuration);
        sessions++;
      }
      
      // If last status is active, user is currently active
      if (i === sortedHistory.length - 2 && end.status === 'inactive') {
        isCurrentlyActive = false;
      } else if (i === sortedHistory.length - 1) {
        isCurrentlyActive = start.status === 'active';
      }
    }
  }
  
  const totalDays = Math.floor(totalDuration / (1000 * 60 * 60 * 24));
  const totalHours = Math.floor((totalDuration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const totalMinutes = Math.floor((totalDuration % (1000 * 60 * 60)) / (1000 * 60));
  
  const avgSessionDuration = sessions > 0 ? totalDuration / sessions / (1000 * 60) : 0; // in minutes
  
  return {
    totalDays,
    totalHours,
    totalMinutes,
    active: isCurrentlyActive,
    totalDuration,
    sessions,
    avgSessionDuration: Math.round(avgSessionDuration * 100) / 100,
    lastActivation: sortedHistory.length > 0 ? new Date(sortedHistory[sortedHistory.length - 1].timestamp) : null,
    firstActivation: sortedHistory.length > 0 ? new Date(sortedHistory[0].timestamp) : null,
    sessionDurations
  };
};

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
        Showing <span className="font-semibold">{(currentPage - 1) * ROWS_PER_PAGE + 1}</span> to{' '}
        <span className="font-semibold">{Math.min(currentPage * ROWS_PER_PAGE, totalItems)}</span> of{' '}
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

// Enhanced Analytics Charts Component
const AnalyticsCharts = ({ users, selectedUsers, showSelectedOnly = false }) => {
  const [registrationTimeRange, setRegistrationTimeRange] = useState('last30days');
  const [genderTimeRange, setGenderTimeRange] = useState('all');
  const [activationTimeRange, setActivationTimeRange] = useState('last7days');
  const [activationChartType, setActivationChartType] = useState('daily'); // daily, hourly, weekly
  const [activationMetric, setActivationMetric] = useState('duration'); // duration, sessions, avgDuration
  const [viewMode, setViewMode] = useState('charts'); // charts, table, list
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Filter users based on selection
  const targetUsers = showSelectedOnly 
    ? users.filter(user => selectedUsers.includes(user._id))
    : users;

  // Prepare comprehensive registration data
  const prepareRegistrationData = () => {
    const now = new Date();
    let filteredUsers = [...targetUsers];
    let timeInterval = { start: null, end: null };
    
    // Apply time range filter
    if (registrationTimeRange !== 'all') {
      filteredUsers = filteredUsers.filter(user => {
        const userDate = new Date(user.createdAt);
        switch(registrationTimeRange) {
          case 'today':
            timeInterval = {
              start: startOfDay(now),
              end: endOfDay(now)
            };
            return isWithinInterval(userDate, timeInterval);
          case 'yesterday':
            const yesterday = subDays(now, 1);
            timeInterval = {
              start: startOfDay(yesterday),
              end: endOfDay(yesterday)
            };
            return isWithinInterval(userDate, timeInterval);
          case 'last7days':
            timeInterval = {
              start: subDays(now, 7),
              end: endOfDay(now)
            };
            return isWithinInterval(userDate, timeInterval);
          case 'last30days':
            timeInterval = {
              start: subDays(now, 30),
              end: endOfDay(now)
            };
            return isWithinInterval(userDate, timeInterval);
          case 'last90days':
            timeInterval = {
              start: subDays(now, 90),
              end: endOfDay(now)
            };
            return isWithinInterval(userDate, timeInterval);
          case 'thisMonth':
            timeInterval = {
              start: startOfMonth(now),
              end: endOfMonth(now)
            };
            return isWithinInterval(userDate, timeInterval);
          case 'thisYear':
            timeInterval = {
              start: startOfYear(now),
              end: endOfYear(now)
            };
            return isWithinInterval(userDate, timeInterval);
          case 'custom':
            // For custom range, you would implement date pickers
            return true;
          default:
            return true;
        }
      });
    }
    
    // Group by date based on time range
    let groupFormat = 'yyyy-MM-dd';
    let intervalDays = eachDayOfInterval(timeInterval);
    
    if (registrationTimeRange === 'thisYear' || registrationTimeRange === 'all') {
      groupFormat = 'yyyy-MM';
      intervalDays = eachMonthOfInterval(timeInterval);
    }
    
    // Initialize with all dates in interval
    const grouped = {};
    intervalDays.forEach(date => {
      const key = format(date, groupFormat);
      grouped[key] = 0;
    });
    
    // Count registrations
    filteredUsers.forEach(user => {
      const key = format(new Date(user.createdAt), groupFormat);
      if (grouped[key] !== undefined) {
        grouped[key] = (grouped[key] || 0) + 1;
      }
    });
    
    // Convert to array and format for display
    return Object.entries(grouped)
      .map(([date, count]) => ({
        date: format(new Date(date), groupFormat === 'yyyy-MM' ? 'MMM yyyy' : 'MMM dd'),
        fullDate: date,
        users: count,
        cumulative: Object.entries(grouped)
          .filter(([d]) => new Date(d) <= new Date(date))
          .reduce((sum, [_, c]) => sum + c, 0)
      }))
      .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
  };

  // Prepare enhanced gender data
  const prepareGenderData = () => {
    let filteredUsers = [...targetUsers];
    const now = new Date();
    
    // Apply time range filter
    if (genderTimeRange !== 'all') {
      filteredUsers = filteredUsers.filter(user => {
        const userDate = new Date(user.createdAt);
        switch(genderTimeRange) {
          case 'today':
            return isWithinInterval(userDate, {
              start: startOfDay(now),
              end: endOfDay(now)
            });
          case 'last7days':
            return isWithinInterval(userDate, {
              start: subDays(now, 7),
              end: endOfDay(now)
            });
          case 'last30days':
            return isWithinInterval(userDate, {
              start: subDays(now, 30),
              end: endOfDay(now)
            });
          case 'thisMonth':
            return isWithinInterval(userDate, {
              start: startOfMonth(now),
              end: endOfMonth(now)
            });
          case 'thisYear':
            return isWithinInterval(userDate, {
              start: startOfYear(now),
              end: endOfYear(now)
            });
          default:
            return true;
        }
      });
    }
    
    // Group by gender with detailed stats
    const genderStats = {
      Male: { count: 0, active: 0, avgActivation: 0 },
      Female: { count: 0, active: 0, avgActivation: 0 },
      Other: { count: 0, active: 0, avgActivation: 0 },
      'Not specified': { count: 0, active: 0, avgActivation: 0 }
    };
    
    filteredUsers.forEach(user => {
      const gender = user.gender || 'Not specified';
      const activation = calculateActivationDuration(user.activationHistory || []);
      
      genderStats[gender].count++;
      if (activation.active) genderStats[gender].active++;
      genderStats[gender].avgActivation += activation.totalDuration;
    });
    
    // Calculate average activation time
    Object.keys(genderStats).forEach(gender => {
      if (genderStats[gender].count > 0) {
        genderStats[gender].avgActivation = 
          Math.round((genderStats[gender].avgActivation / genderStats[gender].count) / (1000 * 60 * 60) * 100) / 100;
      }
    });
    
    // Convert to array for chart
    return Object.entries(genderStats)
      .filter(([_, stats]) => stats.count > 0)
      .map(([name, stats]) => ({
        name,
        value: stats.count,
        active: stats.active,
        percentage: Math.round((stats.count / filteredUsers.length) * 100),
        avgActivation: stats.avgActivation,
        fill: name === 'Male' ? '#3B82F6' : 
              name === 'Female' ? '#EC4899' : 
              name === 'Other' ? '#8B5CF6' : '#6B7280'
      }));
  };

  // Enhanced activation analytics data
  const prepareActivationData = () => {
    const now = new Date();
    let filteredUsers = [...targetUsers];
    
    // Apply time range filter
    if (activationTimeRange !== 'all') {
      filteredUsers = filteredUsers.filter(user => {
        const userDate = new Date(user.createdAt);
        switch(activationTimeRange) {
          case 'today':
            return isWithinInterval(userDate, {
              start: startOfDay(now),
              end: endOfDay(now)
            });
          case 'last7days':
            return isWithinInterval(userDate, {
              start: subDays(now, 7),
              end: endOfDay(now)
            });
          case 'last30days':
            return isWithinInterval(userDate, {
              start: subDays(now, 30),
              end: endOfDay(now)
            });
          case 'thisMonth':
            return isWithinInterval(userDate, {
              start: startOfMonth(now),
              end: endOfMonth(now)
            });
          case 'thisYear':
            return isWithinInterval(userDate, {
              start: startOfYear(now),
              end: endOfYear(now)
            });
          default:
            return true;
        }
      });
    }
    
    // Prepare data based on chart type
    let data = [];
    
    if (activationChartType === 'daily') {
      // Daily activation metrics for last 30 days
      const days = eachDayOfInterval({
        start: subDays(now, 30),
        end: now
      });
      
      data = days.map(day => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        
        let totalDuration = 0;
        let totalSessions = 0;
        let activeUsers = 0;
        let totalUsers = 0;
        
        filteredUsers.forEach(user => {
          const activation = calculateActivationDuration(user.activationHistory || [], day);
          if (activation.totalDuration > 0) {
            totalDuration += activation.totalDuration;
            totalSessions += activation.sessions;
            activeUsers++;
          }
          totalUsers++;
        });
        
        return {
          date: format(day, 'MMM dd'),
          fullDate: day,
          duration: Math.round(totalDuration / (1000 * 60 * 60) * 100) / 100, // in hours
          sessions: totalSessions,
          avgDuration: totalSessions > 0 ? Math.round((totalDuration / totalSessions) / (1000 * 60) * 100) / 100 : 0, // in minutes
          activeUsers,
          activePercentage: Math.round((activeUsers / totalUsers) * 100),
          totalUsers
        };
      });
    } else if (activationChartType === 'hourly') {
      // Hourly pattern for last 7 days
      const hours = Array.from({ length: 24 }, (_, i) => i);
      const lastWeekStart = subDays(now, 7);
      
      data = hours.map(hour => {
        let hourDuration = 0;
        let hourSessions = 0;
        
        filteredUsers.forEach(user => {
          const activationHistory = user.activationHistory || [];
          activationHistory.forEach((record, index) => {
            if (record.status === 'active') {
              const startTime = new Date(record.timestamp);
              const endTime = activationHistory[index + 1] ? 
                new Date(activationHistory[index + 1].timestamp) : now;
              
              // Only consider last 7 days
              if (startTime >= lastWeekStart) {
                const startHour = startTime.getHours();
                const endHour = endTime.getHours();
                
                if (startHour <= hour && endHour >= hour) {
                  const hourStart = new Date(startTime);
                  hourStart.setHours(hour, 0, 0, 0);
                  const hourEnd = new Date(hourStart);
                  hourEnd.setHours(hour + 1, 0, 0, 0);
                  
                  const overlapStart = startTime > hourStart ? startTime : hourStart;
                  const overlapEnd = endTime < hourEnd ? endTime : hourEnd;
                  
                  if (overlapStart < overlapEnd) {
                    hourDuration += overlapEnd - overlapStart;
                    hourSessions++;
                  }
                }
              }
            }
          });
        });
        
        return {
          hour: `${hour}:00`,
          duration: Math.round(hourDuration / (1000 * 60 * 60) * 100) / 100,
          sessions: hourSessions,
          avgDuration: hourSessions > 0 ? Math.round((hourDuration / hourSessions) / (1000 * 60) * 100) / 100 : 0
        };
      });
    } else if (activationChartType === 'weekly') {
      // Weekly trends
      const weeks = Array.from({ length: 12 }, (_, i) => subDays(now, i * 7));
      
      data = weeks.map(weekDate => {
        const weekStart = startOfWeek(weekDate);
        const weekEnd = endOfWeek(weekDate);
        
        let weekDuration = 0;
        let weekSessions = 0;
        let weekActiveUsers = 0;
        
        filteredUsers.forEach(user => {
          const activationHistory = user.activationHistory || [];
          let userWeekDuration = 0;
          let userWeekSessions = 0;
          
          activationHistory.forEach((record, index) => {
            if (record.status === 'active') {
              const startTime = new Date(record.timestamp);
              const endTime = activationHistory[index + 1] ? 
                new Date(activationHistory[index + 1].timestamp) : now;
              
              if (isWithinInterval(startTime, { start: weekStart, end: weekEnd }) ||
                  isWithinInterval(endTime, { start: weekStart, end: weekEnd })) {
                
                const sessionStart = startTime < weekStart ? weekStart : startTime;
                const sessionEnd = endTime > weekEnd ? weekEnd : endTime;
                
                if (sessionStart < sessionEnd) {
                  const sessionDuration = sessionEnd - sessionStart;
                  userWeekDuration += sessionDuration;
                  userWeekSessions++;
                }
              }
            }
          });
          
          if (userWeekDuration > 0) {
            weekDuration += userWeekDuration;
            weekSessions += userWeekSessions;
            weekActiveUsers++;
          }
        });
        
        return {
          week: `Week ${format(weekStart, 'w')}`,
          dateRange: `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd')}`,
          duration: Math.round(weekDuration / (1000 * 60 * 60) * 100) / 100,
          sessions: weekSessions,
          avgDuration: weekSessions > 0 ? Math.round((weekDuration / weekSessions) / (1000 * 60) * 100) / 100 : 0,
          activeUsers: weekActiveUsers
        };
      }).reverse();
    }
    
    return data;
  };

  // Prepare user engagement radar data
  const prepareEngagementData = () => {
    const activeUsers = targetUsers.filter(user => 
      calculateActivationDuration(user.activationHistory || []).active
    ).length;
    
    const totalActivationTime = targetUsers.reduce((sum, user) => {
      const activation = calculateActivationDuration(user.activationHistory || []);
      return sum + activation.totalDuration;
    }, 0);
    
    const avgActivationPerUser = targetUsers.length > 0 ? 
      totalActivationTime / targetUsers.length / (1000 * 60 * 60) : 0; // in hours
    
    const frequentUsers = targetUsers.filter(user => {
      const activation = calculateActivationDuration(user.activationHistory || []);
      return activation.sessions >= 3;
    }).length;
    
    const recentActiveUsers = targetUsers.filter(user => {
      const activation = calculateActivationDuration(user.activationHistory || []);
      return activation.lastActivation && 
             differenceInDays(new Date(), activation.lastActivation) <= 1;
    }).length;
    
    const longSessionUsers = targetUsers.filter(user => {
      const activation = calculateActivationDuration(user.activationHistory || []);
      return activation.avgSessionDuration >= 30; // 30+ minutes avg session
    }).length;
    
    return [
      { subject: 'Active Now', A: Math.round((activeUsers / targetUsers.length) * 100), fullMark: 100 },
      { subject: 'Avg Hours/User', A: Math.min(Math.round(avgActivationPerUser * 10), 100), fullMark: 100 },
      { subject: 'Frequent Users', A: Math.round((frequentUsers / targetUsers.length) * 100), fullMark: 100 },
      { subject: 'Recent Active', A: Math.round((recentActiveUsers / targetUsers.length) * 100), fullMark: 100 },
      { subject: 'Long Sessions', A: Math.round((longSessionUsers / targetUsers.length) * 100), fullMark: 100 }
    ];
  };

  const registrationData = prepareRegistrationData();
  const genderData = prepareGenderData();
  const activationData = prepareActivationData();
  const engagementData = prepareEngagementData();

  // Calculate statistics
  const totalActiveUsers = targetUsers.filter(user => 
    calculateActivationDuration(user.activationHistory || []).active
  ).length;

  const totalActivationHours = targetUsers.reduce((sum, user) => {
    const activation = calculateActivationDuration(user.activationHistory || []);
    return sum + activation.totalDuration;
  }, 0) / (1000 * 60 * 60);

  const avgSessionDuration = targetUsers.reduce((sum, user) => {
    const activation = calculateActivationDuration(user.activationHistory || []);
    return sum + activation.avgSessionDuration;
  }, 0) / targetUsers.length;

  return (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <FaChartBar className="text-primary-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Advanced Analytics Dashboard</h3>
            <p className="text-sm text-gray-500">
              {showSelectedOnly ? `Analyzing ${selectedUsers.length} selected users` : `Analyzing ${users.length} total users`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FaCogs />
            {showAdvanced ? 'Hide Advanced' : 'Advanced Options'}
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('charts')}
              className={`p-2 rounded-lg ${viewMode === 'charts' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-100'}`}
              title="Chart View"
            >
              <FaChartBar />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-100'}`}
              title="Table View"
            >
              <FaTable />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-100'}`}
              title="List View"
            >
              <FaList />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Options Panel */}
      {showAdvanced && (
        <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaCalendar className="inline mr-2" />
                Time Granularity
              </label>
              <select
                value={registrationTimeRange}
                onChange={(e) => setRegistrationTimeRange(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="last90days">Last 90 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="thisYear">This Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaClock className="inline mr-2" />
                Activation Analysis
              </label>
              <select
                value={activationChartType}
                onChange={(e) => setActivationChartType(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="daily">Daily Trends</option>
                <option value="hourly">Hourly Patterns</option>
                <option value="weekly">Weekly Analysis</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaChartLine className="inline mr-2" />
                Metric Type
              </label>
              <select
                value={activationMetric}
                onChange={(e) => setActivationMetric(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="duration">Total Duration (hours)</option>
                <option value="sessions">Number of Sessions</option>
                <option value="avgDuration">Average Session Duration</option>
                <option value="activeUsers">Active Users Count</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-green-600">{totalActiveUsers}</p>
              <p className="text-xs text-gray-500">
                {targetUsers.length > 0 ? Math.round((totalActiveUsers / targetUsers.length) * 100) : 0}% of total
              </p>
            </div>
            <FaToggleOn className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Activation</p>
              <p className="text-2xl font-bold text-blue-600">{Math.round(totalActivationHours * 100) / 100}h</p>
              <p className="text-xs text-gray-500">Across all users</p>
            </div>
            <FaClock className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Session</p>
              <p className="text-2xl font-bold text-purple-600">{Math.round(avgSessionDuration * 100) / 100}m</p>
              <p className="text-xs text-gray-500">Per user session</p>
            </div>
            <FaHistory className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Engagement Score</p>
              <p className="text-2xl font-bold text-orange-600">
                {targetUsers.length > 0 ? Math.round((totalActiveUsers / targetUsers.length) * 100) : 0}
              </p>
              <p className="text-xs text-gray-500">Based on activity</p>
            </div>
            <FaChartLine className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Trends Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaCalendar className="text-blue-500" />
              <h4 className="font-medium text-gray-800">Registration Trends</h4>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                {registrationTimeRange}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={registrationTimeRange}
                onChange={(e) => setRegistrationTimeRange(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="last90days">Last 90 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="thisYear">This Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={registrationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'users') return [`${value} users`, 'Daily Registrations'];
                    if (name === 'cumulative') return [`${value} users`, 'Cumulative Total'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Bar 
                  dataKey="users" 
                  name="Daily Registrations" 
                  fill="#3B82F6" 
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Line 
                  type="monotone" 
                  dataKey="cumulative" 
                  name="Cumulative Total" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <p className="text-gray-600">Total Registrations</p>
              <p className="text-xl font-bold text-blue-600">
                {registrationData.reduce((sum, item) => sum + item.users, 0)}
              </p>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <p className="text-gray-600">Average Daily</p>
              <p className="text-xl font-bold text-green-600">
                {Math.round(registrationData.reduce((sum, item) => sum + item.users, 0) / registrationData.length) || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Gender Distribution Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaUsers className="text-purple-500" />
              <h4 className="font-medium text-gray-800">Gender Distribution</h4>
            </div>
            <select
              value={genderTimeRange}
              onChange={(e) => setGenderTimeRange(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="thisYear">This Year</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => {
                    if (name === 'value') return [`${value} users`, 'Count'];
                    if (name === 'active') return [`${value} active`, 'Active Users'];
                    if (name === 'avgActivation') return [`${value} hours`, 'Avg Activation'];
                    return [value, name];
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {genderData.map((gender, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: gender.fill }} />
                  <span>{gender.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">{gender.value} users</span>
                  <span className="text-gray-500 ml-2">({gender.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activation Analysis Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaToggleOn className="text-green-500" />
              <h4 className="font-medium text-gray-800">Activation Analysis</h4>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                {activationChartType}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={activationTimeRange}
                onChange={(e) => setActivationTimeRange(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="today">Today</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="thisYear">This Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey={activationChartType === 'hourly' ? 'hour' : 'date'} 
                  stroke="#666" 
                  fontSize={12} 
                />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip 
                  formatter={(value, name) => {
                    switch(name) {
                      case 'duration': return [`${value} hours`, 'Total Duration'];
                      case 'sessions': return [`${value} sessions`, 'Number of Sessions'];
                      case 'avgDuration': return [`${value} minutes`, 'Avg Session Duration'];
                      case 'activeUsers': return [`${value} users`, 'Active Users'];
                      default: return [value, name];
                    }
                  }}
                  labelFormatter={(label) => {
                    if (activationChartType === 'weekly') {
                      const item = activationData.find(d => d.date === label);
                      return item ? item.dateRange : label;
                    }
                    return activationChartType === 'hourly' ? `Hour: ${label}` : `Date: ${label}`;
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey={activationMetric} 
                  name={
                    activationMetric === 'duration' ? 'Total Duration (hours)' :
                    activationMetric === 'sessions' ? 'Number of Sessions' :
                    activationMetric === 'avgDuration' ? 'Avg Session (minutes)' :
                    'Active Users Count'
                  }
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="text-center">
              <p className="text-gray-600">Peak Value</p>
              <p className="font-bold text-green-600">
                {activationData.length > 0 ? 
                  Math.max(...activationData.map(d => d[activationMetric] || 0)).toFixed(1) : 
                  0
                }
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Average</p>
              <p className="font-bold text-blue-600">
                {activationData.length > 0 ? 
                  (activationData.reduce((sum, d) => sum + (d[activationMetric] || 0), 0) / activationData.length).toFixed(1) : 
                  0
                }
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Total</p>
              <p className="font-bold text-purple-600">
                {activationData.reduce((sum, d) => sum + (d[activationMetric] || 0), 0).toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* User Engagement Radar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaChartArea className="text-orange-500" />
              <h4 className="font-medium text-gray-800">User Engagement Radar</h4>
            </div>
            <div className="text-sm text-gray-500">
              Overall engagement metrics (0-100 scale)
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={engagementData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" stroke="#666" fontSize={12} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#666" fontSize={10} />
                <Radar
                  name="Engagement"
                  dataKey="A"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Score']}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <FaInfoCircle className="text-blue-500" />
              <span>Higher scores indicate better user engagement across different metrics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table View (when selected) */}
      {viewMode === 'table' && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-medium text-gray-800">Detailed Analytics Data</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Registrations</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cumulative</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Activation Hours</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Active Users</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {registrationData.slice(-10).map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">{item.date}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.users}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.cumulative}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {Math.round((activationData[index]?.duration || 0) * 100) / 100}h
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {activationData[index]?.activeUsers || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Filter Panel Component
const FilterPanel = ({ 
  filters, 
  onFilterChange, 
  onClearFilters,
  onSortChange,
  sortBy,
  users
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });

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

  const dateRangeOptions = [
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'last90days', label: 'Last 90 Days' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const sortOptions = [
    { value: 'latest', label: 'Latest First', icon: <FaSortAmountDown /> },
    { value: 'oldest', label: 'Oldest First', icon: <FaSortAmountUp /> },
    { value: 'name-asc', label: 'Name A-Z', icon: <FaSortAlphaDown /> },
    { value: 'name-desc', label: 'Name Z-A', icon: <FaSortAlphaUp /> },
    { value: 'recent-active', label: 'Recently Active', icon: <FaClock /> },
    { value: 'longest-active', label: 'Longest Active', icon: <FaHistory /> },
    { value: 'most-sessions', label: 'Most Sessions', icon: <FaChartBar /> },
    { value: 'recent-inactive', label: 'Recently Inactive', icon: <FaCalendarTimes /> }
  ];

  const handleDateRangeChange = (value) => {
    if (value === 'custom') {
      setIsOpen(true); // Ensure custom date inputs are visible
      onFilterChange('dateRange', { 
        value: 'custom', 
        startDate: customDateRange.start ? startOfDay(new Date(customDateRange.start)) : null,
        endDate: customDateRange.end ? endOfDay(new Date(customDateRange.end)) : null
      });
      return;
    }
    
    let startDate = null;
    let endDate = null;
    const today = new Date();
    
    switch(value) {
      case 'today':
        startDate = startOfDay(today);
        endDate = endOfDay(today);
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        startDate = startOfDay(yesterday);
        endDate = endOfDay(yesterday);
        break;
      case 'last7days':
        startDate = subDays(today, 7);
        endDate = endOfDay(today);
        break;
      case 'last30days':
        startDate = subDays(today, 30);
        endDate = endOfDay(today);
        break;
      case 'last90days':
        startDate = subDays(today, 90);
        endDate = endOfDay(today);
        break;
      case 'thisMonth':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case 'thisYear':
        startDate = startOfYear(today);
        endDate = endOfYear(today);
        break;
      default:
        startDate = null;
        endDate = null;
    }
    
    onFilterChange('dateRange', { value, startDate, endDate });
  };

  const handleCustomDateApply = () => {
    if (customDateRange.start && customDateRange.end) {
      const startDate = startOfDay(new Date(customDateRange.start));
      const endDate = endOfDay(new Date(customDateRange.end));
      
      if (startDate <= endDate) {
        onFilterChange('dateRange', {
          value: 'custom',
          startDate,
          endDate
        });
      } else {
        toast.error('Start date must be before end date');
      }
    }
  };

  // Calculate filter statistics
  const filteredCount = users.length;
  const activeUsers = users.filter(user => 
    calculateActivationDuration(user.activationHistory || []).active
  ).length;
  const maleUsers = users.filter(user => user.gender === 'Male').length;
  const femaleUsers = users.filter(user => user.gender === 'Female').length;

  return (
    <div className="mb-6">
      {/* Filter Header with Statistics */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <FaFilter className="text-primary-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Filters & Sorting</h3>
            <p className="text-sm text-gray-500">
              {filteredCount} users • {activeUsers} active • {maleUsers} male • {femaleUsers} female
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {isOpen ? <FaChevronUp /> : <FaChevronDown />}
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

      {/* Filter Content */}
      {isOpen && (
        <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Filters */}
            <div className="space-y-6">
              {/* Gender Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <FaMars className="inline mr-2 text-blue-500" />
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

              {/* Activation Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <FaToggleOn className="inline mr-2 text-green-500" />
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

            {/* Right Column - Date & Sort */}
            <div className="space-y-6">
              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <FaCalendar className="inline mr-2 text-purple-500" />
                  Registration Date
                </label>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {dateRangeOptions.slice(0, -1).map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleDateRangeChange(option.value)}
                        className={`px-3 py-2 text-sm rounded-lg transition-all ${
                          filters.dateRange?.value === option.value
                            ? 'bg-purple-100 text-purple-700 border-2 border-purple-300 shadow-sm'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom Date Range */}
                  {filters.dateRange?.value === 'custom' && (
                    <div className="bg-white p-3 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-3 mb-3">
                        <FaCalendarAlt className="text-purple-500" />
                        <span className="text-sm font-medium text-gray-700">Custom Date Range</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={customDateRange.start}
                            onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">End Date</label>
                          <input
                            type="date"
                            value={customDateRange.end}
                            onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleCustomDateApply}
                        disabled={!customDateRange.start || !customDateRange.end}
                        className="mt-3 w-full px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Apply Custom Range
                      </button>
                    </div>
                  )}
                  
                  {/* Apply Custom Range Button */}
                  {filters.dateRange?.value !== 'custom' && (
                    <button
                      onClick={() => handleDateRangeChange('custom')}
                      className={`w-full px-4 py-2 text-sm rounded-lg transition-all ${
                        filters.dateRange?.value === 'custom'
                          ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                          : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <FaCalendarAlt className="inline mr-2" />
                      Set Custom Date Range
                    </button>
                  )}
                </div>
              </div>

              {/* Sorting Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <FaSortAmountDown className="inline mr-2 text-orange-500" />
                  Sort By
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

          {/* Date Range Display */}
          {filters.dateRange?.startDate && filters.dateRange?.endDate && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaCalendar className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    {filters.dateRange.value === 'custom' ? 'Custom Range:' : 'Date Range:'}
                  </span>
                  <span className="text-sm text-blue-700">
                    {format(filters.dateRange.startDate, 'MMM dd, yyyy')} - {format(filters.dateRange.endDate, 'MMM dd, yyyy')}
                  </span>
                </div>
                <button
                  onClick={() => handleDateRangeChange('')}
                  className="text-blue-500 hover:text-blue-700 text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {(filters.gender || filters.activationStatus || filters.dateRange?.value || sortBy !== 'latest') && (
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <FaFilter className="text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Active Filters:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.gender && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-full border border-blue-200">
                {getGenderIcon(filters.gender)}
                Gender: {filters.gender}
                <button 
                  onClick={() => onFilterChange('gender', '')}
                  className="ml-1.5 text-blue-500 hover:text-blue-700 hover:scale-110 transition-transform"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.activationStatus && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-full border border-green-200">
                <FaToggleOn className={filters.activationStatus === 'active' ? 'text-green-500' : 'text-red-500'} />
                Status: {filters.activationStatus}
                <button 
                  onClick={() => onFilterChange('activationStatus', '')}
                  className="ml-1.5 text-green-500 hover:text-green-700 hover:scale-110 transition-transform"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.dateRange?.value && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 text-sm rounded-full border border-purple-200">
                <FaCalendar className="text-purple-500" />
                Date: {dateRangeOptions.find(d => d.value === filters.dateRange.value)?.label || 'Custom'}
                <button 
                  onClick={() => handleDateRangeChange('')}
                  className="ml-1.5 text-purple-500 hover:text-purple-700 hover:scale-110 transition-transform"
                >
                  ×
                </button>
              </span>
            )}
            
            {sortBy !== 'latest' && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 text-sm rounded-full border border-orange-200">
                <FaSortAmountDown className="text-orange-500" />
                Sort: {sortOptions.find(s => s.value === sortBy)?.label}
                <button 
                  onClick={() => onSortChange('latest')}
                  className="ml-1.5 text-orange-500 hover:text-orange-700 hover:scale-110 transition-transform"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
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
  const [activationModal, setActivationModal] = useState({ show: false, userId: null, currentStatus: false });
  const [showSelectedAnalytics, setShowSelectedAnalytics] = useState(false);
  
  const [viewModal, setViewModal] = useState({ show: false, userId: null });
  const [editModal, setEditModal] = useState({ show: false, userId: null });
  const [selectedUserData, setSelectedUserData] = useState(null);

  const [filters, setFilters] = useState({
    gender: '',
    activationStatus: '',
    dateRange: { value: '', startDate: null, endDate: null }
  });
  const [sortBy, setSortBy] = useState('latest');

  /* =========================
     FETCH USERS FROM BACKEND
  ========================= */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userAPI.getAllUsers();
      const usersWithActivation = res.data.data.map(user => ({
        ...user,
        activationHistory: user.activationHistory || []
      }));
      setUsers(usersWithActivation);
      setFilteredUsers(usersWithActivation);
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

  // Apply filters and sorting to ALL users
  useEffect(() => {
    let result = [...users];

    // Apply search filter
    if (searchTerm.trim() !== "") {
      result = result.filter(user =>
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.mobile?.includes(searchTerm) ||
        user.gender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatDateTime(user.createdAt).date.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply gender filter
    if (filters.gender) {
      result = result.filter(user => user.gender === filters.gender);
    }

    // Apply activation status filter
    if (filters.activationStatus) {
      result = result.filter(user => {
        const activation = calculateActivationDuration(user.activationHistory);
        return filters.activationStatus === 'active' ? activation.active : !activation.active;
      });
    }

    // Apply date range filter - FIXED with proper null checks
    if (filters.dateRange?.startDate && filters.dateRange?.endDate) {
      result = result.filter(user => {
        const userDate = new Date(user.createdAt);
        return isWithinInterval(userDate, {
          start: filters.dateRange.startDate,
          end: filters.dateRange.endDate
        });
      });
    }

    // Apply sorting with enhanced options
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
        case 'recent-inactive':
          if (!activationA.active && activationB.active) return -1;
          if (activationA.active && !activationB.active) return 1;
          if (activationA.lastActivation && activationB.lastActivation) {
            return new Date(activationB.lastActivation) - new Date(activationA.lastActivation);
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'longest-active':
          return activationB.totalDuration - activationA.totalDuration;
        case 'most-sessions':
          return activationB.sessions - activationA.sessions;
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    setFilteredUsers(result);
    setPage(1);
  }, [users, searchTerm, filters, sortBy]);

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
     FILTER HANDLERS
  ========================= */
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
      fetchUsers();
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

  /* =========================
     ACTIVATION STATUS HANDLERS
  ========================= */
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

  /* =========================
     LOGOUT HANDLER
  ========================= */
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
    fetchUsers();
    setEditModal({ show: false, userId: null });
    setSelectedUserData(null);
  };

  /* =========================
     PAGE CHANGE HANDLER
  ========================= */
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
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
            Advanced User Management
          </h1>
          <p className="text-gray-600 text-lg">Comprehensive user management with advanced filtering & analytics</p>
          <div className="mt-4 text-sm text-gray-500 bg-yellow-50 inline-block px-4 py-2 rounded-lg">
            <FaLock className="inline mr-2 text-yellow-500" />
            Select users to enable actions
          </div>
        </div>

        <div className="card backdrop-blur-xl shadow-2xl">
          {/* Analytics Charts */}
          <AnalyticsCharts 
            users={users} 
            selectedUsers={selectedUsers}
            showSelectedOnly={showSelectedAnalytics}
          />

          {/* Action Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search across all users..."
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
                {selectedUsers.length} selected
              </span>
              
              {selectedUsers.length > 0 && (
                <button
                  onClick={() => setShowSelectedAnalytics(!showSelectedAnalytics)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    showSelectedAnalytics
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  title="Toggle selected users analytics"
                >
                  <FaChartPie />
                  {showSelectedAnalytics ? 'Show All Analytics' : 'Show Selected Analytics'}
                </button>
              )}
              
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Refresh user list"
              >
                <FaRedo className="text-primary-600" />
                Refresh
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

          {/* Filter Panel */}
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            onSortChange={handleSortChange}
            sortBy={sortBy}
            users={users}
          />

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

                        {/* Name & Details */}
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
                              <p className="text-xs text-gray-400 mt-1">{user.mobile}</p>
                              {activation.sessions > 0 && (
                                <p className="text-xs text-green-600 mt-1">
                                  {activation.sessions} sessions • {activation.avgSessionDuration}m avg
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Registration Date */}
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-gray-700">
                              <FaCalendarAlt className="text-primary-500" />
                              <span className="font-medium">{registrationDate.date}</span>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {registrationDate.time}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                        </td>

                        {/* Gender */}
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
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              {/* View Button */}
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
                              
                              {/* Edit Button */}
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
                              {/* Delete Button */}
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

                        {/* Activation Status */}
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
                                } ${!isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
                                {activation.active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {activation.active ? (
                                <span className="flex items-center gap-1 text-green-600">
                                  <FaClock className="w-3 h-3" />
                                  Active now
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-gray-500">
                                  <FaCalendarTimes className="w-3 h-3" />
                                  Not active
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {activation.totalDays > 0 ? `${activation.totalDays}d ${activation.totalHours}h` : 
                               activation.totalHours > 0 ? `${activation.totalHours}h ${activation.totalMinutes}m` : 
                               'Not activated'}
                            </div>
                            {activation.sessions > 0 && (
                              <div className="text-xs text-blue-500 mt-1">
                                {activation.sessions} sessions
                              </div>
                            )}
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

          {/* Summary Statistics */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-blue-600">{users.length}</p>
                  <p className="text-xs text-gray-500">In database</p>
                </div>
                <FaUser className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-green-600">
                    {users.filter(u => calculateActivationDuration(u.activationHistory || []).active).length}
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
                    {users.filter(u => u.gender === 'Male').length}
                  </p>
                  <p className="text-xs text-gray-500">
                    {users.length > 0 ? Math.round((users.filter(u => u.gender === 'Male').length / users.length) * 100) : 0}%
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
                    {users.filter(u => u.gender === 'Female').length}
                  </p>
                  <p className="text-xs text-gray-500">
                    {users.length > 0 ? Math.round((users.filter(u => u.gender === 'Female').length / users.length) * 100) : 0}%
                  </p>
                </div>
                <FaVenus className="w-8 h-8 text-pink-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
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
        message={`Are you sure you want to ${activationModal.currentStatus ? 'deactivate' : 'activate'} ${activationModal.userName || 'this user'}? This will track their activation time.`}
        confirmText={activationModal.currentStatus ? "Deactivate" : "Activate"}
        cancelText="Cancel"
        type={activationModal.currentStatus ? "warning" : "primary"}
        icon={activationModal.currentStatus ? 
          <FaToggleOff className="text-orange-600 mb-4 w-8 h-8" /> : 
          <FaToggleOn className="text-blue-600 mb-4 w-8 h-8" />}
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
        icon={<FaSignOutAlt className="text-red-600 mb-4 w-8 h-8" />}
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