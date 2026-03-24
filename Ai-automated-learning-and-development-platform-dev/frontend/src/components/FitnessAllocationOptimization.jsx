import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
    FaSearch,
    FaTimes,
    FaRedo,
    FaFileAlt,
    FaPowerOff,
    FaChevronDown,
    FaSpinner,
    FaMedal,
    FaDna,
    FaUsers,
    FaChartBar,
    FaSave,
    FaInfoCircle,
    FaProjectDiagram,
    FaBrain,
    FaCogs,
    FaGraduationCap,
    FaChalkboardTeacher,
    FaComments,
    FaCheckCircle,
    FaBuilding,
    FaUserTie,
    FaBriefcase,
    FaEye,
    FaEdit,
    FaTrash,
    FaFilter,
    FaChevronLeft,
    FaChevronRight,
    FaCheck,
    FaClock,
    FaMapMarkerAlt,
    FaGlobe,
    FaRupeeSign,
    FaCalendarAlt,
    FaLayerGroup,
    FaIdBadge,
    FaToolbox,
    FaShieldAlt,
    FaWater
} from 'react-icons/fa';
import { advertisementAPI, normalizationAPI } from '../utils/api';
import { ResponsiveRadar } from '@nivo/radar';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import ConfirmationModal from './ConfirmationModal';
import { useAuth } from '../context/AuthContext';

// Helper Functions
const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        return {
            date: format(date, "dd/MMM/yyyy"),
            time: format(date, "hh:mm a"),
            fullDate: date
        };
    } catch {
        return { date: "Invalid Date", time: "", fullDate: null };
    }
};

// Tooltip Component
const Tooltip = ({ children, text, position = 'top' }) => {
    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
        'top-left': 'bottom-full right-0 mb-3 ml-[-100%]',
        'bottom-left': 'top-full right-0 mt-3',
    };

    return (
        <div className="relative inline-block group">
            {children}
            <span className={`invisible group-hover:visible absolute z-[9999] ${positionClasses[position] || positionClasses.top} px-4 py-2 bg-white text-black text-[11px] rounded-md border border-black shadow-2xl transition-all duration-200 opacity-0 group-hover:opacity-100 whitespace-normal min-w-[200px] max-w-[350px] text-center pointer-events-none leading-relaxed ring-1 ring-black/5`}>
                {text}
            </span>
        </div>
    );
};

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, rowsPerPage }) => {
    const getVisiblePages = () => {
        const pages = [];
        const maxVisiblePages = 10;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
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

    return (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl">
            <div className="text-sm text-gray-600">
                Showing <span className="font-normal">{(currentPage - 1) * rowsPerPage + 1}</span> to{' '}
                <span className="font-normal">{Math.min(currentPage * rowsPerPage, totalItems)}</span> of{' '}
                <span className="font-normal">{totalItems}</span> items
            </div>

            <div className="flex items-center gap-2">
                <button
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <FaChevronLeft /> Previous
                </button>

                <div className="flex items-center gap-1">
                    {getVisiblePages().map((pageNum, index) => (
                        pageNum === '...' ? (
                            <span key={`ellipsis-${index}`} className="px-2 text-gray-400">...</span>
                        ) : (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={`w-10 h-10 rounded-lg transition-colors flex items-center justify-center ${currentPage === pageNum
                                    ? "bg-primary-600 text-white border border-primary-700"
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
                    Next <FaChevronRight />
                </button>
            </div>

            <div className="text-sm text-gray-600">
                Page <span className="font-normal text-primary-600">{currentPage}</span> of{' '}
                <span className="font-normal">{totalPages || 1}</span>
            </div>
        </div>
    );
};

// Abbreviation Guide Component
const AbbreviationGuide = () => {
    const [isOpen, setIsOpen] = useState(false);

    const abbreviations = [
        { short: "CSF", full: "Criteria Satisfaction Factor", description: "Mathematical match against hard eligibility (age, 10th percentage, Grad percentage). Focuses on Boolean+Margin thresholds." },
        { short: "SEA", full: "Skill Expertise Alignment", description: "Deep neural mapping of user's listed skills vs. the job's Required/Preferred skills, applying weighted importance." },
        { short: "SFMC", full: "Standard Foundation Merit Criteria", description: "Standardized merit score from the pre-selected Foundation Merit List, mapped to the specific advertisement." },
        { short: "EGC", full: "Experience Growth Coefficient", description: "Estimates career trajectory alignment based on chronological gap interpolation." },
        { short: "IM", full: "Interview/Exam Merit", description: "Weights the candidate's actual written/interview test score achieved for the specific advertisement." }
    ];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-normal"
            >
                <FaInfoCircle />
                Component Guide
                <FaChevronDown className={`text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl border border-gray-200 z-50 p-4 animate-fade-in">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-gray-800">VatsAi component guide</h4>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                            <FaTimes size={14} />
                        </button>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {abbreviations.map((item) => (
                            <div key={item.short} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-primary-700 bg-primary-100 px-2 py-0.5 rounded text-sm">{item.short}</span>
                                    <span className="text-xs text-gray-600">{item.full}</span>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
// --- Deep Dive View Components ---

const DeepDiveView = ({ batchResults }) => {
    if (!batchResults || batchResults.length === 0) return null;

    // Aggregate Data across all tasks in the batch
    const aggregatedCandidates = {};
    const globalAllocation = [];
    const allJobsMapped = new Set();
    const globalMatrix = {};

    batchResults.forEach(task => {
        const { fitnessMatrix, candidateBreakdowns, allocation, jobTitle } = task;
        allJobsMapped.add(jobTitle);

        // Aggregate Candidates
        Object.entries(candidateBreakdowns).forEach(([cid, c]) => {
            if (!aggregatedCandidates[cid]) {
                aggregatedCandidates[cid] = {
                    id: cid,
                    name: c.name,
                    maxScore: 0,
                    components: { CSF: 0, SEA: 0, SFMC: 0, EGC: 0, IM: 0 },
                    allScores: []
                };
            }
            const jobData = Object.values(c.jobs)[0];
            if (jobData) {
                if (jobData.score > aggregatedCandidates[cid].maxScore) {
                    aggregatedCandidates[cid].maxScore = jobData.score;
                    aggregatedCandidates[cid].components = jobData.components;
                }
                aggregatedCandidates[cid].allScores.push(jobData.score);
            }
        });

        // Global Matrix Pivot
        Object.entries(fitnessMatrix).forEach(([jid, cMap]) => {
            if (!globalMatrix[jobTitle]) globalMatrix[jobTitle] = {};
            Object.entries(cMap).forEach(([cid, score]) => {
                const existing = globalMatrix[jobTitle][cid];
                if (existing === undefined || score > existing) {
                    globalMatrix[jobTitle][cid] = score;
                }
            });
        });

        // Global Allocation Protocol with Contender Delta
        Object.entries(allocation).forEach(([jid, units]) => {
            const jobScores = Object.entries(fitnessMatrix[jid] || {})
                .sort((a, b) => b[1] - a[1]);

            units.forEach((unit, idx) => {
                // Find next best contender fitness for Delta analysis
                const allocatedCid = unit.candidateId;
                const nextBest = jobScores.find(s => s[0] !== allocatedCid);
                const delta = nextBest ? (unit.fitnessScore - nextBest[1]) : unit.fitnessScore;

                globalAllocation.push({
                    job: jobTitle,
                    unit: `Unit ${idx + 1}`,
                    candidate: candidateBreakdowns[unit.candidateId]?.name || 'Unallocated',
                    fitness: unit.fitnessScore,
                    delta: delta,
                    scarcity: delta < 0.05 ? 'High Pressure' : delta < 0.15 ? 'Competitive' : 'Stable'
                });
            });
        });
    });

    const candidateStandings = Object.values(aggregatedCandidates).sort((a, b) => b.maxScore - a.maxScore);
    const sortedJobs = Array.from(allJobsMapped);

    // Advanced Metrics Helpers
    const getDominantFactor = (components) => {
        if (!components) return 'Neutral';
        const entries = Object.entries(components);
        const [key] = entries.reduce((a, b) => (a[1] > b[1] ? a : b));
        const mapping = {
            'CSF': 'Criteria Dominant',
            'SEA': 'Skill Dominant',
            'SFMC': 'Merit Dominant',
            'EGC': 'Experience Dominant',
            'IM': 'Interview Dominant'
        };
        return mapping[key] || 'Balanced';
    };

    const getPercentile = (score) => {
        const scores = candidateStandings.map(c => c.maxScore);
        const count = scores.filter(s => s < score).length;
        return ((count / scores.length) * 100).toFixed(0);
    };

    return (
        <div className="space-y-12 animate-fade-in p-2">
            {/* Table 1: Candidate to Candidate Intelligence Standings */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-visible">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 border-b border-gray-100 flex items-center justify-between relative group/header rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <FaUsers className="text-blue-500" />
                        <h3 className="text-lg text-gray-800 font-normal">Candidate to Candidate Intelligence Standings</h3>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] text-blue-500 tracking-widest font-normal">Advanced Comparative Analytics</span>
                        <Tooltip text="Aggregate statistical overview of the current candidate pool. Percentiles represent relative standing across all evaluation metrics." position="top-left">
                            <FaInfoCircle className="text-blue-300 hover:text-blue-500 cursor-help transition-colors text-sm" />
                        </Tooltip>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/30">
                                <th className="px-6 py-4 text-xs text-gray-400 font-normal tracking-wider">Candidate Name</th>
                                <th className="px-6 py-4 text-xs text-gray-400 font-normal tracking-wider text-center">Global Percentile</th>
                                <th className="px-6 py-4 text-xs text-gray-400 font-normal tracking-wider text-center">Peak Fitness</th>
                                <th className="px-6 py-4 text-xs text-gray-400 font-normal tracking-wider text-center">Neural Factor Dominance</th>
                                <th className="px-6 py-4 text-xs text-gray-400 font-normal tracking-wider text-center">Batch Centrality</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {candidateStandings.map((c) => {
                                const factor = getDominantFactor(c.components);
                                const avgScore = (Object.values(c.components).reduce((a, b) => a + b, 0) / 5);
                                return (
                                    <tr key={c.id} className="hover:bg-blue-50/20 transition-colors">
                                        <td className="px-6 py-5 text-sm text-gray-700 font-normal">{c.name}</td>
                                        <td className="px-6 py-5 text-sm text-center font-normal">
                                            <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded text-xs">Top {100 - getPercentile(c.maxScore)}%</span>
                                        </td>
                                        <td className="px-6 py-5 text-sm text-center font-normal">
                                            <span className="text-blue-600">{(c.maxScore * 100).toFixed(2)}%</span>
                                        </td>
                                        <td className="px-6 py-5 text-sm text-center font-normal">
                                            <span className={`text-xs ${factor === 'Skill Dominant' ? 'text-emerald-600' : factor === 'Criteria Dominant' ? 'text-amber-600' : 'text-blue-600'}`}>
                                                {factor}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-sm text-center text-gray-400 font-normal italic">{(avgScore * 100).toFixed(1)}% Alignment</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Table 2: Candidate to Job Global Fitness Tensor */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-visible">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 border-b border-gray-100 flex items-center justify-between relative group/header rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <FaProjectDiagram className="text-purple-500" />
                        <h3 className="text-lg text-gray-800 font-normal">Candidate to Job Global Fitness Tensor</h3>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] text-purple-500 tracking-widest font-normal">Neural Match Vector Matrix</span>
                        <Tooltip text="A unified matrix mapping every candidate against every job in the current batch. Verified Match indicators represent high-confidence alignments." position="top-left">
                            <FaInfoCircle className="text-purple-300 hover:text-purple-500 cursor-help transition-colors text-sm" />
                        </Tooltip>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/30">
                                <th className="px-6 py-4 text-xs text-gray-400 font-normal tracking-wider sticky left-0 bg-gray-50/50 z-10 border-r border-gray-100">Talent Identity</th>
                                {sortedJobs.map(job => (
                                    <th key={job} className="px-6 py-4 text-xs text-gray-400 font-normal tracking-wider text-center min-w-[200px]">
                                        {job}
                                    </th>
                                ))}
                                <th className="px-6 py-4 text-xs text-gray-400 font-normal tracking-wider text-center">Match Probability</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {candidateStandings.map((c) => {
                                const scores = sortedJobs.map(job => globalMatrix[job]?.[c.id] || 0);
                                const maxPeak = Math.max(...scores);
                                return (
                                    <tr key={c.id} className="hover:bg-purple-50/20 transition-colors">
                                        <td className="px-6 py-5 text-sm text-gray-700 font-normal sticky left-0 bg-white z-10 border-r border-gray-50">{c.name}</td>
                                        {sortedJobs.map((job, idx) => {
                                            const s = globalMatrix[job]?.[c.id] || 0;
                                            return (
                                                <td key={idx} className="px-6 py-5 text-center font-normal">
                                                    <div className="flex flex-col gap-1 items-center">
                                                        <span className={`text-sm ${s > 0.8 ? 'text-emerald-600' : s > 0.5 ? 'text-amber-600' : 'text-gray-400'}`}>
                                                            {(s * 100).toFixed(1)}%
                                                        </span>
                                                        {s > 0 && (
                                                            <span className="text-[8px] text-gray-400 capitalize tracking-tighter">Verified Match</span>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td className="px-6 py-5 text-sm text-center font-normal">
                                            <span className="px-3 py-1 rounded-lg bg-purple-50 text-purple-600 text-xs border border-purple-100">
                                                {(maxPeak * 100).toFixed(1)}% Probable
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Table 3: Candidate to Vacancy Allocation Protocol */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-visible">
                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-5 border-b border-gray-100 flex items-center justify-between relative group/header rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <FaBriefcase className="text-emerald-500" />
                        <h3 className="text-lg text-gray-800 font-normal">Candidate to Vacancy Allocation Protocol</h3>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] text-emerald-500 tracking-widest font-normal">Unit Level Scarcity Pressure</span>
                        <Tooltip text="Unit-level allocation audit. Contender Delta shows the fitness gap between the assigned candidate and the runner-up." position="top-left">
                            <FaInfoCircle className="text-emerald-300 hover:text-emerald-500 cursor-help transition-colors text-sm" />
                        </Tooltip>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/30">
                                <th className="px-6 py-4 text-xs text-gray-400 font-normal tracking-wider">Operational Target</th>
                                <th className="px-6 py-4 text-xs text-gray-400 font-normal tracking-wider">Vacancy Unit</th>
                                <th className="px-6 py-4 text-xs text-gray-400 font-normal tracking-wider">Allocated Intelligence</th>
                                <th className="px-6 py-4 text-xs text-gray-400 font-normal tracking-wider text-center">Allocated Fitness</th>
                                <th className="px-6 py-4 text-xs text-gray-400 font-normal tracking-wider text-center">Contender Delta</th>
                                <th className="px-6 py-4 text-xs text-gray-400 font-normal tracking-wider text-center">Scarcity Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {globalAllocation.map((v, idx) => (
                                <tr key={idx} className="hover:bg-emerald-50/20 transition-colors">
                                    <td className="px-6 py-5 text-sm text-gray-700 font-normal">{v.job}</td>
                                    <td className="px-6 py-5 text-sm text-gray-500 font-normal">{v.unit}</td>
                                    <td className="px-6 py-5 text-sm text-gray-800 font-normal italic">{v.candidate}</td>
                                    <td className="px-6 py-5 text-sm text-center font-normal">
                                        <span className="text-emerald-600">{(v.fitness * 100).toFixed(2)}%</span>
                                    </td>
                                    <td className="px-6 py-5 text-sm text-center font-normal">
                                        <span className={`text-xs ${v.delta < 0.02 ? 'text-rose-600' : 'text-gray-400'}`}>
                                            +{(v.delta * 100).toFixed(1)}% Gap
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-sm text-center font-normal">
                                        <span className={`px-2 py-0.5 rounded text-[10px] border ${v.scarcity === 'High Pressure' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                            v.scarcity === 'Competitive' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            }`}>
                                            {v.scarcity}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


// --- Main Component ---
const FitnessAllocationOptimization = () => {
    const navigate = useNavigate();
    const { isAdmin, user, logout } = useAuth();

    const [searchTerm, setSearchTerm] = useState('');
    const [advertisements, setAdvertisements] = useState([]);
    const [selectedAds, setSelectedAds] = useState([]);
    const [finalMerits, setFinalMerits] = useState([]);
    const [selectedMerits, setSelectedMerits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isProcessingFitness, setIsProcessingFitness] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [batchResults, setBatchResults] = useState([]); // Array of results for each selected merit
    const [detailIndex, setDetailIndex] = useState(0); // Index of the result currently being viewed
    const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
    const [isDeepDive, setIsDeepDive] = useState(false);

    // Pagination states
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    // Logout modal
    const [logoutModal, setLogoutModal] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [adsRes, meritsRes] = await Promise.all([
                advertisementAPI.getAll(),
                normalizationAPI.getFinalMerits()
            ]);

            if (adsRes.data.success) {
                setAdvertisements(adsRes.data.data);
            }
            if (meritsRes.data.success) {
                setFinalMerits(meritsRes.data.data);
            }
        } catch (err) {
            console.error('Error fetching initial data:', err);
            toast.error('Failed to load advertisements and merit lists', {
                icon: <FaTimes className="text-white text-xl" />,
                style: { background: '#ef4444', color: '#fff' }
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleAd = (adId) => {
        setSelectedAds(prev => {
            const next = prev.includes(adId)
                ? prev.filter(id => id !== adId)
                : [...prev, adId];

            // Cleanup selected merits if their ad is removed
            if (prev.includes(adId)) {
                setSelectedMerits(p => p.filter(mid => {
                    const merit = finalMerits.find(m => m._id === mid);
                    const meritAdId = merit?.advertisementId?._id || merit?.advertisementId;
                    return meritAdId !== adId;
                }));
            }
            return next;
        });
        setBatchResults([]);
    };

    const toggleMerit = (meritId) => {
        setSelectedMerits(prev =>
            prev.includes(meritId)
                ? prev.filter(id => id !== meritId)
                : [...prev, meritId]
        );
        setBatchResults([]);
    };

    const filteredMerits = selectedAds.length > 0
        ? finalMerits.filter(m => {
            const adId = m.advertisementId?._id || m.advertisementId;
            return selectedAds.includes(adId);
        })
        : [];

    const handleRefresh = () => {
        fetchInitialData();
        toast.success('Data refreshed', {
            icon: <FaCheckCircle className="text-white text-xl" />,
            style: { background: '#10b981', color: '#fff' }
        });
    };

    const handleRunFitness = async () => {
        if (selectedAds.length === 0 || selectedMerits.length === 0) {
            toast.error('Please select at least one advertisement and merit list', {
                icon: <FaTimes className="text-white text-xl" />,
                style: { background: '#ef4444', color: '#fff' }
            });
            return;
        }

        try {
            setIsProcessingFitness(true);
            setBatchResults([]);
            setDetailIndex(0);
            setProcessingProgress({ current: 0, total: selectedMerits.length });
            toast.loading(`Processing batch of ${selectedMerits.length} Analytical Tasks...`, {
                id: 'fitness-processing',
                icon: <FaSpinner className="animate-spin text-white text-xl" />,
                style: { background: '#3b82f6', color: '#fff' }
            });

            const results = [];
            for (let i = 0; i < selectedMerits.length; i++) {
                const meritId = selectedMerits[i];
                const meritRecord = finalMerits.find(m => m._id === meritId);
                const adId = meritRecord?.advertisementId?._id || meritRecord?.advertisementId;

                setProcessingProgress({ current: i + 1, total: selectedMerits.length });

                try {
                    const res = await normalizationAPI.runFitness(adId, meritId);
                    if (res.data.success) {
                        results.push({
                            ...res.data.data,
                            advertisementId: adId,                          // ← CRITICAL FIX: include adId
                            advertisementTitle: res.data.advertisementTitle,
                            jobTitle: res.data.jobTitle,
                            meritId
                        });
                    }
                } catch (err) {
                    console.error(`Error processing merit ${meritId}:`, err);
                    toast.error(`Failed for merit ${meritRecord?.title || meritId}`, {
                        duration: 3000,
                        icon: <FaTimes className="text-white text-xl" />,
                        style: { background: '#ef4444', color: '#fff' }
                    });
                }
            }

            if (results.length > 0) {
                setBatchResults(results);
                toast.success(`Batch complete: ${results.length} processed successfully!`, {
                    id: 'fitness-processing',
                    icon: <FaCheckCircle className="text-white text-xl" />,
                    style: { background: '#10b981', color: '#fff' }
                });
            } else {
                toast.error('Batch processing failed for all selected items', {
                    id: 'fitness-processing',
                    icon: <FaTimes className="text-white text-xl" />,
                    style: { background: '#ef4444', color: '#fff' }
                });
            }
        } catch (err) {
            console.error('Fitness processing error:', err);
            toast.error('Failed to process batch fitness & allocation', {
                id: 'fitness-processing',
                icon: <FaTimes className="text-white text-xl" />,
                style: { background: '#ef4444', color: '#fff' }
            });
        } finally {
            setIsProcessingFitness(false);
            setProcessingProgress({ current: 0, total: 0 });
        }
    };

    const handleSaveConsummations = async () => {
        if (batchResults.length === 0) {
            toast.error('No analytical results to save', {
                icon: <FaTimes className="text-white text-xl" />,
                style: { background: '#ef4444', color: '#fff' }
            });
            return;
        }

        try {
            setIsSaving(true);
            toast.loading(`Persisting batch of ${batchResults.length} records...`, {
                id: 'save-consummations',
                icon: <FaSpinner className="animate-spin text-white text-xl" />,
                style: { background: '#8b5cf6', color: '#fff' }
            });

            const batchItems = batchResults.map(result => ({
                advertisementId: result.advertisementId,
                meritListId: result.meritId,
                advertisementTitle: result.advertisementTitle || '',
                jobTitle: result.jobTitle || '',
                fitnessMatrix: result.fitnessMatrix,
                candidateBreakdowns: result.candidateBreakdowns,
                allocation: result.allocation,
                analytics: result.analytics,
                engineVersion: result.engineVersion
            }));

            const res = await normalizationAPI.saveFitnessAllocationBatch(batchItems);

            if (res.data.success) {
                const { saved, duplicates, errors } = res.data.summary;
                const parts = [];
                if (saved > 0) parts.push(`${saved} Saved`);
                if (duplicates > 0) parts.push(`${duplicates} Already Persisted`);
                if (errors > 0) parts.push(`${errors} Failed`);

                if (saved > 0) {
                    toast.success(`Batch Persistence Complete: ${parts.join(', ')}`, {
                        id: 'save-consummations',
                        duration: 5000,
                        icon: <FaCheckCircle className="text-white text-xl" />,
                        style: { background: '#059669', color: '#fff', border: '1px solid #34d399' }
                    });
                } else if (duplicates > 0 && errors === 0) {
                    // Explicit "No Duplicates Allowed" feedback as requested
                    toast.error('Access Denied: Duplicates are not allowed. These records already exist in the Intelligence Vault.', {
                        id: 'save-consummations',
                        icon: <FaShieldAlt className="text-red-100 text-xl" />,
                        duration: 4000,
                        style: { background: '#7f1d1d', color: '#fca5a5', border: '1px solid #ef4444' }
                    });
                } else {
                    toast.error(`Batch Persistence: ${parts.join(', ')}`, {
                        id: 'save-consummations',
                        icon: <FaTimes className="text-white text-xl" />,
                        style: { background: '#ef4444', color: '#fff' }
                    });
                }
            }

        } catch (err) {
            console.error('Save consummations error:', err);
            if (err.response?.data?.message) {
                toast.error(err.response.data.message, {
                    id: 'save-consummations',
                    icon: <FaTimes className="text-white text-xl" />,
                    style: { background: '#ef4444', color: '#fff' }
                });
            } else {
                toast.error('Fatal error during batch persistence', {
                    id: 'save-consummations',
                    icon: <FaTimes className="text-white text-xl" />,
                    style: { background: '#ef4444', color: '#fff' }
                });
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/login");
        } catch (err) {
            console.log("Logout failed", err);
            toast.error("Logout failed", {
                icon: <FaTimes className="text-white text-xl" />,
                style: { background: '#ef4444', color: '#fff' }
            });
        }
    };

    const canRunFitness = selectedAds.length > 0 && selectedMerits.length > 0;

    // Pagination for candidate table
    const paginatedCandidates = useMemo(() => {
        const currentResult = batchResults[detailIndex];
        if (!currentResult) return [];
        const candidates = Object.entries(currentResult.candidateBreakdowns).map(([cid, data]) => ({
            id: cid,
            ...data,
            breakdown: Object.values(data.jobs)[0]
        }));
        return candidates.slice((page - 1) * rowsPerPage, page * rowsPerPage);
    }, [batchResults, detailIndex, page, rowsPerPage]);

    const totalCandidates = batchResults[detailIndex] ? Object.keys(batchResults[detailIndex].candidateBreakdowns).length : 0;
    const totalPages = Math.ceil(totalCandidates / rowsPerPage);

    // --- Data Preparations for Nivo Charts ---

    // 1. Radar Chart Data
    const radarData = useMemo(() => {
        const currentResult = batchResults[detailIndex];
        if (!currentResult) return [];
        const total = Object.keys(currentResult.candidateBreakdowns).length;
        if (total === 0) return [];

        let csf = 0, sea = 0, sfmc = 0, egc = 0, im = 0;

        Object.values(currentResult.candidateBreakdowns).forEach(c => {
            const jobData = Object.values(c.jobs)[0];
            if (jobData?.components) {
                csf += jobData.components.CSF || 0;
                sea += jobData.components.SEA || 0;
                sfmc += jobData.components.SFMC || 0;
                egc += jobData.components.EGC || 0;
                im += jobData.components.IM || 0;
            }
        });

        return [
            { component: 'CSF', value: Math.round((csf / total) * 100) },
            { component: 'SEA', value: Math.round((sea / total) * 100) },
            { component: 'SFMC', value: Math.round((sfmc / total) * 100) },
            { component: 'EGC', value: Math.round((egc / total) * 100) },
            { component: 'IM', value: Math.round((im / total) * 100) }
        ];
    }, [batchResults, detailIndex]);

    // 2. Contender Heatmap Data
    const contenderHeatmapData = useMemo(() => {
        const currentResult = batchResults[detailIndex];
        if (!currentResult) return [];
        const top5 = Object.entries(currentResult.candidateBreakdowns).map(([id, c]) => {
            const jobData = Object.values(c.jobs)[0];
            return {
                name: c.name.split(' ')[0],
                score: Math.round((jobData?.score || 0) * 100),
                CSF: Math.round((jobData?.components?.CSF || 0) * 100),
                SEA: Math.round((jobData?.components?.SEA || 0) * 100),
                SFMC: Math.round((jobData?.components?.SFMC || 0) * 100),
                IM: Math.round((jobData?.components?.IM || 0) * 100)
            };
        }).sort((a, b) => b.score - a.score).slice(0, 5);

        const components = ['CSF', 'SEA', 'SFMC', 'IM'];
        return components.map(comp => ({
            id: comp,
            data: top5.map(c => ({
                x: c.name,
                y: c[comp]
            }))
        }));
    }, [batchResults, detailIndex]);

    // 3. Heatmap Data
    const heatmapData = useMemo(() => {
        const currentResult = batchResults[detailIndex];
        if (!currentResult) return [];
        const matrix = currentResult.fitnessMatrix;
        const data = [];

        Object.entries(matrix).forEach(([jid, cands]) => {
            const item = {
                id: currentResult.jobTitle || 'Target Role',
                data: []
            };
            Object.entries(cands).forEach(([cid, score]) => {
                const cname = currentResult.candidateBreakdowns[cid]?.name.split(' ')[0] || cid.substring(0, 4);
                item.data.push({
                    x: cname,
                    y: Math.round(score * 100)
                });
            });
            data.push(item);
        });
        return data;
    }, [batchResults, detailIndex]);

    return (
        <div className="min-h-screen py-8 px-4 animate-fade-in">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8 animate-slide-down">
                    <h1 className="text-4xl md:text-5xl font-normal text-gray-800 mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                        Fitness & Allocation Optimization Intelligence
                    </h1>
                </div>

                {/* Search & Actions Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search intelligence data..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full font-normal"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <FaTimes />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <AbbreviationGuide />

                        <Tooltip text="Refresh the advertisements and merit lists from the server.">
                            <button
                                onClick={handleRefresh}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-normal"
                                disabled={loading}
                            >
                                <FaRedo className={`${loading ? 'animate-spin' : ''} text-primary-600`} />
                                Refresh
                            </button>
                        </Tooltip>

                        <Tooltip text={
                            !canRunFitness
                                ? "Please select an advertisement and merit list to enable Fitness & Allocation"
                                : isProcessingFitness
                                    ? "VatsAi engine is computing advanced multi-modal fitness..."
                                    : "Run VatsAi's Fitness & Allocation Analysis"
                        }>
                            <button
                                onClick={handleRunFitness}
                                disabled={isProcessingFitness || !canRunFitness}
                                className={`
                                    relative group flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-normal transition-all duration-300 shadow-sm border
                                    ${canRunFitness && !isProcessingFitness
                                        ? 'cursor-pointer active:scale-95 bg-gradient-to-r from-[#7742B2] via-[#F180FF] to-[#FD8BD9] border-transparent'
                                        : 'cursor-not-allowed opacity-80 bg-gray-600'
                                    }
                                    focus:outline-none focus:ring-2 focus:ring-[#F180FF]/50
                                `}
                            >
                                <div className="relative z-10 flex items-center gap-2">
                                    {isProcessingFitness ? (
                                        <FaBrain className="text-gray-800 text-base animate-pulse" />
                                    ) : (
                                        <FaDna className={`text-base transition-all duration-300 group-hover:scale-110 ${canRunFitness ? 'text-gray-800' : 'text-gray-400'}`} />
                                    )}
                                    <span className="font-normal text-gray-800">
                                        {isProcessingFitness ? "Processing..." : "Fitness & allocation"}
                                    </span>
                                </div>
                            </button>
                        </Tooltip>

                        <Tooltip text="Exit the platform securely.">
                            <button
                                onClick={() => setLogoutModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-normal"
                            >
                                <FaPowerOff />
                                Logout
                            </button>
                        </Tooltip>
                    </div>
                </div>

                {/* Selection Panel */}
                <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Ads Selection */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-normal text-gray-700 flex items-center">
                                    <FaFileAlt className="text-secondary-500 mr-2" />
                                    Select Advertisements
                                    {advertisements.length > 0 && (
                                        <span className="ml-2 text-[10px] font-normal bg-secondary-50 text-secondary-600 px-2 py-0.5 rounded-full border border-secondary-200">
                                            {advertisements.length} Total
                                        </span>
                                    )}
                                </label>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => {
                                            if (selectedAds.length === advertisements.length) setSelectedAds([]);
                                            else setSelectedAds(advertisements.map(a => a._id));
                                            setBatchResults([]);
                                        }}
                                        className="text-[11px] font-normal text-primary-600 hover:text-primary-700 bg-primary-50 px-2 py-1 rounded"
                                    >
                                        {selectedAds.length === advertisements.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                    <Tooltip text="Select advertisements to include in the multi-modal fitness batch. Each selection enables related merit lists.">
                                        <FaInfoCircle className="text-gray-300 hover:text-secondary-500 cursor-help transition-colors text-sm" />
                                    </Tooltip>
                                </div>
                            </div>

                            <div className="border border-gray-200 rounded-xl p-4 h-48 overflow-y-auto bg-gray-50 flex flex-col gap-2 custom-scrollbar">
                                {advertisements.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400 italic text-sm">No advertisements found</div>
                                ) : (
                                    advertisements.map(ad => (
                                        <label key={ad._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-all cursor-pointer border border-transparent hover:border-gray-200 group">
                                            <input
                                                type="checkbox"
                                                checked={selectedAds.includes(ad._id)}
                                                onChange={() => toggleAd(ad._id)}
                                                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-normal text-gray-800 group-hover:text-primary-700">{ad.title || ad.jobTitle}</span>
                                                <span className="text-[10px] text-gray-500">Ad ID: {ad.adNumber || ad._id.substring(0, 8)}</span>
                                            </div>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Merits Selection */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-normal text-gray-700 flex items-center">
                                    <FaGraduationCap className="text-primary-500 mr-2" />
                                    Select Merit Lists
                                    {filteredMerits.length > 0 && (
                                        <span className="ml-2 text-[10px] font-normal bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full border border-primary-200">
                                            {filteredMerits.length} Available
                                        </span>
                                    )}
                                </label>
                                <div className="flex items-center gap-3">
                                    <button
                                        disabled={filteredMerits.length === 0}
                                        onClick={() => {
                                            if (selectedMerits.length === filteredMerits.length) setSelectedMerits([]);
                                            else setSelectedMerits(filteredMerits.map(m => m._id));
                                            setBatchResults([]);
                                        }}
                                        className="text-[11px] font-normal text-secondary-600 hover:text-secondary-700 bg-secondary-50 px-2 py-1 rounded disabled:opacity-50"
                                    >
                                        {selectedMerits.length === filteredMerits.length && filteredMerits.length > 0 ? 'Deselect All' : 'Select All'}
                                    </button>
                                    <Tooltip text="Select candidate pools (merit lists) to process against the selected job advertisements.">
                                        <FaInfoCircle className="text-gray-300 hover:text-primary-500 cursor-help transition-colors text-sm" />
                                    </Tooltip>
                                </div>
                            </div>

                            <div className="border border-gray-200 rounded-xl p-4 h-48 overflow-y-auto bg-gray-50 flex flex-col gap-2 custom-scrollbar">
                                {selectedAds.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400 italic text-sm">Select an advertisement first</div>
                                ) : filteredMerits.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400 italic text-sm">No merit lists for selected ads</div>
                                ) : (
                                    filteredMerits.map(merit => (
                                        <label key={merit._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-all cursor-pointer border border-transparent hover:border-gray-200 group">
                                            <input
                                                type="checkbox"
                                                checked={selectedMerits.includes(merit._id)}
                                                onChange={() => toggleMerit(merit._id)}
                                                className="w-4 h-4 text-secondary-600 rounded border-gray-300 focus:ring-secondary-500"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-normal text-gray-800 group-hover:text-secondary-700">{merit.title || 'General Merit List'}</span>
                                                <span className="text-[10px] text-gray-500">Related to: {merit.advertisementId?.title || 'System Ad'}</span>
                                            </div>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Batch Progress Indicator */}
                {isProcessingFitness && (
                    <div className="bg-white rounded-2xl p-8 mb-8 border border-primary-100 animate-pulse">
                        <div className="max-w-md mx-auto">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-normal text-primary-600">Executing Deep Intelligence Batch...</span>
                                <span className="text-sm font-normal text-gray-500">{processingProgress.current} / {processingProgress.total}</span>
                            </div>
                            <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                                <div
                                    className="h-full bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-600 transition-all duration-500"
                                    style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
                                />
                            </div>
                            <p className="text-center text-xs text-gray-400 mt-3 italic">
                                Neural Matcher activating for analytical task #{processingProgress.current}
                            </p>
                        </div>
                    </div>
                )}

                {batchResults.length > 0 ? (
                    <div className="space-y-8 animate-fade-in">

                        {/* Batch Result Navigator */}
                        {!isDeepDive && (
                            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-3 border border-gray-700 flex flex-nowrap items-center gap-3 overflow-x-auto custom-scrollbar">
                                {batchResults.map((result, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setDetailIndex(idx)}
                                        className={`
                                            flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-normal transition-all whitespace-nowrap border shrink-0
                                            ${detailIndex === idx
                                                ? 'bg-blue-500 text-white border-blue-400 scale-[1.02]'
                                                : 'bg-gray-800/50 text-gray-400 border-gray-700/50 hover:text-white hover:bg-gray-700/80'}
                                        `}
                                    >
                                        <span>{result.advertisementTitle || `Task ${idx + 1}`}</span>
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-normal tracking-wider ${detailIndex === idx ? 'bg-white/20 text-white' : 'bg-gray-900 text-gray-500'}`}>
                                            {result.analytics?.totalCandidates || 0}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {isDeepDive ? (
                            <DeepDiveView batchResults={batchResults} />
                        ) : (
                            <>
                                {/* Executive Intelligence Summary */}
                                <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-primary-200 transition-colors overflow-visible">
                                    <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4 relative group/header">
                                        <h3 className="text-xl font-normal text-gray-800 flex items-center gap-3">
                                            <FaChartBar className="text-primary-500 p-2 bg-primary-50 rounded-lg text-4xl" />
                                            Executive Intelligence Summary
                                        </h3>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 tracking-widest">{batchResults[detailIndex].advertisementTitle}</p>
                                                <p className="text-lg text-primary-600">{batchResults[detailIndex].jobTitle}</p>
                                            </div>
                                            <Tooltip text="Summary of key metrics including total candidates, allocation status, and average fitness for the selected task." position="top-left">
                                                <FaInfoCircle className="text-gray-300 hover:text-primary-500 cursor-help transition-colors text-sm" />
                                            </Tooltip>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        <div className="p-5 rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-md transition-all cursor-help group relative">
                                            <p className="text-xs text-gray-500 font-normal mb-2 flex items-center gap-1">
                                                <FaUsers className="text-blue-500" />
                                                Total Candidates
                                            </p>
                                            <p className="text-3xl text-gray-800">{batchResults[detailIndex].analytics.totalCandidates}</p>
                                        </div>

                                        <div className="p-5 rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-white hover:shadow-md transition-all cursor-help group relative">
                                            <p className="text-xs text-gray-500 font-normal mb-2 flex items-center gap-1">
                                                <FaCheckCircle className="text-green-500" />
                                                Total Allocated
                                            </p>
                                            <p className="text-3xl text-green-600">{batchResults[detailIndex].analytics.totalAllocated}</p>
                                        </div>

                                        <div className="p-5 rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white hover:shadow-md transition-all cursor-help group relative">
                                            <p className="text-xs text-gray-500 font-normal mb-2 flex items-center gap-1">
                                                <FaTimes className="text-rose-500" />
                                                Unallocated
                                            </p>
                                            <p className="text-3xl text-rose-600">{batchResults[detailIndex].analytics.unallocatedCount}</p>
                                        </div>

                                        <div className="p-5 rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white hover:shadow-md transition-all cursor-help group relative">
                                            <p className="text-xs text-gray-500 font-normal mb-2 flex items-center gap-1">
                                                <FaChartBar className="text-purple-500" />
                                                Average Fitness
                                            </p>
                                            <p className="text-3xl text-purple-600">
                                                {(batchResults[detailIndex].analytics.averageFitness * 100).toFixed(1)}%
                                            </p>
                                        </div>

                                        <div className="p-5 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white hover:shadow-md transition-all cursor-help group relative">
                                            <p className="text-xs text-gray-500 font-normal mb-2 flex items-center gap-1">
                                                <FaMedal className="text-amber-500" />
                                                Max Fitness
                                            </p>
                                            <p className="text-3xl text-amber-600">
                                                {(batchResults[detailIndex].analytics.maxFitness * 100).toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Visualizations Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Radar Chart */}
                                    <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-200 transition-colors h-[450px] flex flex-col overflow-visible">
                                        <div className="flex items-center justify-between mb-4 relative group/header">
                                            <h3 className="text-lg text-gray-800 flex items-center gap-2">
                                                <FaProjectDiagram className="text-blue-500" />
                                                Average Cohort Strengths Map
                                            </h3>
                                            <Tooltip text="Radar chart visualizing the average strength across different evaluation components for this cohort." position="top-left">
                                                <FaInfoCircle className="text-gray-300 hover:text-blue-500 cursor-help transition-colors text-sm" />
                                            </Tooltip>
                                        </div>
                                        <div className="flex-1 w-full">
                                            {radarData.length > 0 ? (
                                                <ResponsiveRadar
                                                    data={radarData}
                                                    keys={['value']}
                                                    indexBy="component"
                                                    maxValue={100}
                                                    margin={{ top: 40, right: 60, bottom: 40, left: 60 }}
                                                    curve="linearClosed"
                                                    borderWidth={2}
                                                    borderColor={{ from: 'color' }}
                                                    gridLevels={5}
                                                    gridShape="circular"
                                                    colors={['#2424fbff']}
                                                    fillOpacity={0.4}
                                                    animate={true}
                                                    motionConfig="gentle"
                                                    theme={{
                                                        labels: { text: { fontSize: 11, fontWeight: 'medium', fill: '#374151' } },
                                                        grid: { line: { stroke: '#413efdff', strokeWidth: 1 } }
                                                    }}
                                                />
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-gray-400">Insufficient data</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Contender Breakdown */}
                                    <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-emerald-200 transition-colors h-[450px] flex flex-col overflow-visible">
                                        <div className="flex items-center justify-between mb-4 relative group/header">
                                            <h3 className="text-lg font-normal text-gray-800 flex items-center gap-2">
                                                <FaUsers className="text-emerald-500" />
                                                Top Ranked Contenders Breakdown
                                            </h3>
                                            <Tooltip text="Heatmap showing the fitness breakdown of top-ranked candidates across core competencies." position="top-left">
                                                <FaInfoCircle className="text-gray-300 hover:text-emerald-500 cursor-help transition-colors text-sm" />
                                            </Tooltip>
                                        </div>
                                        <div className="flex-1 w-full">
                                            {contenderHeatmapData.length > 0 ? (
                                                <ResponsiveHeatMap
                                                    data={contenderHeatmapData}
                                                    margin={{ top: 30, right: 30, bottom: 60, left: 60 }}
                                                    valueFormat={v => `${v}%`}
                                                    colors={{ type: 'sequential', scheme: 'blues', minValue: 0, maxValue: 100 }}
                                                    animate={true}
                                                />
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-gray-400">Insufficient data</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Deep Component Analysis Table */}
                                <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-purple-200 transition-colors overflow-visible">
                                    <div className="flex items-center justify-between mb-6 relative group/header">
                                        <h3 className="text-lg font-normal text-gray-800 flex items-center gap-2">
                                            <FaDna className="text-purple-500" />
                                            Deep Component Analysis Tensor Map
                                        </h3>
                                        <Tooltip text="Unit-level breakdown of fitness components (CSF, SEA, SFMC, EGC, IM) for each candidate." position="top-left">
                                            <FaInfoCircle className="text-gray-300 hover:text-purple-500 cursor-help transition-colors text-sm" />
                                        </Tooltip>
                                    </div>
                                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gradient-to-r from-gray-50 to-purple-50 border-b border-gray-200">
                                                    <th className="text-left py-4 px-5 text-gray-700">Candidate signature</th>
                                                    <th className="text-center py-4 px-3 text-blue-700">CSF</th>
                                                    <th className="text-center py-4 px-3 text-emerald-700">SEA</th>
                                                    <th className="text-center py-4 px-3 text-purple-700">SFMC</th>
                                                    <th className="text-center py-4 px-3 text-amber-700">EGC</th>
                                                    <th className="text-center py-4 px-3 text-rose-700">IM</th>
                                                    <th className="text-center py-4 px-5 text-gray-900 bg-gray-100">Net fitness</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedCandidates.map((candidate) => (
                                                    <tr key={candidate.id} className="border-b border-gray-100 hover:bg-purple-50/30 transition-colors group">
                                                        <td className="py-4 px-5 text-gray-800">{candidate.name}</td>
                                                        <td className="text-center py-4 px-3">{(candidate.breakdown?.components?.CSF * 100).toFixed(1)}%</td>
                                                        <td className="text-center py-4 px-3">{(candidate.breakdown?.components?.SEA * 100).toFixed(1)}%</td>
                                                        <td className="text-center py-4 px-3">{(candidate.breakdown?.components?.SFMC * 100).toFixed(1)}%</td>
                                                        <td className="text-center py-4 px-3">{(candidate.breakdown?.components?.EGC * 100).toFixed(1)}%</td>
                                                        <td className="text-center py-4 px-3">{(candidate.breakdown?.components?.IM * 100).toFixed(1)}%</td>
                                                        <td className="text-center py-4 px-5 bg-gray-50">{(candidate.breakdown?.score * 100).toFixed(1)}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {totalCandidates > rowsPerPage && (
                                        <div className="mt-6">
                                            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalCandidates} rowsPerPage={rowsPerPage} />
                                        </div>
                                    )}
                                </div>

                                {/* Allocation, Heatmap & Advanced Insights */}
                                <div className="flex flex-col gap-10">
                                    {/* 1. Density Heatmap Matrix (Top) */}
                                    <div className="bg-white rounded-2xl p-8 border border-gray-200 w-full overflow-visible">
                                        <div className="h-[450px] w-full border-b border-gray-100 pb-10">
                                            <div className="flex items-center justify-between mb-6 relative group/header">
                                                <div className="flex items-center gap-3">
                                                    <FaChalkboardTeacher className="text-amber-500" />
                                                    <h3 className="text-xl text-gray-800 font-normal">Density heatmap matrix</h3>
                                                </div>
                                                <Tooltip text="Matrix visualizing the density of fitness scores across the entire role portfolio and candidate pool." position="top-left">
                                                    <FaInfoCircle className="text-gray-300 hover:text-amber-500 cursor-help transition-colors text-sm" />
                                                </Tooltip>
                                            </div>
                                            <div className="h-full">
                                                {heatmapData.length > 0 ? (
                                                    <ResponsiveHeatMap
                                                        data={heatmapData}
                                                        margin={{ top: 40, right: 90, bottom: 60, left: 120 }}
                                                        valueFormat={v => `${v}%`}
                                                        colors={{ type: 'sequential', scheme: 'oranges', minValue: 0, maxValue: 100 }}
                                                        animate={true}
                                                        axisLeft={{
                                                            tickSize: 5,
                                                            tickPadding: 5,
                                                            tickRotation: -90,
                                                            legend: 'Role portfolio',
                                                            legendPosition: 'middle',
                                                            legendOffset: -80
                                                        }}
                                                        axisTop={{
                                                            tickSize: 5,
                                                            tickPadding: 5,
                                                            tickRotation: 0,
                                                            legend: 'Candidate pool',
                                                            legendPosition: 'middle',
                                                            legendOffset: -30
                                                        }}
                                                        legends={[
                                                            {
                                                                anchor: 'bottom',
                                                                translateX: 0,
                                                                translateY: 30,
                                                                length: 400,
                                                                thickness: 8,
                                                                direction: 'row',
                                                                tickPosition: 'after',
                                                                tickSize: 3,
                                                                tickSpacing: 4,
                                                                tickOverlap: false,
                                                                tickFormat: v => `${v}%`,
                                                                title: 'Fitness Score Range (%)',
                                                                titleAlign: 'start',
                                                                titleOffset: 4
                                                            }
                                                        ]}
                                                    />
                                                ) : (
                                                    <div className="h-full flex items-center justify-center text-gray-400">Insufficient data</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Final Allocation Protocol (Bottom) */}
                                    <div className="bg-gradient-to-r from-[#f0f4ff] to-[#e6ecff] rounded-2xl p-8 border border-blue-100">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-blue-200/50 relative group/header">
                                            <h3 className="text-xl text-gray-800 flex items-center gap-3">
                                                <FaCheckCircle className="text-emerald-500" />
                                                Final allocation protocol
                                            </h3>
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-blue-100">
                                                        <span className="text-xs text-gray-500">Vacancies</span>
                                                        <span className="text-sm font-normal text-blue-700">{batchResults[detailIndex].analytics?.totalOpenings || 0}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                                                        <span className="text-xs text-gray-500">Filled</span>
                                                        <span className="text-sm font-normal text-emerald-700">{batchResults[detailIndex].analytics?.totalAllocated || 0}</span>
                                                    </div>
                                                </div>
                                                <Tooltip text="Final results of the matching engine, showing which candidates were allocated to which vacancy units based on highest fitness." position="top-left">
                                                    <FaInfoCircle className="text-gray-300 hover:text-emerald-500 cursor-help transition-colors text-sm" />
                                                </Tooltip>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                                            {Object.entries(batchResults[detailIndex].allocation).map(([jid, allocated]) => (
                                                <React.Fragment key={jid}>
                                                    {allocated.map((item, i) => (
                                                        <div key={i} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl hover:bg-emerald-50/10 transition-all transform hover:-translate-y-1 relative overflow-hidden group">
                                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm text-gray-800">{item.name}</span>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-2">
                                                                <span className="text-sm text-emerald-600">{(item.fitnessScore * 100).toFixed(1)}%</span>
                                                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-emerald-500"
                                                                        style={{ width: `${item.fitnessScore * 100}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </React.Fragment>
                                            ))}

                                            {/* Display reasoning for unfilled slots (vacancies that were not filled) */}
                                            {Array.from({ length: Math.max(0, (batchResults[detailIndex].analytics?.totalOpenings || 0) - (batchResults[detailIndex].analytics?.totalAllocated || 0)) }).map((_, i) => {
                                                return (
                                                    <div key={`unfilled-${i}`} className="flex items-center justify-between p-5 bg-gray-100/50 border border-dashed border-gray-300 rounded-2xl opacity-80 group">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm text-gray-500 mb-1 italic">Unfilled position {i + 1}</span>
                                                            <span className="text-[10px] text-gray-400">
                                                                Reason: Insufficient fitness vs cohort standards
                                                            </span>
                                                        </div>
                                                        <div className="p-2 bg-white rounded-full">
                                                            <FaTimes className="text-gray-300 text-xs" />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="flex justify-center gap-6 pt-8">
                            <Tooltip text="Toggle aggregate batch intelligence view cross-comparing all candidates, jobs, and vacancies.">
                                <button
                                    onClick={() => setIsDeepDive(!isDeepDive)}
                                    className={`
                                        flex items-center justify-center gap-3 px-8 py-3 rounded-xl transition-all duration-300 font-normal border border-transparent
                                        text-gray-800
                                        bg-gradient-to-r from-[#4facfe] to-[#00f2fe]
                                        hover:from-[#96fbc4] hover:to-[#f9f586]
                                        focus:from-[#f5f7fa] focus:to-[#c3cfe2] active:from-[#f5f7fa] active:to-[#c3cfe2]
                                    `}
                                >
                                    <FaWater />
                                    <span className="capitalize">Deep dive into ocean</span>
                                </button>
                            </Tooltip>

                            <Tooltip text="Commit and persist the current batch allocations.">
                                <button
                                    onClick={handleSaveConsummations}
                                    disabled={isSaving || batchResults[detailIndex].analytics?.totalAllocated === 0}
                                    className={`
                                        flex items-center justify-center gap-3 px-8 py-3 rounded-xl transition-all duration-300 font-normal hover:border-red-400 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 text-white border border-transparent
                                        bg-gradient-to-r from-primary-600 to-secondary-600
                                        hover:from-[#f85032] hover:to-[#e73827]
                                        active:from-[#800000] active:to-[#800000] active:border-red-300
                                        focus:border-[#8b0000] focus:ring-pink-500
                                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-primary-600 disabled:hover:to-secondary-600
                                    `}
                                >
                                    {isSaving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                    {isSaving ? 'Persisting Batch Intelligence...' : 'Save Batch Consummations'}
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                ) : !isProcessingFitness && (
                    <div className="text-center py-32 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                        <FaBrain className="text-gray-200 text-8xl mx-auto mb-6" />
                        <h3 className="text-2xl font-normal text-gray-400 mb-2">Awaiting Intelligence Directives</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            Please select advertisements and merit lists above, then initialize the Fitness & Allocation engine.
                        </p>
                    </div>
                )}
            </div>

            {/* Modals */}
            <ConfirmationModal
                isOpen={logoutModal}
                onClose={() => setLogoutModal(false)}
                onConfirm={handleLogout}
                title="Confirm Logout"
                message="Are you sure you want to logout?"
                confirmText="Logout"
                cancelText="Cancel"
                type="danger"
            />
        </div >
    );
};

export default FitnessAllocationOptimization;