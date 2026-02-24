import React, { useState, useMemo, useCallback } from "react";
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    addMonths,
    subMonths,
    format,
    isSameMonth,
    isSameDay,
    isToday,
    isSunday,
    isSaturday,
    getDay,
    getMonth,
    getYear,
    getDate
} from "date-fns";
import {
    FaChevronLeft,
    FaChevronRight,
    FaUser,
    FaCalendarAlt,
    FaEnvelope,
    FaUsers,
    FaSearch,
    FaTimes,
    FaFlag,
    FaInfoCircle,
    FaCheckCircle,
    FaClock,
    FaClipboardList,
    FaArrowLeft,
    FaArrowRight,
    FaFilter,
    FaRegCalendarAlt
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { getWeek, getWeekOfMonth } from "date-fns";

// ─────────────────── Indian Holidays 2026 & 2027 ───────────────────
const INDIAN_HOLIDAYS = {
    // 2026 National & Government Holidays
    "2026-01-26": { name: "Republic Day", type: "national" },
    "2026-03-10": { name: "Maha Shivaratri", type: "gazetted" },
    "2026-03-17": { name: "Holi", type: "gazetted" },
    "2026-03-31": { name: "Id-ul-Fitr (Eid)", type: "gazetted" },
    "2026-04-02": { name: "Ram Navami", type: "gazetted" },
    "2026-04-06": { name: "Mahavir Jayanti", type: "gazetted" },
    "2026-04-14": { name: "Dr. Ambedkar Jayanti", type: "gazetted" },
    "2026-04-18": { name: "Good Friday", type: "gazetted" },
    "2026-05-01": { name: "May Day", type: "gazetted" },
    "2026-05-12": { name: "Buddha Purnima", type: "gazetted" },
    "2026-06-07": { name: "Eid-ul-Adha (Bakrid)", type: "gazetted" },
    "2026-07-06": { name: "Muharram", type: "gazetted" },
    "2026-08-15": { name: "Independence Day", type: "national" },
    "2026-08-16": { name: "Janmashtami", type: "gazetted" },
    "2026-09-05": { name: "Milad-un-Nabi", type: "gazetted" },
    "2026-10-02": { name: "Gandhi Jayanti", type: "national" },
    "2026-10-02": { name: "Gandhi Jayanti", type: "national" },
    "2026-10-20": { name: "Dussehra", type: "gazetted" },
    "2026-11-08": { name: "Diwali", type: "gazetted" },
    "2026-11-10": { name: "Bhai Dooj", type: "gazetted" },
    "2026-11-19": { name: "Guru Nanak Jayanti", type: "gazetted" },
    "2026-12-25": { name: "Christmas", type: "gazetted" },
    // 2027
    "2027-01-26": { name: "Republic Day", type: "national" },
    "2027-02-27": { name: "Maha Shivaratri", type: "gazetted" },
    "2027-03-08": { name: "Holi", type: "gazetted" },
    "2027-03-21": { name: "Id-ul-Fitr (Eid)", type: "gazetted" },
    "2027-04-14": { name: "Dr. Ambedkar Jayanti", type: "gazetted" },
    "2027-04-02": { name: "Good Friday", type: "gazetted" },
    "2027-05-01": { name: "May Day", type: "gazetted" },
    "2027-08-15": { name: "Independence Day", type: "national" },
    "2027-10-02": { name: "Gandhi Jayanti", type: "national" },
    "2027-12-25": { name: "Christmas", type: "gazetted" },
};

const InterviewCalendarView = ({ filteredUsers, panels, onViewUser }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDay, setSelectedDay] = useState(null); // date key for detail panel
    const [hoveredDay, setHoveredDay] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update live time for tooltip
    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Filter States
    const [filterDays, setFilterDays] = useState([]); // indices 0-6 (0=Sun, 1=Mon...)
    const [filterRange, setFilterRange] = useState({ start: "", end: "" });
    const [filterWeeks, setFilterWeeks] = useState([]); // 1, 2, 3, 4, 5, 6 (week of month)

    // Filter combined logic
    const filteredCandidates = useMemo(() => {
        return filteredUsers.filter(u => {
            // 1. Search filter
            if (searchTerm.trim()) {
                const q = searchTerm.toLowerCase();
                const matchesSearch =
                    u.fullName?.toLowerCase().includes(q) ||
                    u.email?.toLowerCase().includes(q) ||
                    u.mobile?.includes(q) ||
                    u.education?.graduation?.degree?.toLowerCase().includes(q) ||
                    u.education?.qualifyingDegree?.degree?.toLowerCase().includes(q);
                if (!matchesSearch) return false;
            }

            // If user has no schedule, they only pass if no date filters are active
            const schedule = u.interviewSchedule?.scheduledDate;
            const hasDateFilters = filterDays.length > 0 || filterRange.start || filterRange.end || filterWeeks.length > 0;

            if (!schedule) {
                return !hasDateFilters; // Unscheduled users only show if no specific date filters active
            }

            const date = new Date(schedule);

            // 2. Day of Week filter
            if (filterDays.length > 0) {
                if (!filterDays.includes(getDay(date))) return false;
            }

            // 3. Date Range filter
            if (filterRange.start) {
                if (format(date, "yyyy-MM-dd") < filterRange.start) return false;
            }
            if (filterRange.end) {
                if (format(date, "yyyy-MM-dd") > filterRange.end) return false;
            }

            // 4. Week of Month filter
            if (filterWeeks.length > 0) {
                const wom = getWeekOfMonth(date, { weekStartsOn: 1 });
                if (!filterWeeks.includes(wom)) return false;
            }

            return true;
        });
    }, [filteredUsers, searchTerm, filterDays, filterRange, filterWeeks]);

    // Group users by scheduled interview date
    const usersByDate = useMemo(() => {
        const map = {};
        filteredCandidates.forEach(user => {
            const dateStr = user.interviewSchedule?.scheduledDate;
            if (!dateStr) return;
            const dateKey = format(new Date(dateStr), "yyyy-MM-dd");
            if (!map[dateKey]) map[dateKey] = [];
            map[dateKey].push(user);
        });
        return map;
    }, [filteredCandidates]);

    // Stats
    const stats = useMemo(() => {
        const scheduled = filteredCandidates.filter(u => u.interviewSchedule?.scheduledDate).length;
        const emailSent = filteredCandidates.filter(u => u.interviewEmailSent?.sent).length;
        const panelAssigned = filteredCandidates.reduce((sum, u) => sum + (u.panelAssignments?.length || 0), 0);
        const notScheduled = filteredCandidates.length - scheduled;
        // Count interviews this month
        const monthKey = format(currentMonth, "yyyy-MM");
        const thisMonthCount = Object.entries(usersByDate)
            .filter(([k]) => k.startsWith(monthKey))
            .reduce((sum, [, arr]) => sum + arr.length, 0);
        return { scheduled, emailSent, panelAssigned, notScheduled, total: filteredCandidates.length, thisMonth: thisMonthCount };
    }, [filteredCandidates, usersByDate, currentMonth]);

    // Calendar grid days
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        const days = [];
        let day = calStart;
        while (day <= calEnd) {
            days.push(day);
            day = addDays(day, 1);
        }
        return days;
    }, [currentMonth]);

    const weekDays = [
        { short: "Mon", color: "text-indigo-700" },
        { short: "Tue", color: "text-indigo-700" },
        { short: "Wed", color: "text-indigo-700" },
        { short: "Thu", color: "text-indigo-700" },
        { short: "Fri", color: "text-indigo-700" },
        { short: "Sat", color: "text-blue-600" },
        { short: "Sun", color: "text-red-600" },
    ];

    const getPanelNames = (user) => {
        if (!user.panelAssignments?.length || !panels?.length) return [];
        return user.panelAssignments.map(assignment => {
            const panel = panels.find(p => p._id === assignment.panelId);
            return panel?.name || "Unknown Panel";
        });
    };

    const getDayInfo = (day) => {
        const dateKey = format(day, "yyyy-MM-dd");
        const holiday = INDIAN_HOLIDAYS[dateKey];
        const sunday = isSunday(day);
        const saturday = isSaturday(day);
        return { dateKey, holiday, sunday, saturday };
    };

    // Get cell background & text styling based on day type
    const getCellClasses = (day, isCurrentMonth, todayFlag) => {
        const { holiday, sunday, saturday } = getDayInfo(day);
        let bg = "bg-white";
        let hover = "hover:bg-indigo-50/40";
        let border = "";

        if (!isCurrentMonth) {
            bg = "bg-gray-50/70";
            hover = "";
        } else if (todayFlag) {
            bg = "bg-indigo-50/60";
            border = "ring-2 ring-inset ring-indigo-500";
        } else if (holiday && holiday.type === "national") {
            bg = "bg-red-50/70";
            hover = "hover:bg-red-100/60";
        } else if (holiday) {
            bg = "bg-orange-50/60";
            hover = "hover:bg-orange-100/50";
        } else if (sunday) {
            bg = "bg-red-50/40";
            hover = "hover:bg-red-100/40";
        } else if (saturday) {
            bg = "bg-blue-50/30";
            hover = "hover:bg-blue-100/30";
        }

        return `${bg} ${hover} ${border}`;
    };

    const getDayNumberClasses = (day, isCurrentMonth, todayFlag) => {
        const { holiday, sunday } = getDayInfo(day);
        if (todayFlag) return "bg-indigo-600 text-white shadow-md shadow-indigo-200";
        if (!isCurrentMonth) return "text-gray-300";
        if (holiday?.type === "national") return "text-red-700 font-extrabold";
        if (holiday) return "text-orange-700 font-bold";
        if (sunday) return "text-red-500 font-bold";
        return "text-gray-700";
    };

    const MAX_VISIBLE = 3;

    // Navigate to month that has interviews
    const jumpToNextInterviewMonth = (direction) => {
        const sortedDateKeys = Object.keys(usersByDate).sort();
        if (sortedDateKeys.length === 0) return;
        const currentKey = format(currentMonth, "yyyy-MM");
        if (direction > 0) {
            const next = sortedDateKeys.find(k => k > currentKey + "-99");
            if (next) setCurrentMonth(new Date(next));
        } else {
            const prev = [...sortedDateKeys].reverse().find(k => k < currentKey + "-00");
            if (prev) setCurrentMonth(new Date(prev));
        }
    };

    // Detail panel for selected day
    const selectedDayUsers = selectedDay ? (usersByDate[selectedDay] || []) : [];
    const selectedDayHoliday = selectedDay ? INDIAN_HOLIDAYS[selectedDay] : null;

    const handleUserNavigate = (user) => {
        const dateStr = user.interviewSchedule?.scheduledDate;
        if (dateStr) {
            const date = new Date(dateStr);
            setCurrentMonth(date);
            setSelectedDay(format(date, "yyyy-MM-dd"));
        } else {
            toast.error(`${user.fullName} is not scheduled yet`);
        }
    };

    return (
        <div className="animate-fade-in">
            {/* ───── User Quick Navigation ───── */}
            <div className="mb-6 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <FaUsers className="text-indigo-600 text-sm" />
                        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Candidate Quick Nav</h3>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                        Total Candidates: {stats.total}
                    </span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {filteredCandidates.map(user => (
                        <button
                            key={user._id}
                            onClick={() => handleUserNavigate(user)}
                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer shadow-sm group ${user.interviewSchedule?.scheduledDate
                                ? 'bg-pink-50 border-pink-200 hover:bg-pink-100'
                                : 'bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-400'
                                }`}
                        >
                            {user.profileImage ? (
                                <img src={user.profileImage} alt="" className="w-6 h-6 rounded-full object-cover border border-white" />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center border border-gray-100">
                                    <FaUser className="text-[10px] text-gray-400" />
                                </div>
                            )}
                            <div className="text-left">
                                <p className={`text-[11px] font-bold truncate max-w-[100px] ${user.interviewSchedule?.scheduledDate ? 'text-pink-700' : 'text-gray-400'}`}>
                                    {user.fullName}
                                </p>
                                {user.interviewSchedule?.scheduledDate && (
                                    <p className="text-[9px] text-pink-400 font-medium">
                                        {format(new Date(user.interviewSchedule.scheduledDate), "dd MMM")}
                                    </p>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* ───── Top Controls: Search + Stats ───── */}
            <div className="mb-5 space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name, email, phone, degree..."
                            className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent shadow-sm transition-all"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                                <FaTimes className="text-xs" />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-xs transition-all shadow-sm cursor-pointer ${isFilterOpen || filterDays.length > 0 || filterRange.start || filterRange.end || filterWeeks.length > 0
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-indigo-50"
                            }`}
                    >
                        <FaFilter className="text-[10px]" />
                        Advanced Filters
                        {(filterDays.length > 0 || filterRange.start || filterRange.end || filterWeeks.length > 0) && (
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                        )}
                    </button>

                    {/* Quick Stats Chips */}
                    <div className="flex flex-wrap items-center gap-2">
                        {[
                            { label: "This Month", value: stats.thisMonth, icon: FaCalendarAlt, cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
                            { label: "Scheduled", value: stats.scheduled, icon: FaCheckCircle, cls: "bg-pink-50 text-pink-700 border-pink-200" },
                            { label: "Email Sent", value: stats.emailSent, icon: FaEnvelope, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                            { label: "Panels Assigned", value: stats.panelAssigned, icon: FaClipboardList, cls: "bg-purple-50 text-purple-700 border-purple-200" },
                            { label: "Unscheduled", value: stats.notScheduled, icon: FaClock, cls: "bg-amber-50 text-amber-700 border-amber-200" },
                        ].map(({ label, value, icon: Icon, cls }) => (
                            <span key={label} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-sm ${cls}`}>
                                <Icon className="text-[10px]" />
                                {label}: <span className="font-bold">{value}</span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Expanded Filters */}
                {isFilterOpen && (
                    <div className="p-5 bg-white rounded-2xl border border-indigo-100 shadow-xl animate-scale-up space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Day of Week */}
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <FaRegCalendarAlt className="text-indigo-400" /> Day of Week
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { l: "M", i: 1 }, { l: "T", i: 2 }, { l: "W", i: 3 },
                                        { l: "T", i: 4 }, { l: "F", i: 5 }, { l: "S", i: 6 }, { l: "S", i: 0 }
                                    ].map(day => (
                                        <button
                                            key={day.i}
                                            onClick={() => {
                                                setFilterDays(prev =>
                                                    prev.includes(day.i) ? prev.filter(x => x !== day.i) : [...prev, day.i]
                                                );
                                            }}
                                            className={`w-9 h-9 rounded-xl border text-xs font-bold transition-all cursor-pointer ${filterDays.includes(day.i)
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                                : "bg-gray-50 text-gray-500 border-gray-200 hover:border-indigo-300"
                                                }`}
                                        >
                                            {day.l}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Date Range */}
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <FaCalendarAlt className="text-indigo-400" /> Date Range
                                </h4>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={filterRange.start}
                                        onChange={(e) => setFilterRange(prev => ({ ...prev, start: e.target.value }))}
                                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-400 outline-none"
                                    />
                                    <span className="text-gray-400 text-xs">to</span>
                                    <input
                                        type="date"
                                        value={filterRange.end}
                                        onChange={(e) => setFilterRange(prev => ({ ...prev, end: e.target.value }))}
                                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-400 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Week of Month */}
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <FaClipboardList className="text-indigo-400" /> Week of Month
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {[1, 2, 3, 4, 5, 6].map(wk => (
                                        <button
                                            key={wk}
                                            onClick={() => {
                                                setFilterWeeks(prev =>
                                                    prev.includes(wk) ? prev.filter(x => x !== wk) : [...prev, wk]
                                                );
                                            }}
                                            className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${filterWeeks.includes(wk)
                                                ? "bg-purple-600 text-white border-purple-600"
                                                : "bg-gray-50 text-gray-500 border-gray-200 hover:border-purple-300"
                                                }`}
                                        >
                                            Week {wk}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-[10px] text-gray-400 font-medium italic">
                                * Filtering updates all stats and user chips in real-time.
                            </p>
                            <button
                                onClick={() => {
                                    setFilterDays([]);
                                    setFilterRange({ start: "", end: "" });
                                    setFilterWeeks([]);
                                }}
                                className="text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-wider cursor-pointer"
                            >
                                Reset All Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ───── Month Navigator ───── */}
            <div className="flex items-center justify-between mb-4 bg-gradient-to-r from-indigo-50 via-white to-purple-50 p-3 rounded-xl border border-indigo-100 shadow-sm">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => jumpToNextInterviewMonth(-1)}
                        className="px-2.5 py-2 text-[10px] font-semibold text-indigo-600 bg-white rounded-lg border border-indigo-100 hover:bg-indigo-50 transition-all cursor-pointer shadow-sm"
                        title="Jump to previous month with interviews"
                    >
                        <FaArrowLeft className="text-[9px]" />
                    </button>
                    <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-white rounded-lg border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                        <FaChevronLeft className="text-indigo-600 text-[10px]" />
                        <span className="text-xs font-semibold text-gray-700">Prev</span>
                    </button>
                </div>

                <div className="flex items-center">
                    <h2 className="text-xl font-extrabold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent select-none">
                        {format(currentMonth, "MMMM yyyy")}
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-white rounded-lg border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                        <span className="text-xs font-semibold text-gray-700">Next</span>
                        <FaChevronRight className="text-indigo-600 text-[10px]" />
                    </button>
                    <button
                        onClick={() => jumpToNextInterviewMonth(1)}
                        className="px-2.5 py-2 text-[10px] font-semibold text-indigo-600 bg-white rounded-lg border border-indigo-100 hover:bg-indigo-50 transition-all cursor-pointer shadow-sm"
                        title="Jump to next month with interviews"
                    >
                        <FaArrowRight className="text-[9px]" />
                    </button>
                </div>
            </div>

            {/* ───── Color Legend & Today ───── */}
            <div className="flex flex-wrap items-center justify-between mb-4 px-1 text-[10px] font-semibold">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-gray-500 uppercase tracking-wider mr-1">Legend:</span>
                    <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-500 border border-indigo-600"></span> Today</span>
                    <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 border border-red-500"></span> Sunday</span>
                    <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-300 border border-blue-400"></span> Saturday</span>
                    <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-600 border border-red-700"></span> National Holiday</span>
                    <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-400 border border-orange-500"></span> Govt. Holiday</span>
                    <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-pink-200 border border-pink-300"></span> Has Interviews</span>
                </div>
                <button
                    onClick={() => setCurrentMonth(new Date())}
                    title={`Current Time: ${format(currentTime, "EEEE, dd MMM yyyy | hh:mm:ss a")}`}
                    className="px-4 py-1.5 bg-black text-white rounded-lg font-bold text-[10px] hover:bg-gray-800 transition-all cursor-pointer shadow-md active:scale-95 border border-black uppercase tracking-wider"
                >
                    Today
                </button>
            </div>

            <div className="flex gap-4">
                {/* ───── Calendar Grid ───── */}
                <div className={`bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden transition-all ${selectedDay ? 'flex-1' : 'w-full'}`}>
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 bg-gradient-to-r from-indigo-100 via-blue-100 to-purple-100 border-b border-indigo-200">
                        {weekDays.map(({ short, color }) => (
                            <div key={short} className="py-3 text-center">
                                <span className={`text-xs font-bold tracking-wider uppercase ${color}`}>{short}</span>
                            </div>
                        ))}
                    </div>

                    {/* Day Cells */}
                    <div className="grid grid-cols-7">
                        {calendarDays.map((day, idx) => {
                            const { dateKey, holiday, sunday, saturday } = getDayInfo(day);
                            const usersOnDay = usersByDate[dateKey] || [];
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const todayFlag = isToday(day);
                            const hasUsers = usersOnDay.length > 0;
                            const visibleUsers = usersOnDay.slice(0, MAX_VISIBLE);
                            const overflow = usersOnDay.length - MAX_VISIBLE;
                            const isSelected = selectedDay === dateKey;
                            const isHovered = hoveredDay === dateKey;

                            return (
                                <div
                                    key={idx}
                                    className={`
                    min-h-[120px] border-b border-r border-gray-100 p-1.5 transition-all duration-150 cursor-pointer relative
                    ${getCellClasses(day, isCurrentMonth, todayFlag)}
                    ${isSelected ? "ring-2 ring-inset ring-indigo-600 bg-indigo-50/80" : ""}
                    ${isHovered && !isSelected ? "shadow-inner" : ""}
                  `}
                                    onClick={() => isCurrentMonth && setSelectedDay(isSelected ? null : dateKey)}
                                    onMouseEnter={() => setHoveredDay(dateKey)}
                                    onMouseLeave={() => setHoveredDay(null)}
                                >
                                    {/* Day Number + Holiday Badge */}
                                    <div className="flex items-start justify-between mb-1">
                                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-bold ${getDayNumberClasses(day, isCurrentMonth, todayFlag)}`}>
                                            {format(day, "d")}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {hasUsers && isCurrentMonth && (
                                                <span className="text-[8px] font-bold text-white bg-indigo-500 px-1.5 py-0.5 rounded-full shadow-sm leading-none">
                                                    {usersOnDay.length}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Holiday Label */}
                                    {holiday && isCurrentMonth && (
                                        <div className={`mb-1 px-1.5 py-0.5 rounded text-[8px] font-bold truncate ${holiday.type === "national"
                                            ? "bg-red-100 text-red-700 border border-red-200"
                                            : "bg-orange-100 text-orange-700 border border-orange-200"
                                            }`} title={holiday.name}>
                                            <FaFlag className="inline mr-0.5 text-[7px]" />{holiday.name}
                                        </div>
                                    )}

                                    {/* Sunday label if no holiday */}
                                    {sunday && !holiday && isCurrentMonth && (
                                        <div className="mb-1 px-1.5 py-0.5 rounded text-[8px] font-bold text-red-400 bg-red-50 border border-red-100 truncate">
                                            Sunday
                                        </div>
                                    )}

                                    {/* User Chips */}
                                    {isCurrentMonth && (
                                        <div className="flex flex-col gap-0.5">
                                            {visibleUsers.map(user => {
                                                const panelNames = getPanelNames(user);
                                                return (
                                                    <button
                                                        key={user._id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onViewUser && onViewUser(user);
                                                        }}
                                                        className={`w-full text-left px-1.5 py-1 rounded-md border transition-all cursor-pointer group shadow-sm ${user.interviewEmailSent?.sent
                                                            ? "bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                                                            : "bg-pink-50 border-pink-100 hover:bg-pink-100"
                                                            }`}
                                                        title={`${user.fullName}\n${user.email}\nPanels: ${panelNames.length ? panelNames.join(", ") : "None"}\n${user.interviewEmailSent?.sent ? "✓ Email sent" : "✗ Email pending"}`}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            {user.profileImage ? (
                                                                <img src={user.profileImage} alt="" className="w-4 h-4 rounded-full object-cover border border-white shadow-sm flex-shrink-0" />
                                                            ) : (
                                                                <div className="w-4 h-4 rounded-full bg-indigo-200 flex items-center justify-center flex-shrink-0">
                                                                    <FaUser className="text-[6px] text-pink-600" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <span className="text-[9px] font-semibold text-gray-800 truncate leading-tight block">
                                                                    {user.fullName}
                                                                </span>
                                                                {panelNames.length > 0 && (
                                                                    <span className="text-[7px] text-pink-500 font-medium truncate block">
                                                                        {panelNames.join(", ")}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {user.interviewEmailSent?.sent && (
                                                                <FaCheckCircle className="text-[7px] text-emerald-500 flex-shrink-0" />
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                            {overflow > 0 && (
                                                <span className="text-center text-[8px] font-bold text-indigo-600 bg-indigo-100 rounded-full py-0.5 border border-indigo-200 cursor-default">
                                                    +{overflow} more
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ───── Detail Side Panel ───── */}
                {selectedDay && (
                    <div className="w-80 bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden flex flex-col animate-slide-left">
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-indigo-100 to-purple-100 border-b border-indigo-200">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-extrabold text-indigo-800">
                                    {format(new Date(selectedDay), "EEEE, dd MMM yyyy")}
                                </h3>
                                <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                    <FaTimes className="text-xs" />
                                </button>
                            </div>
                            {selectedDayHoliday && (
                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold ${selectedDayHoliday.type === "national"
                                    ? "bg-red-100 text-red-700 border border-red-200"
                                    : "bg-orange-100 text-orange-700 border border-orange-200"
                                    }`}>
                                    <FaFlag className="text-[8px]" />{selectedDayHoliday.name}
                                    <span className="opacity-60">({selectedDayHoliday.type === "national" ? "National" : "Govt."})</span>
                                </div>
                            )}
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                                    {selectedDayUsers.length} candidate{selectedDayUsers.length !== 1 ? "s" : ""}
                                </span>
                                <span className="text-xs text-emerald-600 font-medium">
                                    {selectedDayUsers.filter(u => u.interviewEmailSent?.sent).length} emailed
                                </span>
                            </div>
                        </div>

                        {/* User List */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {selectedDayUsers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <FaCalendarAlt className="text-3xl text-gray-200 mb-3" />
                                    <p className="text-sm text-gray-400 font-medium">No interviews on this day</p>
                                </div>
                            ) : (
                                selectedDayUsers.map(user => {
                                    const panelNames = getPanelNames(user);
                                    const degree = user.education?.qualifyingDegree?.degree || user.education?.graduation?.degree || "N/A";
                                    return (
                                        <button
                                            key={user._id}
                                            onClick={() => onViewUser && onViewUser(user)}
                                            className="w-full text-left p-3 bg-gray-50 hover:bg-indigo-50 rounded-xl border border-gray-100 hover:border-indigo-200 transition-all cursor-pointer group shadow-sm"
                                        >
                                            <div className="flex items-start gap-3">
                                                {user.profileImage ? (
                                                    <img src={user.profileImage} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm">
                                                        <FaUser className="text-sm text-indigo-500" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-800 group-hover:text-indigo-700 transition-colors truncate">{user.fullName}</p>
                                                    <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">{user.mobile}</p>
                                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                                        <span className="text-[9px] font-medium px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100 truncate max-w-[140px]" title={degree}>
                                                            {degree.length > 22 ? degree.substring(0, 20) + "…" : degree}
                                                        </span>
                                                        {panelNames.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {panelNames.map((name, i) => (
                                                                    <span key={i} className="text-[9px] font-medium px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100">
                                                                        {name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {user.interviewEmailSent?.sent ? (
                                                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-100">
                                                                ✓ Emailed
                                                            </span>
                                                        ) : (
                                                            <span className="text-[9px] font-medium px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded border border-amber-100">
                                                                ✗ Not Emailed
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ───── Unscheduled Candidates ───── */}
            {stats.notScheduled > 0 && (
                <div className="mt-5 p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-2 mb-3">
                        <FaClock className="text-amber-500 text-sm" />
                        <h3 className="text-sm font-bold text-amber-800">
                            Unscheduled Candidates ({stats.notScheduled})
                        </h3>
                        <span className="text-[10px] text-amber-500 font-medium ml-auto">Click to view details</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {filteredCandidates
                            .filter(u => !u.interviewSchedule?.scheduledDate)
                            .slice(0, 24)
                            .map(user => (
                                <button
                                    key={user._id}
                                    onClick={() => onViewUser && onViewUser(user)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-lg border border-amber-200 hover:border-amber-400 hover:bg-amber-50 transition-all cursor-pointer shadow-sm text-xs group"
                                    title={`${user.fullName}\n${user.email}\n${user.education?.graduation?.degree || "No degree info"}`}
                                >
                                    {user.profileImage ? (
                                        <img src={user.profileImage} alt="" className="w-4 h-4 rounded-full object-cover border border-amber-100" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center">
                                            <FaUser className="text-[7px] text-amber-600" />
                                        </div>
                                    )}
                                    <span className="font-medium text-gray-700 group-hover:text-amber-800 transition-colors">{user.fullName}</span>
                                </button>
                            ))}
                        {stats.notScheduled > 24 && (
                            <span className="inline-flex items-center px-2.5 py-1.5 text-xs font-bold text-amber-600 bg-amber-100 rounded-lg border border-amber-200">
                                +{stats.notScheduled - 24} more
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InterviewCalendarView;
