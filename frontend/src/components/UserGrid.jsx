import React, { useEffect, useState, useMemo, useRef } from "react";
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
  FaCalendarTimes,
  FaGenderless,
  FaTrashAlt,
  FaChartBar,
  FaChartPie,
  FaUsers,
  FaToggleOn as FaToggleOnIcon,
  FaToggleOff as FaToggleOffIcon,
  FaChartLine,
  FaUserClock,
  FaCalendarDay,
  FaCalendarWeek,
  FaCalendarCheck,
  FaUserCheck,
  FaUserTimes,
  FaArrowRight,
  FaList,
  FaTable,
  FaUserFriends,
  FaUsersCog,
  FaChartArea,
  FaInfoCircle
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
  isValid,
  isSameDay,
  isSameMonth,
  isSameYear,
  subHours,
  parse,
  addDays,
  addMonths,
  addYears,
  differenceInMinutes,
  differenceInSeconds,
  subMonths,
  subYears,
  eachMonthOfInterval,
  isAfter,
  isBefore
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
  ComposedChart
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

// Enhanced activation duration calculation with real-time updates
const calculateActivationDuration = (activationHistory, specificDate = null, dateRange = null, realTime = true) => {
  if (!activationHistory || activationHistory.length === 0) {
    return { 
      active: false,
      totalDuration: 0,
      sessions: 0,
      lastActivation: null,
      firstActivation: null,
      todayDuration: 0,
      yesterdayDuration: 0,
      thisWeekDuration: 0,
      thisMonthDuration: 0,
      dateRangeDuration: 0,
      hourlyBreakdown: {},
      liveDuration: 0
    };
  }
  
  // Sort history by date
  const sortedHistory = [...activationHistory].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );
  
  let totalDuration = 0;
  let isCurrentlyActive = false;
  let sessions = 0;
  let todayDuration = 0;
  let yesterdayDuration = 0;
  let thisWeekDuration = 0;
  let thisMonthDuration = 0;
  let dateRangeDuration = 0;
  let liveDuration = 0;
  const hourlyBreakdown = {};
  
  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = startOfDay(subDays(now, 1));
  const yesterdayEnd = endOfDay(subDays(now, 1));
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  
  // Initialize hourly breakdown for 24 hours
  for (let hour = 0; hour < 24; hour++) {
    hourlyBreakdown[hour] = 0;
  }

  // Check if currently active (last status is active)
  const lastEntry = sortedHistory[sortedHistory.length - 1];
  const isActiveNow = lastEntry && lastEntry.status === 'active';
  isCurrentlyActive = isActiveNow;

  // Calculate durations for specific date or date range
  for (let i = 0; i < sortedHistory.length; i += 2) {
    const start = sortedHistory[i];
    const end = sortedHistory[i + 1] || (isActiveNow ? { status: 'inactive', timestamp: new Date().toISOString() } : null);
    
    if (start.status === 'active' && end) {
      const startTime = new Date(start.timestamp);
      const endTime = new Date(end.timestamp);
      
      // Calculate session duration
      let sessionDuration = endTime - startTime;
      
      // If this is the current active session and we want real-time, add time since activation
      if (isActiveNow && i === sortedHistory.length - 2 && realTime) {
        sessionDuration = now - startTime;
        liveDuration = now - startTime;
      }
      
      // Check if session falls within specific date
      if (specificDate) {
        const specificDateStart = startOfDay(specificDate);
        const specificDateEnd = endOfDay(specificDate);
        
        const sessionStart = startTime < specificDateStart ? specificDateStart : startTime;
        const sessionEnd = endTime > specificDateEnd ? specificDateEnd : endTime;
        
        if (sessionStart < sessionEnd) {
          const filteredSessionDuration = sessionEnd - sessionStart;
          totalDuration += filteredSessionDuration;
          
          // Add to date-specific duration
          if (isSameDay(specificDate, now)) {
            todayDuration += filteredSessionDuration;
          }
          
          // Add to hourly breakdown
          const hourStart = new Date(sessionStart);
          const hourEnd = new Date(sessionEnd);
          while (hourStart < hourEnd) {
            const hour = hourStart.getHours();
            const nextHour = new Date(hourStart);
            nextHour.setHours(hour + 1, 0, 0, 0);
            const hourDuration = Math.min(hourEnd - hourStart, nextHour - hourStart);
            hourlyBreakdown[hour] += hourDuration;
            hourStart.setHours(hour + 1, 0, 0, 0);
          }
          
          sessions++;
        }
      } else if (dateRange) {
        // Check if session falls within date range
        const rangeStart = dateRange.startDate;
        const rangeEnd = dateRange.endDate;
        
        const sessionStart = startTime < rangeStart ? rangeStart : startTime;
        const sessionEnd = endTime > rangeEnd ? rangeEnd : endTime;
        
        if (sessionStart < sessionEnd) {
          const filteredSessionDuration = sessionEnd - sessionStart;
          dateRangeDuration += filteredSessionDuration;
          
          // Add to hourly breakdown for each day in range
          const currentDay = startOfDay(sessionStart);
          const rangeEndDay = endOfDay(sessionEnd);
          
          while (currentDay <= rangeEndDay) {
            const dayStart = startOfDay(currentDay);
            const dayEnd = endOfDay(currentDay);
            
            const daySessionStart = sessionStart < dayStart ? dayStart : sessionStart;
            const daySessionEnd = sessionEnd > dayEnd ? dayEnd : sessionEnd;
            
            if (daySessionStart < daySessionEnd) {
              const dayDuration = daySessionEnd - daySessionStart;
              
              // Add to appropriate time period
              if (isSameDay(currentDay, now)) {
                todayDuration += dayDuration;
              }
              if (isSameDay(currentDay, subDays(now, 1))) {
                yesterdayDuration += dayDuration;
              }
              if (currentDay >= weekStart) {
                thisWeekDuration += dayDuration;
              }
              if (currentDay >= monthStart) {
                thisMonthDuration += dayDuration;
              }
              
              // Add to hourly breakdown for this day
              const hourStart = new Date(daySessionStart);
              const hourEnd = new Date(daySessionEnd);
              while (hourStart < hourEnd) {
                const hour = hourStart.getHours();
                const nextHour = new Date(hourStart);
                nextHour.setHours(hour + 1, 0, 0, 0);
                const hourDuration = Math.min(hourEnd - hourStart, nextHour - hourStart);
                hourlyBreakdown[hour] += hourDuration;
                hourStart.setHours(hour + 1, 0, 0, 0);
              }
            }
            
            currentDay.setDate(currentDay.getDate() + 1);
          }
          
          sessions++;
        }
      } else {
        // Calculate for all time
        totalDuration += sessionDuration;
        
        // Calculate durations for different time periods
        if (startTime <= now && (isSameDay(startTime, now) || isSameDay(endTime, now))) {
          const sessionStart = startTime < todayStart ? todayStart : startTime;
          const sessionEnd = endTime > now ? now : endTime;
          if (sessionStart < sessionEnd) {
            todayDuration += sessionEnd - sessionStart;
          }
        }
        
        if (startTime <= yesterdayEnd && endTime >= yesterdayStart) {
          const sessionStart = startTime < yesterdayStart ? yesterdayStart : startTime;
          const sessionEnd = endTime > yesterdayEnd ? yesterdayEnd : endTime;
          if (sessionStart < sessionEnd) {
            yesterdayDuration += sessionEnd - sessionStart;
          }
        }
        
        if (startTime <= now && endTime >= weekStart) {
          const sessionStart = startTime < weekStart ? weekStart : startTime;
          const sessionEnd = endTime > now ? now : endTime;
          if (sessionStart < sessionEnd) {
            thisWeekDuration += sessionEnd - sessionStart;
          }
        }
        
        if (startTime <= now && endTime >= monthStart) {
          const sessionStart = startTime < monthStart ? monthStart : startTime;
          const sessionEnd = endTime > now ? now : endTime;
          if (sessionStart < sessionEnd) {
            thisMonthDuration += sessionEnd - sessionStart;
          }
        }
        
        sessions++;
      }
    }
  }
  
  // Add live duration to today's total if user is currently active
  if (isCurrentlyActive && realTime) {
    todayDuration += liveDuration;
    thisWeekDuration += liveDuration;
    thisMonthDuration += liveDuration;
    totalDuration += liveDuration;
    
    // Add to current hour's breakdown
    const currentHour = now.getHours();
    hourlyBreakdown[currentHour] = (hourlyBreakdown[currentHour] || 0) + liveDuration;
  }
  
  return {
    active: isCurrentlyActive,
    totalDuration,
    sessions,
    lastActivation: sortedHistory.length > 0 ? new Date(sortedHistory[sortedHistory.length - 1].timestamp) : null,
    firstActivation: sortedHistory.length > 0 ? new Date(sortedHistory[0].timestamp) : null,
    todayDuration,
    yesterdayDuration,
    thisWeekDuration,
    thisMonthDuration,
    dateRangeDuration,
    hourlyBreakdown,
    avgSessionDuration: sessions > 0 ? totalDuration / sessions : 0,
    liveDuration
  };
};

// Format duration helper
const formatDuration = (milliseconds) => {
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

// Format duration in HH:MM:SS
const formatDurationHHMMSS = (milliseconds) => {
  if (!milliseconds || milliseconds <= 0) return "00:00:00";
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Format hours from milliseconds
const formatHours = (milliseconds) => {
  if (!milliseconds || milliseconds <= 0) return "0";
  return (milliseconds / (1000 * 60 * 60)).toFixed(2);
};

// Live timer component for active users
const LiveTimer = ({ startTime, className = "" }) => {
  const [elapsed, setElapsed] = useState(0);
  
  useEffect(() => {
    if (!startTime) return;
    
    const updateElapsed = () => {
      const now = new Date();
      const start = new Date(startTime);
      setElapsed(now - start);
    };
    
    // Initial update
    updateElapsed();
    
    // Update every second
    const interval = setInterval(updateElapsed, 1000);
    
    return () => clearInterval(interval);
  }, [startTime]);
  
  return (
    <span className={`font-medium ${className}`}>
      {formatDuration(elapsed)}
    </span>
  );
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

// Enhanced Activation Analytics Component with live updates
const ActivationAnalytics = ({ users, selectedUsers }) => {
  const [timeRange, setTimeRange] = useState('today');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [customDateRange, setCustomDateRange] = useState({
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [viewMode, setViewMode] = useState('individual');
  const [selectedAnalyticsUsers, setSelectedAnalyticsUsers] = useState([]);
  const [chartType, setChartType] = useState('bar');
  const [timeUnit, setTimeUnit] = useState('hours');
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  
  // Force refresh every 5 seconds for live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(Date.now());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Filter users for analytics
  const targetUsers = useMemo(() => {
    return selectedUsers.length > 0 
      ? users.filter(user => selectedUsers.includes(user._id))
      : users;
  }, [users, selectedUsers, lastUpdate]);

  // Get date range based on selection
  const getDateRange = useMemo(() => {
    const now = new Date();
    let startDate, endDate;
    
    switch(timeRange) {
      case 'today':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'yesterday':
        startDate = startOfDay(subDays(now, 1));
        endDate = endOfDay(subDays(now, 1));
        break;
      case 'last7days':
        startDate = startOfDay(subDays(now, 6));
        endDate = endOfDay(now);
        break;
      case 'last30days':
        startDate = startOfDay(subDays(now, 29));
        endDate = endOfDay(now);
        break;
      case 'thisWeek':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case 'thisMonth':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'custom':
        startDate = startOfDay(new Date(customDateRange.start));
        endDate = endOfDay(new Date(customDateRange.end));
        break;
      default:
        startDate = startOfDay(selectedDate);
        endDate = endOfDay(selectedDate);
    }
    
    return { startDate, endDate };
  }, [timeRange, selectedDate, customDateRange]);

  // Prepare individual user activation data with live updates
  const individualUserData = useMemo(() => {
    return targetUsers.map(user => {
      const activation = calculateActivationDuration(
        user.activationHistory || [], 
        timeRange === 'specific' ? selectedDate : null,
        timeRange !== 'specific' ? getDateRange : null,
        true // Enable real-time calculation
      );
      
      // Get last activation time for live timer
      const lastActivationEntry = user.activationHistory
        ?.filter(entry => entry.status === 'active')
        .pop();
      
      return {
        id: user._id,
        name: user.fullName || `User ${user._id?.substring(0, 6)}`,
        email: user.email,
        gender: user.gender,
        totalDuration: activation.dateRangeDuration || activation.totalDuration,
        todayDuration: activation.todayDuration,
        yesterdayDuration: activation.yesterdayDuration,
        thisWeekDuration: activation.thisWeekDuration,
        thisMonthDuration: activation.thisMonthDuration,
        sessions: activation.sessions,
        active: activation.active,
        lastActivation: activation.lastActivation,
        lastActivationTime: lastActivationEntry?.timestamp,
        hourlyBreakdown: activation.hourlyBreakdown,
        avgSessionDuration: activation.avgSessionDuration,
        liveDuration: activation.liveDuration
      };
    }).sort((a, b) => {
      // Sort active users first, then by total duration
      if (a.active && !b.active) return -1;
      if (!a.active && b.active) return 1;
      return b.totalDuration - a.totalDuration;
    });
  }, [targetUsers, timeRange, selectedDate, getDateRange, lastUpdate]);

  // Prepare comparison data for selected users
  const comparisonData = useMemo(() => {
    if (selectedAnalyticsUsers.length === 0) return [];
    
    const selectedUsersData = individualUserData.filter(user => 
      selectedAnalyticsUsers.includes(user.id)
    );
    
    // Prepare data for chart
    if (timeRange === 'today' || timeRange === 'yesterday' || timeRange === 'specific') {
      // Hourly comparison
      const hours = Array.from({ length: 24 }, (_, i) => i);
      return hours.map(hour => {
        const dataPoint = { hour: `${hour.toString().padStart(2, '0')}:00` };
        selectedUsersData.forEach(user => {
          const hourDuration = user.hourlyBreakdown[hour] || 0;
          dataPoint[user.name] = timeUnit === 'hours' 
            ? hourDuration / (1000 * 60 * 60)
            : timeUnit === 'minutes'
              ? hourDuration / (1000 * 60)
              : hourDuration / 1000;
        });
        return dataPoint;
      });
    } else {
      // Daily comparison for date ranges
      const days = eachDayOfInterval({ 
        start: getDateRange.startDate, 
        end: getDateRange.endDate 
      });
      
      return days.map(day => {
        const dateStr = format(day, 'MMM dd');
        const dataPoint = { date: dateStr, fullDate: day };
        
        selectedUsersData.forEach(user => {
          const userData = individualUserData.find(u => u.id === user.id);
          if (userData) {
            // For simplicity, we'll show total duration for each day
            dataPoint[user.name] = timeUnit === 'hours'
              ? userData.totalDuration / (1000 * 60 * 60) / days.length
              : timeUnit === 'minutes'
                ? userData.totalDuration / (1000 * 60) / days.length
                : userData.totalDuration / 1000 / days.length;
          }
        });
        
        return dataPoint;
      });
    }
  }, [selectedAnalyticsUsers, individualUserData, timeRange, timeUnit, getDateRange]);

  // Calculate statistics with live updates
  const stats = useMemo(() => {
    const totalDuration = individualUserData.reduce((sum, user) => sum + user.totalDuration, 0);
    const activeUsers = individualUserData.filter(user => user.active).length;
    const totalSessions = individualUserData.reduce((sum, user) => sum + user.sessions, 0);
    const avgSessionDuration = individualUserData.length > 0 
      ? individualUserData.reduce((sum, user) => sum + user.avgSessionDuration, 0) / individualUserData.length
      : 0;
    
    // Calculate live active duration for active users
    const liveActiveDuration = individualUserData
      .filter(user => user.active)
      .reduce((sum, user) => sum + (user.liveDuration || 0), 0);
    
    return {
      totalUsers: individualUserData.length,
      activeUsers,
      totalDuration,
      liveActiveDuration,
      totalSessions,
      avgSessionDuration,
      avgDurationPerUser: individualUserData.length > 0 ? totalDuration / individualUserData.length : 0
    };
  }, [individualUserData]);

  // Toggle user selection for comparison
  const toggleAnalyticsUser = (userId) => {
    setSelectedAnalyticsUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Format value based on time unit
  const formatTimeValue = (value) => {
    switch(timeUnit) {
      case 'hours':
        return `${(value / (1000 * 60 * 60)).toFixed(2)}h`;
      case 'minutes':
        return `${(value / (1000 * 60)).toFixed(0)}m`;
      case 'seconds':
        return `${(value / 1000).toFixed(0)}s`;
      default:
        return formatDuration(value);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <FaChartArea className="text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Activation Analytics</h3>
            <p className="text-sm text-gray-500">
              <span className="inline-flex items-center gap-1">
                <FaClock className="text-green-500 animate-pulse" />
                Live Updates
              </span>
              • Analyzing {stats.totalUsers} users • {selectedUsers.length > 0 ? `${selectedUsers.length} selected` : 'All users'}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">View:</label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('individual')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'individual' 
                    ? 'bg-primary-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FaUserClock className="inline mr-1" />
                Individual
              </button>
              <button
                onClick={() => setViewMode('comparison')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'comparison' 
                    ? 'bg-primary-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FaUserFriends className="inline mr-1" />
                Compare
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Chart:</label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setChartType('bar')}
                className={`p-1 rounded-md transition-colors ${
                  chartType === 'bar' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                title="Bar Chart"
              >
                <FaChartBar />
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`p-1 rounded-md transition-colors ${
                  chartType === 'line' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                title="Line Chart"
              >
                <FaChartLine />
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`p-1 rounded-md transition-colors ${
                  chartType === 'area' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                title="Area Chart"
              >
                <FaChartArea />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Time Range Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaCalendar className="inline mr-2 text-blue-500" />
              Time Range
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="thisWeek">This Week</option>
              <option value="thisMonth">This Month</option>
              <option value="specific">Specific Date</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          
          {timeRange === 'specific' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaCalendarDay className="inline mr-2 text-purple-500" />
                Select Date
              </label>
              <input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}
          
          {timeRange === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaClock className="inline mr-2 text-green-500" />
              Time Unit
            </label>
            <select
              value={timeUnit}
              onChange={(e) => setTimeUnit(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="hours">Hours</option>
              <option value="minutes">Minutes</option>
              <option value="seconds">Seconds</option>
            </select>
          </div>
        </div>
        
        {timeRange === 'custom' && (
          <div className="mt-3 text-sm text-gray-600">
            <FaCalendarAlt className="inline mr-2 text-blue-500" />
            Analyzing from {format(new Date(customDateRange.start), 'MMM dd, yyyy')} to {format(new Date(customDateRange.end), 'MMM dd, yyyy')}
          </div>
        )}
      </div>

      {/* Live Statistics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500 bg-opacity-10 rounded-full transform translate-x-8 -translate-y-8"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm text-gray-600">Total Active Time</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatTimeValue(stats.totalDuration)}
              </p>
              <p className="text-xs text-gray-500">
                {timeRange === 'today' ? 'Today' : timeRange === 'yesterday' ? 'Yesterday' : 'Selected period'}
              </p>
            </div>
            <FaClock className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-500 bg-opacity-10 rounded-full transform translate-x-8 -translate-y-8"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm text-gray-600">Active Users Now</p>
              <p className="text-2xl font-bold text-green-600">
                <span className="flex items-center gap-2">
                  {stats.activeUsers}
                  {stats.activeUsers > 0 && (
                    <span className="text-xs font-normal text-green-500">
                      ({formatTimeValue(stats.liveActiveDuration)} live)
                    </span>
                  )}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% of total
              </p>
            </div>
            <div className="relative">
              <FaUserCheck className="w-8 h-8 text-green-500" />
              {stats.activeUsers > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500 bg-opacity-10 rounded-full transform translate-x-8 -translate-y-8"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalSessions}</p>
              <p className="text-xs text-gray-500">
                Avg {formatDuration(stats.avgSessionDuration)} per session
              </p>
            </div>
            <FaHistory className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500 bg-opacity-10 rounded-full transform translate-x-8 -translate-y-8"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm text-gray-600">Avg per User</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatTimeValue(stats.avgDurationPerUser)}
              </p>
              <p className="text-xs text-gray-500">
                Average active time
              </p>
            </div>
            <FaUsers className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Comparison Mode */}
      {viewMode === 'comparison' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaUserFriends className="text-primary-600" />
              <h4 className="font-medium text-gray-800">User Comparison</h4>
            </div>
            <div className="text-sm text-gray-500">
              {selectedAnalyticsUsers.length} users selected for comparison
            </div>
          </div>
          
          {/* User Selection */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 mb-3">
              {individualUserData.slice(0, 10).map(user => (
                <button
                  key={user.id}
                  onClick={() => toggleAnalyticsUser(user.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                    selectedAnalyticsUsers.includes(user.id)
                      ? 'bg-primary-100 text-primary-700 border border-primary-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  <FaUser className="text-gray-500" />
                  {user.name}
                  {selectedAnalyticsUsers.includes(user.id) && (
                    <FaCheckCircle className="text-primary-600" />
                  )}
                  {user.active && (
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  )}
                </button>
              ))}
            </div>
            
            {selectedAnalyticsUsers.length > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Selected Users:</span>
                  <button
                    onClick={() => setSelectedAnalyticsUsers([])}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedAnalyticsUsers.map(userId => {
                    const user = individualUserData.find(u => u.id === userId);
                    if (!user) return null;
                    return (
                      <span key={userId} className="inline-flex items-center gap-1 px-2 py-1 bg-white text-gray-700 text-xs rounded-full border border-gray-300">
                        {user.name}
                        {user.active && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
                        <button
                          onClick={() => toggleAnalyticsUser(userId)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          {/* Comparison Chart */}
          {selectedAnalyticsUsers.length > 0 && (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey={timeRange.includes('day') || timeRange === 'specific' ? 'hour' : 'date'} 
                      stroke="#666" 
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#666" 
                      fontSize={12}
                      label={{ 
                        value: timeUnit.charAt(0).toUpperCase() + timeUnit.slice(1), 
                        angle: -90, 
                        position: 'insideLeft' 
                      }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value.toFixed(2)} ${timeUnit}`, 'Duration']}
                    />
                    <Legend />
                    {selectedAnalyticsUsers.map((userId, index) => {
                      const user = individualUserData.find(u => u.id === userId);
                      if (!user) return null;
                      const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];
                      return (
                        <Bar 
                          key={userId}
                          dataKey={user.name}
                          fill={colors[index % colors.length]}
                          radius={[4, 4, 0, 0]}
                          barSize={20}
                        />
                      );
                    })}
                  </BarChart>
                ) : chartType === 'line' ? (
                  <LineChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey={timeRange.includes('day') || timeRange === 'specific' ? 'hour' : 'date'} 
                      stroke="#666" 
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#666" 
                      fontSize={12}
                      label={{ 
                        value: timeUnit.charAt(0).toUpperCase() + timeUnit.slice(1), 
                        angle: -90, 
                        position: 'insideLeft' 
                      }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value.toFixed(2)} ${timeUnit}`, 'Duration']}
                    />
                    <Legend />
                    {selectedAnalyticsUsers.map((userId, index) => {
                      const user = individualUserData.find(u => u.id === userId);
                      if (!user) return null;
                      const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];
                      return (
                        <Line 
                          key={userId}
                          type="monotone"
                          dataKey={user.name}
                          stroke={colors[index % colors.length]}
                          strokeWidth={2}
                          dot={{ strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      );
                    })}
                  </LineChart>
                ) : (
                  <AreaChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey={timeRange.includes('day') || timeRange === 'specific' ? 'hour' : 'date'} 
                      stroke="#666" 
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#666" 
                      fontSize={12}
                      label={{ 
                        value: timeUnit.charAt(0).toUpperCase() + timeUnit.slice(1), 
                        angle: -90, 
                        position: 'insideLeft' 
                      }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value.toFixed(2)} ${timeUnit}`, 'Duration']}
                    />
                    <Legend />
                    {selectedAnalyticsUsers.map((userId, index) => {
                      const user = individualUserData.find(u => u.id === userId);
                      if (!user) return null;
                      const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];
                      return (
                        <Area 
                          key={userId}
                          type="monotone"
                          dataKey={user.name}
                          stroke={colors[index % colors.length]}
                          fill={colors[index % colors.length]}
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                      );
                    })}
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Individual User Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Activity List */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaList className="text-blue-500" />
              <h4 className="font-medium text-gray-800">User Activity Details</h4>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                {viewMode === 'individual' ? 'Individual' : 'Comparison'} View
              </span>
            </div>
            <div className="text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <FaClock className="text-green-500 animate-pulse" />
                Live Updates
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Active Time</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Sessions</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Avg Session</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {individualUserData.slice(0, 8).map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-medium relative ${
                          user.active ? 'ring-2 ring-green-500 ring-offset-1' : ''
                        }`}>
                          {user.name.charAt(0)}
                          {user.active && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-800">
                          {formatTimeValue(user.totalDuration)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDurationHHMMSS(user.totalDuration)}
                        </span>
                        {user.active && user.lastActivationTime && (
                          <span className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <FaClock className="animate-pulse" />
                            <LiveTimer startTime={user.lastActivationTime} />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">{user.sessions}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">
                        {formatDuration(user.avgSessionDuration)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                        user.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.active ? (
                          <>
                            <FaToggleOnIcon className="text-green-500 animate-pulse" />
                            Active Now
                          </>
                        ) : (
                          <>
                            <FaToggleOffIcon className="text-gray-500" />
                            Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleAnalyticsUser(user.id)}
                        className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                          selectedAnalyticsUsers.includes(user.id)
                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {selectedAnalyticsUsers.includes(user.id) ? 'Remove' : 'Compare'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {individualUserData.length > 8 && (
            <div className="mt-4 text-center">
              <button className="text-sm text-primary-600 hover:text-primary-700">
                View all {individualUserData.length} users
              </button>
            </div>
          )}
        </div>

        {/* Hourly Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaClock className="text-purple-500" />
              <h4 className="font-medium text-gray-800">Hourly Pattern</h4>
            </div>
            <div className="text-xs text-gray-500">
              {timeRange === 'today' ? 'Today' : timeRange === 'yesterday' ? 'Yesterday' : 'Selected day'}
            </div>
          </div>
          
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {Array.from({ length: 24 }, (_, hour) => {
              const totalHourDuration = individualUserData.reduce((sum, user) => 
                sum + (user.hourlyBreakdown[hour] || 0), 0
              );
              
              const percentage = individualUserData.length > 0
                ? (totalHourDuration / individualUserData.reduce((sum, user) => 
                    sum + Object.values(user.hourlyBreakdown).reduce((a, b) => a + b, 0), 0
                  )) * 100
                : 0;
              
              const currentHour = new Date().getHours();
              const isCurrentHour = hour === currentHour;
              
              return (
                <div key={hour} className={`flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg ${isCurrentHour ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 text-center">
                      <span className={`text-sm font-medium ${isCurrentHour ? 'text-blue-600' : 'text-gray-700'}`}>
                        {hour.toString().padStart(2, '0')}:00
                        {isCurrentHour && <span className="ml-1 text-xs text-blue-500">●</span>}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          style={{ width: `${Math.min(percentage * 3, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-800">
                      {formatDuration(totalHourDuration)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <FaInfoCircle className="inline mr-2 text-blue-500" />
              Shows when users are most active throughout the day
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <FaCalendarDay className="text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-700">Peak Hour</p>
              <p className="text-xs text-gray-500">Most active time of day</p>
            </div>
          </div>
          {(() => {
            const hourlyTotals = Array.from({ length: 24 }, (_, hour) => ({
              hour,
              total: individualUserData.reduce((sum, user) => sum + (user.hourlyBreakdown[hour] || 0), 0)
            }));
            const peakHour = hourlyTotals.reduce((max, current) => 
              current.total > max.total ? current : max
            , { hour: 0, total: 0 });
            
            return (
              <>
                <p className="text-2xl font-bold text-blue-600">
                  {peakHour.hour.toString().padStart(2, '0')}:00
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {formatDuration(peakHour.total)} total activity
                </p>
              </>
            );
          })()}
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <FaUserCheck className="text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-700">Most Active User</p>
              <p className="text-xs text-gray-500">Highest total active time</p>
            </div>
          </div>
          {individualUserData.length > 0 ? (
            <>
              <p className="text-lg font-bold text-green-600 truncate">
                {individualUserData[0].name}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {formatTimeValue(individualUserData[0].totalDuration)} • {individualUserData[0].sessions} sessions
              </p>
              {individualUserData[0].active && (
                <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                  <FaClock className="animate-pulse" />
                  Currently active for <LiveTimer startTime={individualUserData[0].lastActivationTime} className="text-green-600" />
                </p>
              )}
            </>
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <FaUsersCog className="text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-700">Engagement Rate</p>
              <p className="text-xs text-gray-500">Active users vs total</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {stats.activeUsers} active out of {stats.totalUsers} users
          </p>
        </div>
      </div>
    </div>
  );
};

// Simplified Analytics Charts Component
const AnalyticsCharts = ({ users }) => {
  const [timeRange, setTimeRange] = useState('last30days');
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Force refresh every 10 seconds for live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(Date.now());
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Prepare registration data (bar chart)
  const registrationData = useMemo(() => {
    const now = new Date();
    let startDate, endDate;
    
    // Set date range based on selection
    switch(timeRange) {
      case 'today':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'yesterday':
        startDate = startOfDay(subDays(now, 1));
        endDate = endOfDay(subDays(now, 1));
        break;
      case 'last7days':
        startDate = subDays(now, 6);
        endDate = endOfDay(now);
        break;
      case 'last30days':
        startDate = subDays(now, 29);
        endDate = endOfDay(now);
        break;
      case 'last90days':
        startDate = subDays(now, 89);
        endDate = endOfDay(now);
        break;
      case 'thisMonth':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'thisYear':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      default:
        // All time - use first registration date
        const allDates = users.map(u => new Date(u.createdAt)).filter(d => isValid(d));
        if (allDates.length > 0) {
          startDate = new Date(Math.min(...allDates));
          endDate = now;
        } else {
          startDate = subDays(now, 30);
          endDate = now;
        }
    }

    // Generate date intervals
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Group registrations by date
    const grouped = {};
    days.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      grouped[key] = {
        date: format(day, 'MMM dd'),
        fullDate: day,
        users: 0,
        cumulative: 0
      };
    });

    // Count registrations
    users.forEach(user => {
      const userDate = new Date(user.createdAt);
      const key = format(userDate, 'yyyy-MM-dd');
      if (grouped[key]) {
        grouped[key].users++;
      }
    });

    // Calculate cumulative totals
    let cumulative = 0;
    const result = Object.values(grouped)
      .sort((a, b) => a.fullDate - b.fullDate)
      .map(item => {
        cumulative += item.users;
        return {
          ...item,
          cumulative
        };
      });

    return result;
  }, [users, timeRange, lastUpdate]);

  // Prepare gender distribution data (pie chart)
  const genderData = useMemo(() => {
    const genderStats = {
      'Male': { count: 0, active: 0 },
      'Female': { count: 0, active: 0 },
      'Other': { count: 0, active: 0 },
      'Not specified': { count: 0, active: 0 }
    };

    users.forEach(user => {
      const gender = user.gender || 'Not specified';
      const activation = calculateActivationDuration(user.activationHistory || [], null, null, true);
      
      genderStats[gender].count++;
      if (activation.active) genderStats[gender].active++;
    });

    // Convert to chart data format
    const result = Object.entries(genderStats)
      .filter(([_, stats]) => stats.count > 0)
      .map(([name, stats]) => ({
        name,
        value: stats.count,
        active: stats.active,
        percentage: users.length > 0 ? Math.round((stats.count / users.length) * 100) : 0,
        fill: name === 'Male' ? '#3B82F6' : 
              name === 'Female' ? '#EC4899' : 
              name === 'Other' ? '#8B5CF6' : '#6B7280'
      }));

    return result;
  }, [users, lastUpdate]);

  // Calculate statistics with live updates
  const stats = useMemo(() => {
    const activeUsers = users.filter(user => 
      calculateActivationDuration(user.activationHistory || [], null, null, true).active
    ).length;
    
    const maleUsers = users.filter(user => user.gender === 'Male').length;
    const femaleUsers = users.filter(user => user.gender === 'Female').length;
    const otherUsers = users.filter(user => user.gender === 'Other').length;
    
    return {
      totalUsers: users.length,
      activeUsers,
      maleUsers,
      femaleUsers,
      otherUsers
    };
  }, [users, lastUpdate]);

  return (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <FaChartBar className="text-primary-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Analytics Dashboard</h3>
            <p className="text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <FaClock className="text-green-500 animate-pulse" />
                Live Updates
              </span>
              • Analyzing {stats.totalUsers} users
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Time Range:</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Statistics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-primary-600">{stats.totalUsers}</p>
              <p className="text-xs text-gray-500">Registered</p>
            </div>
            <FaUsers className="w-8 h-8 text-primary-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Now</p>
              <p className="text-2xl font-bold text-green-600">
                <span className="flex items-center gap-2">
                  {stats.activeUsers}
                  {stats.activeUsers > 0 && (
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  )}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% of total
              </p>
            </div>
            <div className="relative">
              <FaToggleOn className="w-8 h-8 text-green-500" />
              {stats.activeUsers > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Male Users</p>
              <p className="text-2xl font-bold text-blue-600">{stats.maleUsers}</p>
              <p className="text-xs text-gray-500">
                {stats.totalUsers > 0 ? Math.round((stats.maleUsers / stats.totalUsers) * 100) : 0}%
              </p>
            </div>
            <FaMars className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Female Users</p>
              <p className="text-2xl font-bold text-pink-600">{stats.femaleUsers}</p>
              <p className="text-xs text-gray-500">
                {stats.totalUsers > 0 ? Math.round((stats.femaleUsers / stats.totalUsers) * 100) : 0}%
              </p>
            </div>
            <FaVenus className="w-8 h-8 text-pink-500" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Trends Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaCalendar className="text-blue-500" />
              <h4 className="font-medium text-gray-800">Registration Trends</h4>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={registrationData.slice(-15)}> {/* Show last 15 days */}
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#666" 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip 
                  formatter={(value) => [`${value} users`, 'Registrations']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Bar 
                  dataKey="users" 
                  name="Daily Registrations" 
                  fill="#3B82F6" 
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Registrations ({timeRange})</p>
              <p className="text-xl font-bold text-blue-600">
                {registrationData.reduce((sum, item) => sum + item.users, 0)}
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
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => {
                    const payload = props.payload;
                    return [`${value} users (${payload.percentage}%)`, name];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {genderData.map((gender, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: gender.fill }} />
                  <span>{gender.name}</span>
                  {gender.active > 0 && (
                    <span className="text-xs text-green-500">
                      ({gender.active} active)
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-medium">{gender.value} users</span>
                  <span className="text-gray-500 ml-2">({gender.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activation Status Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaToggleOnIcon className="text-green-500" />
              <h4 className="font-medium text-gray-800">Current Status</h4>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Active', value: stats.activeUsers, fill: '#10B981' },
                    { name: 'Inactive', value: stats.totalUsers - stats.activeUsers, fill: '#6B7280' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell key="active" fill="#10B981" />
                  <Cell key="inactive" fill="#6B7280" />
                </Pie>
                <Tooltip 
                  formatter={(value, name) => {
                    const percentage = stats.totalUsers > 0 ? Math.round((value / stats.totalUsers) * 100) : 0;
                    return [`${value} users (${percentage}%)`, name];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Active Users</span>
                {stats.activeUsers > 0 && (
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                )}
              </div>
              <div className="text-right">
                <span className="font-medium">{stats.activeUsers} users</span>
                <span className="text-gray-500 ml-2">
                  ({stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <span>Inactive Users</span>
              </div>
              <div className="text-right">
                <span className="font-medium">{stats.totalUsers - stats.activeUsers} users</span>
                <span className="text-gray-500 ml-2">
                  ({stats.totalUsers > 0 ? Math.round(((stats.totalUsers - stats.activeUsers) / stats.totalUsers) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
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
    { value: 'most-active', label: 'Most Active', icon: <FaToggleOnIcon /> }
  ];

  const handleDateRangeChange = (value) => {
    if (value === 'custom') {
      setIsOpen(true);
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

  // Calculate filter statistics with live updates
  const filteredCount = users.length;
  const activeUsers = users.filter(user => 
    calculateActivationDuration(user.activationHistory || [], null, null, true).active
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
              <span className="flex items-center gap-1">
                <FaClock className="text-green-500 animate-pulse" />
                Live Stats
              </span>
              • {filteredCount} users • {activeUsers} active • {maleUsers} male • {femaleUsers} female
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

      {/* Filter Content */}
      {isOpen && (
        <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Filters */}
            <div className="space-y-6">
              {/* Gender Filter */}
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

              {/* Activation Status Filter */}
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

            {/* Right Column - Date & Sort */}
            <div className="space-y-6">
              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
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
                </div>
              </div>

              {/* Sorting Options */}
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
  
  const [viewModal, setViewModal] = useState({ show: false, userId: null });
  const [editModal, setEditModal] = useState({ show: false, userId: null });
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

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
      setLastUpdate(Date.now());
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

  // Force refresh every 30 seconds for live updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (users.length > 0) {
        setLastUpdate(Date.now());
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [users]);

  // Apply filters and sorting to ALL users with live updates
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
        const activation = calculateActivationDuration(user.activationHistory, null, null, true);
        return filters.activationStatus === 'active' ? activation.active : !activation.active;
      });
    }

    // Apply date range filter
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
      const activationA = calculateActivationDuration(a.activationHistory, null, null, true);
      const activationB = calculateActivationDuration(b.activationHistory, null, null, true);
      
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
  }, [users, searchTerm, filters, sortBy, lastUpdate]);

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
    
    const activation = calculateActivationDuration(user.activationHistory || [], null, null, true);
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
      
      // Update locally first for instant feedback
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
      setLastUpdate(Date.now());
      toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
      
      if (selectedUserData && selectedUserData._id === activationModal.userId) {
        const user = updatedUsers.find(u => u._id === activationModal.userId);
        setSelectedUserData(user);
      }
      
      // Optionally update on server
      // await userAPI.updateActivationStatus(activationModal.userId, newStatus);
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
          {/* Basic Analytics Charts */}
          <AnalyticsCharts users={users} />
          
          {/* Enhanced Activation Analytics */}
          <ActivationAnalytics users={users} selectedUsers={selectedUsers} />

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
                    const activation = calculateActivationDuration(user.activationHistory || [], null, null, true);
                    
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
                                  {activation.active && (
                                    <span className="ml-1">
                                      + <LiveTimer startTime={activation.lastActivation} className="text-green-600" />
                                    </span>
                                  )}
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
                            <div className="text-xs text-gray-400 mt-1">
                              {formatDuration(activation.totalDuration)}
                            </div>
                            {activation.sessions > 0 && (
                              <div className="text-xs text-blue-500 mt-1">
                                {activation.sessions} sessions
                              </div>
                            )}
                            {activation.todayDuration > 0 && (
                              <div className="text-xs text-green-500 mt-1">
                                Today: {formatDuration(activation.todayDuration)}
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
                    {users.filter(u => calculateActivationDuration(u.activationHistory || [], null, null, true).active).length}
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