import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    FaSearch, FaTimes, FaRedo, FaUpload, FaFilter,
    FaTrashAlt, FaSortAmountDown, FaSortAmountUp,
    FaChevronLeft, FaChevronRight, FaFilePdf, FaFileAlt,
    FaBriefcase, FaBuilding, FaUserTie, FaBrain, FaUserPlus,
    FaPaperPlane, FaArrowLeft, FaUsers, FaHourglassHalf, FaCheckCircle
} from 'react-icons/fa';
import {
    ArrowLeftOnRectangleIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── Score Badge ───
const ScoreBadge = ({ score }) => {
    const s = parseFloat(score) || 0;
    let bg = 'bg-red-100 text-red-700 border-red-200';
    if (s >= 0.7) bg = 'bg-emerald-100 text-emerald-700 border-emerald-200';
    else if (s >= 0.4) bg = 'bg-amber-100 text-amber-700 border-amber-200';
    return (
        <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full border ${bg}`}>
            {(s * 100).toFixed(1)}%
        </span>
    );
};

// ─── Component Score Bar ───
const MiniBar = ({ value, label, color = 'bg-primary-500' }) => {
    const pct = Math.round((parseFloat(value) || 0) * 100);
    return (
        <div className="flex items-center gap-2 text-[11px]" title={`${label}: ${pct}%`}>
            <span className="w-20 text-gray-500 truncate">{label}</span>
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <span className="w-8 text-right text-gray-600">{pct}%</span>
        </div>
    );
};

// ─── Pagination ───
const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, rowsPerPage }) => {
    const getPages = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
        if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
        for (let i = start; i <= end; i++) pages.push(i);
        if (end < totalPages) { if (end < totalPages - 1) pages.push('...'); pages.push(totalPages); }
        return pages;
    };
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-gray-500">
                {Math.min((currentPage - 1) * rowsPerPage + 1, totalItems)}–{Math.min(currentPage * rowsPerPage, totalItems)} of {totalItems}
            </span>
            <div className="flex items-center gap-1">
                <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"><FaChevronLeft size={12} /></button>
                {getPages().map((p, i) => (
                    <button key={i} onClick={() => typeof p === 'number' && onPageChange(p)}
                        disabled={p === '...'}
                        className={`min-w-[32px] h-8 rounded-lg text-xs font-medium transition-all
                            ${p === currentPage ? 'bg-primary-600 text-white shadow-sm' : p === '...' ? 'cursor-default' : 'hover:bg-gray-100 text-gray-700'}`}>
                        {p}
                    </button>
                ))}
                <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"><FaChevronRight size={12} /></button>
            </div>
        </div>
    );
};


// ─── Confirmation Modal ───
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, type = 'danger' }) => {
    if (!isOpen) return null;
    const isDanger = type === 'danger';
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 animate-scale-in">
                <div className="text-center mb-6">
                    <div className={`w-16 h-16 ${isDanger ? 'bg-red-100' : 'bg-primary-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <FaTimes className={`${isDanger ? 'text-red-600' : 'text-primary-600'} text-2xl`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                    <p className="text-gray-500 text-sm mt-2">{message}</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className={`flex-[2] px-4 py-3 rounded-xl ${isDanger ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-200'} text-white font-bold transition-colors shadow-lg`}>
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};


// ═══════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ───
// ═══════════════════════════════════════════════════════════════
const FitnessTfidf = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    // State
    const [results, setResults] = useState([]);
    const [vacancies, setVacancies] = useState({});
    const [vacancyTotals, setVacancyTotals] = useState({ total: 0, unfilled: 0, filled: 0 });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [uploadPct, setUploadPct] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [filtersOpen, setFiltersOpen] = useState(true);
    const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 15;

    // Filters
    const [filterDept, setFilterDept] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterJobCode, setFilterJobCode] = useState('');
    const [filterMinScore, setFilterMinScore] = useState('');
    const [filterMaxScore, setFilterMaxScore] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterAction, setFilterAction] = useState('');

    // Confirmation Modal State
    const [confModal, setConfModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        type: 'danger'
    });

    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
    const [viewingResumeUrl, setViewingResumeUrl] = useState('');
    const [viewingCandidateName, setViewingCandidateName] = useState('');
    const [selectedRows, setSelectedRows] = useState([]); // Array of recordId_jobId

    const closeConf = () => setConfModal({ ...confModal, isOpen: false });

    // Freeze check: returns true if specific role or entire department has 0 openings
    const isFrozen = (deptName, roleTitle) => {
        const deptVacancies = vacancies[deptName] || {};
        // Check if specific role is full
        if (deptVacancies[roleTitle] === 0) return true;
        // Check if entire department is full (sum of all roles in that dept is 0)
        const totalOpenings = Object.values(deptVacancies).reduce((sum, count) => sum + (count || 0), 0);
        if (totalOpenings === 0) return true;
        return false;
    };

    // ─── Fetch results on mount ───
    useEffect(() => {
        fetchResults();
        fetchVacancies();
    }, []);

    const fetchVacancies = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API}/fitnesstfidf/vacancies`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setVacancies(res.data.vacancies || {});
                setVacancyTotals({
                    total: res.data.totalVacancies || 0,
                    unfilled: res.data.totalUnfilled || 0,
                    filled: res.data.totalFilled || 0
                });
            }
        } catch (err) {
            console.error('Fetch vacancies error:', err);
        }
    };

    const fetchResults = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API}/fitnesstfidf/results`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.success) {
                setResults(res.data.data || []);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            toast.error('Failed to load fitness results');
        } finally {
            setLoading(false);
        }
    };

    // ─── Upload handler ───
    const handleUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Validate all are PDFs
        const nonPdf = files.filter(f => f.type !== 'application/pdf');
        if (nonPdf.length > 0) {
            toast.error(`${nonPdf.length} non-PDF file(s) rejected. Only PDF allowed.`);
            return;
        }

        // Validate size (5MB each)
        const oversized = files.filter(f => f.size > 5 * 1024 * 1024);
        if (oversized.length > 0) {
            toast.error(`${oversized.length} file(s) exceed 5 MB limit.`);
            return;
        }

        setUploading(true);
        setUploadProgress(`Uploading ${files.length} resumes...`);

        const formData = new FormData();
        files.forEach(f => formData.append('resumes', f));

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API}/fitnesstfidf/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 600000, // 10 min timeout for large batches
            });

            if (res.data.success) {
                toast.success(res.data.message || 'Fitness computed successfully');
                setUploadProgress('');
                fetchResults();
            } else {
                toast.error(res.data.message || 'Upload failed');
            }
        } catch (err) {
            console.error('Upload error:', err);
            toast.error(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
            setUploadProgress('');
            // Reset file input
            e.target.value = '';
        }
    };

    const handleClearResults = () => {
        setConfModal({
            isOpen: true,
            title: 'Clear All Results',
            message: 'Are you sure you want to clear all TF-IDF fitness results? This action cannot be undone.',
            type: 'danger',
            onConfirm: async () => {
                closeConf();
                try {
                    const token = localStorage.getItem('token');
                    await axios.delete(`${API}/fitnesstfidf/clear`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    toast.success('All results cleared');
                    setResults([]);
                } catch (err) {
                    toast.error('Failed to clear results');
                }
            }
        });
    };

    const handleLogout = () => {
        setConfModal({
            isOpen: true,
            title: 'Confirm Logout',
            message: 'Are you sure you want to sign out of your account?',
            type: 'primary',
            onConfirm: () => {
                closeConf();
                logout();
            }
        });
    };

    const openResumeModal = (resumeFile, candidateName) => {
        const token = localStorage.getItem('token');
        setViewingResumeUrl(`${API}/fitnesstfidf/download/${resumeFile}?token=${token}`);
        setViewingCandidateName(candidateName);
        setIsResumeModalOpen(true);
    };

    const handleDeleteEntry = (recordId, jobId, candidateName) => {
        setConfModal({
            isOpen: true,
            title: 'Remove Entry',
            message: `Are you sure you want to remove the entry for ${candidateName}?`,
            type: 'danger',
            onConfirm: async () => {
                closeConf();
                try {
                    const token = localStorage.getItem('token');
                    const res = await axios.delete(`${API}/fitnesstfidf/record/${recordId}/job/${jobId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.data.success) {
                        toast.success('Entry removed');
                        setResults(prev => prev.map(r => {
                            if (r._id === recordId) {
                                const newR = { ...r };
                                if (newR.fitnessByJob) {
                                    if (newR.fitnessByJob instanceof Map) {
                                        newR.fitnessByJob = new Map(newR.fitnessByJob);
                                        newR.fitnessByJob.delete(jobId);
                                        if (newR.fitnessByJob.size === 0) return null;
                                    } else {
                                        newR.fitnessByJob = { ...newR.fitnessByJob };
                                        delete newR.fitnessByJob[jobId];
                                        if (Object.keys(newR.fitnessByJob).length === 0) return null;
                                    }
                                }
                                return newR;
                            }
                            return r;
                        }).filter(Boolean));
                    }
                } catch (err) {
                    toast.error('Failed to remove entry');
                }
            }
        });
    };

    const handleSendToDeptHead = async (recordId, jobId) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API}/fitnesstfidf/send/${recordId}/job/${jobId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                toast.success('Strategy dispatched to Department Head');
                fetchResults(); // Refetch to sync state
            }
        } catch (err) {
            toast.error('Dispatch failed. Check AI orchestration.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Flatten results for grid ───
    // Each row = one resume × one job pair
    const flatRows = useMemo(() => {
        const rows = [];
        for (const record of results) {
            const fitMap = record.fitnessByJob || {};
            // Convert Map / Object
            const entries = fitMap instanceof Map
                ? Array.from(fitMap.entries())
                : Object.entries(fitMap);

            for (const [jobId, jobFit] of entries) {
                const comps = jobFit.components || {};
                rows.push({
                    _id: `${record._id}_${jobId}`,
                    recordId: record._id,
                    resumeFile: record.resumeFile || 'unknown.pdf',
                    candidateName: record.candidateName || 'Unknown',
                    skills: record.extractedData?.skills || [],
                    summary: record.extractedData?.summary || '',
                    extractedData: record.extractedData || {},
                    jobId,
                    score: jobFit.score || 0,
                    components: {
                        skillOverlap: comps.skillOverlap || 0,
                        educationMatch: comps.educationMatch || 0,
                    },
                    jobCode: jobFit.jobCode || '',
                    roleTitle: jobFit.roleTitle || '',
                    departmentName: jobFit.departmentName || '',
                    createdAt: record.createdAt,
                    status: jobFit.status || 'Pending',
                    rejectedBy: jobFit.rejectedBy || null,
                });
            }
        }
        return rows;
    }, [results]);

    // ─── Dept Role Summary ───
    const deptRoleSummary = useMemo(() => {
        const summary = {};
        flatRows.forEach(row => {
            const dept = row.departmentName || 'Unknown';
            const role = row.roleTitle || 'Unknown';
            if (!summary[dept]) summary[dept] = {};
            summary[dept][role] = (summary[dept][role] || 0) + 1;
        });
        return summary;
    }, [flatRows]);

    // ─── Unique filter options ───
    const departments = useMemo(() => [...new Set(flatRows.map(r => r.departmentName).filter(Boolean))].sort(), [flatRows]);
    const roles = useMemo(() => {
        let pool = flatRows;
        if (filterDept) pool = pool.filter(r => r.departmentName === filterDept);
        return [...new Set(pool.map(r => r.roleTitle).filter(Boolean))].sort();
    }, [flatRows, filterDept]);
    const jobCodes = useMemo(() => {
        let pool = flatRows;
        if (filterDept) pool = pool.filter(r => r.departmentName === filterDept);
        if (filterRole) pool = pool.filter(r => r.roleTitle === filterRole);
        return [...new Set(pool.map(r => r.jobCode).filter(Boolean))].sort();
    }, [flatRows, filterDept, filterRole]);

    // ─── Filtered + sorted rows ───
    const filteredRows = useMemo(() => {
        let rows = flatRows;

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            rows = rows.filter(r =>
                r.candidateName.toLowerCase().includes(q) ||
                r.resumeFile.toLowerCase().includes(q) ||
                r.jobCode.toLowerCase().includes(q) ||
                r.roleTitle.toLowerCase().includes(q) ||
                r.departmentName.toLowerCase().includes(q)
            );
        }

        // Filters
        if (filterDept) rows = rows.filter(r => r.departmentName === filterDept);
        if (filterRole) rows = rows.filter(r => r.roleTitle === filterRole);
        if (filterJobCode) rows = rows.filter(r => r.jobCode === filterJobCode);
        if (filterMinScore) rows = rows.filter(r => r.score >= parseFloat(filterMinScore) / 100);
        if (filterMaxScore) rows = rows.filter(r => r.score <= parseFloat(filterMaxScore) / 100);
        if (filterStatus) rows = rows.filter(r => r.status === filterStatus);
        if (filterAction === 'Frozen') rows = rows.filter(r => isFrozen(r.departmentName, r.roleTitle));
        if (filterAction === 'Active') rows = rows.filter(r => !isFrozen(r.departmentName, r.roleTitle));

        // Sort
        rows = [...rows].sort((a, b) => sortOrder === 'desc' ? b.score - a.score : a.score - b.score);

        return rows;
    }, [flatRows, searchQuery, filterDept, filterRole, filterJobCode, filterMinScore, filterMaxScore, filterStatus, filterAction, sortOrder]);

    // ─── Live Filter Counts ───
    const filterCounts = useMemo(() => {
        const counts = {
            departments: {},
            roles: {},
            jobCodes: {},
            statuses: {},
            actions: { Active: 0, Frozen: 0 }
        };

        // For each category, calculate counts by applying all OTHER filters
        const getFilteredForCategory = (excludeFilter) => {
            let rows = flatRows;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                rows = rows.filter(r =>
                    r.candidateName.toLowerCase().includes(q) ||
                    r.resumeFile.toLowerCase().includes(q) ||
                    r.jobCode.toLowerCase().includes(q) ||
                    r.roleTitle.toLowerCase().includes(q) ||
                    r.departmentName.toLowerCase().includes(q)
                );
            }
            if (excludeFilter !== 'dept' && filterDept) rows = rows.filter(r => r.departmentName === filterDept);
            if (excludeFilter !== 'role' && filterRole) rows = rows.filter(r => r.roleTitle === filterRole);
            if (excludeFilter !== 'jobCode' && filterJobCode) rows = rows.filter(r => r.jobCode === filterJobCode);
            if (excludeFilter !== 'score') {
                if (filterMinScore) rows = rows.filter(r => r.score >= parseFloat(filterMinScore) / 100);
                if (filterMaxScore) rows = rows.filter(r => r.score <= parseFloat(filterMaxScore) / 100);
            }
            if (excludeFilter !== 'status' && filterStatus) rows = rows.filter(r => r.status === filterStatus);
            if (excludeFilter !== 'action' && filterAction) {
                if (filterAction === 'Frozen') rows = rows.filter(r => isFrozen(r.departmentName, r.roleTitle));
                if (filterAction === 'Active') rows = rows.filter(r => !isFrozen(r.departmentName, r.roleTitle));
            }
            return rows;
        };

        // Dept counts
        getFilteredForCategory('dept').forEach(r => {
            counts.departments[r.departmentName] = (counts.departments[r.departmentName] || 0) + 1;
        });
        // Role counts
        getFilteredForCategory('role').forEach(r => {
            counts.roles[r.roleTitle] = (counts.roles[r.roleTitle] || 0) + 1;
        });
        // JobCode counts
        getFilteredForCategory('jobCode').forEach(r => {
            counts.jobCodes[r.jobCode] = (counts.jobCodes[r.jobCode] || 0) + 1;
        });
        // Status counts
        getFilteredForCategory('status').forEach(r => {
            counts.statuses[r.status] = (counts.statuses[r.status] || 0) + 1;
        });
        // Action counts
        const rowsForAction = getFilteredForCategory('action');
        rowsForAction.forEach(r => {
            if (isFrozen(r.departmentName, r.roleTitle)) counts.actions.Frozen++;
            else counts.actions.Active++;
        });

        return counts;
    }, [flatRows, searchQuery, filterDept, filterRole, filterJobCode, filterMinScore, filterMaxScore, filterStatus, filterAction]);

    // Pagination
    const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredRows.slice(start, start + rowsPerPage);
    }, [filteredRows, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
        setSelectedRows([]); // Clear selection when filters change
    }, [searchQuery, filterDept, filterRole, filterJobCode, filterMinScore, filterMaxScore, filterStatus, filterAction]);

    const toggleRowSelection = (id) => {
        setSelectedRows(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const selectAllFiltered = () => {
        const allIds = filteredRows.map(r => r._id);
        setSelectedRows(allIds);
    };

    const onClearSelection = () => {
        setSelectedRows([]);
    };

    const onTogglePageSelection = (pageIndex) => {
        const start = (pageIndex - 1) * rowsPerPage;
        const end = pageIndex * rowsPerPage;
        const pageRowIds = filteredRows.slice(start, end).map(r => r._id);

        const allPageSelected = pageRowIds.length > 0 && pageRowIds.every(id => selectedRows.includes(id));
        if (allPageSelected) {
            setSelectedRows(prev => prev.filter(id => !pageRowIds.includes(id)));
        } else {
            setSelectedRows(prev => [...new Set([...prev, ...pageRowIds])]);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedRows.length === 0) return;

        setConfModal({
            isOpen: true,
            title: 'Permanent Bulk Delete',
            message: `Are you sure you want to permanently delete ${selectedRows.length} selected matches? This action cannot be undone.`,
            type: 'danger',
            onConfirm: async () => {
                closeConf();
                setLoading(true);
                try {
                    const token = localStorage.getItem('token');
                    // Selection IDs are formatted as recordId_jobId
                    const selections = selectedRows.map(id => {
                        const [recordId, jobId] = id.split('_');
                        return { recordId, jobId };
                    });

                    const res = await axios.post(`${API}/fitnesstfidf/bulk-delete`, { selections }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (res.data.success) {
                        toast.success(res.data.message);
                        setSelectedRows([]);
                        fetchResults();
                    }
                } catch (err) {
                    toast.error('Bulk deletion failed');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const clearFilters = () => {
        setFilterDept('');
        setFilterRole('');
        setFilterJobCode('');
        setFilterMinScore('');
        setFilterMaxScore('');
        setFilterStatus('');
        setFilterAction('');
        setSearchQuery('');
    };

    const hasActiveFilters = filterDept || filterRole || filterJobCode || filterMinScore || filterMaxScore || filterStatus || filterAction;


    const handleResetVacancies = () => {
        setConfModal({
            isOpen: true,
            title: 'Reset All Vacancies?',
            message: 'This will revert all "Accepted" candidates back to "Pending" and restore their vacancy counts in the Job collection. This action is intended for testing and batch corrections.',
            type: 'warning',
            onConfirm: async () => {
                try {
                    setLoading(true);
                    const res = await axios.post(`${API}/fitnesstfidf/reset-vacancies`, {}, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    if (res.data.success) {
                        toast.success(res.data.message);
                        fetchResults();
                        fetchVacancies();
                        setSelectedRows([]);
                    }
                } catch (err) {
                    console.error('[TF-IDF] Reset vacancies error:', err);
                    toast.error('Failed to reset vacancies.');
                } finally {
                    setLoading(false);
                    closeConf();
                }
            }
        });
    };

    // ═══════════════════════════════════════════════════════════════
    // ─── RENDER ───
    // ═══════════════════════════════════════════════════════════════
    return (
        <div className="animate-fadeIn">
            {/* ─── Title ─── */}
            <div className="mb-6">
                <h1 className="text-2xl text-gray-800 flex items-center gap-3">
                    <DocumentTextIcon className="w-7 h-7 text-primary-600" />
                    Fitness Tf-idf
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Upload bulk resumes and compute AI-powered fitness scores across all jobs, roles, and departments
                </p>
            </div>

            {/* ─── Header Bar ─── */}
            <div className="flex flex-wrap items-center gap-3 mb-4 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                        type="text"
                        placeholder="Search candidate, resume, job..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <FaTimes size={12} />
                        </button>
                    )}
                </div>

                {/* Actions */}
                <button onClick={fetchResults} disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm disabled:opacity-50"
                    title="Refresh results">
                    <FaRedo className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>

                {/* Upload Button */}
                <label className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all
                    ${uploading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md active:scale-[0.98]'}`}>
                    <FaUpload />
                    {uploading ? uploadProgress || 'Processing...' : 'Upload Resumes'}
                    <input
                        type="file"
                        multiple
                        accept=".pdf"
                        onChange={handleUpload}
                        disabled={uploading}
                        className="hidden"
                    />
                </label>

                <button onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-[#6f0000] transition-colors text-sm"
                    title="Logout">
                    <ArrowLeftOnRectangleIcon className="w-4 h-4" />
                    Logout
                </button>
            </div>

            {/* ─── Live Vacancies ─── */}
            {Object.keys(vacancies).length > 0 && (
                <div className="mb-4 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <FaUserPlus className="text-primary-500" /> Live Vacancies
                    </h2>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                        {Object.entries(vacancies).map(([dept, rolesObj]) => (
                            <div key={dept} className="min-w-[220px] border border-gray-100 rounded-lg bg-gray-50 p-3 shadow-sm">
                                <h3 className="text-xs font-bold text-gray-800 mb-2 border-b border-gray-200 pb-1">{dept}</h3>
                                <div className="space-y-1.5 flex flex-col">
                                    {Object.entries(rolesObj).map(([role, count]) => (
                                        <div key={role} className="flex justify-between items-center text-[11px]">
                                            <span className="text-gray-600 truncate max-w-[150px]" title={role}>{role}</span>
                                            <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${count > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                {count} {count === 1 ? 'opening' : 'openings'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Filter Panel ─── */}
            <div className="mb-4">
                <div className="flex items-center gap-3 mb-3">
                    <button onClick={() => setFiltersOpen(!filtersOpen)}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        <FaFilter size={12} />
                        {filtersOpen ? 'Hide Filters' : 'Show Filters'}
                    </button>
                    <button onClick={handleResetVacancies}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200">
                        <FaRedo size={12} />
                        Reset All Vacancies
                    </button>
                    {hasActiveFilters && (
                        <button onClick={clearFilters}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                            <FaTrashAlt size={12} />
                            Clear All Filters
                        </button>
                    )}
                    <span className="text-xs text-gray-500 ml-auto">
                        {filteredRows.length} result{filteredRows.length !== 1 ? 's' : ''}
                        {hasActiveFilters ? ' (filtered)' : ''}
                    </span>
                </div>

                {filtersOpen && (
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                            {/* Department */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                                    <FaBuilding className="text-primary-500" size={11} />
                                    Department
                                </label>
                                <select value={filterDept} onChange={(e) => { setFilterDept(e.target.value); setFilterRole(''); setFilterJobCode(''); }}
                                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all">
                                    <option value="">All Departments ({departments.length})</option>
                                    {departments.map(d => <option key={d} value={d}>{d} ({filterCounts.departments[d] || 0})</option>)}
                                </select>
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                                    <FaUserTie className="text-primary-500" size={11} />
                                    Role
                                </label>
                                <select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); }}
                                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all">
                                    <option value="">All Roles ({roles.length})</option>
                                    {roles.map(r => <option key={r} value={r}>{r} ({filterCounts.roles[r] || 0})</option>)}
                                </select>
                            </div>

                            {/* Job */}
                            {/* Job ID */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                                    <FaBriefcase className="text-primary-500" size={11} />
                                    Job ID
                                </label>
                                <select
                                    value={filterJobCode}
                                    onChange={(e) => setFilterJobCode(e.target.value)}
                                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                >
                                    <option value="">All Job Codes ({jobCodes.length})</option>
                                    {jobCodes.map(j => <option key={j} value={j}>{j} ({filterCounts.jobCodes[j] || 0})</option>)}
                                </select>
                            </div>

                            {/* Min Score */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                                    <FaBrain className="text-emerald-500" size={11} />
                                    Min Score %
                                </label>
                                <input type="number" min="0" max="100" step="1" value={filterMinScore}
                                    onChange={(e) => setFilterMinScore(e.target.value)} placeholder="e.g. 40"
                                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                            </div>

                            {/* Max Score */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                                    <FaBrain className="text-amber-500" size={11} />
                                    Max Score %
                                </label>
                                <input type="number" min="0" max="100" step="1" value={filterMaxScore}
                                    onChange={(e) => setFilterMaxScore(e.target.value)} placeholder="e.g. 90"
                                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                            </div>

                            {/* Sort */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                                    <FaSortAmountDown className="text-gray-400" size={11} />
                                    Sort by Score
                                </label>
                                <div className="flex gap-2 h-10">
                                    <button onClick={() => setSortOrder('desc')}
                                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 rounded-lg border transition-all text-[11px] font-medium
                                            ${sortOrder === 'desc' ? 'bg-primary-100 text-primary-700 border-primary-300 shadow-sm' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                                        <FaSortAmountDown size={11} /> High first
                                    </button>
                                    <button onClick={() => setSortOrder('asc')}
                                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 rounded-lg border transition-all text-[11px] font-medium
                                            ${sortOrder === 'asc' ? 'bg-primary-100 text-primary-700 border-primary-300 shadow-sm' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                                        <FaSortAmountUp size={11} /> Low first
                                    </button>
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className="lg:col-span-2 xl:col-span-3">
                                <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                                    <FaCheckCircle className="text-primary-500" size={11} />
                                    Status
                                </label>
                                <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
                                    {[
                                        { label: 'All Statuses', value: '', color: 'bg-primary-100 text-primary-700 border-primary-300', count: flatRows.length },
                                        { label: 'Pending', value: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-300', count: filterCounts.statuses['Pending'] || 0 },
                                        { label: 'Accepted', value: 'Accepted', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', count: filterCounts.statuses['Accepted'] || 0 },
                                        { label: 'Rejected', value: 'Rejected', color: 'bg-rose-100 text-rose-700 border-rose-300', count: filterCounts.statuses['Rejected'] || 0 },
                                        { label: 'Sent to DeptHead', value: 'Sent to DeptHead', color: 'bg-blue-100 text-blue-700 border-blue-300', count: filterCounts.statuses['Sent to DeptHead'] || filterCounts.statuses['Sent'] || 0 }
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setFilterStatus(opt.value)}
                                            className={`h-9 px-3 text-[11px] font-medium rounded-lg border transition-all whitespace-nowrap flex items-center justify-center gap-2 ${filterStatus === opt.value
                                                ? opt.color + ' shadow-sm'
                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            {opt.label}
                                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${filterStatus === opt.value ? 'bg-white/50' : 'bg-gray-100'}`}>
                                                {opt.count}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Action Filter (Frozen/Active) */}
                            <div className="lg:col-span-1 xl:col-span-3">
                                <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                                    <FaHourglassHalf className="text-primary-500" size={11} />
                                    Vacancies / Action
                                </label>
                                <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
                                    {[
                                        { label: 'All Candidates', value: '', color: 'bg-indigo-100 text-indigo-700 border-indigo-300', count: flatRows.length },
                                        { label: 'Openings Available', value: 'Active', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', count: filterCounts.actions.Active },
                                        { label: 'Freezed (No Vacancies)', value: 'Frozen', color: 'bg-rose-100 text-rose-700 border-rose-300', count: filterCounts.actions.Frozen }
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setFilterAction(opt.value)}
                                            className={`h-9 px-3 text-[11px] font-medium rounded-lg border transition-all whitespace-nowrap flex items-center justify-center gap-2 ${filterAction === opt.value
                                                ? opt.color + ' shadow-sm'
                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            {opt.label}
                                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${filterAction === opt.value ? 'bg-white/50' : 'bg-gray-100'}`}>
                                                {opt.count}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Results Summary ─── */}
            {results.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {[
                        { label: 'Total Resumes', value: [...new Set(filteredRows.map(r => r.recordId))].length, icon: <FaFilePdf className="text-red-400" /> },
                        { label: 'Total Pairs', value: filteredRows.length, icon: <FaBrain className="text-purple-400" /> },
                        { label: 'Avg Score', value: `${(filteredRows.reduce((s, r) => s + r.score, 0) / Math.max(filteredRows.length, 1) * 100).toFixed(1)}%`, icon: <FaBrain className="text-emerald-400" /> },
                        {
                            label: 'Total Vacancies',
                            value: vacancyTotals.total,
                            subtext: `${vacancyTotals.unfilled} Unfilled • ${vacancyTotals.filled} Filled`,
                            icon: <FaUserPlus className="text-blue-400" />
                        },
                    ].map((stat, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                            <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center min-w-[36px] min-h-[36px]">{stat.icon}</div>
                            <div className="flex flex-col">
                                <p className="text-lg font-semibold text-gray-800 leading-tight">{stat.value}</p>
                                <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{stat.label}</p>
                                {stat.subtext && <p className="text-[9px] text-gray-400 mt-1 leading-tight">{stat.subtext}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ─── Bulk Action Bar ─── */}
            {filteredRows.length > 0 && (
                <div className="mb-8 pt-6 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                        <FaUsers className="text-primary-600" />
                        Selection & Bulk Operations
                    </label>

                    <div className={`p-4 rounded-xl border transition-all duration-300 ${selectedRows.length > 0 ? 'bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-indigo-200 shadow-md' : 'bg-slate-100/50 border-slate-200'}`}>
                        <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
                            {/* Left: Info & Global Select */}
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${selectedRows.length > 0 ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-200' : 'bg-gray-200'}`}>
                                        <FaUsers size={20} className={`transition-colors ${selectedRows.length > 0 ? 'text-white' : 'text-gray-400'}`} />
                                    </div>
                                    {selectedRows.length > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] flex items-center justify-center px-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-black rounded-full shadow-md border-2 border-white animate-bounce">
                                            {selectedRows.length}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <p className={`text-sm font-bold transition-colors whitespace-nowrap ${selectedRows.length > 0 ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600' : 'text-gray-500'}`}>
                                            {selectedRows.length > 0 ? `${selectedRows.length} Selected` : 'None Selected'}
                                        </p>
                                        <button
                                            onClick={() => selectedRows.length === filteredRows.length ? onClearSelection() : selectAllFiltered()}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border whitespace-nowrap ${selectedRows.length === filteredRows.length
                                                ? 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200'
                                                : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 shadow-sm'
                                                }`}
                                        >
                                            {selectedRows.length === filteredRows.length ? 'Unselect All' : `Select All ${filteredRows.length}`}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-gray-500 mt-0.5">Manage selections across pages</p>
                                </div>
                            </div>

                            {/* Middle: Per-Page Selection */}
                            {totalPages > 1 && (
                                <div className="flex flex-col gap-2">
                                    <p className="text-[11px] font-bold text-gray-500 tracking-tight ml-1">Select By Page</p>
                                    <div className="flex flex-wrap items-center gap-1.5 max-w-[500px]">
                                        {Array.from({ length: totalPages }).map((_, i) => {
                                            const pageIndex = i + 1;
                                            const start = (pageIndex - 1) * rowsPerPage;
                                            const end = pageIndex * rowsPerPage;
                                            const pageRowIds = filteredRows.slice(start, end).map(r => r._id);
                                            const isPageSelected = pageRowIds.length > 0 && pageRowIds.every(id => selectedRows.includes(id));

                                            return (
                                                <button
                                                    key={pageIndex}
                                                    onClick={() => onTogglePageSelection(pageIndex)}
                                                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-bold transition-all border ${isPageSelected
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                                                        }`}
                                                    title={`Toggle selection for Page ${pageIndex}`}
                                                >
                                                    {pageIndex}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Right: Actions */}
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={selectedRows.length === 0}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                                >
                                    <FaTrashAlt /> Permanent Delete {selectedRows.length > 0 ? `(${selectedRows.length})` : ''}
                                </button>
                            </div>
                        </div>
                    </div>

                    <p className="mt-4 text-xs text-gray-500 italic flex items-center gap-1">
                        <FaHourglassHalf className="text-gray-400" />
                        * Bulk actions are permanent and affect all matching matches. Permanent delete cannot be undone.
                    </p>
                </div>
            )}

            {/* ─── Grid Table ─── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                            <span className="text-sm text-gray-500">Loading fitness results...</span>
                        </div>
                    </div>
                ) : uploading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                            <span className="text-sm text-gray-600">{uploadProgress || 'AI is analyzing resumes...'}</span>
                            <span className="text-xs text-gray-400">This may take a moment for large batches</span>
                        </div>
                    </div>
                ) : paginatedRows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <DocumentTextIcon className="w-16 h-16 mb-4 text-gray-300" />
                        <p className="text-sm">
                            {results.length === 0
                                ? 'No fitness results yet. Upload resumes to begin.'
                                : 'No results match the current filters.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left w-10">
                                        <input
                                            type="checkbox"
                                            checked={paginatedRows.length > 0 && paginatedRows.every(r => selectedRows.includes(r._id))}
                                            onChange={() => onTogglePageSelection(currentPage)}
                                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-12 tracking-wide">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 tracking-wide w-[32%]">Candidate</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 tracking-wide w-[14%]">Dept</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 tracking-wide w-[18%]">Role / Job</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 tracking-wide w-[20%]">AI Evaluation</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 tracking-wide w-[16%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedRows.map((row, idx) => (
                                    <tr key={row._id} className={`hover:bg-blue-50/30 transition-colors ${selectedRows.includes(row._id) ? 'bg-primary-50/50' : ''}`}>
                                        <td className="px-4 py-4 align-top">
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.includes(row._id)}
                                                onChange={() => toggleRowSelection(row._id)}
                                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-4 py-4 text-xs font-medium text-gray-400 align-top">
                                            {(currentPage - 1) * rowsPerPage + idx + 1}
                                        </td>

                                        {/* Details Column */}
                                        <td className="px-4 py-4 align-top w-[32%] overflow-hidden">
                                            <div className="flex flex-col gap-1.5 overflow-hidden">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-800 text-[13px] truncate" title={row.candidateName}>
                                                        {row.candidateName}
                                                    </span>
                                                    <button
                                                        onClick={() => openResumeModal(row.resumeFile, row.candidateName)}
                                                        className="ml-2 text-[10px] text-primary-500 hover:underline inline-flex items-center gap-0.5" title="View Resume">
                                                        <FaFileAlt size={10} /> View
                                                    </button>
                                                </div>
                                                {row.summary && (
                                                    <p className="text-[11px] text-gray-500 leading-relaxed whitespace-pre-line" title={row.summary}>
                                                        {row.summary}
                                                    </p>
                                                )}
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {(row.skills || []).map((skill, idx) => (
                                                        <span key={idx} className="px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded text-[9px] border border-gray-100 hover:bg-gray-100 transition-colors">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Dept Column */}
                                        <td className="px-4 py-4 text-xs text-gray-600 align-top w-[18%]">
                                            <div className="flex flex-col gap-1">
                                                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-50 text-gray-700 rounded-md border border-gray-200 w-fit">
                                                    <FaBuilding className="text-gray-400" size={10} />
                                                    <span className="font-semibold">{row.departmentName || '—'}</span>
                                                </div>
                                                <div className="pl-1 mt-1 flex flex-col gap-0.5">
                                                    {Object.entries(deptRoleSummary[row.departmentName] || {}).map(([role, count]) => (
                                                        <span key={role} className="text-[9px] text-gray-500 leading-tight">
                                                            • {role} ({count})
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Role / Job Column */}
                                        <td className="px-4 py-4 align-top w-[18%]">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5" title="Role Name">
                                                    <FaUserTie className="text-primary-400" size={10} />
                                                    {row.roleTitle || '—'}
                                                </span>
                                                <span className="text-[11px] text-gray-500 flex items-center gap-1.5" title="Exact Job ID">
                                                    <FaBriefcase className="text-blue-400" size={10} />
                                                    <span className="font-mono text-[10px] bg-gray-100 px-1 py-0.5 rounded border border-gray-200">{row.jobCode || '—'}</span>
                                                </span>
                                            </div>
                                        </td>

                                        {/* Fitness & Intelligence Column */}
                                        <td className="px-4 py-4 align-top w-[20%]">
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


                                        {/* Actions Column */}
                                        <td className="px-4 py-4 align-top text-right">
                                            <div className="flex flex-col items-end gap-2">
                                                {/* Freezed Badge: Show for any status EXCEPT final decisions (Accepted/Rejected) if role is full */}
                                                {isFrozen(row.departmentName, row.roleTitle) &&
                                                    row.status !== 'Accepted' &&
                                                    row.status !== 'Rejected' && (
                                                        <span className="inline-flex items-center text-center justify-center px-3 py-1.5 text-[10px] font-bold bg-slate-50 text-slate-700 rounded-lg border border-slate-200 w-32 leading-tight shadow-sm uppercase tracking-wider">
                                                            Role Freezed
                                                        </span>
                                                    )}

                                                {row.status === 'Sent' || row.status === 'Sent to DeptHead' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 w-32 justify-center shadow-sm">
                                                        <FaPaperPlane size={10} />
                                                        Sent to Head
                                                    </span>
                                                ) : row.status === 'Accepted' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-blue-50 text-blue-700 rounded-lg border border-blue-200 w-32 justify-center shadow-sm">
                                                        <FaUserTie size={10} />
                                                        Accepted
                                                    </span>
                                                ) : row.status === 'Rejected' ? (
                                                    <div className="flex flex-col gap-2 items-end">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-red-50 text-red-700 rounded-lg border border-red-200 w-32 justify-center text-center leading-tight shadow-sm" title={`Rejected by ${row.rejectedBy || 'Dept Head'}`}>
                                                            Rejected by Head
                                                        </span>
                                                        <button
                                                            onClick={() => handleDeleteEntry(row.recordId, row.jobId, row.candidateName)}
                                                            className="inline-flex items-center justify-center gap-1.5 w-32 px-3 py-1.5 text-[11px] font-medium bg-white text-red-600 rounded-lg border border-red-200 hover:bg-red-50 transition-colors shadow-sm"
                                                        >
                                                            <FaTrashAlt size={10} />
                                                            Remove Entry
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {!isFrozen(row.departmentName, row.roleTitle) && (
                                                            <button
                                                                onClick={() => handleSendToDeptHead(row.recordId, row.jobId)}
                                                                className="inline-flex items-center justify-center gap-1.5 w-32 px-3 py-1.5 text-[11px] font-medium bg-primary-50 text-primary-700 rounded-lg border border-primary-200 hover:bg-primary-100 transition-colors shadow-sm"
                                                            >
                                                                <FaPaperPlane size={10} />
                                                                Send to DeptHead
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteEntry(row.recordId, row.jobId, row.candidateName)}
                                                            className="inline-flex items-center justify-center gap-1.5 w-32 px-3 py-1.5 text-[11px] font-medium bg-white text-red-600 rounded-lg border border-red-200 hover:bg-red-50 transition-colors shadow-sm"
                                                        >
                                                            <FaTrashAlt size={10} />
                                                            Remove Entry
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ─── Pagination ─── */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredRows.length}
                rowsPerPage={rowsPerPage}
            />

            {/* ─── Clear All Button ─── */}
            {
                results.length > 0 && (
                    <div className="mt-6 flex justify-end">
                        <button onClick={handleClearResults}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200 transition-colors">
                            <FaTrashAlt size={12} />
                            Clear All Results
                        </button>
                    </div>
                )
            }

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confModal.isOpen}
                title={confModal.title}
                message={confModal.message}
                type={confModal.type}
                onConfirm={confModal.onConfirm}
                onCancel={closeConf}
            />

            {/* Resume Viewer Modal */}
            {
                isResumeModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-scale-in">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                                        <FaFileAlt size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{viewingCandidateName}</h3>
                                        <p className="text-xs text-gray-500">Document Review</p>
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
                                    Download Resume
                                </a>
                                <button
                                    onClick={() => setIsResumeModalOpen(false)}
                                    className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ═══ Upload Loader Overlay ═══ */}
            {uploading && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 transition-all">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-4 border-gray-400 border-t-white animate-spin"></div>
                        <p className="text-sm font-medium text-white tracking-wide">{uploadProgress || 'Processing resumes...'}</p>
                    </div>
                </div>
            )}
        </div >
    );
};

export default FitnessTfidf;
