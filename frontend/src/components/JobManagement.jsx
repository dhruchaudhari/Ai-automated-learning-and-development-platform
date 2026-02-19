import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { departmentAPI, jobDescriptionAPI } from '../utils/api';
import {
    FaBuilding,
    FaBriefcase,
    FaPlus,
    FaEdit,
    FaTrash,
    FaTimes,
    FaSave,
    FaChevronRight,
    FaClipboardList,
    FaTools,
    FaSpinner,
    FaSearch,
    FaArrowLeft
} from 'react-icons/fa';

const JobManagement = () => {
    // ==================== STATE ====================
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [jobDescriptions, setJobDescriptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [jobsLoading, setJobsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Department form
    const [showDeptForm, setShowDeptForm] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [deptForm, setDeptForm] = useState({ name: '', description: '' });

    // Job Description form
    const [showJobForm, setShowJobForm] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [jobForm, setJobForm] = useState({
        jobTitle: '',
        description: '',
        responsibilities: '',
        requiredSkillset: '',
        qualifications: ''
    });

    // ==================== DATA FETCHING ====================
    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        if (selectedDepartment) {
            fetchJobDescriptions(selectedDepartment._id);
        }
    }, [selectedDepartment]);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const res = await departmentAPI.getAll();
            setDepartments(res.data.data);
        } catch (error) {
            console.error('Error fetching departments:', error);
            toast.error('Failed to load departments');
        } finally {
            setLoading(false);
        }
    };

    const fetchJobDescriptions = async (deptId) => {
        try {
            setJobsLoading(true);
            const res = await jobDescriptionAPI.getByDepartment(deptId);
            setJobDescriptions(res.data.data);
        } catch (error) {
            console.error('Error fetching job descriptions:', error);
            toast.error('Failed to load job descriptions');
        } finally {
            setJobsLoading(false);
        }
    };

    // ==================== DEPARTMENT CRUD ====================
    const handleDeptSubmit = async (e) => {
        e.preventDefault();
        if (!deptForm.name.trim()) {
            toast.error('Department name is required');
            return;
        }

        try {
            if (editingDept) {
                await departmentAPI.update(editingDept._id, deptForm);
                toast.success('Department updated');
                if (selectedDepartment?._id === editingDept._id) {
                    setSelectedDepartment({ ...selectedDepartment, ...deptForm });
                }
            } else {
                await departmentAPI.create(deptForm);
                toast.success('Department created');
            }
            setShowDeptForm(false);
            setEditingDept(null);
            setDeptForm({ name: '', description: '' });
            fetchDepartments();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save department');
        }
    };

    const handleEditDept = (dept) => {
        setEditingDept(dept);
        setDeptForm({ name: dept.name, description: dept.description || '' });
        setShowDeptForm(true);
    };

    const handleDeleteDept = async (dept) => {
        if (!window.confirm(`Delete "${dept.name}" and all its job descriptions?`)) return;

        try {
            await departmentAPI.delete(dept._id);
            toast.success('Department deleted');
            if (selectedDepartment?._id === dept._id) {
                setSelectedDepartment(null);
                setJobDescriptions([]);
            }
            fetchDepartments();
        } catch (error) {
            toast.error('Failed to delete department');
        }
    };

    // ==================== JOB DESCRIPTION CRUD ====================
    const handleJobSubmit = async (e) => {
        e.preventDefault();
        if (!jobForm.jobTitle.trim() || !jobForm.description.trim() || !jobForm.responsibilities.trim() || !jobForm.requiredSkillset.trim() || !jobForm.qualifications.trim()) {
            toast.error('All fields are required');
            return;
        }

        try {
            if (editingJob) {
                await jobDescriptionAPI.update(editingJob._id, jobForm);
                toast.success('Job description updated');
            } else {
                await jobDescriptionAPI.create({ ...jobForm, department: selectedDepartment._id });
                toast.success('Job description created');
            }
            setShowJobForm(false);
            setEditingJob(null);
            setJobForm({ jobTitle: '', description: '', responsibilities: '', requiredSkillset: '', qualifications: '' });
            fetchJobDescriptions(selectedDepartment._id);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save job description');
        }
    };

    const handleEditJob = (job) => {
        setEditingJob(job);
        setJobForm({
            jobTitle: job.jobTitle,
            description: job.description,
            responsibilities: job.responsibilities,
            requiredSkillset: job.requiredSkillset,
            qualifications: job.qualifications || ''
        });
        setShowJobForm(true);
    };

    const handleDeleteJob = async (job) => {
        if (!window.confirm(`Delete job "${job.jobTitle}"?`)) return;

        try {
            await jobDescriptionAPI.delete(job._id);
            toast.success('Job description deleted');
            fetchJobDescriptions(selectedDepartment._id);
        } catch (error) {
            toast.error('Failed to delete job description');
        }
    };

    const cancelDeptForm = () => {
        setShowDeptForm(false);
        setEditingDept(null);
        setDeptForm({ name: '', description: '' });
    };

    const cancelJobForm = () => {
        setShowJobForm(false);
        setEditingJob(null);
        setJobForm({ jobTitle: '', description: '', responsibilities: '', requiredSkillset: '', qualifications: '' });
    };

    // ==================== FILTERED DEPARTMENTS ====================
    const filteredDepartments = departments.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ==================== RENDER ====================
    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <FaBuilding className="text-primary-600" />
                    Department & Job Descriptions
                </h1>
                <p className="text-gray-600 mt-2">Manage departments and their job descriptions</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* ==================== LEFT PANEL — DEPARTMENTS ==================== */}
                <div className="lg:col-span-4">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        {/* Departments Header */}
                        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <FaBuilding />
                                    Departments
                                </h2>
                                <button
                                    onClick={() => { setShowDeptForm(true); setEditingDept(null); setDeptForm({ name: '', description: '' }); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition-colors"
                                >
                                    <FaPlus className="text-xs" />
                                    Add
                                </button>
                            </div>
                            {/* Search */}
                            <div className="mt-3 relative">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm" />
                                <input
                                    type="text"
                                    placeholder="Search departments..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                                />
                            </div>
                        </div>

                        {/* Add/Edit Department Form */}
                        {showDeptForm && (
                            <div className="p-4 border-b border-gray-100 bg-primary-50">
                                <form onSubmit={handleDeptSubmit} className="space-y-3">
                                    <h3 className="text-sm font-semibold text-primary-700">
                                        {editingDept ? 'Edit Department' : 'New Department'}
                                    </h3>
                                    <input
                                        type="text"
                                        value={deptForm.name}
                                        onChange={(e) => setDeptForm(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Department name *"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        autoFocus
                                    />
                                    <input
                                        type="text"
                                        value={deptForm.description}
                                        onChange={(e) => setDeptForm(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Description (optional)"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                    <div className="flex gap-2">
                                        <button type="submit" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors">
                                            <FaSave className="text-xs" />
                                            {editingDept ? 'Update' : 'Create'}
                                        </button>
                                        <button type="button" onClick={cancelDeptForm} className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors">
                                            <FaTimes />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Department List */}
                        <div className="max-h-[60vh] overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center p-8">
                                    <FaSpinner className="animate-spin text-primary-600 text-xl" />
                                </div>
                            ) : filteredDepartments.length === 0 ? (
                                <div className="p-8 text-center">
                                    <FaBuilding className="mx-auto text-3xl text-gray-300 mb-3" />
                                    <p className="text-gray-500 text-sm">
                                        {searchTerm ? 'No departments match your search' : 'No departments yet'}
                                    </p>
                                </div>
                            ) : (
                                filteredDepartments.map((dept) => (
                                    <div
                                        key={dept._id}
                                        className={`group flex items-center justify-between p-4 border-b border-gray-50 cursor-pointer transition-all hover:bg-gray-50 ${selectedDepartment?._id === dept._id ? 'bg-primary-50 border-l-4 border-l-primary-600' : ''
                                            }`}
                                        onClick={() => { setSelectedDepartment(dept); setShowJobForm(false); setEditingJob(null); }}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`text-sm font-semibold truncate ${selectedDepartment?._id === dept._id ? 'text-primary-700' : 'text-gray-800'}`}>
                                                {dept.name}
                                            </h3>
                                            {dept.description && (
                                                <p className="text-xs text-gray-500 truncate mt-0.5">{dept.description}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditDept(dept); }}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                title="Edit department"
                                            >
                                                <FaEdit className="text-xs" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteDept(dept); }}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                title="Delete department"
                                            >
                                                <FaTrash className="text-xs" />
                                            </button>
                                            <FaChevronRight className={`text-xs ${selectedDepartment?._id === dept._id ? 'text-primary-600' : 'text-gray-300'}`} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Department Count */}
                        <div className="p-3 bg-gray-50 border-t border-gray-100">
                            <p className="text-xs text-gray-500 text-center">
                                {filteredDepartments.length} department{filteredDepartments.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ==================== RIGHT PANEL — JOB DESCRIPTIONS ==================== */}
                <div className="lg:col-span-8">
                    {!selectedDepartment ? (
                        /* Empty state */
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center min-h-[50vh]">
                            <div className="text-center p-8">
                                <FaArrowLeft className="mx-auto text-4xl text-gray-200 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-400">Select a Department</h3>
                                <p className="text-sm text-gray-400 mt-1">Choose a department from the left to view its job descriptions</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                            {/* Job Descriptions Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                            <FaBriefcase />
                                            Job Descriptions
                                        </h2>
                                        <p className="text-blue-200 text-sm mt-0.5">
                                            Department: <span className="font-semibold text-white">{selectedDepartment.name}</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => { setShowJobForm(true); setEditingJob(null); setJobForm({ jobTitle: '', description: '', responsibilities: '', requiredSkillset: '', qualifications: '' }); }}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition-colors font-medium"
                                    >
                                        <FaPlus className="text-xs" />
                                        Add Job Description
                                    </button>
                                </div>
                            </div>

                            {/* Add/Edit Job Form */}
                            {showJobForm && (
                                <div className="p-6 border-b border-gray-100 bg-blue-50">
                                    <form onSubmit={handleJobSubmit} className="space-y-4">
                                        <h3 className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                                            <FaClipboardList />
                                            {editingJob ? 'Edit Job Description' : 'New Job Description'}
                                        </h3>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Job Title / Role *</label>
                                            <input
                                                type="text"
                                                value={jobForm.jobTitle}
                                                onChange={(e) => setJobForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                                                placeholder="e.g. Senior Software Engineer"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                autoFocus
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
                                            <textarea
                                                value={jobForm.description}
                                                onChange={(e) => setJobForm(prev => ({ ...prev, description: e.target.value }))}
                                                placeholder="Detailed job description..."
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Responsibilities *</label>
                                            <textarea
                                                value={jobForm.responsibilities}
                                                onChange={(e) => setJobForm(prev => ({ ...prev, responsibilities: e.target.value }))}
                                                placeholder="Key responsibilities and duties..."
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                                                <FaTools className="text-gray-400" />
                                                Required Skillset *
                                            </label>
                                            <textarea
                                                value={jobForm.requiredSkillset}
                                                onChange={(e) => setJobForm(prev => ({ ...prev, requiredSkillset: e.target.value }))}
                                                placeholder="Required skills, technologies, and qualifications..."
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                                                <FaClipboardList className="text-gray-400" />
                                                Qualifications *
                                            </label>
                                            <textarea
                                                value={jobForm.qualifications}
                                                onChange={(e) => setJobForm(prev => ({ ...prev, qualifications: e.target.value }))}
                                                placeholder="Required education, certifications, and experience..."
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                                            />
                                        </div>

                                        <div className="flex gap-2 pt-1">
                                            <button type="submit" className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium">
                                                <FaSave className="text-xs" />
                                                {editingJob ? 'Update Job Description' : 'Create Job Description'}
                                            </button>
                                            <button type="button" onClick={cancelJobForm} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors">
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Job Description List */}
                            <div className="divide-y divide-gray-100">
                                {jobsLoading ? (
                                    <div className="flex items-center justify-center p-12">
                                        <FaSpinner className="animate-spin text-blue-600 text-xl" />
                                    </div>
                                ) : jobDescriptions.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <FaBriefcase className="mx-auto text-4xl text-gray-200 mb-4" />
                                        <h3 className="text-gray-500 font-medium">No job descriptions yet</h3>
                                        <p className="text-sm text-gray-400 mt-1">Add job descriptions for "{selectedDepartment.name}"</p>
                                    </div>
                                ) : (
                                    jobDescriptions.map((job) => (
                                        <div key={job._id} className="p-5 hover:bg-gray-50 transition-colors group">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                                                        <FaBriefcase className="text-blue-500 text-sm" />
                                                        {job.jobTitle}
                                                    </h3>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        Added {new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEditJob(job)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <FaEdit className="text-sm" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteJob(job)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <FaTrash className="text-sm" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-3 text-sm">
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</h4>
                                                    <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Responsibilities</h4>
                                                    <p className="text-gray-700 whitespace-pre-line">{job.responsibilities}</p>
                                                </div>
                                                <div className="bg-blue-50 rounded-lg p-3">
                                                    <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                        <FaTools className="text-blue-400" />
                                                        Required Skillset
                                                    </h4>
                                                    <p className="text-gray-700 whitespace-pre-line">{job.requiredSkillset}</p>
                                                </div>
                                                <div className="bg-indigo-50 rounded-lg p-3">
                                                    <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                        <FaClipboardList className="text-indigo-400" />
                                                        Qualifications
                                                    </h4>
                                                    <p className="text-gray-700 whitespace-pre-line">{job.qualifications}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Job Count */}
                            {jobDescriptions.length > 0 && (
                                <div className="p-3 bg-gray-50 border-t border-gray-100">
                                    <p className="text-xs text-gray-500 text-center">
                                        {jobDescriptions.length} job description{jobDescriptions.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JobManagement;
