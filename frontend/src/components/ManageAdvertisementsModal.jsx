import React, { useState, useEffect } from 'react';
import { advertisementAPI, departmentAPI, roleAPI, jobAPI } from '../utils/api';
import { toast } from 'react-hot-toast';
import { validateAdForm } from '../utils/validations';
import {
    FaPlus, FaTrash, FaEdit, FaTimes, FaFilePdf,
    FaCalendarAlt, FaCheck, FaTimesCircle, FaBullhorn,
    FaUser, FaClock, FaCalendarCheck, FaBuilding, FaUserCheck, FaBriefcase
} from 'react-icons/fa';
import ModalContainer from './ModalContainer';
import ConfirmationModal from './ConfirmationModal';
import { format } from 'date-fns';

const ManageAdvertisementsModal = ({ isOpen, onClose }) => {
    const [advertisements, setAdvertisements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAd, setEditingAd] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ show: false, adId: null });
    const [viewingAd, setViewingAd] = useState(null);
    const [viewingAdLoading, setViewingAdLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        lastDateToApply: '',
        detail: null,
        isActive: true,
        department: '',
        role: '',
        job: '' // Changed from jobs: [] to job: ''
    });

    const [departments, setDepartments] = useState([]);
    const [roles, setRoles] = useState([]);
    const [allJobs, setAllJobs] = useState([]); // Store all jobs for filtering
    const [filteredJobs, setFilteredJobs] = useState([]); // Jobs that pass the deadline filter
    const [loadingData, setLoadingData] = useState(false);

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchAdvertisements();
            fetchDepartments();
            fetchAllJobs();
        }
    }, [isOpen]);

    const fetchDepartments = async () => {
        try {
            const res = await departmentAPI.getAll();
            setDepartments(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch departments', err);
        }
    };

    useEffect(() => {
        if (formData.department) {
            fetchRoles(formData.department);
        } else {
            setRoles([]);
            setFormData(prev => ({ ...prev, role: '' }));
        }
    }, [formData.department]);

    const fetchRoles = async (deptId) => {
        try {
            const res = await roleAPI.getByDepartment(deptId);
            setRoles(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch roles', err);
        }
    };

    const fetchAllJobs = async () => {
        try {
            const res = await jobAPI.getAll();
            const jobsData = res.data.data || [];
            setAllJobs(jobsData);

            // Apply deadline filter: include jobs if deadline is today or later, 
            // OR if deadline was within the last 5 days.
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const fiveDaysAgo = new Date(today);
            fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

            const filtered = jobsData.filter(job => {
                const deadline = new Date(job.applicationDeadline);
                return deadline >= fiveDaysAgo;
            });

            setFilteredJobs(filtered);
        } catch (err) {
            console.error('Failed to fetch jobs', err);
        }
    };

    const fetchAdvertisements = async () => {
        setLoading(true);
        try {
            const res = await advertisementAPI.getAll();
            setAdvertisements(res.data.data || []);
        } catch (err) {
            toast.error('Failed to load advertisements');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        const newFormData = { ...formData, [field]: value };
        setFormData(newFormData);

        // Live validation
        const fieldErrors = validateAdForm(newFormData, !!editingAd);
        setErrors(prev => ({ ...prev, [field]: fieldErrors[field] }));
    };

    const handleJobSelect = (job) => {
        const isSelected = formData.job === job._id;
        const newJobValue = isSelected ? '' : job._id;

        // Auto-populate title from job's role title
        const newTitle = !isSelected ? (job.role ? (typeof job.role === 'object' ? job.role.title : '') : '') : '';
        const newDeadline = !isSelected && job.applicationDeadline ? format(new Date(job.applicationDeadline), 'yyyy-MM-dd') : '';

        const newFormData = {
            ...formData,
            job: newJobValue,
            title: newTitle,
            lastDateToApply: newDeadline || formData.lastDateToApply
        };

        setFormData(newFormData);

        // Live validation for job and title
        const fieldErrors = validateAdForm(newFormData, !!editingAd);
        setErrors(prev => ({ ...prev, job: fieldErrors.job, title: fieldErrors.title }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleInputChange('detail', file);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            lastDateToApply: '',
            detail: null,
            isActive: true,
            department: '',
            role: '',
            job: ''
        });
        setErrors({});
        setEditingAd(null);
        setIsFormOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formErrors = validateAdForm(formData, !!editingAd);
        setErrors(formErrors);

        if (Object.values(formErrors).some(err => err)) {
            toast.error('Please fix validation errors');
            return;
        }

        setIsSubmitting(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('lastDateToApply', formData.lastDateToApply);
            data.append('isActive', formData.isActive);
            data.append('job', formData.job);

            if (formData.detail instanceof File) {
                data.append('document', formData.detail);
            }

            if (editingAd) {
                await advertisementAPI.update(editingAd._id, data);
                toast.success('Advertisement updated successfully');
            } else {
                await advertisementAPI.create(data);
                toast.success('Advertisement created successfully');
            }

            resetForm();
            fetchAdvertisements();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Action failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (ad) => {
        setEditingAd(ad);
        setFormData({
            title: ad.title,
            lastDateToApply: ad.lastDateToApply ? format(new Date(ad.lastDateToApply), 'yyyy-MM-dd') : '',
            detail: ad.detail,
            isActive: ad.isActive,
            department: '', // Reset filters on edit view
            role: '',
            job: ad.job?._id || ad.job || ''
        });
        setIsFormOpen(true);
    };

    const handleViewAd = async (ad) => {
        const hasFullDetails = ad.job && typeof ad.job === 'object' && ad.job.jobCode;

        if (!hasFullDetails && ad._id) {
            setViewingAdLoading(true);
            setViewingAd(ad); // Show partial while loading
            try {
                const res = await advertisementAPI.getById(ad._id);
                setViewingAd(res.data.data);
            } catch (err) {
                console.error('Failed to fetch full ad details', err);
                toast.error('Showing partial details due to fetch error');
            } finally {
                setViewingAdLoading(false);
            }
        } else {
            setViewingAd(ad);
        }
    };

    const handleDelete = async () => {
        try {
            await advertisementAPI.delete(deleteModal.adId);
            toast.success('Advertisement deleted');
            fetchAdvertisements();
        } catch (err) {
            toast.error('Failed to delete');
        } finally {
            setDeleteModal({ show: false, adId: null });
        }
    };

    // Filter jobs by dept/role for selection UI, and exclude jobs already linked to an advertisement
    const usedJobIds = advertisements.map(ad => typeof ad.job === 'object' ? ad.job?._id : ad.job).filter(Boolean);
    const displayedJobs = filteredJobs.filter(job => {
        // Exclude jobs already used in another ad (allow the current editing ad's job)
        const isUsed = usedJobIds.includes(job._id);
        const isCurrentEditJob = editingAd && (typeof editingAd.job === 'object' ? editingAd.job?._id : editingAd.job) === job._id;
        if (isUsed && !isCurrentEditJob) return false;
        if (formData.department && (typeof job.department === 'object' ? job.department?._id : job.department) !== formData.department) return false;
        if (formData.role && (typeof job.role === 'object' ? job.role?._id : job.role) !== formData.role) return false;
        return true;
    });

    const AdDetailView = ({ ad, onBack, loading }) => {
        if (!ad) return null;

        const job = ad.job;
        const role = ad.role || (typeof job === 'object' ? job?.role : null);
        const department = ad.department || (typeof job === 'object' ? job?.department : null);

        const formatDateStr = (dateString, fallback = 'N/A') => {
            if (!dateString) return fallback;
            try {
                return format(new Date(dateString), 'dd MMM yyyy');
            } catch (e) {
                return dateString;
            }
        };

        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <p className="mt-4 text-gray-400 text-sm">Loading full history...</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col h-full overflow-y-auto pr-1 text-gray-700">
                <div className="sticky top-0 bg-white z-10 pb-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-xl text-gray-800 tracking-tight flex items-center gap-2 leading-tight">
                            <FaBullhorn className="text-purple-600 flex-shrink-0" />
                            <span>{ad.title || 'Untitled Advertisement'}</span>
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                Job ID: {job?.jobCode || 'N/A'}
                            </span>
                            <span className="text-[11px] text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100 flex items-center gap-1">
                                <FaCalendarCheck size={10} /> Deadline: {formatDateStr(ad.lastDateToApply)}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onBack}
                        className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-lg transition-all flex items-center gap-2 text-sm"
                    >
                        Return to List
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                    {/* Department Details */}
                    <div className="bg-blue-50/20 p-5 rounded-xl border border-blue-100/50">
                        <h4 className="text-blue-800 text-[11px] flex items-center gap-2 mb-4 uppercase tracking-widest border-b border-blue-100 pb-2">
                            <FaBuilding className="text-blue-500" /> Department
                        </h4>
                        {department ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] text-blue-400 uppercase tracking-widest mb-1">Name</p>
                                        <p className="text-sm text-gray-800 leading-tight">{department.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-blue-400 uppercase tracking-widest mb-1">Code</p>
                                        <p className="text-xs text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-100 inline-block">{department.code}</p>
                                    </div>
                                </div>
                                {department.description && (
                                    <div>
                                        <p className="text-[10px] text-blue-400 uppercase tracking-widest mb-1">Overview</p>
                                        <p className="text-xs text-gray-600 leading-relaxed bg-white/40 p-2.5 rounded-lg border border-blue-50">{department.description}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 italic">No department data</p>
                        )}
                    </div>

                    {/* Role Details */}
                    <div className="bg-purple-50/20 p-5 rounded-xl border border-purple-100/50">
                        <h4 className="text-purple-800 text-[11px] flex items-center gap-2 mb-4 uppercase tracking-widest border-b border-purple-100 pb-2">
                            <FaUserCheck className="text-purple-500" /> Role Specs
                        </h4>
                        {role ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-2.5 rounded-lg border border-purple-100">
                                        <p className="text-[10px] text-purple-400 uppercase tracking-widest mb-0.5">Level</p>
                                        <p className="text-xs text-gray-800">{role.level}</p>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-lg border border-purple-100">
                                        <p className="text-[10px] text-purple-400 uppercase tracking-widest mb-0.5">Type</p>
                                        <p className="text-xs text-gray-800">{role.employmentType}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] text-purple-400 uppercase tracking-widest mb-1.5">Education</p>
                                    <p className="text-xs text-gray-800 bg-white p-2.5 rounded-lg border border-purple-100 leading-relaxed">
                                        {role.education}
                                    </p>
                                </div>
                                {/* Capabilities */}
                                {(role.requiredSkills?.length > 0 || role.preferredSkills?.length > 0) && (
                                    <div>
                                        <p className="text-[10px] text-purple-400 uppercase tracking-widest mb-1.5">Capabilities / Skills</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {role.requiredSkills?.map((s, idx) => (
                                                <span key={`req-${idx}`} className="px-2 py-0.5 bg-purple-600 text-white rounded text-[9px] border border-purple-700">
                                                    {(s.name || s)} {s.weight ? `(${Math.round(s.weight * 100)}%)` : ''}
                                                </span>
                                            ))}
                                            {role.preferredSkills?.map((s, idx) => (
                                                <span key={`pref-${idx}`} className="px-2 py-0.5 bg-white border border-indigo-100 text-indigo-700 rounded text-[9px]">
                                                    {(s.name || s)} {s.weight ? `(${Math.round(s.weight * 100)}%)` : ''}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 italic">No role data available</p>
                        )}
                    </div>

                    {/* Job Details */}
                    <div className="bg-white border border-gray-100 p-6 rounded-2xl lg:col-span-2 shadow-sm">
                        <h4 className="text-gray-800 text-[11px] flex items-center gap-2 mb-4 uppercase tracking-widest border-b pb-2">
                            <FaBriefcase className="text-indigo-600" /> Job Profile & Location
                        </h4>
                        {job ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                                        <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-1">City/Location</p>
                                        <p className="text-sm text-gray-800">
                                            {job.location?.city || 'N/A'}{job.location?.state ? `, ${job.location.state}` : ''}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                                        <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-1">Openings</p>
                                        <p className="text-sm text-indigo-600">{job.openings} Positions</p>
                                    </div>
                                    <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100 md:col-span-2">
                                        <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-1">Salary Budget</p>
                                        <p className="text-sm text-green-700">
                                            {job.salaryRange?.currency || 'INR'} {job.salaryRange?.min?.toLocaleString()} - {job.salaryRange?.max?.toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-50">
                                    <div>
                                        <p className="text-[10px] text-indigo-500 uppercase tracking-wider mb-2">Description</p>
                                        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap pl-3 border-l-2 border-indigo-50">{job.description}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-indigo-500 uppercase tracking-wider mb-2">Responsibilities</p>
                                        <ul className="space-y-2">
                                            {job.responsibilities?.map((r, idx) => (
                                                <li key={idx} className="text-xs text-gray-650 flex gap-2.5 p-1.5 rounded bg-gray-50/30 border border-gray-50/50">
                                                    <span className="text-indigo-400 mt-0.5 flex-shrink-0">•</span>
                                                    {r}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Criteria Matrix */}
                                {role?.criteriaSet && (
                                    <div className="mt-6 pt-5 border-t bg-gray-50/20 -mx-6 -mb-6 p-6 rounded-b-2xl">
                                        <p className="text-[11px] text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                                            Eligibility Rules
                                        </p>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-5 gap-x-4">
                                            {Object.entries(role.criteriaSet)
                                                .filter(([k, v]) => v !== undefined && k !== '_id' && !Array.isArray(v) && v !== null && v !== '')
                                                .map(([key, value]) => (
                                                    <div key={key}>
                                                        <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">
                                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                                        </p>
                                                        <p className="text-sm text-gray-800">
                                                            {typeof value === 'boolean' ? (value ? 'Required' : 'N/A') : value}
                                                        </p>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                        {/* Disciplines */}
                                        {role.criteriaSet.specificDegrees?.length > 0 && (
                                            <div className="mt-5 pt-4 border-t border-gray-100">
                                                <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-2">Specific Disciplines</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {role.criteriaSet.specificDegrees.map((degree, idx) => (
                                                        <span key={idx} className="px-2 py-0.5 bg-white text-purple-700 text-[10px] rounded border border-purple-50 shadow-sm">
                                                            {typeof degree === 'object' ? degree.name : degree}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 italic">No detailed profile found</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };


    return (
        <>
            <ModalContainer
                isOpen={isOpen}
                onClose={onClose}
                title="Manage Advertisements"
                size="large"
            >
                <div className="flex flex-col h-full space-y-6 p-1">
                    {/* Header Action */}
                    {/* Header Action */}
                    {!isFormOpen && !viewingAd && (
                        <div className="flex justify-between items-center bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                            <div>
                                <h3 className="text-lg text-purple-800 flex items-center gap-2 leading-tight">
                                    <FaBullhorn />
                                    Job Advertisements
                                </h3>
                                <p className="text-sm text-purple-600/70">Manage active and drafted job posts</p>
                            </div>
                            <button
                                onClick={() => setIsFormOpen(true)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm rounded-lg hover:shadow-md transition-all active:scale-95"
                            >
                                <FaPlus /> New Advertisement
                            </button>
                        </div>
                    )}

                    {/* Form Section */}
                    {isFormOpen && (
                        <div className="bg-white border border-purple-100 rounded-2xl p-6 shadow-sm animate-fade-in">
                            <div className="flex justify-between items-center mb-6 border-b pb-4">
                                <h3 className="text-xl text-gray-800 tracking-tight">
                                    {editingAd ? 'Update Advertisement' : 'Create New Advertisement'}
                                </h3>
                                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition-all">
                                    <FaTimes size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Title */}
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-500 uppercase tracking-widest flex items-center gap-2 px-1">
                                            <FaBullhorn className="text-purple-600" /> Auto-Generated Title
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            readOnly={true}
                                            placeholder="Select a job to generate title"
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-all bg-gray-50 cursor-not-allowed text-sm text-gray-800 ${errors.title ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}
                                        />
                                        <p className="text-[10px] text-purple-600 px-1 opacity-80">
                                            The title is automatically set based on the selected job's role title.
                                        </p>
                                        {errors.title && <p className="text-xs text-red-500 px-1">{errors.title}</p>}
                                    </div>

                                    {/* PDF Upload */}
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-500 uppercase tracking-widest flex items-center gap-2 px-1">
                                            <FaFilePdf className="text-purple-600" /> Advertisement PDF
                                        </label>
                                        <div className={`relative group border border-dashed rounded-xl p-3 px-4 transition-all ${errors.detail ? 'border-red-200 bg-red-50/30' : 'border-gray-200 hover:border-purple-300'}`}>
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 border border-purple-100">
                                                    <FaFilePdf size={14} />
                                                </div>
                                                <div className="truncate flex-1">
                                                    <p className="text-xs text-gray-700 truncate">
                                                        {formData.detail instanceof File ? formData.detail.name : (editingAd ? 'Current Document Attached' : 'Attach PDF Document')}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400">PDF, maximum 10MB</p>
                                                </div>
                                            </div>
                                        </div>
                                        {errors.detail && <p className="text-xs text-red-500 px-1">{errors.detail}</p>}
                                    </div>
                                </div>

                                {/* Job Selection Area */}
                                <div className="space-y-4 border-t pt-6">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-sm text-gray-700 flex items-center gap-2">
                                            <FaBriefcase className="text-purple-600" /> Select Job for Advertisement
                                        </h4>
                                        <div className="flex gap-2">
                                            <select
                                                value={formData.department}
                                                onChange={(e) => handleInputChange('department', e.target.value)}
                                                className="text-xs border rounded-lg px-2 py-1 outline-none"
                                            >
                                                <option value="">Filter Dept</option>
                                                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                            </select>
                                            <select
                                                value={formData.role}
                                                onChange={(e) => handleInputChange('role', e.target.value)}
                                                disabled={!formData.department}
                                                className="text-xs border rounded-lg px-2 py-1 outline-none disabled:opacity-50"
                                            >
                                                <option value="">Filter Role</option>
                                                {roles.map(r => <option key={r._id} value={r._id}>{r.title}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {errors.jobs && <p className="text-xs text-red-500">{errors.jobs}</p>}

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-1">
                                        {displayedJobs.map(job => {
                                            const isSelected = formData.job === job._id;
                                            const isPast = new Date(job.applicationDeadline) < new Date().setHours(0, 0, 0, 0);

                                            return (
                                                <div
                                                    key={job._id}
                                                    onClick={() => handleJobSelect(job)}
                                                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${isSelected
                                                        ? 'border-purple-500 bg-purple-50 shadow-md ring-2 ring-purple-500/20'
                                                        : 'border-gray-100 hover:border-purple-200'
                                                        }`}
                                                >
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                                                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-gray-900 truncate tracking-tight">{job.jobCode}</p>
                                                        <div className="flex flex-col mt-0.5">
                                                            <p className="text-[10px] text-gray-600 truncate">
                                                                {typeof job.role === 'object' ? job.role?.title : 'No Role'}
                                                            </p>
                                                            <p className="text-[9px] text-gray-400 truncate">
                                                                {typeof job.department === 'object' ? job.department?.name : 'No Dept'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {displayedJobs.length === 0 && (
                                            <div className="col-span-full py-10 text-center bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                                                <p className="text-xs text-gray-400">No available jobs found for filters</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Status Toggle */}
                                <div className="flex items-center gap-4 py-3">
                                    <label className="text-sm text-gray-700 cursor-pointer" onClick={() => handleInputChange('isActive', !formData.isActive)}>
                                        Active for Registration
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange('isActive', !formData.isActive)}
                                        className={`w-12 h-6 rounded-full transition-all relative ${formData.isActive ? 'bg-purple-600' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${formData.isActive ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>

                                <div className="flex justify-end gap-3 pt-5 border-t">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-6 py-2.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-xl transition-all text-sm"
                                    >
                                        Discard Changes
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm rounded-xl hover:shadow-md disabled:opacity-50 transition-all active:scale-95"
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Processing...
                                            </span>
                                        ) : (
                                            <>
                                                <FaCheck /> {editingAd ? 'Save Updates' : 'Publish Advertisement'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Detail View Container */}
                    {viewingAd && (
                        <div className="bg-white border border-purple-100 rounded-2xl p-6 shadow-sm animate-fade-in flex-1 overflow-hidden">
                            <AdDetailView
                                ad={viewingAd}
                                onBack={() => setViewingAd(null)}
                                loading={viewingAdLoading}
                            />
                        </div>
                    )}

                    {/* Advertisement Title List */}
                    {!isFormOpen && !viewingAd && (
                        <div className="flex-1 overflow-hidden flex flex-col pt-2">
                            <div className="overflow-y-auto border border-gray-100 rounded-2xl bg-white shadow-sm">
                                {loading ? (
                                    <div className="py-20 flex flex-col items-center justify-center">
                                        <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
                                        <p className="text-gray-400 text-sm">Synchronizing advertisements...</p>
                                    </div>
                                ) : advertisements.length === 0 ? (
                                    <div className="py-20 flex flex-col items-center justify-center opacity-40">
                                        <FaBullhorn size={40} className="text-gray-300 mb-4" />
                                        <p className="text-gray-500 text-lg">No Job Posts Found</p>
                                        <p className="text-gray-400 text-sm">Create a new advertisement to start recruiting.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-50">
                                        {advertisements.map((ad) => (
                                            <div
                                                key={ad._id}
                                                className="group flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-all cursor-pointer border-l-4 border-transparent hover:border-purple-400"
                                                onClick={() => handleViewAd(ad)}
                                            >
                                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                                    <div className="w-10 h-10 bg-gray-50 text-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-100 transition-colors group-hover:bg-purple-600 group-hover:text-white">
                                                        <FaBullhorn size={14} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-gray-800 transition-colors truncate text-[13px] leading-tight">
                                                            {ad.title}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-1.5">
                                                            <span className={`px-2 py-0.5 rounded-md text-[9px] border ${ad.isActive ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                                                {ad.isActive ? 'Published' : 'Draft'}
                                                            </span>
                                                            {ad.lastDateToApply && (
                                                                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                                    <FaCalendarCheck size={10} className="text-red-300" />
                                                                    Ends: {format(new Date(ad.lastDateToApply), 'dd MMM yyyy')}
                                                                </span>
                                                            )}
                                                            {ad.job?.jobCode && (
                                                                <span className="text-[10px] text-indigo-400/80 bg-indigo-50/50 px-1.5 rounded border border-indigo-100/50">
                                                                    {ad.job.jobCode}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-3">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEdit(ad); }}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="Edit Post"
                                                    >
                                                        <FaEdit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setDeleteModal({ show: true, adId: ad._id }); }}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Delete Post"
                                                    >
                                                        <FaTrash size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div >
            </ModalContainer >

            <ConfirmationModal
                isOpen={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, adId: null })}
                onConfirm={handleDelete}
                title="Delete Advertisement"
                message="Are you sure you want to delete this advertisement? This action cannot be undone."
                confirmText="Yes, Delete Ad"
                type="danger"
            />
        </>
    );
};

export default ManageAdvertisementsModal;
