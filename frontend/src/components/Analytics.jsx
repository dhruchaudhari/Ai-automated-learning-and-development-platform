import React, { useEffect, useState, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  FaChartBar,
  FaChartPie,
  FaChartLine,
  FaChartArea,
  FaUsers,
  FaUserCheck,
  FaUserClock,
  FaClock,
  FaCalendar,
  FaCalendarAlt,
  FaMars,
  FaVenus,
  FaTransgender,
  FaToggleOn,
  FaToggleOff,
  FaSpinner,
  FaPowerOff,
  FaRedo,
  FaSearch,
  FaTimes,
  FaInfoCircle,
  FaArrowRight,
  FaFilter,
  FaSortAmountDown,
  FaSortAmountUp,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaArrowLeft,
  FaUserFriends,
  FaUser,
  FaCheckCircle,
  FaEye,
  FaList,
  FaTable,
  FaToggleOn as FaToggleOnIcon,
  FaToggleOff as FaToggleOffIcon,
  FaChartArea as FaChartAreaIcon,
  FaUsersCog,
  FaCalendarDay,
  FaCalendarWeek,
  FaCalendarCheck
} from "react-icons/fa";
import { 
  format, 
  parseISO, 
  subDays, 
  startOfDay, 
  endOfDay, 
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
  eachMonthOfInterval,
  differenceInDays,
  differenceInHours,
  differenceInMinutes
} from "date-fns";
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
import ConfirmationModal from "./ConfirmationModal";
import { calculateActivationDuration, formatDuration } from "./UserGrid";
import { UserContext } from "../context/UserContext";

// Enhanced activation duration calculation for analytics
const calculateEnhancedActivationDuration = (activationHistory) => {
  if (!activationHistory || activationHistory.length === 0) {
    return { 
      active: false,
      totalDuration: 0,
      sessions: 0,
      lastActivation: null,
      todayDuration: 0,
      yesterdayDuration: 0,
      thisWeekDuration: 0,
      thisMonthDuration: 0,
      hourlyBreakdown: {},
      avgSessionDuration: 0
    };
  }
  
  const sortedHistory = [...activationHistory].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );
  
  let totalDuration = 0;
  let sessions = 0;
  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = startOfDay(subDays(now, 1));
  const yesterdayEnd = endOfDay(subDays(now, 1));
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  
  let todayDuration = 0;
  let yesterdayDuration = 0;
  let thisWeekDuration = 0;
  let thisMonthDuration = 0;
  const hourlyBreakdown = {};
  
  // Initialize hourly breakdown object
  for (let i = 0; i < 24; i++) {
    hourlyBreakdown[i] = 0;
  }
  
  const lastEntry = sortedHistory[sortedHistory.length - 1];
  const isActiveNow = lastEntry && lastEntry.status === 'active';
  
  for (let i = 0; i < sortedHistory.length; i += 2) {
    const start = sortedHistory[i];
    const end = sortedHistory[i + 1] || (isActiveNow ? { timestamp: now.toISOString() } : null);
    
    if (start.status === 'active' && end) {
      const startTime = new Date(start.timestamp);
      const endTime = new Date(end.timestamp);
      const sessionDuration = endTime - startTime;
      
      totalDuration += sessionDuration;
      sessions++;
      
      // Today's duration
      if (startTime <= now && (isSameDay(startTime, now) || isSameDay(endTime, now))) {
        const sessionStart = startTime < todayStart ? todayStart : startTime;
        const sessionEnd = endTime > now ? now : endTime;
        if (sessionStart < sessionEnd) {
          todayDuration += sessionEnd - sessionStart;
        }
      }
      
      // Yesterday's duration
      if (startTime <= yesterdayEnd && endTime >= yesterdayStart) {
        const sessionStart = startTime < yesterdayStart ? yesterdayStart : startTime;
        const sessionEnd = endTime > yesterdayEnd ? yesterdayEnd : endTime;
        if (sessionStart < sessionEnd) {
          yesterdayDuration += sessionEnd - sessionStart;
        }
      }
      
      // This week's duration
      if (startTime <= now && endTime >= weekStart) {
        const sessionStart = startTime < weekStart ? weekStart : startTime;
        const sessionEnd = endTime > now ? now : endTime;
        if (sessionStart < sessionEnd) {
          thisWeekDuration += sessionEnd - sessionStart;
        }
      }
      
      // This month's duration
      if (startTime <= now && endTime >= monthStart) {
        const sessionStart = startTime < monthStart ? monthStart : startTime;
        const sessionEnd = endTime > now ? now : endTime;
        if (sessionStart < sessionEnd) {
          thisMonthDuration += sessionEnd - sessionStart;
        }
      }
      
      // Hourly breakdown for today
      if (startTime <= todayStart && endTime >= todayStart) {
        const sessionStart = startTime < todayStart ? todayStart : startTime;
        const sessionEnd = endTime > now ? now : endTime;
        
        let currentHour = new Date(sessionStart);
        const endHour = new Date(sessionEnd);
        
        while (currentHour < endHour) {
          const hour = currentHour.getHours();
          const nextHour = new Date(currentHour);
          nextHour.setHours(hour + 1, 0, 0, 0);
          const hourDuration = Math.min(endHour - currentHour, nextHour - currentHour);
          
          hourlyBreakdown[hour] += hourDuration;
          currentHour = nextHour;
        }
      }
    }
  }
  
  // Add live duration if currently active
  if (isActiveNow && lastEntry) {
    const liveStart = new Date(lastEntry.timestamp);
    const liveDuration = now - liveStart;
    
    totalDuration += liveDuration;
    todayDuration += liveDuration;
    thisWeekDuration += liveDuration;
    thisMonthDuration += liveDuration;
    
    const currentHour = now.getHours();
    hourlyBreakdown[currentHour] += liveDuration;
  }
  
  return {
    active: isActiveNow,
    totalDuration,
    sessions,
    lastActivation: sortedHistory.length > 0 ? new Date(sortedHistory[sortedHistory.length - 1].timestamp) : null,
    todayDuration,
    yesterdayDuration,
    thisWeekDuration,
    thisMonthDuration,
    hourlyBreakdown,
    avgSessionDuration: sessions > 0 ? totalDuration / sessions : 0
  };
};

// Helper function to get today's active sessions
const getTodayActiveSessions = (activationHistory) => {
  if (!activationHistory || activationHistory.length === 0) {
    return [];
  }
  
  const now = new Date();
  const todayStart = startOfDay(now);
  const sortedHistory = [...activationHistory].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );
  
  const sessions = [];
  const lastEntry = sortedHistory[sortedHistory.length - 1];
  const isActiveNow = lastEntry && lastEntry.status === 'active';
  
  for (let i = 0; i < sortedHistory.length; i += 2) {
    const start = sortedHistory[i];
    const end = sortedHistory[i + 1] || (isActiveNow ? { timestamp: now.toISOString() } : null);
    
    if (start.status === 'active' && end) {
      const startTime = new Date(start.timestamp);
      const endTime = new Date(end.timestamp);
      
      // Check if session overlaps with today
      if (endTime >= todayStart && startTime <= now) {
        const sessionStart = startTime < todayStart ? todayStart : startTime;
        const sessionEnd = endTime > now ? now : endTime;
        
        if (sessionStart < sessionEnd) {
          sessions.push({
            startTime: sessionStart,
            endTime: sessionEnd,
            duration: sessionEnd - sessionStart
          });
        }
      }
    }
  }
  
  // If currently active, also add the live session
  if (isActiveNow && lastEntry) {
    const liveStart = new Date(lastEntry.timestamp);
    if (liveStart <= now && liveStart >= todayStart) {
      sessions.push({
        startTime: liveStart,
        endTime: now,
        duration: now - liveStart,
        isLive: true
      });
    }
  }
  
  // Sort sessions by start time
  return sessions.sort((a, b) => a.startTime - b.startTime);
};

// Enhanced function to get detailed today's activity
const getDetailedTodayActivity = (activationHistory) => {
  const sessions = getTodayActiveSessions(activationHistory);
  const now = new Date();
  
  if (sessions.length === 0) {
    return {
      sessions: [],
      totalDuration: 0,
      activeNow: false,
      currentSessionStart: null,
      formattedSessions: []
    };
  }
  
  let totalDuration = 0;
  const formattedSessions = [];
  
  sessions.forEach(session => {
    totalDuration += session.duration;
    
    const startTimeStr = format(session.startTime, 'HH:mm:ss');
    const endTimeStr = session.isLive ? 'Now' : format(session.endTime, 'HH:mm:ss');
    const durationStr = formatDuration(session.duration);
    
    formattedSessions.push({
      startTime: session.startTime,
      endTime: session.endTime,
      startFormatted: startTimeStr,
      endFormatted: endTimeStr,
      duration: session.duration,
      durationFormatted: durationStr,
      isLive: session.isLive || false
    });
  });
  
  const lastSession = sessions[sessions.length - 1];
  const activeNow = lastSession && lastSession.isLive === true;
  
  return {
    sessions: formattedSessions,
    totalDuration,
    activeNow,
    currentSessionStart: activeNow ? lastSession.startTime : null,
    sessionCount: sessions.length
  };
};

// Live Timer Component
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

// Session Details Modal Component
const SessionDetailsModal = ({ user, isOpen, onClose }) => {
  if (!isOpen || !user) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800">{user.name}'s Today Activity</h3>
              <p className="text-gray-600">Detailed session timeline for today ({format(new Date(), 'MMMM d, yyyy')})</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Time Today</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatDuration(user.todayDuration)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Session Count</p>
                  <p className="text-xl font-bold text-blue-600">
                    {user.todayActivity.sessionCount}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Status</p>
                  <p className={`text-xl font-bold ${user.activeNow ? 'text-green-600' : 'text-gray-600'}`}>
                    {user.activeNow ? 'Active Now' : 'Inactive'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Session Timeline</h4>
              {user.todayActivity.sessions.length > 0 ? (
                <div className="space-y-3">
                  {user.todayActivity.sessions.map((session, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border ${session.isLive ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${session.isLive ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`} />
                          <span className="font-medium text-gray-800">
                            Session {idx + 1}
                          </span>
                          {session.isLive && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full animate-pulse">
                              Live Now
                            </span>
                          )}
                        </div>
                        <span className="font-medium text-gray-800">
                          {session.durationFormatted}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Started</p>
                          <p className="text-gray-800">
                            {format(session.startTime, 'HH:mm:ss')}
                          </p>
                          <p className="text-xs text-gray-400">
                            {format(session.startTime, 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Ended</p>
                          <p className={`${session.isLive ? 'text-green-600 font-medium' : 'text-gray-800'}`}>
                            {session.isLive ? 'Active Now' : format(session.endTime, 'HH:mm:ss')}
                          </p>
                          {!session.isLive && (
                            <p className="text-xs text-gray-400">
                              {format(session.endTime, 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {session.isLive && (
                        <div className="mt-3 pt-3 border-t border-green-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FaClock className="text-green-600 animate-pulse" />
                              <span className="text-green-700">Current session duration:</span>
                            </div>
                            <LiveTimer 
                              startTime={session.startTime} 
                              className="text-green-700 font-bold"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <FaClock className="text-4xl mx-auto mb-3 text-gray-300" />
                  <p>No activity recorded for today</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Analytics Component
const Analytics = () => {
  const navigate = useNavigate();
  const { users, refreshUsers } = useContext(UserContext);
  
  const [loading, setLoading] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [timeRange, setTimeRange] = useState('last30days');
  const [chartType, setChartType] = useState('bar');
  const [viewMode, setViewMode] = useState('overview');
  const [selectedAnalyticsUsers, setSelectedAnalyticsUsers] = useState([]);
  const [timeUnit, setTimeUnit] = useState('hours');
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [filters, setFilters] = useState({
    gender: '',
    activationStatus: ''
  });
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);
  const [showSessionDetails, setShowSessionDetails] = useState(false);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (users.length > 0) {
        setLastUpdate(Date.now());
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [users]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (err) {
      console.log("Logout failed:", err);
      toast.error("Logout failed");
    }
  };

  const handleRefresh = () => {
    refreshUsers();
    toast.success("Analytics refreshed");
  };

  const toggleAnalyticsUser = (userId) => {
    setSelectedAnalyticsUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

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
      case 'last90days':
        startDate = startOfDay(subDays(now, 89));
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
      case 'thisYear':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      default:
        const allDates = users.map(u => new Date(u.createdAt)).filter(d => isValid(d));
        if (allDates.length > 0) {
          startDate = new Date(Math.min(...allDates));
          endDate = now;
        } else {
          startDate = subDays(now, 30);
          endDate = now;
        }
    }
    
    return { startDate, endDate };
  }, [timeRange, users]);

  // Prepare registration data
  const registrationData = useMemo(() => {
    const { startDate, endDate } = getDateRange;
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    const grouped = {};
    days.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      grouped[key] = {
        date: format(day, 'MMM dd'),
        fullDate: day,
        users: 0,
        cumulative: 0,
        activeUsers: 0,
        totalDuration: 0
      };
    });

    users.forEach(user => {
      const userDate = new Date(user.createdAt);
      const key = format(userDate, 'yyyy-MM-dd');
      if (grouped[key]) {
        grouped[key].users++;
        
        const activation = calculateEnhancedActivationDuration(user.activationHistory);
        if (activation.active) grouped[key].activeUsers++;
        grouped[key].totalDuration += activation.todayDuration;
      }
    });

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
  }, [users, getDateRange, lastUpdate]);

  // Prepare gender distribution data
  const genderData = useMemo(() => {
    const genderStats = {
      'Male': { count: 0, active: 0, totalDuration: 0 },
      'Female': { count: 0, active: 0, totalDuration: 0 },
      'Other': { count: 0, active: 0, totalDuration: 0 },
      'Not specified': { count: 0, active: 0, totalDuration: 0 }
    };

    users.forEach(user => {
      const gender = user.gender || 'Not specified';
      const activation = calculateEnhancedActivationDuration(user.activationHistory);
      
      genderStats[gender].count++;
      if (activation.active) genderStats[gender].active++;
      genderStats[gender].totalDuration += activation.totalDuration;
    });

    const result = Object.entries(genderStats)
      .filter(([_, stats]) => stats.count > 0)
      .map(([name, stats]) => ({
        name,
        value: stats.count,
        active: stats.active,
        totalDuration: stats.totalDuration,
        percentage: users.length > 0 ? Math.round((stats.count / users.length) * 100) : 0,
        fill: name === 'Male' ? '#3B82F6' : 
              name === 'Female' ? '#EC4899' : 
              name === 'Other' ? '#8B5CF6' : '#6B7280'
      }));

    return result;
  }, [users, lastUpdate]);

  // Prepare user comparison data
  const userComparisonData = useMemo(() => {
    const filteredUsers = selectedAnalyticsUsers.length > 0
      ? users.filter(user => selectedAnalyticsUsers.includes(user._id))
      : users.slice(0, 5); // Show top 5 users by default

    return filteredUsers.map(user => {
      const activation = calculateEnhancedActivationDuration(user.activationHistory);
      const todayActivity = getDetailedTodayActivity(user.activationHistory);
      
      return {
        id: user._id,
        name: user.fullName || `User ${user._id?.substring(0, 6)}`,
        email: user.email,
        gender: user.gender,
        totalDuration: activation.totalDuration,
        todayDuration: activation.todayDuration,
        sessions: activation.sessions,
        active: activation.active,
        lastActivation: activation.lastActivation,
        avgSessionDuration: activation.avgSessionDuration,
        hourlyBreakdown: activation.hourlyBreakdown,
        todayActivity: todayActivity,
        todaySessions: todayActivity.sessions,
        activeNow: todayActivity.activeNow,
        currentSessionStart: todayActivity.currentSessionStart
      };
    }).sort((a, b) => {
      if (a.activeNow && !b.activeNow) return -1;
      if (!a.activeNow && b.activeNow) return 1;
      return b.totalDuration - a.totalDuration;
    });
  }, [users, selectedAnalyticsUsers, lastUpdate]);

  // Prepare hourly comparison data
  const hourlyComparisonData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return hours.map(hour => {
      const dataPoint = { hour: `${hour.toString().padStart(2, '0')}:00` };
      
      userComparisonData.forEach(user => {
        // Safely get hour duration from hourlyBreakdown object
        const hourDuration = user.hourlyBreakdown && typeof user.hourlyBreakdown === 'object' 
          ? (user.hourlyBreakdown[hour] || 0) 
          : 0;
          
        dataPoint[user.name] = timeUnit === 'hours' 
          ? hourDuration / (1000 * 60 * 60)
          : timeUnit === 'minutes'
            ? hourDuration / (1000 * 60)
            : hourDuration / 1000;
      });
      
      return dataPoint;
    });
  }, [userComparisonData, timeUnit]);

  // Calculate statistics
  const stats = useMemo(() => {
    const activeUsers = users.filter(user => 
      calculateEnhancedActivationDuration(user.activationHistory).active
    ).length;
    
    const maleUsers = users.filter(user => user.gender === 'Male').length;
    const femaleUsers = users.filter(user => user.gender === 'Female').length;
    const otherUsers = users.filter(user => user.gender === 'Other').length;
    
    const totalActivationTime = users.reduce((sum, user) => {
      return sum + calculateEnhancedActivationDuration(user.activationHistory).totalDuration;
    }, 0);
    
    const totalSessions = users.reduce((sum, user) => {
      return sum + calculateEnhancedActivationDuration(user.activationHistory).sessions;
    }, 0);
    
    const todayActivationTime = users.reduce((sum, user) => {
      return sum + calculateEnhancedActivationDuration(user.activationHistory).todayDuration;
    }, 0);
    
    const avgActivationTime = users.length > 0 ? totalActivationTime / users.length : 0;
    const avgSessions = users.length > 0 ? totalSessions / users.length : 0;
    
    // Peak hour calculation
    const hourlyTotals = Array(24).fill(0);
    users.forEach(user => {
      const activation = calculateEnhancedActivationDuration(user.activationHistory);
      if (activation.hourlyBreakdown && typeof activation.hourlyBreakdown === 'object') {
        Object.keys(activation.hourlyBreakdown).forEach(hourKey => {
          const hourIndex = parseInt(hourKey);
          if (!isNaN(hourIndex) && hourIndex >= 0 && hourIndex < 24) {
            hourlyTotals[hourIndex] += activation.hourlyBreakdown[hourIndex] || 0;
          }
        });
      }
    });
    
    const peakHourIndex = hourlyTotals.reduce((maxIndex, current, index, arr) => 
      current > arr[maxIndex] ? index : maxIndex, 0
    );
    
    // Most active user
    let mostActiveUser = null;
    let maxDuration = 0;
    
    users.forEach(user => {
      const activation = calculateEnhancedActivationDuration(user.activationHistory);
      if (activation.totalDuration > maxDuration) {
        maxDuration = activation.totalDuration;
        mostActiveUser = user;
      }
    });
    
    return {
      totalUsers: users.length,
      activeUsers,
      maleUsers,
      femaleUsers,
      otherUsers,
      totalActivationTime,
      totalSessions,
      todayActivationTime,
      avgActivationTime,
      avgSessions,
      peakHour: peakHourIndex,
      mostActiveUser,
      engagementRate: users.length > 0 ? Math.round((activeUsers / users.length) * 100) : 0
    };
  }, [users, lastUpdate]);

  // Format time value based on unit
  const formatTimeValue = (value) => {
    if (!value || value <= 0) return "0";
    
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
    <div className="min-h-screen py-8 px-4 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 animate-slide-down">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 text-lg">Comprehensive insights and data visualization</p>
          <div className="mt-4 text-sm text-gray-500 bg-blue-50 inline-block px-4 py-2 rounded-lg">
            <FaClock className="inline mr-2 text-blue-500 animate-pulse" />
            Live Updates • {users.length} users • {stats.activeUsers} active now
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* Action Bar */}
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/grid")}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                title="Go to User Management"
              >
                <FaArrowLeft />
                Back to Users
              </button>
              
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('overview')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === 'overview' 
                      ? 'bg-primary-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <FaChartBar className="inline mr-1" />
                  Overview
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
                <button
                  onClick={() => setViewMode('detailed')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === 'detailed' 
                      ? 'bg-primary-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <FaList className="inline mr-1" />
                  Detailed
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600">
                Last updated: {format(new Date(lastUpdate), 'hh:mm:ss a')}
              </span>
              
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Refresh analytics"
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

          {/* Controls Bar */}
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
                  <option value="last90days">Last 90 Days</option>
                  <option value="thisWeek">This Week</option>
                  <option value="thisMonth">This Month</option>
                  <option value="thisYear">This Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaChartBar className="inline mr-2 text-green-500" />
                  Chart Type
                </label>
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="area">Area Chart</option>
                  <option value="composed">Composed Chart</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaFilter className="inline mr-2 text-purple-500" />
                  Gender Filter
                </label>
                <select
                  value={filters.gender}
                  onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaClock className="inline mr-2 text-orange-500" />
                  Time Unit
                </label>
                <select
                  value={timeUnit}
                  onChange={(e) => setTimeUnit(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="hours">Hours</option>
                  <option value="minutes">Minutes</option>
                  <option value="seconds">Seconds</option>
                </select>
              </div>
            </div>
          </div>

          {/* Statistics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
                  <p className="text-xs text-gray-500">Registered</p>
                </div>
                <FaUsers className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-green-600">
                    <span className="flex items-center gap-2">
                      {stats.activeUsers}
                      {stats.activeUsers > 0 && (
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      )}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.engagementRate}% engagement
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
            
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Activity</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatDuration(stats.todayActivationTime)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Total active time today
                  </p>
                </div>
                <FaClock className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.totalSessions}</p>
                  <p className="text-xs text-gray-500">
                    Avg {stats.avgSessions.toFixed(1)} per user
                  </p>
                </div>
                <FaChartLine className="w-8 h-8 text-orange-500" />
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
                  {users.slice(0, 10).map(user => {
                    const activation = calculateEnhancedActivationDuration(user.activationHistory);
                    return (
                      <button
                        key={user._id}
                        onClick={() => toggleAnalyticsUser(user._id)}
                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                          selectedAnalyticsUsers.includes(user._id)
                            ? 'bg-primary-100 text-primary-700 border border-primary-300'
                            : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        <FaUser className="text-gray-500" />
                        {user.fullName || `User ${user._id?.substring(0, 6)}`}
                        {selectedAnalyticsUsers.includes(user._id) && (
                          <FaCheckCircle className="text-primary-600" />
                        )}
                        {activation.active && (
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        )}
                      </button>
                    );
                  })}
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
                        const user = users.find(u => u._id === userId);
                        if (!user) return null;
                        const activation = calculateEnhancedActivationDuration(user.activationHistory);
                        return (
                          <span key={userId} className="inline-flex items-center gap-1 px-2 py-1 bg-white text-gray-700 text-xs rounded-full border border-gray-300">
                            {user.fullName || `User ${userId.substring(0, 6)}`}
                            {activation.active && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
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
                <div className="h-80 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'bar' ? (
                      <BarChart data={hourlyComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="hour" stroke="#666" fontSize={12} />
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
                          formatter={(value) => [`${Number(value).toFixed(2)} ${timeUnit}`, 'Duration']}
                        />
                        <Legend />
                        {userComparisonData.map((user, index) => {
                          const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];
                          return (
                            <Bar 
                              key={user.id}
                              dataKey={user.name}
                              fill={colors[index % colors.length]}
                              radius={[4, 4, 0, 0]}
                              barSize={20}
                            />
                          );
                        })}
                      </BarChart>
                    ) : chartType === 'line' ? (
                      <LineChart data={hourlyComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="hour" stroke="#666" fontSize={12} />
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
                          formatter={(value) => [`${Number(value).toFixed(2)} ${timeUnit}`, 'Duration']}
                        />
                        <Legend />
                        {userComparisonData.map((user, index) => {
                          const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];
                          return (
                            <Line 
                              key={user.id}
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
                    ) : chartType === 'area' ? (
                      <AreaChart data={hourlyComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="hour" stroke="#666" fontSize={12} />
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
                          formatter={(value) => [`${Number(value).toFixed(2)} ${timeUnit}`, 'Duration']}
                        />
                        <Legend />
                        {userComparisonData.map((user, index) => {
                          const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];
                          return (
                            <Area 
                              key={user.id}
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
                    ) : (
                      <ComposedChart data={hourlyComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="hour" stroke="#666" fontSize={12} />
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
                          formatter={(value) => [`${Number(value).toFixed(2)} ${timeUnit}`, 'Duration']}
                        />
                        <Legend />
                        {userComparisonData.map((user, index) => {
                          const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];
                          return (
                            <Bar 
                              key={`bar-${user.id}`}
                              dataKey={user.name}
                              fill={colors[index % colors.length]}
                              fillOpacity={0.6}
                              barSize={15}
                            />
                          );
                        })}
                        {userComparisonData.map((user, index) => {
                          const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];
                          return (
                            <Line 
                              key={`line-${user.id}`}
                              type="monotone"
                              dataKey={user.name}
                              stroke={colors[index % colors.length]}
                              strokeWidth={2}
                            />
                          );
                        })}
                      </ComposedChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Registration Trends Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FaCalendar className="text-blue-500" />
                  <h4 className="font-medium text-gray-800">Registration Trends</h4>
                </div>
                <div className="text-sm text-gray-500">
                  {timeRange === 'all' ? 'All Time' : timeRange.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' ? (
                    <BarChart data={registrationData.slice(-15)}>
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
                  ) : chartType === 'line' ? (
                    <LineChart data={registrationData.slice(-15)}>
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
                      <Line 
                        type="monotone"
                        dataKey="users" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={{ strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  ) : chartType === 'area' ? (
                    <AreaChart data={registrationData.slice(-15)}>
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
                      <Area 
                        type="monotone"
                        dataKey="users" 
                        stroke="#3B82F6" 
                        fill="#3B82F6"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  ) : (
                    <ComposedChart data={registrationData.slice(-15)}>
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
                        fillOpacity={0.6}
                        barSize={20}
                      />
                      <Line 
                        type="monotone"
                        dataKey="cumulative" 
                        name="Cumulative Total" 
                        stroke="#10B981" 
                        strokeWidth={2}
                      />
                    </ComposedChart>
                  )}
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
                        return [`${value} users (${payload?.percentage || 0}%)`, name];
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
                          ({gender.active} active • {formatDuration(gender.totalDuration)})
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
          </div>

          {/* Activation Status Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FaToggleOn className="text-green-500" />
                <h4 className="font-medium text-gray-800">Activation Status</h4>
              </div>
              <div className="text-sm text-gray-500">
                {stats.activeUsers} active • {stats.totalUsers - stats.activeUsers} inactive
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
                    ({stats.engagementRate}%)
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

          {/* Detailed User Analysis (for detailed view) */}
          {viewMode === 'detailed' && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FaList className="text-blue-500" />
                  <h4 className="font-medium text-gray-800">User Activity Details</h4>
                </div>
                <div className="text-sm text-gray-500">
                  Showing top {Math.min(10, users.length)} users
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">User</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Today's Activity</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Sessions</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Avg Session</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {userComparisonData.slice(0, 10).map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-medium relative ${
                              user.activeNow ? 'ring-2 ring-green-500 ring-offset-1' : ''
                            }`}>
                              {user.name.charAt(0)}
                              {user.activeNow && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {user.gender || 'Not specified'} • Joined {format(new Date(user.id.timestamp || Date.now()), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-800">
                                {formatDuration(user.todayDuration)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {user.todayActivity.sessionCount} session{user.todayActivity.sessionCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                            
                            {/* Today's sessions timeline */}
                            {user.todayActivity.sessionCount > 0 ? (
                              <div className="space-y-1">
                                {user.todayActivity.sessions.slice(0, 2).map((session, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${session.isLive ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`} />
                                      <span className="text-gray-600">{session.startFormatted}</span>
                                      <FaArrowRight className="text-gray-400 text-xs" />
                                      <span className={`${session.isLive ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                                        {session.endFormatted}
                                      </span>
                                    </div>
                                    <span className="text-gray-500">{session.durationFormatted}</span>
                                  </div>
                                ))}
                                
                                {user.todayActivity.sessionCount > 2 && (
                                  <div className="text-xs text-blue-600 cursor-pointer hover:underline"
                                    onClick={() => {
                                      setSelectedUserForDetails(user);
                                      setShowSessionDetails(true);
                                    }}
                                  >
                                    + {user.todayActivity.sessionCount - 2} more sessions
                                  </div>
                                )}
                                
                                {user.activeNow && (
                                  <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <FaClock className="text-green-600 text-xs animate-pulse" />
                                        <span className="text-xs text-green-700">Currently active for</span>
                                      </div>
                                      <LiveTimer 
                                        startTime={user.currentSessionStart} 
                                        className="text-green-700 font-semibold"
                                      />
                                    </div>
                                    <div className="text-xs text-green-600 mt-1">
                                      Started at {format(user.currentSessionStart, 'HH:mm:ss')}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400 italic">No activity today</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-800">{user.sessions}</span>
                            <span className="text-xs text-gray-500">total sessions</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">
                            {formatDuration(user.avgSessionDuration)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                            user.activeNow
                              ? 'bg-green-100 text-green-700'
                              : user.active
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {user.activeNow ? (
                              <>
                                <FaToggleOnIcon className="text-green-500 animate-pulse" />
                                Active Now
                              </>
                            ) : user.active ? (
                              <>
                                <FaClock className="text-yellow-500" />
                                Recently Active
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
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-800">
                              {formatTimeValue(user.totalDuration)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDuration(user.totalDuration)}
                            </span>
                            {user.lastActivation && !user.activeNow && (
                              <span className="text-xs text-gray-400 mt-1">
                                Last: {format(user.lastActivation, 'HH:mm')}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Additional Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <FaClock className="text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Peak Hour</p>
                  <p className="text-xs text-gray-500">Most active time of day</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {stats.peakHour.toString().padStart(2, '0')}:00
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Highest user activity
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <FaUserCheck className="text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Most Active User</p>
                  <p className="text-xs text-gray-500">Highest total active time</p>
                </div>
              </div>
              {stats.mostActiveUser ? (
                <>
                  <p className="text-lg font-bold text-green-600 truncate">
                    {stats.mostActiveUser.fullName || `User ${stats.mostActiveUser._id?.substring(0, 6)}`}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDuration(stats.mostActiveUser.activationHistory ? 
                      calculateEnhancedActivationDuration(stats.mostActiveUser.activationHistory).totalDuration : 0)}
                  </p>
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
                {stats.engagementRate}%
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {stats.activeUsers} active out of {stats.totalUsers} users
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Session Details Modal */}
      <SessionDetailsModal
        user={selectedUserForDetails}
        isOpen={showSessionDetails}
        onClose={() => {
          setShowSessionDetails(false);
          setSelectedUserForDetails(null);
        }}
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
      />
    </div>
  );
};

export default Analytics;