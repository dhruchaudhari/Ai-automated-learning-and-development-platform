import React, { useState, useMemo } from "react";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveBar } from "@nivo/bar";
import {
    format,
    eachDayOfInterval,
    min as dateMin,
    max as dateMax,
    subDays,
    addDays,
    isValid,
    differenceInDays,
    startOfTomorrow,
    endOfTomorrow,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    addMonths,
    isWithinInterval,
    startOfDay,
    endOfDay,
    parseISO
} from "date-fns";
import {
    FaCalendarAlt,
    FaEnvelope,
    FaClock,
    FaUsers,
    FaUser,
    FaCheckCircle,
    FaChartLine,
    FaChartBar,
    FaChartArea,
    FaClipboardList,
    FaSearch,
    FaTimes,
    FaInfoCircle,
    FaFilter,
    FaRegCalendarAlt
} from "react-icons/fa";
import { getDay, getWeekOfMonth } from "date-fns";

const CHART_TYPES = [
    { key: "area", label: "Area", icon: FaChartArea },
    { key: "line", label: "Line", icon: FaChartLine },
    { key: "bar", label: "Bar", icon: FaChartBar },
];

const InterviewTimelineView = ({ filteredUsers, panels, onViewUser }) => {
    const [chartType, setChartType] = useState("area"); // area | line | bar
    const [showCumulative, setShowCumulative] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedDate, setExpandedDate] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [viewPreset, setViewPreset] = useState("datewise"); // datewise | daywise | monthwise | tomorrow | nextweek | nextmonth | next6months | custom

    // Filter States
    const [filterDays, setFilterDays] = useState([]); // indices 0-6 (0=Sun, 1=Mon...)
    const [filterRange, setFilterRange] = useState({ start: "", end: "" });
    const [filterWeeks, setFilterWeeks] = useState([]); // 1, 2, 3, 4, 5, 6 (week of month)

    // Search and Advanced filters
    const filteredCandidates = useMemo(() => {
        const now = new Date();

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

            // Preset & Advanced filters
            const schedule = u.interviewSchedule?.scheduledDate;
            if (!schedule) {
                // If no schedule and we have active preset/filters, hide them
                if (viewPreset !== "datewise" && viewPreset !== "daywise" && viewPreset !== "monthwise" && viewPreset !== "custom") return false;
                if (filterDays.length > 0 || filterRange.start || filterRange.end || filterWeeks.length > 0) return false;
                return true;
            }

            const date = new Date(schedule);

            // 2. Preset Time Range Filters
            if (viewPreset === "tomorrow") {
                if (!isWithinInterval(date, { start: startOfTomorrow(), end: endOfTomorrow() })) return false;
            } else if (viewPreset === "nextweek") {
                const start = startOfDay(now);
                const end = endOfDay(addDays(now, 7));
                if (!isWithinInterval(date, { start, end })) return false;
            } else if (viewPreset === "nextmonth") {
                const start = startOfDay(now);
                const end = endOfDay(addMonths(now, 1));
                if (!isWithinInterval(date, { start, end })) return false;
            } else if (viewPreset === "next6months") {
                const start = startOfDay(now);
                const end = endOfDay(addMonths(now, 6));
                if (!isWithinInterval(date, { start, end })) return false;
            }

            // 3. Day of Week filter
            if (filterDays.length > 0) {
                if (!filterDays.includes(getDay(date))) return false;
            }

            // 4. Date Range filter (Custom)
            if (filterRange.start) {
                if (format(date, "yyyy-MM-dd") < filterRange.start) return false;
            }
            if (filterRange.end) {
                if (format(date, "yyyy-MM-dd") > filterRange.end) return false;
            }

            // 5. Week of Month filter
            if (filterWeeks.length > 0) {
                const wom = getWeekOfMonth(date, { weekStartsOn: 1 });
                if (!filterWeeks.includes(wom)) return false;
            }

            return true;
        });
    }, [filteredUsers, searchTerm, filterDays, filterRange, filterWeeks, viewPreset]);

    // Search filter

    const getPanelNames = (user) => {
        if (!user.panelAssignments?.length || !panels?.length) return [];
        return user.panelAssignments.map(assignment => {
            const panel = panels.find(p => p._id === assignment.panelId);
            return panel?.name || "Unknown Panel";
        });
    };

    // Build chart data
    const { lineData, barData, dateUserMap, stats, dateRange } = useMemo(() => {
        const scheduledUsers = filteredCandidates.filter(u => u.interviewSchedule?.scheduledDate);
        const emailSentUsers = filteredCandidates.filter(u => u.interviewEmailSent?.sent);

        const st = {
            scheduled: scheduledUsers.length,
            emailSent: emailSentUsers.length,
            panelAssigned: filteredCandidates.reduce((sum, u) => sum + (u.panelAssignments?.length || 0), 0),
            notScheduled: filteredCandidates.length - scheduledUsers.length,
            total: filteredCandidates.length
        };

        if (scheduledUsers.length === 0) {
            return { lineData: [], barData: [], dateUserMap: {}, stats: st, dateRange: null };
        }

        const dates = scheduledUsers.map(u => new Date(u.interviewSchedule.scheduledDate)).filter(d => isValid(d));
        if (dates.length === 0) {
            return { lineData: [], barData: [], dateUserMap: {}, stats: st, dateRange: null };
        }

        // --- Aggregation Preparation ---
        const userMap = {};
        const scheduledGrouped = {};
        const emailSentGrouped = {};
        let xLabels = [];

        if (viewPreset === "daywise") {
            // Sunday (0) to Saturday (6)
            const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            days.forEach((day, i) => {
                scheduledGrouped[i] = 0;
                emailSentGrouped[i] = 0;
                userMap[i] = [];
            });
            scheduledUsers.forEach(u => {
                const d = getDay(new Date(u.interviewSchedule.scheduledDate));
                scheduledGrouped[d]++;
                userMap[d].push(u);
                if (u.interviewEmailSent?.sent) emailSentGrouped[d]++;
            });
            xLabels = days.map((label, i) => ({ label, key: i }));

        } else if (viewPreset === "monthwise") {
            scheduledUsers.forEach(u => {
                const k = format(new Date(u.interviewSchedule.scheduledDate), "MMM yyyy");
                if (!scheduledGrouped[k]) {
                    scheduledGrouped[k] = 0;
                    emailSentGrouped[k] = 0;
                    userMap[k] = [];
                }
                scheduledGrouped[k]++;
                userMap[k].push(u);
                if (u.interviewEmailSent?.sent) emailSentGrouped[k]++;
            });
            xLabels = Object.keys(scheduledGrouped).sort((a, b) => new Date(a) - new Date(b)).map(k => ({ label: k, key: k }));

        } else {
            // Datewise (Default)
            const minDate = subDays(dateMin(dates), 1);
            const maxDate = addDays(dateMax(dates), 1);
            const allDays = eachDayOfInterval({ start: minDate, end: maxDate });

            allDays.forEach(d => {
                const key = format(d, "yyyy-MM-dd");
                scheduledGrouped[key] = 0;
                emailSentGrouped[key] = 0;
                userMap[key] = [];
                xLabels.push({ label: format(d, "dd MMM"), key });
            });

            scheduledUsers.forEach(user => {
                const key = format(new Date(user.interviewSchedule.scheduledDate), "yyyy-MM-dd");
                if (scheduledGrouped[key] !== undefined) {
                    scheduledGrouped[key]++;
                    userMap[key].push(user);
                }
                if (user.interviewEmailSent?.sent && emailSentGrouped[key] !== undefined) {
                    emailSentGrouped[key]++;
                }
            });
        }

        // --- Construct Chart Series ---
        let cumScheduled = 0;
        let cumEmail = 0;

        const scheduledLine = {
            id: showCumulative ? "Cumulative Scheduled" : "Interviews Scheduled",
            data: xLabels.map(xl => {
                const val = scheduledGrouped[xl.key] || 0;
                cumScheduled += val;
                return {
                    x: xl.label,
                    y: showCumulative ? cumScheduled : val,
                    dateKey: xl.key
                };
            })
        };

        const emailLine = {
            id: showCumulative ? "Cumulative Emails Sent" : "Emails Sent",
            data: xLabels.map(xl => {
                const val = emailSentGrouped[xl.key] || 0;
                cumEmail += val;
                return {
                    x: xl.label,
                    y: showCumulative ? cumEmail : val,
                    dateKey: xl.key
                };
            })
        };

        const bData = xLabels.map(xl => ({
            date: xl.label,
            dateKey: xl.key,
            "Interviews": scheduledGrouped[xl.key] || 0,
            "Emails Sent": emailSentGrouped[xl.key] || 0,
        }));

        const minD = dates.length > 0 ? dateMin(dates) : null;
        const maxD = dates.length > 0 ? dateMax(dates) : null;

        return {
            lineData: [scheduledLine, emailLine],
            barData: bData,
            dateUserMap: userMap,
            stats: st,
            dateRange: minD ? { start: minD, end: maxD, days: differenceInDays(maxD, minD) + 1 } : null
        };
    }, [filteredCandidates, showCumulative, viewPreset]);

    const dateBreakdown = useMemo(() => {
        if (!dateRange && viewPreset !== "daywise" && viewPreset !== "monthwise") return [];
        return Object.entries(dateUserMap)
            .filter(([, users]) => users.length > 0)
            .sort(([a], [b]) => {
                if (viewPreset === "daywise") return Number(a) - Number(b);
                if (viewPreset === "monthwise") return new Date(a) - new Date(b);
                return a.localeCompare(b);
            })
            .map(([key, users]) => {
                let label = key;
                if (viewPreset === "daywise") {
                    label = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][key];
                } else if (viewPreset === "monthwise") {
                    label = key;
                } else {
                    label = format(new Date(key), "EEE, dd MMM yyyy");
                }
                return {
                    dateKey: key,
                    dateLabel: label,
                    users,
                    emailSent: users.filter(u => u.interviewEmailSent?.sent).length,
                    panelAssigned: users.filter(u => u.panelAssignments?.length > 0).length
                };
            });
    }, [dateUserMap, dateRange, viewPreset]);

    // Custom tooltip for line/area chart
    const LineTooltip = ({ point }) => {
        const dateKey = point?.data?.dateKey;
        const usersOnDate = dateKey ? (dateUserMap[dateKey] || []) : [];
        const isEmailSeried = point?.serieId?.includes("Email");

        return (
            <div className="bg-white rounded-xl shadow-2xl border border-indigo-100 p-4 max-w-[300px] pointer-events-none" style={{ zIndex: 99999 }}>
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                    <FaCalendarAlt className="text-indigo-500 text-xs" />
                    <span className="text-sm font-bold text-gray-800">{point?.data?.x}</span>
                    <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${isEmailSeried ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700"
                        }`}>
                        {point?.data?.y} {isEmailSeried ? "email(s)" : "interview(s)"}
                    </span>
                </div>
                {usersOnDate.length > 0 && !isEmailSeried && (
                    <div className="space-y-1.5">
                        {usersOnDate.slice(0, 5).map(user => {
                            const pNames = getPanelNames(user);
                            return (
                                <div key={user._id} className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-50 border border-gray-100">
                                    {user.profileImage ? (
                                        <img src={user.profileImage} alt="" className="w-5 h-5 rounded-full object-cover border border-white shadow-sm flex-shrink-0" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                            <FaUser className="text-[7px] text-indigo-600" />
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px] font-semibold text-gray-700 truncate">{user.fullName}</p>
                                        {pNames.map((name, i) => (
                                            <p key={i} className="text-[9px] text-purple-500 leading-tight">{name}</p>
                                        ))}
                                    </div>
                                    {user.interviewEmailSent?.sent ? (
                                        <FaCheckCircle className="text-[9px] text-emerald-500 flex-shrink-0" />
                                    ) : (
                                        <FaClock className="text-[9px] text-amber-400 flex-shrink-0" />
                                    )}
                                </div>
                            );
                        })}
                        {usersOnDate.length > 5 && (
                            <p className="text-[10px] text-center text-indigo-500 font-medium pt-0.5">+{usersOnDate.length - 5} more</p>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Custom tooltip for bar chart
    const BarTooltip = ({ id, value, indexValue, data }) => {
        const key = data?.dateKey;
        const usersOnGroup = key !== undefined ? (dateUserMap[key] || []) : [];
        return (
            <div className="bg-white rounded-xl shadow-2xl border border-indigo-100 p-3 max-w-[280px] pointer-events-none">
                <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-100">
                    <FaCalendarAlt className="text-indigo-500 text-xs" />
                    <span className="text-sm font-bold text-gray-800">{indexValue}</span>
                    <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${id === "Emails Sent" ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700"
                        }`}>
                        {value} {id}
                    </span>
                </div>
                {usersOnGroup.length > 0 && id === "Interviews" && (
                    <div className="space-y-1">
                        {usersOnGroup.slice(0, 4).map(user => (
                            <div key={user._id} className="flex items-center gap-1.5 text-[11px]">
                                <FaUser className="text-[8px] text-indigo-400 flex-shrink-0" />
                                <span className="font-medium text-gray-700 truncate">{user.fullName}</span>
                                {user.interviewEmailSent?.sent && <FaCheckCircle className="text-[8px] text-emerald-500 flex-shrink-0" />}
                            </div>
                        ))}
                        {usersOnGroup.length > 4 && (
                            <p className="text-[10px] text-indigo-500 font-medium">+{usersOnGroup.length - 4} more</p>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Empty state
    if (lineData.length === 0) {
        return (
            <div className="animate-fade-in">
                <div className="flex flex-col items-center justify-center py-20 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                    <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                        <FaClock className="text-3xl text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">No Interviews Found</h3>
                    <p className="text-sm text-gray-500 text-center max-w-md mb-8">
                        {viewPreset !== "datewise" || searchTerm || filterDays.length > 0 || filterRange.start || filterRange.end || filterWeeks.length > 0
                            ? "Current filters and presets are hiding all scheduled interviews."
                            : "Schedule interviews for eligible candidates from the Grid view to see timeline analytics here."
                        }
                    </p>
                    {(viewPreset !== "datewise" || searchTerm || filterDays.length > 0 || filterRange.start || filterRange.end || filterWeeks.length > 0) && (
                        <button
                            onClick={() => {
                                setViewPreset("datewise");
                                setSearchTerm("");
                                setFilterDays([]);
                                setFilterRange({ start: "", end: "" });
                                setFilterWeeks([]);
                                setIsFilterOpen(false);
                            }}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-indigo-200 hover:bg-indigo-700 transition-all cursor-pointer"
                        >
                            <FaCalendarAlt className="text-xs" />
                            Back to Default View
                        </button>
                    )}
                </div>
            </div>
        );
    }

    const nivoTheme = {
        axis: {
            ticks: { text: { fontSize: 11, fill: "#64748b", fontWeight: 500 } },
            legend: { text: { fontSize: 12, fill: "#475569", fontWeight: 600 } }
        },
        grid: { line: { stroke: "#f1f5f9", strokeWidth: 1 } },
        crosshair: { line: { stroke: "#6366f1", strokeWidth: 1, strokeDasharray: "6 6" } }
    };

    return (
        <div className="animate-fade-in">
            {/* ───── Top Controls: Search + Chart Toggle ───── */}
            <div className="mb-5 space-y-4">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 max-w-2xl">
                        {/* Search */}
                        <div className="relative flex-1">
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name, email, phone, degree..."
                                className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent shadow-sm"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                                    <FaTimes className="text-xs" />
                                </button>
                            )}
                        </div>

                        <div className="relative">
                            <select
                                value={viewPreset}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setViewPreset(val);
                                    if (val === "custom") setIsFilterOpen(true);
                                    else setIsFilterOpen(false);
                                }}
                                className={`appearance-none flex items-center gap-2 pl-9 pr-8 py-2.5 rounded-xl border font-bold text-xs transition-all shadow-sm cursor-pointer outline-none ${viewPreset !== "datewise"
                                    ? "bg-indigo-600 text-white border-indigo-600"
                                    : "bg-white text-gray-600 border-gray-200 hover:bg-indigo-50"
                                    }`}
                            >
                                <optgroup label="Grouping & Views">
                                    <option value="datewise">Datewise View</option>
                                    <option value="daywise">Daywise (Mon-Sun)</option>
                                    <option value="monthwise">Monthwise Overview</option>
                                </optgroup>
                                <optgroup label="Time Presets">
                                    <option value="tomorrow">Tomorrow Only</option>
                                    <option value="nextweek">Next 7 Days</option>
                                    <option value="nextmonth">Next 30 Days</option>
                                    <option value="next6months">Next 6 Months</option>
                                </optgroup>
                                <optgroup label="Advanced">
                                    <option value="custom">Advanced Filters...</option>
                                </optgroup>
                            </select>
                            <FaCalendarAlt className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-xs ${viewPreset !== "datewise" ? "text-white" : "text-indigo-500"}`} />
                            <span className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform ${viewPreset !== "datewise" ? "text-white" : "text-gray-400"}`}>▾</span>
                        </div>

                        {/* Quick filter indicator button (only if advanced filters active) */}
                        {(filterDays.length > 0 || filterRange.start || filterRange.end || filterWeeks.length > 0) && (
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 font-bold text-xs shadow-sm hover:bg-purple-100 transition-all cursor-pointer"
                            >
                                <FaFilter className="text-[10px]" />
                                Filters Active
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse"></span>
                            </button>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Chart Type Toggle */}
                        <div className="flex items-center bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {CHART_TYPES.map(({ key, label, icon: Icon }) => (
                                <button
                                    key={key}
                                    onClick={() => setChartType(key)}
                                    className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${chartType === key
                                        ? "bg-indigo-600 text-white"
                                        : "text-gray-500 hover:bg-indigo-50 hover:text-indigo-700"
                                        }`}
                                >
                                    <Icon className="text-[10px]" />
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Cumulative Toggle */}
                        {chartType !== "bar" && (
                            <button
                                onClick={() => setShowCumulative(!showCumulative)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-sm ${showCumulative
                                    ? "bg-indigo-600 text-white border-indigo-600"
                                    : "bg-white text-gray-600 border-gray-200 hover:bg-indigo-50"
                                    }`}
                            >
                                <FaChartLine className="text-[10px]" />
                                Cumulative
                            </button>
                        )}
                    </div>
                </div>

                {/* Advanced Filters Panel */}
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
                            <p className="text-[10px] text-gray-400 font-medium italic">* Filtering updates all timeline analytics instantly.</p>
                            <button
                                onClick={() => {
                                    setFilterDays([]);
                                    setFilterRange({ start: "", end: "" });
                                    setFilterWeeks([]);
                                }}
                                className="text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-wider cursor-pointer"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ───── Stats Cards ───── */}
            <div className="mb-5 grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                    { label: "Total Eligible", value: stats.total, icon: FaUsers, bg: "from-indigo-50 to-indigo-100", border: "border-indigo-200", text: "text-indigo-700", iconBg: "bg-indigo-200/50" },
                    { label: "Scheduled", value: stats.scheduled, icon: FaCalendarAlt, bg: "from-blue-50 to-blue-100", border: "border-blue-200", text: "text-blue-700", iconBg: "bg-blue-200/50" },
                    { label: "Emails Sent", value: stats.emailSent, icon: FaEnvelope, bg: "from-emerald-50 to-emerald-100", border: "border-emerald-200", text: "text-emerald-700", iconBg: "bg-emerald-200/50" },
                    { label: "Panels Assigned", value: stats.panelAssigned, icon: FaClipboardList, bg: "from-purple-50 to-purple-100", border: "border-purple-200", text: "text-purple-700", iconBg: "bg-purple-200/50" },
                    { label: "Not Scheduled", value: stats.notScheduled, icon: FaClock, bg: "from-amber-50 to-amber-100", border: "border-amber-200", text: "text-amber-700", iconBg: "bg-amber-200/50" },
                ].map(({ label, value, icon: Icon, bg, border, text, iconBg }) => (
                    <div key={label} className={`p-3 rounded-xl bg-gradient-to-br ${bg} border ${border} shadow-sm`}>
                        <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
                                <Icon className={`text-sm ${text}`} />
                            </div>
                            <div>
                                <p className="text-[9px] text-gray-500 font-bold tracking-wider uppercase">{label}</p>
                                <p className={`text-xl font-extrabold ${text}`}>{value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ───── Chart ───── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <FaCalendarAlt className="text-indigo-500" />
                        Interview Schedule Timeline
                        {showCumulative && <span className="text-[10px] text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 font-medium">(Cumulative)</span>}
                    </h3>
                    {dateRange && (
                        <span className="text-[10px] text-gray-400 font-medium">
                            {dateRange.days} days span • {format(dateRange.start, "dd MMM")} — {format(dateRange.end, "dd MMM yyyy")}
                        </span>
                    )}
                </div>

                <div style={{ height: 380 }}>
                    {chartType === "bar" ? (
                        <ResponsiveBar
                            data={barData}
                            keys={["Interviews", "Emails Sent"]}
                            indexBy="date"
                            margin={{ top: 20, right: 30, bottom: 60, left: 50 }}
                            padding={0.35}
                            groupMode="grouped"
                            colors={["#6366f1", "#10b981"]}
                            borderRadius={4}
                            borderWidth={1}
                            borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
                            axisTop={null}
                            axisRight={null}
                            axisBottom={{
                                tickSize: 5,
                                tickPadding: 8,
                                tickRotation: -45,
                            }}
                            axisLeft={{
                                tickSize: 5,
                                tickPadding: 5,
                                legend: "Count",
                                legendOffset: -40,
                                legendPosition: "middle",
                                format: v => Number.isInteger(v) ? v : ""
                            }}
                            labelSkipWidth={20}
                            labelSkipHeight={12}
                            labelTextColor={{ from: "color", modifiers: [["darker", 2]] }}
                            tooltip={BarTooltip}
                            legends={[{
                                dataFrom: "keys",
                                anchor: "top-right",
                                direction: "row",
                                translateY: -15,
                                itemsSpacing: 8,
                                itemWidth: 110,
                                itemHeight: 20,
                                symbolSize: 12,
                                symbolShape: "circle"
                            }]}
                            theme={nivoTheme}
                            motionConfig="gentle"
                        />
                    ) : (
                        <ResponsiveLine
                            data={lineData}
                            margin={{ top: 20, right: 30, bottom: 60, left: 50 }}
                            xScale={{ type: "point" }}
                            yScale={{ type: "linear", min: 0, max: "auto", stacked: false }}
                            curve="monotoneX"
                            axisTop={null}
                            axisRight={null}
                            axisBottom={{
                                tickSize: 5,
                                tickPadding: 8,
                                tickRotation: -45,
                            }}
                            axisLeft={{
                                tickSize: 5,
                                tickPadding: 5,
                                legend: showCumulative ? "Cumulative Count" : "Count",
                                legendOffset: -40,
                                legendPosition: "middle",
                                format: v => Number.isInteger(v) ? v : ""
                            }}
                            enableArea={chartType === "area"}
                            areaOpacity={0.15}
                            colors={["#6366f1", "#10b981"]}
                            lineWidth={3}
                            pointSize={10}
                            pointColor={{ theme: "background" }}
                            pointBorderWidth={3}
                            pointBorderColor={{ from: "serieColor" }}
                            enableSlices={false}
                            useMesh={true}
                            tooltip={LineTooltip}
                            legends={[{
                                anchor: "top-right",
                                direction: "row",
                                translateY: -15,
                                itemsSpacing: 16,
                                itemWidth: 160,
                                itemHeight: 20,
                                symbolSize: 12,
                                symbolShape: "circle"
                            }]}
                            theme={nivoTheme}
                            motionConfig="gentle"
                        />
                    )}
                </div>
            </div>

            {/* ───── Date-wise Breakdown ───── */}
            {dateBreakdown.length > 0 && (
                <div className="mt-5 bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                    <div className="px-5 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <FaClipboardList className="text-indigo-500" />
                            Date-wise Breakdown
                        </h3>
                        <span className="text-[10px] text-gray-400 font-medium">{dateBreakdown.length} {viewPreset === "daywise" ? "days" : viewPreset === "monthwise" ? "months" : "dates"} in view</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {dateBreakdown.map(({ dateKey, dateLabel, users, emailSent, panelAssigned }) => {
                            const isExpanded = expandedDate === dateKey;
                            return (
                                <div key={dateKey}>
                                    <button
                                        onClick={() => setExpandedDate(isExpanded ? null : dateKey)}
                                        className="w-full px-5 py-3 flex items-center justify-between hover:bg-indigo-50/30 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                                <span className="text-xs font-bold text-indigo-700">
                                                    {viewPreset === "daywise" ? dateLabel.charAt(0) : viewPreset === "monthwise" ? dateLabel.charAt(0) : format(new Date(dateKey), "dd")}
                                                </span>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-gray-800">{dateLabel}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                                {users.length} candidate{users.length !== 1 ? "s" : ""}
                                            </span>
                                            {emailSent > 0 && (
                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                    {emailSent} emailed
                                                </span>
                                            )}
                                            {panelAssigned > 0 && (
                                                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                                                    {panelAssigned} paneled
                                                </span>
                                            )}
                                            <span className={`text-gray-400 text-xs transition-transform ${isExpanded ? "rotate-180" : ""}`}>▾</span>
                                        </div>
                                    </button>

                                    {/* Expanded user cards */}
                                    {isExpanded && (
                                        <div className="px-5 pb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 animate-fade-in">
                                            {users.map(user => {
                                                const panelNames = getPanelNames(user);
                                                const degree = user.education?.qualifyingDegree?.degree || user.education?.graduation?.degree || "N/A";
                                                return (
                                                    <button
                                                        key={user._id}
                                                        onClick={() => onViewUser && onViewUser(user)}
                                                        className="flex items-start gap-3 p-3 bg-gray-50 hover:bg-indigo-50 rounded-xl border border-gray-100 hover:border-indigo-200 transition-all cursor-pointer group text-left shadow-sm"
                                                    >
                                                        {user.profileImage ? (
                                                            <img src={user.profileImage} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0" />
                                                        ) : (
                                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                                                                <FaUser className="text-xs text-indigo-500" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-bold text-gray-800 group-hover:text-indigo-700 transition-colors truncate">{user.fullName}</p>
                                                            <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                <span className="text-[9px] font-medium px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100 truncate max-w-[120px]" title={degree}>
                                                                    {degree.length > 18 ? degree.substring(0, 16) + "…" : degree}
                                                                </span>
                                                                {panelNames.map((name, i) => (
                                                                    <span key={i} className="text-[9px] font-medium px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100">{name}</span>
                                                                ))}
                                                                {user.interviewEmailSent?.sent ? (
                                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-100">✓ Emailed</span>
                                                                ) : (
                                                                    <span className="text-[9px] font-medium px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded border border-amber-100">✗ Pending</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InterviewTimelineView;
