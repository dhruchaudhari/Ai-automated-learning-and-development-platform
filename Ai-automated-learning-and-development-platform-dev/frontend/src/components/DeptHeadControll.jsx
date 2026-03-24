import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
    FaSearch,
    FaTimes,
    FaRedo,
    FaPowerOff,
    FaBuilding,
    FaUserTie,
    FaBriefcase,
    FaUserPlus,
    FaBrain,
    FaCheck,
    FaTimes as FaReject,
    FaFileAlt,
    FaTools,
    FaGraduationCap,
    FaToolbox
} from "react-icons/fa";

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ScoreBadge = ({ score }) => {
    let color = 'bg-red-100 text-red-700 border-red-200';
    if (score >= 0.70) color = 'bg-emerald-100 text-emerald-700 border-emerald-200';
    else if (score >= 0.40) color = 'bg-amber-100 text-amber-700 border-amber-200';

    return (
        <span className={`px-2 py-1 rounded-md text-xs font-bold border ${color}`}>
            {(score * 100).toFixed(0)}% Match
        </span>
    );
};

const DeptHeadControll = () => {
    const { logout } = useAuth();
    const [userData, setUserData] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("live"); // 'live' or 'history'

    const [results, setResults] = useState([]);
    const [vacancies, setVacancies] = useState({});
    const [loading, setLoading] = useState(false);
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
    const [viewingResumeUrl, setViewingResumeUrl] = useState("");
    const [viewingCandidateName, setViewingCandidateName] = useState("");

    // --- History View Filters ---
    const [historySearch, setHistorySearch] = useState("");
    const [historyDateRange, setHistoryDateRange] = useState("all");

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setUserData(parsed);
            } catch (error) {
                console.error("Error parsing user data:", error);
            }
        }
    }, []);

    const fetchDashboardData = async () => {
        if (!userData || !userData.department) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const resResults = await axios.get(`${API}/fitnesstfidf/depthead/results?department=${encodeURIComponent(userData.department)}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (resResults.data.success) {
                setResults(resResults.data.data || []);
            }

            const resVac = await axios.get(`${API}/fitnesstfidf/vacancies`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (resVac.data.success) {
                const allVac = resVac.data.vacancies || {};
                // Only keep this department's vacancies
                setVacancies({ [userData.department]: allVac[userData.department] || {} });
            }
        } catch (err) {
            console.error('Fetch error:', err);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userData) {
            fetchDashboardData();
        }
    }, [userData]);

    const handleRefresh = () => {
        fetchDashboardData();
    };

    const handleClearFilters = () => {
        setSearchTerm("");
    };

    // Flatten results specific to Pending Review (Live Mode)
    const flatRows = useMemo(() => {
        if (!userData || !userData.department) return [];
        const rows = [];
        for (const record of results) {
            const fitMap = record.fitnessByJob || {};
            const entries = fitMap instanceof Map ? Array.from(fitMap.entries()) : Object.entries(fitMap);

            for (const [jobId, jobFit] of entries) {
                // LIVE VIEW: Must belong to this department and be sent to Dept Head (pending decision)
                if (jobFit.departmentName === userData.department && jobFit.status === 'Sent') {
                    const comps = jobFit.components || {};
                    let summaryText = record.extractedData?.summary || '';
                    if (Array.isArray(summaryText)) summaryText = summaryText.join(' ');

                    rows.push({
                        _id: `${record._id}_${jobId}`,
                        recordId: record._id,
                        resumeFile: record.resumeFile || 'unknown.pdf',
                        candidateName: record.candidateName || 'Unknown',
                        skills: record.extractedData?.skills || [],
                        summary: summaryText,
                        jobId,
                        score: jobFit.score || 0,
                        metrics: {
                            skillOverlap: comps.skillOverlap || 0,
                            educationMatch: comps.educationMatch || 0,
                        },
                        jobCode: jobFit.jobCode || '',
                        roleTitle: jobFit.roleTitle || '',
                        updatedAt: jobFit.updatedAt || record.updatedAt || new Date().toISOString()
                    });
                }
            }
        }

        // Apply search filter
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            return rows.filter(r =>
                r.candidateName.toLowerCase().includes(q) ||
                r.roleTitle.toLowerCase().includes(q) ||
                r.skills.some(s => s.toLowerCase().includes(q))
            );
        }

        return rows;
    }, [results, userData, searchTerm]);

    // Flatten results specific to HISTORY / AUDIT View (Accepted candidates)
    const historyRows = useMemo(() => {
        if (!userData || !userData.department) return [];
        const rows = [];
        for (const record of results) {
            const fitMap = record.fitnessByJob || {};
            const entries = fitMap instanceof Map ? Array.from(fitMap.entries()) : Object.entries(fitMap);

            for (const [jobId, jobFit] of entries) {
                // HISTORY VIEW: Only those who Accepted by THIS department head
                if (jobFit.departmentName === userData.department && jobFit.status === 'Accepted') {
                    const comps = jobFit.components || {};
                    let summaryText = record.extractedData?.summary || '';
                    if (Array.isArray(summaryText)) summaryText = summaryText.join(' ');

                    rows.push({
                        _id: `${record._id}_${jobId}`,
                        recordId: record._id,
                        resumeFile: record.resumeFile || 'unknown.pdf',
                        candidateName: record.candidateName || 'Unknown',
                        skills: record.extractedData?.skills || [],
                        education: record.extractedData?.education || [],
                        summary: summaryText,
                        jobId,
                        jobCode: jobFit.jobCode || '',
                        roleTitle: jobFit.roleTitle || '',
                        departmentName: jobFit.departmentName || '',
                        acceptedAt: jobFit.updatedAt || record.updatedAt || new Date().toISOString()
                    });
                }
            }
        }

        // Apply history search
        let filtered = rows;
        if (historySearch.trim()) {
            const q = historySearch.toLowerCase();
            filtered = filtered.filter(r =>
                r.candidateName.toLowerCase().includes(q) ||
                r.roleTitle.toLowerCase().includes(q) ||
                r.skills.some(s => s.toLowerCase().includes(q))
            );
        }

        // Apply date range filter
        if (historyDateRange !== 'all') {
            const now = new Date();
            let cutoffDate = new Date();
            if (historyDateRange === 'today') {
                cutoffDate.setHours(0, 0, 0, 0);
            } else if (historyDateRange === '7days') {
                cutoffDate.setDate(now.getDate() - 7);
            } else if (historyDateRange === '30days') {
                cutoffDate.setDate(now.getDate() - 30);
            }

            filtered = filtered.filter(r => new Date(r.acceptedAt) >= cutoffDate);
        }

        // Sort by most recently accepted
        filtered.sort((a, b) => new Date(b.acceptedAt) - new Date(a.acceptedAt));

        return filtered;
    }, [results, userData, historySearch, historyDateRange]);

    const handleAccept = async (recordId, jobId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API}/fitnesstfidf/accept/${recordId}/job/${jobId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                toast.success('Resume accepted & vacancy fulfilled');
                fetchDashboardData();
            }
        } catch (err) {
            toast.error('Failed to accept resume');
        }
    };

    const openResumeModal = (resumeFile, candidateName) => {
        const token = localStorage.getItem('token');
        setViewingResumeUrl(`${API}/fitnesstfidf/download/${resumeFile}?token=${token}`);
        setViewingCandidateName(candidateName);
        setIsResumeModalOpen(true);
    };

    const handleReject = async (recordId, jobId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API}/fitnesstfidf/reject/${recordId}/job/${jobId}`, {
                rejectedBy: userData.username || userData.fullName || 'Dept Head'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                toast.success('Resume rejected');
                fetchDashboardData();
            }
        } catch (err) {
            toast.error('Failed to reject resume');
        }
    };

    return (
        <div className="min-h-screen py-8 px-4 animate-fade-in transition-all duration-500 bg-gray-50/50">
            <div className="max-w-7xl mx-auto">
                {/* Title */}
                <div className="text-center mb-10 animate-slide-down">
                    <h1 className="text-4xl md:text-5xl font-normal text-gray-800 mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                        Department Head Review
                    </h1>
                </div>

                {/* Main Content Area */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                    {/* Header Controls */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl border border-primary-100">
                        {/* Search Bar */}
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={viewMode === 'live' ? "Search candidate, role, or skills..." : "Search history records..."}
                                    value={viewMode === 'live' ? searchTerm : historySearch}
                                    onChange={(e) => viewMode === 'live' ? setSearchTerm(e.target.value) : setHistorySearch(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-72 md:w-96 font-normal text-sm"
                                />
                                {(viewMode === 'live' ? searchTerm : historySearch) && (
                                    <button
                                        onClick={() => viewMode === 'live' ? setSearchTerm("") : setHistorySearch("")}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <FaTimes />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setViewMode(prev => prev === 'live' ? 'history' : 'live')}
                                className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition-colors border shadow-sm ${viewMode === 'live'
                                    ? 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                                    : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700'
                                    }`}
                                title={viewMode === 'live' ? "View Audit History" : "Back to Pending Reviews"}
                            >
                                {viewMode === 'live' ? <FaToolbox /> : <FaCheck />}
                                {viewMode === 'live' ? 'View Records' : 'Back to Live'}
                            </button>

                            <div className="w-px h-8 bg-gray-300 mx-1"></div>

                            <button
                                onClick={handleRefresh}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-normal disabled:opacity-50 bg-white shadow-sm"
                                title="Refresh data"
                            >
                                <FaRedo className={loading ? 'animate-spin text-primary-600' : 'text-primary-600'} />
                                Refresh
                            </button>

                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-normal shadow-sm"
                                title="Logout from application"
                            >
                                <FaPowerOff />
                                Logout
                            </button>
                        </div>
                    </div>

                    {/* Live Vacancies Panel */}
                    {Object.keys(vacancies).length > 0 && (
                        <div className="mb-6 border border-gray-100 rounded-xl bg-gray-50 p-4">
                            <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <FaUserPlus className="text-primary-500" /> Live Vacancies for {userData?.department}
                            </h2>
                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                                {Object.entries(vacancies).map(([dept, rolesObj]) => (
                                    <div key={dept} className="flex gap-3">
                                        {Object.entries(rolesObj).map(([role, count]) => (
                                            <div key={role} className="min-w-[180px] bg-white border border-gray-200 rounded-lg p-3 shadow-sm flex flex-col justify-between items-start gap-2">
                                                <span className="text-xs font-semibold text-gray-700 truncate w-full" title={role}>{role}</span>
                                                <span className={`font-bold px-2 py-1 rounded text-xs ${count > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                    {count} {count === 1 ? 'opening' : 'openings'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Main Content Areas */}
                    {viewMode === 'live' ? (
                        /* --- LIVE VIEW: PENDING REVIEW QUEUE --- */
                        <>
                            {loading && flatRows.length === 0 ? (
                                <div className="text-center py-10">
                                    <FaRedo className="animate-spin text-3xl text-primary-500 mx-auto mb-4" />
                                    <p className="text-gray-500">Loading assigned candidates...</p>
                                </div>
                            ) : flatRows.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                                    <FaCheck className="text-4xl text-emerald-300 mx-auto mb-3" />
                                    <h3 className="text-lg font-medium text-gray-800 mb-1">All Caught Up!</h3>
                                    <p className="text-gray-500 text-sm">You have no pending candidates to review.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                                    <table className="w-full text-left bg-white">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 tracking-wide w-[32%]">Candidate</th>
                                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 tracking-wide w-[24%]">Job / Role</th>
                                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 tracking-wide w-[24%]">AI Evaluation</th>
                                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 tracking-wide text-right w-[20%]">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {flatRows.map((row) => (
                                                <tr key={row._id} className="hover:bg-blue-50/30 transition-colors">
                                                    {/* Candidate Info */}
                                                    <td className="px-4 py-4 align-top w-[32%]">
                                                        <div className="flex flex-col gap-2">
                                                            <span className="text-sm font-semibold text-gray-800">
                                                                {row.candidateName}
                                                                <button
                                                                    onClick={() => openResumeModal(row.resumeFile, row.candidateName)}
                                                                    className="ml-2 text-xs text-primary-500 hover:underline inline-flex items-center gap-1" title="View Resume">
                                                                    <FaFileAlt /> View
                                                                </button>
                                                            </span>
                                                            {row.summary && (
                                                                <p className="text-[11px] text-gray-500 leading-relaxed whitespace-pre-line" title={row.summary}>
                                                                    {row.summary}
                                                                </p>
                                                            )}
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {(row.skills || []).map((skill, idx) => (
                                                                    <span key={idx} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] border border-gray-200 hover:bg-gray-200 transition-colors">
                                                                        {skill}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Job / Role */}
                                                    <td className="px-4 py-4 align-top w-[24%]">
                                                        <div className="flex flex-col gap-1.5">
                                                            <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                                                                <FaUserTie className="text-primary-400" size={10} /> {row.roleTitle || '—'}
                                                            </span>
                                                            <span className="text-[11px] text-gray-500 flex items-center gap-1.5">
                                                                <FaBriefcase className="text-blue-400" size={10} />
                                                                <span className="font-mono text-[10px] bg-gray-100 px-1 py-0.5 rounded border border-gray-200">{row.jobCode || '—'}</span>
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* AI Evaluation */}
                                                    <td className="px-4 py-4 align-top w-[24%]">
                                                        <div className="flex flex-col gap-3">
                                                            <div className="flex items-center justify-end">
                                                                <ScoreBadge score={row.score} />
                                                            </div>
                                                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-700 ease-out ${row.score >= 0.70 ? 'bg-emerald-500' : row.score >= 0.40 ? 'bg-amber-400' : 'bg-red-500'}`}
                                                                    style={{ width: `${Math.min(100, row.score * 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-4 py-4 align-top text-right w-[20%]">
                                                        <div className="flex flex-col items-end gap-2">
                                                            <button
                                                                onClick={() => handleAccept(row.recordId, row.jobId)}
                                                                className="inline-flex items-center justify-center gap-1.5 w-full max-w-[120px] px-3 py-2 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm"
                                                            >
                                                                <FaCheck size={10} /> Accept
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(row.recordId, row.jobId)}
                                                                className="inline-flex items-center justify-center gap-1.5 w-full max-w-[120px] px-3 py-2 text-xs font-semibold bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100 transition-colors shadow-sm"
                                                            >
                                                                <FaReject size={10} /> Reject
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    ) : (
                        /* --- HISTORY VIEW: AUDIT TIMELINE --- */
                        <div className="animate-fade-in">
                            {/* History Filter Bar (FilterPanel style) */}
                            <div className="p-4 bg-gradient-to-br from-gray-50 to-indigo-50/40 rounded-xl border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                                    <div className="flex items-center gap-2">
                                        <FaCheck className="text-emerald-500" />
                                        <span className="text-sm font-bold text-gray-700 whitespace-nowrap">Accepted Records History</span>
                                    </div>
                                    <div className="h-6 w-px bg-gray-300 hidden md:block"></div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Date Filter:</span>
                                        <select
                                            value={historyDateRange}
                                            onChange={(e) => setHistoryDateRange(e.target.value)}
                                            className="text-xs border-gray-300 rounded px-2 py-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="all">All Time</option>
                                            <option value="today">Today</option>
                                            <option value="7days">Last 7 Days</option>
                                            <option value="30days">Last 30 Days</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="text-xs font-bold text-indigo-700 bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 shadow-sm whitespace-nowrap">
                                    {historyRows.length} Records Found
                                </div>
                            </div>

                            {/* History Cards Grid */}
                            {loading && historyRows.length === 0 ? (
                                <div className="text-center py-10">
                                    <FaRedo className="animate-spin text-3xl text-primary-500 mx-auto mb-4" />
                                    <p className="text-gray-500">Loading history records...</p>
                                </div>
                            ) : historyRows.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                                    <FaGraduationCap className="text-4xl text-gray-300 mx-auto mb-3" />
                                    <h3 className="text-lg font-medium text-gray-800 mb-1">No History Records Found</h3>
                                    <p className="text-gray-500 text-sm">You haven't accepted any candidates yet, or none match the active filters.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {historyRows.map(row => (
                                        <div key={row._id} className="relative bg-white rounded-2xl border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group">
                                            {/* Banner - WHEN */}
                                            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-3 flex justify-between items-center text-white border-b-4 border-emerald-500">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-400">
                                                        <FaCheck size={16} className="text-emerald-400" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] uppercase tracking-wider text-slate-300 font-semibold mb-0.5">When Selected</span>
                                                        <span className="text-sm font-bold tracking-wide text-emerald-50">
                                                            {new Date(row.acceptedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => openResumeModal(row.resumeFile, row.candidateName)}
                                                    className="w-8 h-8 bg-white/10 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
                                                    title="View Original Resume"
                                                >
                                                    <FaFileAlt size={14} className="text-white" />
                                                </button>
                                            </div>

                                            <div className="p-5 flex-1 flex flex-col gap-5 bg-white">
                                                {/* Section - WHO */}
                                                <div>
                                                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2 block">Who Selected</span>
                                                    <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2 group-hover:text-primary-600 transition-colors">
                                                        {row.candidateName}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 mb-3">
                                                        <FaBriefcase className="text-primary-500" size={14} />
                                                        <span className="font-semibold">{row.roleTitle}</span>
                                                        <span className="text-gray-300">|</span>
                                                        <span className="font-mono text-xs text-gray-500">{row.jobCode}</span>
                                                    </div>

                                                    {row.summary && (
                                                        <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                                                            <p className="text-[11px] text-gray-600 leading-relaxed italic line-clamp-3" title={row.summary}>
                                                                "{row.summary}"
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Section - Job Role Details */}
                                                <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                                                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1 block">Job & Department Record</span>

                                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className="text-gray-500 font-semibold">Department:</span>
                                                                <span className="text-slate-800 font-bold">{row.departmentName || 'Unknown'}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className="text-gray-500 font-semibold">Role & Title:</span>
                                                                <span className="text-slate-700 font-semibold">{row.roleTitle || '—'}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className="text-gray-500 font-semibold">Vacancy Code:</span>
                                                                <span className="font-mono text-[10px] text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-100">{row.jobCode || '—'}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1 mt-2 block">Applicant Parsed Details</span>

                                                    {/* Education */}
                                                    <button
                                                        onClick={() => openResumeModal(row.resumeFile, row.candidateName)}
                                                        className="w-full h-9 flex items-center justify-center gap-2 px-3 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold hover:bg-slate-200 transition-all border border-slate-200 mb-2 shadow-sm"
                                                    >
                                                        <FaFileAlt size={12} />
                                                        View Resume
                                                    </button>

                                                    {/* Skills */}
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-[10px] font-semibold text-gray-500 flex items-center gap-1"><FaToolbox size={10} /> Extracted Skills</span>
                                                        <div className="flex flex-wrap gap-1">
                                                            {(row.skills || []).map((skill, idx) => (
                                                                <span key={idx} className="px-1.5 py-0.5 bg-white text-gray-700 rounded text-[10px] border border-gray-200 shadow-sm">
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Resume Viewer Modal */}
            {isResumeModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-scale-in">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                                    <FaFileAlt size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{viewingCandidateName}</h3>
                                    <p className="text-xs text-gray-500">Resume Preview</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsResumeModalOpen(false)}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-800"
                            >
                                <FaTimes size={20} />
                            </button>
                        </div>
                        <div className="flex-1 bg-gray-100 p-2">
                            <iframe
                                src={`${viewingResumeUrl}#toolbar=0`}
                                className="w-full h-full rounded-lg shadow-inner bg-white"
                                title="Resume Viewer"
                            />
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <a
                                href={viewingResumeUrl}
                                download
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Download Original
                            </a>
                            <button
                                onClick={() => setIsResumeModalOpen(false)}
                                className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeptHeadControll;
