import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import {
    FaBuilding,
    FaUserTie,
    FaBriefcase,
    FaSearch,
    FaPlus,
    FaEye,
    FaEdit,
    FaTrash,
    FaFilter,
    FaTimes,
    FaSpinner,
    FaChevronLeft,
    FaChevronRight,
    FaRedo,
    FaPowerOff,
    FaCheck,
    FaCheckCircle,
    FaInfoCircle,
    FaClock,
    FaMapMarkerAlt,
    FaGlobe,
    FaRupeeSign,
    FaUsers,
    FaCalendarAlt,
    FaLayerGroup,
    FaBriefcase as FaEmploymentType,
    FaGraduationCap,
    FaCog,
    FaShieldAlt,
    FaBrain,
    FaToolbox,
    FaIdBadge,
    FaChevronDown
} from 'react-icons/fa';
import { departmentAPI, roleAPI, jobAPI, degreeOptionAPI } from '../utils/api';
import ConfirmationModal from './ConfirmationModal';
import ModalContainer from './ModalContainer';
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

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, rowsPerPage }) => {
    const getVisiblePages = () => {
        const pages = [];
        const maxVisiblePages = 5;

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
                Showing <span className="font-semibold">{(currentPage - 1) * rowsPerPage + 1}</span> to{' '}
                <span className="font-semibold">{Math.min(currentPage * rowsPerPage, totalItems)}</span> of{' '}
                <span className="font-semibold">{totalItems}</span> items
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
                    Next <FaChevronRight />
                </button>
            </div>

            <div className="text-sm text-gray-600">
                Page <span className="font-semibold text-primary-600">{currentPage}</span> of{' '}
                <span className="font-semibold">{totalPages || 1}</span>
            </div>
        </div>
    );
};

// Main Component
const JobsDeptsRolesSuperintendence = () => {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();

    // State for active tab
    const [activeTab, setActiveTab] = useState('departments'); // 'departments', 'roles', 'jobs'

    // Data states
    const [departments, setDepartments] = useState([]);
    const [roles, setRoles] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [degreeOptions, setDegreeOptions] = useState([]);
    const [filteredData, setFilteredData] = useState([]);

    // UI states
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [showFilters, setShowFilters] = useState(false);
    const [logoutModal, setLogoutModal] = useState(false);

    // Modal states
    const [createModal, setCreateModal] = useState({ show: false, type: null });
    const [viewModal, setViewModal] = useState({ show: false, type: null, data: null });
    const [editModal, setEditModal] = useState({ show: false, type: null, data: null });
    const [deleteModal, setDeleteModal] = useState({ show: false, type: null, id: null, name: '' });

    // Form states for create/edit
    const [formData, setFormData] = useState({});
    const [formErrors, setFormErrors] = useState({});
    const [formTouched, setFormTouched] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [degreeSearch, setDegreeSearch] = useState('');
    const [specSearch, setSpecSearch] = useState('');
    const [showDegreeDropdown, setShowDegreeDropdown] = useState(false);
    const [showSpecDropdown, setShowSpecDropdown] = useState(false);

    // Filters state
    const [sortBy, setSortBy] = useState('latest');
    const [filters, setFilters] = useState({
        department: '',
        level: '',
        employmentType: '',
        education: '',
        hasParent: '',
        location: '',
        isRemote: '',
        minSalary: '',
        maxSalary: '',
        createdDate: ''
    });
    const [isFilterOpen, setIsFilterOpen] = useState(true);

    // Fetch data based on active tab
    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'departments') {
                const res = await departmentAPI.getAll();
                setDepartments(res.data.data || []);
                setFilteredData(res.data.data || []);
            } else if (activeTab === 'roles') {
                const res = await roleAPI.getAll();
                setRoles(res.data.data || []);
                setFilteredData(res.data.data || []);
            } else if (activeTab === 'jobs') {
                const [jobRes, deptRes, roleRes] = await Promise.all([
                    jobAPI.getAll(),
                    departmentAPI.getAll(),
                    roleAPI.getAll()
                ]);
                setJobs(jobRes.data.data || []);
                setDepartments(deptRes.data.data || []);
                setRoles(roleRes.data.data || []);
                setFilteredData(jobRes.data.data || []);
            }
        } catch (error) {
            console.error(`Error fetching ${activeTab}:`, error);
            toast.error(`Failed to load ${activeTab}`);
        } finally {
            setLoading(false);
        }
    };

    // Fetch degree options once
    useEffect(() => {
        fetchDegreeOptions();
    }, []);

    const fetchDegreeOptions = async () => {
        try {
            const res = await degreeOptionAPI.getAll();
            setDegreeOptions(res.data.data || []);
        } catch (error) {
            console.error("Error fetching degree options:", error);
        }
    };

    // Apply filters, search, and sort
    useEffect(() => {
        let data = [];
        if (activeTab === 'departments') data = [...departments];
        else if (activeTab === 'roles') data = [...roles];
        else if (activeTab === 'jobs') data = [...jobs];

        // Apply search
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            data = data.filter(item => {
                if (activeTab === 'departments') {
                    return item.name?.toLowerCase().includes(term) ||
                        item.code?.toLowerCase().includes(term) ||
                        item.description?.toLowerCase().includes(term);
                } else if (activeTab === 'roles') {
                    return item.title?.toLowerCase().includes(term) ||
                        item.level?.toLowerCase().includes(term) ||
                        item.employmentType?.toLowerCase().includes(term);
                } else if (activeTab === 'jobs') {
                    return item.jobCode?.toLowerCase().includes(term) ||
                        item.location?.city?.toLowerCase().includes(term) ||
                        item.location?.country?.toLowerCase().includes(term);
                }
                return false;
            });
        }

        // Created date filter (shared)
        if (filters.createdDate) {
            const now = new Date();
            let cutoff = null;
            if (filters.createdDate === 'today') cutoff = new Date(now.setHours(0, 0, 0, 0));
            else if (filters.createdDate === 'last7days') cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            else if (filters.createdDate === 'thisMonth') cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
            else if (filters.createdDate === 'thisYear') cutoff = new Date(now.getFullYear(), 0, 1);
            if (cutoff) {
                data = data.filter(item => new Date(item.createdAt) >= cutoff);
            }
        }

        // Department-specific filters
        if (activeTab === 'departments') {
            if (filters.hasParent === 'top') {
                data = data.filter(item => !item.parentDepartment);
            } else if (filters.hasParent === 'sub') {
                data = data.filter(item => !!item.parentDepartment);
            }
        }

        // Role-specific filters
        if (activeTab === 'roles') {
            if (filters.department) {
                data = data.filter(item => item.department?._id === filters.department || item.department === filters.department);
            }
            if (filters.level) {
                data = data.filter(item => item.level === filters.level);
            }
            if (filters.employmentType) {
                data = data.filter(item => item.employmentType === filters.employmentType);
            }
            if (filters.education) {
                data = data.filter(item => item.education === filters.education);
            }
        }

        // Job-specific filters
        if (activeTab === 'jobs') {
            if (filters.department) {
                data = data.filter(item => item.department?._id === filters.department || item.department === filters.department);
            }
            if (filters.location) {
                data = data.filter(item =>
                    item.location?.city?.toLowerCase().includes(filters.location.toLowerCase()) ||
                    item.location?.state?.toLowerCase().includes(filters.location.toLowerCase())
                );
            }
            if (filters.isRemote !== '') {
                data = data.filter(item => item.location?.isRemote === (filters.isRemote === 'true'));
            }
            if (filters.minSalary) {
                data = data.filter(item => (item.salaryRange?.max || 0) >= parseInt(filters.minSalary));
            }
            if (filters.maxSalary) {
                data = data.filter(item => (item.salaryRange?.min || 0) <= parseInt(filters.maxSalary));
            }
        }

        // Apply sorting (shared)
        const getName = (item) => {
            if (activeTab === 'departments') return item.name || '';
            if (activeTab === 'roles') return item.title || '';
            if (activeTab === 'jobs') return item.jobCode || '';
            return '';
        };
        if (sortBy === 'latest') {
            data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortBy === 'oldest') {
            data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sortBy === 'name-asc') {
            data.sort((a, b) => getName(a).localeCompare(getName(b)));
        } else if (sortBy === 'name-desc') {
            data.sort((a, b) => getName(b).localeCompare(getName(a)));
        }

        setFilteredData(data);
        setPage(1);
    }, [searchTerm, filters, sortBy, departments, roles, jobs, activeTab]);

    // Statistics
    const stats = useMemo(() => {
        const total = filteredData.length;
        if (activeTab === 'departments') {
            const withParent = departments.filter(d => d.parentDepartment).length;
            return { total, withParent, withoutParent: departments.length - withParent };
        } else if (activeTab === 'roles') {
            const byLevel = {
                Intern: roles.filter(r => r.level === 'Intern').length,
                Junior: roles.filter(r => r.level === 'Junior').length,
                Mid: roles.filter(r => r.level === 'Mid').length,
                Senior: roles.filter(r => r.level === 'Senior').length,
                Lead: roles.filter(r => r.level === 'Lead').length,
                Manager: roles.filter(r => r.level === 'Manager').length
            };
            return { total, byLevel };
        } else if (activeTab === 'jobs') {
            const active = jobs.filter(j => new Date(j.applicationDeadline) > new Date()).length;
            return { total, active, expired: jobs.length - active };
        }
        return { total };
    }, [departments, roles, jobs, filteredData, activeTab]);

    // Pagination
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = filteredData.slice(
        (page - 1) * rowsPerPage,
        page * rowsPerPage
    );

    // Form validation functions
    const validateField = (name, value) => {
        if (activeTab === 'departments') {
            if (name === 'name') {
                if (!value?.trim()) return 'Department name is required';
                if (value.length < 2) return 'Name must be at least 2 characters';
                if (value.length > 100) return 'Name too long (max 100 chars)';
            }
            if (name === 'code') {
                if (!value?.trim()) return 'Department code is required';
                if (!/^[A-Z0-9]+$/.test(value)) return 'Code must be uppercase letters and numbers only';
                if (value.length < 2 || value.length > 10) return 'Code must be 2-10 characters';
            }
        } else if (activeTab === 'roles') {
            if (name === 'title') {
                if (!value?.trim()) return 'Role title is required';
                if (value.length < 3) return 'Title must be at least 3 characters';
            }
            if (name === 'department') {
                if (!value) return 'Department is required';
            }
            if (name === 'level') {
                if (!value) return 'Level is required';
            }
            if (name === 'employmentType') {
                if (!value) return 'Employment type is required';
            }
            if (name === 'education') {
                if (!value) return 'Education is required';
            }
            if (name === 'criteriaSet') {
                if (!value) return 'Criteria set is required';
                const hasCriteria = Object.values(value).some(v => {
                    if (Array.isArray(v)) return v.length > 0;
                    return v !== undefined && v !== '' && v !== null;
                });
                if (!hasCriteria) return 'At least one criteria must be set';

                // Specific range validations
                if (value.min10thPercentage && (value.min10thPercentage < 0 || value.min10thPercentage > 100)) return '10th % must be between 0-100';
                if (value.min12thPercentage && (value.min12thPercentage < 0 || value.min12thPercentage > 100)) return '12th % must be between 0-100';
                if (value.minGraduationPercentage && (value.minGraduationPercentage < 0 || value.minGraduationPercentage > 100)) return 'Graduation % must be between 0-100';
                if (value.minPGPercentage && (value.minPGPercentage < 0 || value.minPGPercentage > 100)) return 'PG % must be between 0-100';
                if (value.minAge && (value.minAge < 14 || value.minAge > 100)) return 'Invalid minimum age';
                if (value.maxAge && (value.maxAge < 14 || value.maxAge > 100)) return 'Invalid maximum age';
                if (value.minAge && value.maxAge && parseInt(value.minAge) > parseInt(value.maxAge)) return 'Min age cannot be greater than max age';

                // Minimum Experience validation inside criteriaSet
                if (value.minimumExperience !== undefined && value.minimumExperience !== '') {
                    if (value.minimumExperience < 0) return 'Experience cannot be negative';
                    if (value.minimumExperience > 50) return 'Experience cannot exceed 50 years';
                }
            }
        } else if (activeTab === 'jobs') {
            if (name === 'jobCode') {
                if (!value?.trim()) return 'Job code is required';
                if (!/^[A-Z0-9-]+$/.test(value)) return 'Use uppercase letters, numbers, and hyphens only';
            }
            if (name === 'department') {
                if (!value) return 'Department is required';
            }
            if (name === 'role') {
                if (!value) return 'Role is required';
            }
            if (name === 'description') {
                if (!value?.trim()) return 'Description is required';
                if (value.length < 20) return 'Description must be at least 20 characters';
            }
            if (name === 'applicationDeadline') {
                if (!value) return 'Application deadline is required';
                const selectedDate = new Date(value);
                const minDate = new Date();
                minDate.setHours(0, 0, 0, 0);
                minDate.setDate(minDate.getDate() + 5);

                if (selectedDate < minDate) {
                    return 'Deadline must be at least 5 days from today';
                }
            }
            if (name === 'openings') {
                if (!value || value < 1) return 'At least 1 opening required';
                if (value > 999) return 'Openings cannot exceed 999';
            }
        }
        return '';
    };

    const handleBlur = (name) => {
        setFormTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, formData[name]);
        setFormErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let newValue = type === 'checkbox' ? checked : value;

        // Special handling
        if (name === 'code') {
            newValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        }
        if (name === 'jobCode') {
            newValue = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
        }
        if (name === 'minimumExperience' || name === 'openings' || name === 'min' || name === 'max') {
            newValue = value.replace(/\D/g, '');
        }

        // Special handling for Education change to reset CriteriaSet
        if (name === 'education') {
            setFormData(prev => ({
                ...prev,
                [name]: newValue,
                criteriaSet: {
                    ...(prev.criteriaSet || {}),
                    specificDegrees: [],
                    specializations: []
                }
            }));
            setDegreeSearch('');
            setSpecSearch('');
        } else {
            setFormData(prev => ({ ...prev, [name]: newValue }));
        }

        // Clear error on change
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleNestedChange = (parent, field, value) => {
        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...(prev[parent] || {}),
                [field]: value
            }
        }));
    };

    const handleAddResponsibility = () => {
        const current = formData.responsibilities || [];
        setFormData(prev => ({
            ...prev,
            responsibilities: [...current, '']
        }));
    };

    const handleResponsibilityChange = (index, value) => {
        const updated = [...(formData.responsibilities || [])];
        updated[index] = value;
        setFormData(prev => ({ ...prev, responsibilities: updated }));
    };

    const handleRemoveResponsibility = (index) => {
        const updated = (formData.responsibilities || []).filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, responsibilities: updated }));
    };

    const handleAddSkill = () => {
        const current = formData.requiredSkills || [];
        setFormData(prev => ({
            ...prev,
            requiredSkills: [...current, { name: '', minYears: 0, weight: 1.0 }]
        }));
    };

    const handleSkillChange = (index, field, value) => {
        const updated = [...(formData.requiredSkills || [])];
        updated[index] = { ...updated[index], [field]: value };
        setFormData(prev => ({ ...prev, requiredSkills: updated }));
    };

    const handleRemoveSkill = (index) => {
        const updated = (formData.requiredSkills || []).filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, requiredSkills: updated }));
    };

    const handleAddPreferredSkill = () => {
        const current = formData.preferredSkills || [];
        setFormData(prev => ({
            ...prev,
            preferredSkills: [...current, { name: '', weight: 0.5 }]
        }));
    };

    const handlePreferredSkillChange = (index, field, value) => {
        const updated = [...(formData.preferredSkills || [])];
        updated[index] = { ...updated[index], [field]: value };
        setFormData(prev => ({ ...prev, preferredSkills: updated }));
    };

    const handleRemovePreferredSkill = (index) => {
        const updated = (formData.preferredSkills || []).filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, preferredSkills: updated }));
    };

    const handleCriteriaChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            criteriaSet: {
                ...(prev.criteriaSet || {}),
                [field]: value
            }
        }));
    };

    // CRUD Operations
    const handleCreate = async () => {
        // Validate all fields
        const requiredFields = activeTab === 'departments' ? ['name', 'code'] :
            activeTab === 'roles' ? ['title', 'department', 'level', 'employmentType', 'minimumExperience'] :
                ['jobCode', 'department', 'role', 'description', 'applicationDeadline', 'openings'];

        const newErrors = {};
        requiredFields.forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) newErrors[field] = error;
        });

        if (Object.keys(newErrors).length > 0) {
            setFormErrors(newErrors);
            // Mark all as touched
            const touched = {};
            requiredFields.forEach(f => touched[f] = true);
            setFormTouched(touched);
            toast.error('Please fix all validation errors');
            return;
        }

        setSubmitting(true);
        try {
            let response;
            if (activeTab === 'departments') {
                response = await departmentAPI.create(formData);
            } else if (activeTab === 'roles') {
                response = await roleAPI.create(formData);
            } else {
                response = await jobAPI.create(formData);
            }

            if (response.data.success) {
                toast.success(`${activeTab.slice(0, -1)} created successfully`);
                setCreateModal({ show: false, type: null });
                setFormData({});
                setFormErrors({});
                fetchData();
            }
        } catch (error) {
            console.error('Create error:', error);
            const msg = error.response?.data?.message || error.message || 'Creation failed';
            toast.error(msg);

            // Handle duplicate errors
            if (msg.includes('duplicate') || msg.includes('already exists')) {
                if (msg.includes('code') || msg.includes('Code')) {
                    setFormErrors(prev => ({ ...prev, code: msg }));
                } else if (msg.includes('title')) {
                    setFormErrors(prev => ({ ...prev, title: msg }));
                } else if (msg.includes('jobCode')) {
                    setFormErrors(prev => ({ ...prev, jobCode: msg }));
                }
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        if (!editModal.data?._id) return;

        // Validate all fields
        const requiredFields = activeTab === 'departments' ? ['name', 'code'] :
            activeTab === 'roles' ? ['title', 'department', 'level', 'employmentType', 'minimumExperience'] :
                ['jobCode', 'department', 'role', 'description', 'applicationDeadline', 'openings'];

        const newErrors = {};
        requiredFields.forEach(field => {
            const error = validateField(field, formData[field] !== undefined ? formData[field] : editModal.data[field]);
            if (error) newErrors[field] = error;
        });

        if (Object.keys(newErrors).length > 0) {
            setFormErrors(newErrors);
            const touched = {};
            requiredFields.forEach(f => touched[f] = true);
            setFormTouched(touched);
            toast.error('Please fix all validation errors');
            return;
        }

        setSubmitting(true);
        try {
            let response;
            const updateData = { ...editModal.data, ...formData };

            if (activeTab === 'departments') {
                response = await departmentAPI.update(editModal.data._id, updateData);
            } else if (activeTab === 'roles') {
                response = await roleAPI.update(editModal.data._id, updateData);
            } else {
                response = await jobAPI.update(editModal.data._id, updateData);
            }

            if (response.data.success) {
                toast.success(`${activeTab.slice(0, -1)} updated successfully`);
                setEditModal({ show: false, type: null, data: null });
                setFormData({});
                setFormErrors({});
                fetchData();
            }
        } catch (error) {
            console.error('Update error:', error);
            toast.error(error.response?.data?.message || error.message || 'Update failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteModal.id) return;

        try {
            let response;
            if (activeTab === 'departments') {
                response = await departmentAPI.delete(deleteModal.id);
            } else if (activeTab === 'roles') {
                response = await roleAPI.delete(deleteModal.id);
            } else {
                response = await jobAPI.delete(deleteModal.id);
            }

            if (response.data.success) {
                toast.success(response.data.message || `${activeTab.slice(0, -1)} deleted successfully`);
                setDeleteModal({ show: false, type: null, id: null, name: '' });
                fetchData();
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error(error.response?.data?.message || error.message || 'Delete failed');
        }
    };

    const handleLogout = async () => {
        try {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            toast.success("Logged out successfully");
            navigate("/login");
        } catch (err) {
            console.log("Logout failed", err);
        }
    };

    const openCreateModal = () => {
        let defaults = {};
        if (activeTab === 'roles') {
            defaults = {
                education: "Bachelor's",
                requiredSkills: [],
                preferredSkills: [],
                responsibilities: [],
                criteriaSet: {
                    min10thPercentage: '',
                    min12thPercentage: '',
                    minGraduationPercentage: '',
                    minPGPercentage: '',
                    minAge: '',
                    maxAge: '',
                    specificDegrees: [],
                    specializations: []
                }
            };
        } else if (activeTab === 'jobs') {
            const fiveDaysFromNow = new Date();
            fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
            const defaultDeadline = fiveDaysFromNow.toISOString().split('T')[0];

            defaults = {
                salaryRange: { currency: 'INR' },
                location: { isRemote: false },
                openings: 1,
                applicationDeadline: defaultDeadline
            };
        }
        setFormData(defaults);
        setFormErrors({});
        setFormTouched({});
        setCreateModal({ show: true, type: activeTab });
    };

    const openViewModal = (data) => {
        setViewModal({ show: true, type: activeTab, data });
    };

    const openEditModal = (data) => {
        setFormData({
            ...data,
            department: data.department?._id || data.department,
            role: data.role?._id || data.role,
            criteriaSet: {
                min10thPercentage: data.criteriaSet?.min10thPercentage || '',
                min12thPercentage: data.criteriaSet?.min12thPercentage || '',
                minGraduationPercentage: data.criteriaSet?.minGraduationPercentage || '',
                minPGPercentage: data.criteriaSet?.minPGPercentage || '',
                minAge: data.criteriaSet?.minAge || '',
                maxAge: data.criteriaSet?.maxAge || '',
                specificDegrees: data.criteriaSet?.specificDegrees || [],
                specializations: data.criteriaSet?.specializations || []
            },
            applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline).toISOString().split('T')[0] : '',
            openings: data.openings || 1
        });
        setFormErrors({});
        setFormTouched({});
        setEditModal({ show: true, type: activeTab, data });
    };

    const openDeleteModal = (id, name) => {
        setDeleteModal({ show: true, type: activeTab, id, name });
    };

    const clearFilters = () => {
        setFilters({
            department: '',
            level: '',
            employmentType: '',
            education: '',
            hasParent: '',
            location: '',
            isRemote: '',
            minSalary: '',
            maxSalary: '',
            createdDate: ''
        });
        setSortBy('latest');
        setSearchTerm('');
        toast.success('Filters cleared');
    };

    return (
        <div className="min-h-screen py-8 px-4 animate-fade-in">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8 animate-slide-down">
                    <h1 className="text-4xl md:text-5xl font-normal text-gray-800 mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                        Jobs, Departments & Roles superintendence
                    </h1>
                </div>

                {/* Search & Actions Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab}...`}
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
                        <button
                            onClick={fetchData}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-normal"
                            title="Refresh data"
                        >
                            <FaRedo className="text-primary-600" />
                            Refresh
                        </button>

                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:shadow-lg transition-all font-normal"
                        >
                            <FaPlus />
                            Create {activeTab.slice(0, -1)}
                        </button>

                        <button
                            onClick={() => setLogoutModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-normal"
                        >
                            <FaPowerOff />
                            Logout
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex flex-wrap items-center gap-3 mb-8">
                    {[
                        {
                            id: 'departments',
                            label: 'Departments',
                            icon: FaBuilding,
                            count: departments.length,
                            defaultBg: 'bg-blue-500 border-blue-600 text-white',
                            hoverBg: 'hover:bg-blue-400 hover:border-blue-500 hover:shadow-blue-300/40',
                            activeBg: 'bg-blue-800 text-white border-blue-950 shadow-lg scale-105 z-10'
                        },
                        {
                            id: 'roles',
                            label: 'Roles',
                            icon: FaUserTie,
                            count: roles.length,
                            defaultBg: 'bg-indigo-500 border-indigo-600 text-white',
                            hoverBg: 'hover:bg-indigo-400 hover:border-indigo-500 hover:shadow-indigo-300/40',
                            activeBg: 'bg-indigo-800 text-white border-indigo-950 shadow-lg scale-105 z-10'
                        },
                        {
                            id: 'jobs',
                            label: 'Jobs',
                            icon: FaBriefcase,
                            count: jobs.length,
                            defaultBg: 'bg-[#FF1493] border-pink-600 text-white',
                            hoverBg: 'hover:bg-[#FF69B4] hover:border-pink-400 hover:shadow-pink-300/40',
                            activeBg: 'bg-[#8B0A50] text-white border-[#5B0035] shadow-lg scale-105 z-10'
                        }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center justify-center gap-2 w-44 h-11 rounded-xl transition-all duration-300 font-semibold border-2 shadow-sm focus:outline-none focus:ring-0 ${activeTab === tab.id
                                ? tab.activeBg
                                : `${tab.defaultBg} ${tab.hoverBg} hover:shadow-md hover:-translate-y-0.5`
                                }`}
                        >
                            <tab.icon className="text-lg text-white" />
                            <span className="text-sm text-white">{tab.label}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white bg-opacity-20 text-white">
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Statistics */}
                <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 via-white to-slate-50 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex flex-wrap items-center gap-6">
                        {activeTab === 'departments' && (
                            <>
                                <div className="flex items-center gap-2">
                                    <FaBuilding className="text-primary-500" />
                                    <span className="font-medium text-gray-800">Total: {stats.total}</span>
                                </div>
                                <div className="w-px h-6 bg-gray-300" />
                                <div className="flex items-center gap-2">
                                    <FaLayerGroup className="text-green-500" />
                                    <span className="text-sm text-gray-600">With Parent: {stats.withParent}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FaBuilding className="text-blue-500" />
                                    <span className="text-sm text-gray-600">Top Level: {stats.withoutParent}</span>
                                </div>
                            </>
                        )}

                        {activeTab === 'roles' && (
                            <>
                                <div className="flex items-center gap-2">
                                    <FaUserTie className="text-primary-500" />
                                    <span className="font-medium text-gray-800">Total Roles: {stats.total}</span>
                                </div>
                                <div className="w-px h-6 bg-gray-300" />
                                <div className="flex flex-wrap gap-3">
                                    {Object.entries(stats.byLevel).map(([level, count]) => count > 0 && (
                                        <span key={level} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-100">
                                            {level}: {count}
                                        </span>
                                    ))}
                                </div>
                            </>
                        )}

                        {activeTab === 'jobs' && (
                            <>
                                <div className="flex items-center gap-2">
                                    <FaBriefcase className="text-primary-500" />
                                    <span className="font-medium text-gray-800">Total Jobs: {stats.total}</span>
                                </div>
                                <div className="w-px h-6 bg-gray-300" />
                                <div className="flex items-center gap-2 text-green-600">
                                    <FaCheck className="text-green-500" />
                                    <span className="text-sm">Active: {stats.active}</span>
                                </div>
                                <div className="flex items-center gap-2 text-amber-600">
                                    <FaClock className="text-amber-500" />
                                    <span className="text-sm">Expired: {stats.expired}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Filters Panel */}
                <div className="mb-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <FaFilter className="text-primary-600" />
                                {isFilterOpen ? 'Hide Filters' : 'Show Filters'}
                            </button>
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            >
                                <FaTimes /> Clear All
                            </button>
                        </div>
                    </div>

                    {isFilterOpen && (
                        <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column — Shared Filters */}
                                <div className="space-y-6">
                                    {/* Sort Display */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            <FaClock className="inline mr-2 text-primary-600" />
                                            Sort Display
                                        </label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {[
                                                { value: 'latest', label: 'Latest First', icon: <FaChevronDown /> },
                                                { value: 'oldest', label: 'Oldest First', icon: <FaChevronDown className="rotate-180" /> },
                                                { value: 'name-asc', label: 'Name A-Z', icon: <FaLayerGroup /> },
                                                { value: 'name-desc', label: 'Name Z-A', icon: <FaLayerGroup /> }
                                            ].map(option => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setSortBy(option.value)}
                                                    className={`flex flex-col items-center justify-center gap-1 px-2 py-3 text-[10px] rounded-lg transition-all ${sortBy === option.value
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

                                    {/* Created Date Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            <FaCalendarAlt className="inline mr-2 text-primary-600" />
                                            Created Date
                                        </label>
                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                            {[
                                                { value: '', label: 'All Time' },
                                                { value: 'today', label: 'Today' },
                                                { value: 'last7days', label: 'Last 7 Days' },
                                                { value: 'thisMonth', label: 'This Month' },
                                                { value: 'thisYear', label: 'This Year' }
                                            ].map(option => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setFilters(prev => ({ ...prev, createdDate: option.value }))}
                                                    className={`px-3 py-2 text-sm rounded-lg transition-all ${filters.createdDate === option.value
                                                        ? 'bg-purple-100 text-purple-700 border-2 border-purple-300 shadow-sm'
                                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                                        }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Department-specific: Structure Filter */}
                                    {activeTab === 'departments' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                                <FaLayerGroup className="inline mr-2 text-primary-600" />
                                                Department Structure
                                            </label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { value: '', label: 'All' },
                                                    { value: 'top', label: 'Top-Level' },
                                                    { value: 'sub', label: 'Sub-Departments' }
                                                ].map(option => (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => setFilters(prev => ({ ...prev, hasParent: option.value }))}
                                                        className={`px-3 py-2 text-sm rounded-lg transition-all ${filters.hasParent === option.value
                                                            ? 'bg-blue-100 text-blue-700 border-2 border-blue-300 shadow-sm'
                                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                                            }`}
                                                    >
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column — Tab-Specific Filters */}
                                <div className="space-y-6">
                                    {/* Roles Filters */}
                                    {activeTab === 'roles' && (
                                        <>
                                            {/* Department */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                                    <FaBuilding className="inline mr-2 text-primary-600" />
                                                    Department
                                                </label>
                                                <select
                                                    value={filters.department}
                                                    onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                                                >
                                                    <option value="">All Departments</option>
                                                    {departments.map(dept => (
                                                        <option key={dept._id} value={dept._id}>{dept.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Level */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                                    <FaLayerGroup className="inline mr-2 text-primary-600" />
                                                    Level
                                                </label>
                                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                                    {['', 'Intern', 'Junior', 'Mid', 'Senior', 'Lead', 'Manager'].map(level => (
                                                        <button
                                                            key={level}
                                                            onClick={() => setFilters(prev => ({ ...prev, level }))}
                                                            className={`px-3 py-2 text-xs rounded-lg transition-all ${filters.level === level
                                                                ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300 shadow-sm'
                                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                                                }`}
                                                        >
                                                            {level || 'All'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Employment Type */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                                    <FaBriefcase className="inline mr-2 text-primary-600" />
                                                    Employment Type
                                                </label>
                                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                                    {['', 'Full-time', 'Part-time', 'Contract', 'Internship'].map(type => (
                                                        <button
                                                            key={type}
                                                            onClick={() => setFilters(prev => ({ ...prev, employmentType: type }))}
                                                            className={`px-3 py-2 text-xs rounded-lg transition-all ${filters.employmentType === type
                                                                ? 'bg-green-100 text-green-700 border-2 border-green-300 shadow-sm'
                                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                                                }`}
                                                        >
                                                            {type || 'All'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Education */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                                    <FaGraduationCap className="inline mr-2 text-primary-600" />
                                                    Education
                                                </label>
                                                <select
                                                    value={filters.education}
                                                    onChange={(e) => setFilters(prev => ({ ...prev, education: e.target.value }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                                                >
                                                    <option value="">All Education</option>
                                                    <option value="High School">High School</option>
                                                    <option value="Bachelor's">Bachelor's</option>
                                                    <option value="Master's">Master's</option>
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    {/* Jobs Filters */}
                                    {activeTab === 'jobs' && (
                                        <>
                                            {/* Department */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                                    <FaBuilding className="inline mr-2 text-primary-600" />
                                                    Department
                                                </label>
                                                <select
                                                    value={filters.department}
                                                    onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                                                >
                                                    <option value="">All Departments</option>
                                                    {departments.map(dept => (
                                                        <option key={dept._id} value={dept._id}>{dept.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Location */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                                    <FaMapMarkerAlt className="inline mr-2 text-primary-600" />
                                                    Location
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Search city or state..."
                                                    value={filters.location}
                                                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                />
                                            </div>

                                            {/* Salary Range */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                                    <FaRupeeSign className="inline mr-2 text-primary-600" />
                                                    Salary Range
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="number"
                                                        placeholder="Min"
                                                        value={filters.minSalary}
                                                        onChange={(e) => setFilters(prev => ({ ...prev, minSalary: e.target.value }))}
                                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                    />
                                                    <span className="text-gray-400">—</span>
                                                    <input
                                                        type="number"
                                                        placeholder="Max"
                                                        value={filters.maxSalary}
                                                        onChange={(e) => setFilters(prev => ({ ...prev, maxSalary: e.target.value }))}
                                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* When on departments tab, show a note in right column */}
                                    {activeTab === 'departments' && (
                                        <div className="flex items-center justify-center h-full">
                                            <p className="text-sm text-gray-400 italic">
                                                <FaInfoCircle className="inline mr-2" />
                                                Use the search bar and structure filter to narrow down departments.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Rows Per Page Selector */}
                <div className="flex justify-end mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Rows per page:</span>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => setRowsPerPage(Number(e.target.value))}
                            className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>
                </div>

                {/* Data Grid */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-primary-100 to-secondary-100">
                                <tr>
                                    {activeTab === 'departments' && (
                                        <>
                                            <th className="py-4 px-6 text-left font-medium">Code</th>
                                            <th className="py-4 px-6 text-left font-medium">Name</th>
                                            <th className="py-4 px-6 text-left font-medium">Description</th>
                                            <th className="py-4 px-6 text-left font-medium">Parent Department</th>
                                            <th className="py-4 px-6 text-left font-medium">Created</th>
                                            <th className="py-4 px-6 text-center font-medium">Actions</th>
                                        </>
                                    )}

                                    {activeTab === 'roles' && (
                                        <>
                                            <th className="py-4 px-6 text-left font-medium">Details</th>
                                            <th className="py-4 px-6 text-left font-medium">Skills</th>
                                            <th className="py-4 px-6 text-left font-medium">CriteriaSet</th>
                                            <th className="py-4 px-6 text-center font-medium">Actions</th>
                                        </>
                                    )}

                                    {activeTab === 'jobs' && (
                                        <>
                                            <th className="py-4 px-6 text-left font-medium">Details</th>
                                            <th className="py-4 px-6 text-left font-medium">Deadline</th>
                                            <th className="py-4 px-6 text-left font-medium">Openings</th>
                                            <th className="py-4 px-6 text-left font-medium">Salary</th>
                                            <th className="py-4 px-6 text-center font-medium">Actions</th>
                                        </>
                                    )}
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={activeTab === 'departments' ? 6 : (activeTab === 'roles' ? 4 : 5)} className="py-12 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <FaSpinner className="animate-spin text-primary-500 text-2xl" />
                                                <span className="text-gray-500">Loading {activeTab}...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={activeTab === 'departments' ? 6 : (activeTab === 'roles' ? 4 : 5)} className="py-12 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <FaBuilding className="text-gray-300 text-4xl" />
                                                <p className="text-lg text-gray-500">No {activeTab} found</p>
                                                <p className="text-sm text-gray-400">
                                                    {searchTerm || Object.values(filters).some(f => f)
                                                        ? "Try adjusting your search or filters"
                                                        : `No ${activeTab} created yet`}
                                                </p>
                                                {(searchTerm || Object.values(filters).some(f => f)) && (
                                                    <button
                                                        onClick={clearFilters}
                                                        className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                                    >
                                                        Clear Filters
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedData.map(item => {
                                        const created = formatDateTime(item.createdAt);

                                        if (activeTab === 'departments') {
                                            return (
                                                <tr key={item._id} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-md text-xs font-mono font-bold">
                                                            {item.code}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 font-medium">{item.name}</td>
                                                    <td className="py-4 px-6 max-w-xs truncate">{item.description || '-'}</td>
                                                    <td className="py-4 px-6">
                                                        {item.parentDepartment && item.parentDepartment.name ? (
                                                            <span className="text-sm text-gray-700">
                                                                {item.parentDepartment.name}
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-1 bg-red-50 text-red-500 rounded-md text-xs font-medium border border-red-200">No Parent</span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="text-sm">
                                                            <div>{created.date}</div>
                                                            <div className="text-xs text-gray-500">{created.time}</div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => openViewModal(item)}
                                                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                                title="View"
                                                            >
                                                                <FaEye size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => openEditModal(item)}
                                                                className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                                                                title="Edit"
                                                            >
                                                                <FaEdit size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => openDeleteModal(item._id, item.name)}
                                                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                                title="Delete"
                                                            >
                                                                <FaTrash size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        if (activeTab === 'roles') {
                                            return (
                                                <tr key={item._id} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="font-bold text-gray-900 text-base">{item.title}</div>
                                                            <div className="flex flex-wrap gap-1.5 items-center">
                                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold border border-blue-100 flex items-center gap-1">
                                                                    <FaBuilding size={10} /> {item.department?.name || 'N/A'}
                                                                </span>
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${item.level === 'Intern' ? 'bg-gray-50 text-gray-600 border-gray-200' :
                                                                    item.level === 'Junior' ? 'bg-green-50 text-green-600 border-green-200' :
                                                                        item.level === 'Mid' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                                            item.level === 'Senior' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                                                                                item.level === 'Lead' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                                                                    'bg-red-50 text-red-600 border-red-200'
                                                                    }`}>
                                                                    <FaLayerGroup size={10} /> {item.level}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 mt-1">
                                                                <span className="flex items-center gap-1 font-medium bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                                                    <FaGraduationCap size={10} className="text-primary-500" /> {item.education || "Bachelor's"}
                                                                </span>
                                                                <span className="flex items-center gap-1 font-medium bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                                                    <FaIdBadge size={10} className="text-secondary-500" /> {item.employmentType}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 max-w-[200px]">
                                                        <div className="flex flex-col gap-2">
                                                            <div>
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                                                                    <FaCog size={10} className="text-primary-400" /> Required
                                                                </p>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {item.requiredSkills?.map((skill, idx) => (
                                                                        <span key={idx} className="px-1.5 py-0.5 bg-primary-50 text-primary-700 rounded text-[10px] border border-primary-100 font-medium">
                                                                            {skill.name} <span className="opacity-60 text-[8px] font-bold">({skill.weight || 1.0})</span>
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            {(item.preferredSkills?.length || 0) > 0 && (
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                                                                        <FaBrain size={10} className="text-purple-400" /> Preferred
                                                                    </p>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {item.preferredSkills?.map((skill, idx) => (
                                                                            <span key={idx} className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] border border-purple-100 font-medium">
                                                                                {typeof skill === 'object' ? skill.name : skill} <span className="opacity-60 text-[8px] font-bold">({typeof skill === 'object' ? (skill.weight || 0.5) : 0.5})</span>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
                                                            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]">
                                                                {item.criteriaSet?.min10thPercentage && (
                                                                    <div className="flex items-center justify-between gap-1 text-amber-900">
                                                                        <span className="font-bold">10th:</span>
                                                                        <span className="bg-amber-200 px-1 rounded">{item.criteriaSet.min10thPercentage}%</span>
                                                                    </div>
                                                                )}
                                                                {item.criteriaSet?.min12thPercentage && (
                                                                    <div className="flex items-center justify-between gap-1 text-amber-900">
                                                                        <span className="font-bold">12th:</span>
                                                                        <span className="bg-amber-200 px-1 rounded">{item.criteriaSet.min12thPercentage}%</span>
                                                                    </div>
                                                                )}
                                                                {item.criteriaSet?.minGraduationPercentage && (
                                                                    <div className="flex items-center justify-between gap-1 text-amber-900">
                                                                        <span className="font-bold">Grad:</span>
                                                                        <span className="bg-amber-200 px-1 rounded">{item.criteriaSet.minGraduationPercentage}%</span>
                                                                    </div>
                                                                )}
                                                                {item.criteriaSet?.minPGPercentage && (
                                                                    <div className="flex items-center justify-between gap-1 text-amber-900">
                                                                        <span className="font-bold">PG:</span>
                                                                        <span className="bg-amber-200 px-1 rounded">{item.criteriaSet.minPGPercentage}%</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center justify-between gap-1 text-amber-900 border-t border-amber-100/50 pt-1 mt-1 col-span-2">
                                                                    <span className="font-bold flex items-center gap-1"><FaClock size={10} /> Experience:</span>
                                                                    <span className="bg-amber-200 px-1.5 rounded font-bold">{item.criteriaSet?.minimumExperience ?? 0} yrs</span>
                                                                </div>
                                                                {(item.criteriaSet?.minAge || item.criteriaSet?.maxAge) && (
                                                                    <div className="col-span-2 flex items-center gap-2 text-amber-900 border-t border-amber-100/50 pt-1 mt-1">
                                                                        <span className="font-bold whitespace-nowrap">Age Range:</span>
                                                                        <span className="bg-amber-200 px-1.5 py-0.5 rounded font-bold">{item.criteriaSet.minAge || 'Any'} - {item.criteriaSet.maxAge || 'Any'}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {item.criteriaSet?.specificDegrees?.length > 0 && (
                                                                <div className="mt-2 text-[9px] text-amber-800 border-t border-amber-100 pt-1">
                                                                    <span className="font-bold mr-1 flex items-center gap-1 uppercase tracking-wider"><FaShieldAlt size={8} /> Degrees:</span>
                                                                    <span className="font-medium line-clamp-1">{item.criteriaSet.specificDegrees.map(d => typeof d === 'object' ? d.name : (degreeOptions.find(opt => opt._id === d)?.name || 'Deg')).join(', ')}</span>
                                                                </div>
                                                            )}
                                                            {item.criteriaSet?.specializations?.length > 0 && (
                                                                <div className="mt-1 text-[9px] text-amber-800 border-t border-amber-100 pt-1">
                                                                    <span className="font-bold mr-1 flex items-center gap-1 uppercase tracking-wider"><FaGlobe size={8} /> Specializations:</span>
                                                                    <span className="font-medium line-clamp-1">{item.criteriaSet.specializations.join(', ')}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => openViewModal(item)}
                                                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                                title="View"
                                                            >
                                                                <FaEye size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => openEditModal(item)}
                                                                className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                                                                title="Edit"
                                                            >
                                                                <FaEdit size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => openDeleteModal(item._id, item.title)}
                                                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                                title="Delete"
                                                            >
                                                                <FaTrash size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        if (activeTab === 'jobs') {
                                            const isExpired = new Date(item.applicationDeadline) < new Date();
                                            return (
                                                <tr key={item._id} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-mono font-bold">
                                                                    {item.jobCode}
                                                                </span>
                                                                <span className="text-sm font-bold text-gray-900">
                                                                    {item.role?.title || 'N/A'} ({item.role?.level || 'N/A'})
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                                                                <span className="text-xs text-gray-600 flex items-center gap-1">
                                                                    <FaBuilding size={12} className="text-primary-500" /> {item.department?.name || 'N/A'}
                                                                </span>
                                                                <span className="text-xs text-gray-600 flex items-center gap-1">
                                                                    <FaMapMarkerAlt size={12} className="text-secondary-500" />
                                                                    {item.location?.city ? `${item.location.city}, ${item.location.state || ''}, ${item.location.country || 'IN'}` : 'N/A'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-2">
                                                            <FaCalendarAlt size={14} className={isExpired ? 'text-red-400' : 'text-green-400'} />
                                                            <span className={`text-sm font-medium ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
                                                                {formatDateTime(item.applicationDeadline).date}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-2">
                                                            <FaUsers size={14} className="text-primary-500" />
                                                            <span className="text-sm font-bold text-gray-700">{item.openings}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        {item.salaryRange?.min || item.salaryRange?.max ? (
                                                            <div className="flex items-center gap-1">
                                                                <FaRupeeSign className="text-primary-600 text-xs" />
                                                                <span className="text-sm font-medium text-gray-700">
                                                                    {item.salaryRange.min} - {item.salaryRange.max}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 text-sm italic">Not specified</span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => openViewModal(item)}
                                                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                                title="View Details"
                                                            >
                                                                <FaEye size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => openEditModal(item)}
                                                                className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                                                                title="Edit Job"
                                                            >
                                                                <FaEdit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => openDeleteModal(item._id, item.jobCode)}
                                                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                                title="Delete Job"
                                                            >
                                                                <FaTrash size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        return null;
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        totalItems={filteredData.length}
                        rowsPerPage={rowsPerPage}
                    />
                </div>
            </div>

            {/* Create Modal */}
            <ModalContainer
                isOpen={createModal.show}
                onClose={() => setCreateModal({ show: false, type: null })}
                title={`Create ${createModal.type?.slice(0, -1) || ''}`}
                size="large"
                footer={
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={handleCreate}
                            disabled={submitting}
                            className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {submitting ? <FaSpinner className="animate-spin inline mr-2" /> : <FaPlus className="inline mr-2" />}
                            Create
                        </button>
                        <button
                            onClick={() => setCreateModal({ show: false, type: null })}
                            className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                }
            >
                <div className="p-6">
                    {activeTab === 'departments' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Department Name */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <FaBuilding className="text-primary-600" />
                                        Department Name *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name || ''}
                                            onChange={handleChange}
                                            onBlur={() => handleBlur('name')}
                                            className={`w-full pl-10 pr-10 py-3 border rounded-xl transition-all ${formTouched.name && formErrors.name ? 'border-red-500 bg-red-50' :
                                                formTouched.name && !formErrors.name ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-primary-300'
                                                }`}
                                            placeholder="e.g., Engineering"
                                        />
                                        <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        {formTouched.name && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                {formErrors.name ? <FaTimes className="text-red-500" /> : <FaCheck className="text-green-500" />}
                                            </div>
                                        )}
                                    </div>
                                    {formErrors.name && (
                                        <p className="text-xs text-red-600 flex items-center gap-1">
                                            <FaInfoCircle /> {formErrors.name}
                                        </p>
                                    )}
                                </div>

                                {/* Department Code */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <FaIdBadge className="text-primary-600" />
                                        Department Code *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="code"
                                            value={formData.code || ''}
                                            onChange={handleChange}
                                            onBlur={() => handleBlur('code')}
                                            className={`w-full pl-10 pr-10 py-3 border rounded-xl transition-all ${formTouched.code && formErrors.code ? 'border-red-500 bg-red-50' :
                                                formTouched.code && !formErrors.code ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-primary-300'
                                                }`}
                                            placeholder="e.g., ENG"
                                            maxLength="10"
                                        />
                                        <FaIdBadge className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        {formTouched.code && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                {formErrors.code ? <FaTimes className="text-red-500" /> : <FaCheck className="text-green-500" />}
                                            </div>
                                        )}
                                    </div>
                                    {formErrors.code && (
                                        <p className="text-xs text-red-600 flex items-center gap-1">
                                            <FaInfoCircle /> {formErrors.code}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Parent Department */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <FaLayerGroup className="text-primary-600" />
                                    Parent Department
                                </label>
                                <div className="relative">
                                    <select
                                        name="parentDepartment"
                                        value={formData.parentDepartment || ''}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl appearance-none hover:border-primary-300 transition-all focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">None (Top Level)</option>
                                        {departments.map(dept => (
                                            <option key={dept._id} value={dept._id}>{dept.name}</option>
                                        ))}
                                    </select>
                                    <FaLayerGroup className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <FaChevronDown className="text-gray-400 text-sm" />
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <FaInfoCircle className="text-primary-600" />
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description || ''}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl hover:border-primary-300 transition-all focus:ring-2 focus:ring-primary-500"
                                    placeholder="Briefly describe the department's purpose..."
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'roles' && (
                        <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2 scrollbar-thin">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Role Title */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <FaUserTie className="text-primary-600" />
                                        Role Title *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title || ''}
                                            onChange={handleChange}
                                            onBlur={() => handleBlur('title')}
                                            className={`w-full pl-10 pr-10 py-3 border rounded-xl transition-all ${formTouched.title && formErrors.title ? 'border-red-500 bg-red-50' :
                                                formTouched.title && !formErrors.title ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-primary-300'
                                                }`}
                                            placeholder="e.g., Software Engineer"
                                        />
                                        <FaUserTie className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        {formTouched.title && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                {formErrors.title ? <FaTimes className="text-red-500" /> : <FaCheck className="text-green-500" />}
                                            </div>
                                        )}
                                    </div>
                                    {formErrors.title && (
                                        <p className="text-xs text-red-600 flex items-center gap-1 animate-pulse">
                                            <FaInfoCircle /> {formErrors.title}
                                        </p>
                                    )}
                                </div>

                                {/* Department Select */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <FaBuilding className="text-primary-600" />
                                        Department *
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="department"
                                            value={formData.department || ''}
                                            onChange={handleChange}
                                            onBlur={() => handleBlur('department')}
                                            className={`w-full pl-10 pr-10 py-3 border rounded-xl transition-all appearance-none ${formTouched.department && formErrors.department ? 'border-red-500 bg-red-50' :
                                                formTouched.department && !formErrors.department ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-primary-300'
                                                }`}
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map(dept => (
                                                <option key={dept._id} value={dept._id}>{dept.name}</option>
                                            ))}
                                        </select>
                                        <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        {formTouched.department && (
                                            <div className="absolute right-8 top-1/2 -translate-y-1/2">
                                                {formErrors.department ? <FaTimes className="text-red-500" /> : <FaCheck className="text-green-500" />}
                                            </div>
                                        )}
                                    </div>
                                    {formErrors.department && (
                                        <p className="text-xs text-red-600 flex items-center gap-1">
                                            <FaInfoCircle /> {formErrors.department}
                                        </p>
                                    )}
                                </div>

                                {/* Level Select */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <FaLayerGroup className="text-primary-600" />
                                        Career Level *
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="level"
                                            value={formData.level || ''}
                                            onChange={handleChange}
                                            onBlur={() => handleBlur('level')}
                                            className={`w-full pl-10 pr-10 py-3 border rounded-xl transition-all appearance-none ${formTouched.level && formErrors.level ? 'border-red-500 bg-red-50' :
                                                formTouched.level && !formErrors.level ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-primary-300'
                                                }`}
                                        >
                                            <option value="">Select Level</option>
                                            <option value="Intern">Intern</option>
                                            <option value="Junior">Junior</option>
                                            <option value="Mid">Mid</option>
                                            <option value="Senior">Senior</option>
                                            <option value="Lead">Lead</option>
                                            <option value="Manager">Manager</option>
                                        </select>
                                        <FaLayerGroup className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        {formTouched.level && (
                                            <div className="absolute right-8 top-1/2 -translate-y-1/2">
                                                {formErrors.level ? <FaTimes className="text-red-500" /> : <FaCheck className="text-green-500" />}
                                            </div>
                                        )}
                                    </div>
                                    {formErrors.level && (
                                        <p className="text-xs text-red-600 flex items-center gap-1">
                                            <FaInfoCircle /> {formErrors.level}
                                        </p>
                                    )}
                                </div>

                                {/* Education Select */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <FaGraduationCap className="text-primary-600" />
                                        Education *
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="education"
                                            value={formData.education || "Bachelor's"}
                                            onChange={handleChange}
                                            onBlur={() => handleBlur('education')}
                                            className={`w-full pl-10 pr-10 py-3 border rounded-xl transition-all appearance-none ${formTouched.education && formErrors.education ? 'border-red-500 bg-red-50' :
                                                formTouched.education && !formErrors.education ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-primary-300'
                                                }`}
                                        >
                                            <option value="Diploma">Diploma</option>
                                            <option value="Bachelor's">Bachelor's</option>
                                            <option value="Master's">Master's</option>
                                        </select>
                                        <FaGraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        {formTouched.education && (
                                            <div className="absolute right-8 top-1/2 -translate-y-1/2">
                                                {formErrors.education ? <FaTimes className="text-red-500" /> : <FaCheck className="text-green-500" />}
                                            </div>
                                        )}
                                    </div>
                                    {formErrors.education && (
                                        <p className="text-xs text-red-600 flex items-center gap-1">
                                            <FaInfoCircle /> {formErrors.education}
                                        </p>
                                    )}
                                </div>

                                {/* Employment Type */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <FaIdBadge className="text-primary-600" />
                                        Employment Type *
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="employmentType"
                                            value={formData.employmentType || ''}
                                            onChange={handleChange}
                                            onBlur={() => handleBlur('employmentType')}
                                            className={`w-full pl-10 pr-10 py-3 border rounded-xl transition-all appearance-none ${formTouched.employmentType && formErrors.employmentType ? 'border-red-500 bg-red-50' :
                                                formTouched.employmentType && !formErrors.employmentType ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-primary-300'
                                                }`}
                                        >
                                            <option value="">Select Type</option>
                                            <option value="Full-time">Full-time</option>
                                            <option value="Part-time">Part-time</option>
                                            <option value="Contract">Contract</option>
                                            <option value="Internship">Internship</option>
                                        </select>
                                        <FaIdBadge className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        {formTouched.employmentType && (
                                            <div className="absolute right-8 top-1/2 -translate-y-1/2">
                                                {formErrors.employmentType ? <FaTimes className="text-red-500" /> : <FaCheck className="text-green-500" />}
                                            </div>
                                        )}
                                    </div>
                                    {formErrors.employmentType && (
                                        <p className="text-xs text-red-600 flex items-center gap-1">
                                            <FaInfoCircle /> {formErrors.employmentType}
                                        </p>
                                    )}
                                </div>



                            </div>

                            {/* Required Skills */}
                            <div className="p-6 bg-primary-50 rounded-2xl border border-primary-100 space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-base font-bold text-primary-900 flex items-center gap-2">
                                        <FaCog className="text-primary-600 animate-spin-slow" />
                                        Required Skills
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleAddSkill}
                                        className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 shadow-md transition-all active:scale-95"
                                    >
                                        <FaPlus className="inline mr-2" /> Add Skill
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {(formData.requiredSkills || []).map((skill, index) => (
                                        <div key={index} className="flex flex-wrap md:flex-nowrap gap-3 items-center bg-white p-4 rounded-xl border border-primary-100 shadow-sm animate-slide-in">
                                            <div className="flex-1 min-w-[200px] relative">
                                                <input
                                                    type="text"
                                                    placeholder="Skill name (e.g., React)"
                                                    value={skill.name || ''}
                                                    onChange={(e) => handleSkillChange(index, 'name', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                />
                                            </div>
                                            <div className="w-32 relative">
                                                <label className="text-[10px] font-bold text-gray-400 absolute -top-2 left-2 bg-white px-1">Weight</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="1"
                                                    value={skill.weight || 1.0}
                                                    onChange={(e) => handleSkillChange(index, 'weight', parseFloat(e.target.value) || 0)}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSkill(index)}
                                                className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                            >
                                                <FaTrash size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {(formData.requiredSkills || []).length === 0 && (
                                        <div className="text-center py-6 border-2 border-dashed border-primary-200 rounded-xl text-primary-400 text-sm italic">
                                            No skills added yet. Add skills to define core requirements.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Preferred Skills */}
                            <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100 space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-base font-bold text-purple-900 flex items-center gap-2">
                                        <FaBrain className="text-purple-600" />
                                        Preferred Skills (Bonus)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleAddPreferredSkill}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 shadow-md transition-all"
                                    >
                                        <FaPlus className="inline mr-2" /> Add Preferred
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {(formData.preferredSkills || []).map((skill, index) => (
                                        <div key={index} className="flex flex-wrap md:flex-nowrap gap-3 items-center bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
                                            <div className="flex-1 min-w-[200px]">
                                                <input
                                                    type="text"
                                                    placeholder="Skill name (e.g., Docker)"
                                                    value={skill.name || ''}
                                                    onChange={(e) => handlePreferredSkillChange(index, 'name', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                                                />
                                            </div>
                                            <div className="w-32 relative">
                                                <label className="text-[10px] uppercase font-bold text-gray-400 absolute -top-2 left-2 bg-white px-1">Weight</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="1"
                                                    value={skill.weight || 0.5}
                                                    onChange={(e) => handlePreferredSkillChange(index, 'weight', parseFloat(e.target.value) || 0)}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemovePreferredSkill(index)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                            >
                                                <FaTrash size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {(formData.preferredSkills || []).length === 0 && (
                                        <div className="text-center py-4 text-purple-400 text-sm italic">
                                            No preferred skills added yet.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Application Criteria Set */}
                            <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-4">
                                <label className="text-base font-bold text-amber-900 flex items-center gap-2">
                                    <FaCheckCircle className="text-amber-600" />
                                    Application Criteria (Strict Validation)
                                </label>
                                <p className="text-xs text-amber-600 italic">Configure minimum eligibility requirements. At least one criteria is mandatory.</p>

                                <div className="p-3 bg-white/50 rounded-xl border border-amber-200/50 mb-2">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Min Experience *</label>
                                        <input
                                            type="number"
                                            value={formData.criteriaSet?.minimumExperience || ''}
                                            onChange={(e) => handleCriteriaChange('minimumExperience', e.target.value.replace(/\D/g, ''))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-bold"
                                            placeholder="e.g. 2"
                                            min="0"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500">Min 10th%</label>
                                        <input
                                            type="number"
                                            value={formData.criteriaSet?.min10thPercentage || ''}
                                            onChange={(e) => handleCriteriaChange('min10thPercentage', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                                            placeholder="e.g. 60"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500">Min 12th%</label>
                                        <input
                                            type="number"
                                            value={formData.criteriaSet?.min12thPercentage || ''}
                                            onChange={(e) => handleCriteriaChange('min12thPercentage', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                                            placeholder="e.g. 60"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500">Min Grad%</label>
                                        <input
                                            type="number"
                                            value={formData.criteriaSet?.minGraduationPercentage || ''}
                                            onChange={(e) => handleCriteriaChange('minGraduationPercentage', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                                            placeholder="e.g. 60"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500">Min PG%</label>
                                        <input
                                            type="number"
                                            value={formData.criteriaSet?.minPGPercentage || ''}
                                            onChange={(e) => handleCriteriaChange('minPGPercentage', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                                            placeholder="e.g. 60"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500">Min Age</label>
                                        <input
                                            type="number"
                                            value={formData.criteriaSet?.minAge || ''}
                                            onChange={(e) => handleCriteriaChange('minAge', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                                            placeholder="18"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500">Max Age</label>
                                        <input
                                            type="number"
                                            value={formData.criteriaSet?.maxAge || ''}
                                            onChange={(e) => handleCriteriaChange('maxAge', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                                            placeholder="60"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-600">Required Degrees</label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {(formData.criteriaSet?.specificDegrees || []).map(degreeId => {
                                                const degree = degreeOptions.find(d => d._id === degreeId);
                                                return (
                                                    <span key={degreeId} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs flex items-center gap-2 animate-scale-in">
                                                        {degree?.name || 'Unknown'}
                                                        <FaTimes
                                                            className="cursor-pointer hover:text-amber-900 transition-colors"
                                                            onClick={() => {
                                                                const updated = (formData.criteriaSet.specificDegrees || []).filter(id => id !== degreeId);
                                                                handleCriteriaChange('specificDegrees', updated);
                                                            }}
                                                        />
                                                    </span>
                                                );
                                            })}
                                        </div>
                                        <div className="relative">
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={degreeSearch}
                                                    onFocus={() => setShowDegreeDropdown(true)}
                                                    onChange={(e) => setDegreeSearch(e.target.value)}
                                                    placeholder="Search degrees..."
                                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 bg-white"
                                                />
                                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                            </div>

                                            {showDegreeDropdown && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-[60]"
                                                        onClick={() => setShowDegreeDropdown(false)}
                                                    />
                                                    <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-[70] scrollbar-thin">
                                                        {degreeOptions
                                                            .filter(d => {
                                                                const searchMatch = d.name.toLowerCase().includes(degreeSearch.toLowerCase());
                                                                const notSelected = !(formData.criteriaSet?.specificDegrees || []).includes(d._id);

                                                                // Education based filtering
                                                                let categoryMatch = true;
                                                                const edu = formData.education || "Bachelor's";
                                                                if (edu === "Bachelor's") categoryMatch = d.category === 'bachelor';
                                                                else if (edu === "Master's") categoryMatch = d.category === 'master';
                                                                // For Diploma and PhD, we might show all or specific subsets. 
                                                                // Based on current model, category is enum: ['bachelor', 'master']

                                                                return searchMatch && notSelected && categoryMatch;
                                                            }).length > 0 ? (
                                                            degreeOptions
                                                                .filter(d => {
                                                                    const searchMatch = d.name.toLowerCase().includes(degreeSearch.toLowerCase());
                                                                    const notSelected = !(formData.criteriaSet?.specificDegrees || []).includes(d._id);

                                                                    let categoryMatch = true;
                                                                    const edu = formData.education || "Bachelor's";
                                                                    if (edu === "Bachelor's") categoryMatch = d.category === 'bachelor';
                                                                    else if (edu === "Master's") categoryMatch = d.category === 'master';

                                                                    return searchMatch && notSelected && categoryMatch;
                                                                }).map(d => (
                                                                    <div
                                                                        key={d._id}
                                                                        onClick={() => {
                                                                            handleCriteriaChange('specificDegrees', [...(formData.criteriaSet?.specificDegrees || []), d._id]);
                                                                            setDegreeSearch('');
                                                                            setShowDegreeDropdown(false);
                                                                        }}
                                                                        className="px-4 py-2 hover:bg-amber-50 cursor-pointer text-sm text-gray-700 flex justify-between items-center transition-colors border-b border-gray-50 last:border-0"
                                                                    >
                                                                        <span>{d.name}</span>
                                                                        <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{d.category}</span>
                                                                    </div>
                                                                ))
                                                        ) : (
                                                            <div className="px-4 py-3 text-xs text-gray-500 text-center italic">No matching degrees found</div>
                                                        )
                                                        }
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-600">Specializations</label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {(formData.criteriaSet?.specializations || []).map(spec => (
                                                <span key={spec} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs flex items-center gap-2 animate-scale-in">
                                                    {spec}
                                                    <FaTimes
                                                        className="cursor-pointer hover:text-amber-900 transition-colors"
                                                        onClick={() => {
                                                            const updated = (formData.criteriaSet.specializations || []).filter(s => s !== spec);
                                                            handleCriteriaChange('specializations', updated);
                                                        }}
                                                    />
                                                </span>
                                            ))}
                                        </div>
                                        <div className="relative">
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={specSearch}
                                                    onFocus={() => setShowSpecDropdown(true)}
                                                    onChange={(e) => setSpecSearch(e.target.value)}
                                                    placeholder="Search specializations..."
                                                    className="w-full pl-9 pr-4 py-2 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 bg-white"
                                                    disabled={!(formData.criteriaSet?.specificDegrees?.length > 0)}
                                                />
                                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                            </div>

                                            {showSpecDropdown && formData.criteriaSet?.specificDegrees?.length > 0 && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-[60]"
                                                        onClick={() => setShowSpecDropdown(false)}
                                                    />
                                                    <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-[70] scrollbar-thin">
                                                        {degreeOptions
                                                            .filter(d => (formData.criteriaSet?.specificDegrees || []).includes(d._id))
                                                            .flatMap(d => d.specializations)
                                                            .filter((spec, index, self) => self.indexOf(spec) === index) // Unique
                                                            .filter(spec =>
                                                                spec.toLowerCase().includes(specSearch.toLowerCase()) &&
                                                                !(formData.criteriaSet?.specializations || []).includes(spec)
                                                            ).length > 0 ? (
                                                            degreeOptions
                                                                .filter(d => (formData.criteriaSet?.specificDegrees || []).includes(d._id))
                                                                .flatMap(d => d.specializations)
                                                                .filter((spec, index, self) => self.indexOf(spec) === index)
                                                                .filter(spec =>
                                                                    spec.toLowerCase().includes(specSearch.toLowerCase()) &&
                                                                    !(formData.criteriaSet?.specializations || []).includes(spec)
                                                                ).map(spec => (
                                                                    <div
                                                                        key={spec}
                                                                        onClick={() => {
                                                                            handleCriteriaChange('specializations', [...(formData.criteriaSet?.specializations || []), spec]);
                                                                            setSpecSearch('');
                                                                            setShowSpecDropdown(false);
                                                                        }}
                                                                        className="px-4 py-2 hover:bg-amber-50 cursor-pointer text-sm text-gray-700 transition-colors border-b border-gray-50 last:border-0"
                                                                    >
                                                                        {spec}
                                                                    </div>
                                                                ))
                                                        ) : (
                                                            <div className="px-4 py-3 text-xs text-gray-500 text-center italic">
                                                                {formData.criteriaSet?.specificDegrees?.length > 0
                                                                    ? "No matching specializations found"
                                                                    : "Select a degree first"}
                                                            </div>
                                                        )
                                                        }
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2 pt-4">
                                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <FaInfoCircle className="text-primary-600" />
                                    Role Description *
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description || ''}
                                    onChange={handleChange}
                                    rows="5"
                                    className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all hover:border-primary-300"
                                    placeholder="Provide a detailed description of the role, expectations, and growth opportunities..."
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'jobs' && (
                        <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2 scrollbar-thin">
                            {/* Primary Details: Job Code & Department */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <FaBriefcase className="text-primary-600" />
                                        Job Code *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="jobCode"
                                            value={formData.jobCode || ''}
                                            onChange={handleChange}
                                            onBlur={() => handleBlur('jobCode')}
                                            className={`w-full pl-10 pr-10 py-3 border rounded-xl transition-all ${formTouched.jobCode && formErrors.jobCode ? 'border-red-500 bg-red-50' :
                                                formTouched.jobCode && !formErrors.jobCode ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-primary-300'
                                                }`}
                                            placeholder="e.g., ENG-2024-001"
                                        />
                                        <FaBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        {formTouched.jobCode && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                {formErrors.jobCode ? <FaTimes className="text-red-500" /> : <FaCheck className="text-green-500" />}
                                            </div>
                                        )}
                                    </div>
                                    {formErrors.jobCode && (
                                        <p className="text-xs text-red-600 flex items-center gap-1">
                                            <FaInfoCircle /> {formErrors.jobCode}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <FaBuilding className="text-primary-600" />
                                        Department *
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="department"
                                            value={formData.department || ''}
                                            onChange={(e) => {
                                                handleChange(e);
                                                // Clear role when department changes as roles are linked
                                                setFormData(prev => ({ ...prev, role: '' }));
                                            }}
                                            onBlur={() => handleBlur('department')}
                                            className={`w-full pl-10 pr-10 py-3 border rounded-xl transition-all appearance-none ${formTouched.department && formErrors.department ? 'border-red-500 bg-red-50' :
                                                formTouched.department && !formErrors.department ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-primary-300'
                                                }`}
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map(dept => (
                                                <option key={dept._id} value={dept._id}>{dept.name}</option>
                                            ))}
                                        </select>
                                        <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <FaChevronDown className="text-gray-400 text-sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Associated Role & Application Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <FaUserTie className="text-primary-600" />
                                        Associated Role *
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="role"
                                            value={formData.role || ''}
                                            onChange={handleChange}
                                            onBlur={() => handleBlur('role')}
                                            disabled={!formData.department}
                                            className={`w-full pl-10 pr-10 py-3 border rounded-xl transition-all appearance-none ${!formData.department ? 'bg-gray-50 opacity-60' : ''} ${formTouched.role && formErrors.role ? 'border-red-500 bg-red-50' :
                                                formTouched.role && !formErrors.role ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-primary-300'
                                                }`}
                                        >
                                            <option value="">Select Role</option>
                                            {roles
                                                .filter(r => String(r.department?._id || r.department) === String(formData.department))
                                                .map(role => (
                                                    <option key={role._id} value={role._id}>{role.title} ({role.level})</option>
                                                ))}
                                        </select>
                                        <FaUserTie className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <FaChevronDown className="text-gray-400 text-sm" />
                                        </div>
                                    </div>
                                    {formErrors.role && (
                                        <p className="text-xs text-red-600 flex items-center gap-1">
                                            <FaInfoCircle /> {formErrors.role}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <FaCalendarAlt className="text-primary-600" />
                                        Application Deadline *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            name="applicationDeadline"
                                            value={formData.applicationDeadline || ''}
                                            onChange={handleChange}
                                            onBlur={() => handleBlur('applicationDeadline')}
                                            min={new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                            className={`w-full pl-10 pr-4 py-3 border rounded-xl transition-all ${formTouched.applicationDeadline && formErrors.applicationDeadline ? 'border-red-500 bg-red-50' :
                                                formTouched.applicationDeadline && !formErrors.applicationDeadline ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-primary-300'
                                                }`}
                                        />
                                        <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                    {formErrors.applicationDeadline && (
                                        <p className="text-xs text-red-600 flex items-center gap-1">
                                            <FaInfoCircle /> {formErrors.applicationDeadline}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Openings & Location Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <FaUsers className="text-primary-600" />
                                        Number of Openings *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="openings"
                                            value={formData.openings || ''}
                                            onChange={handleChange}
                                            onBlur={() => handleBlur('openings')}
                                            min="1"
                                            className={`w-full pl-10 pr-4 py-3 border rounded-xl transition-all ${formTouched.openings && formErrors.openings ? 'border-red-500 bg-red-50' :
                                                formTouched.openings && !formErrors.openings ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-primary-300'
                                                }`}
                                            placeholder="e.g. 1"
                                        />
                                        <FaUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                    {formErrors.openings && (
                                        <p className="text-xs text-red-600 flex items-center gap-1">
                                            <FaInfoCircle /> {formErrors.openings}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <FaMapMarkerAlt className="text-primary-600" />
                                        City / Location *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="e.g., Ahmedabad"
                                            value={formData.location?.city || ''}
                                            onChange={(e) => handleNestedChange('location', 'city', e.target.value)}
                                            className="w-full pl-10 px-4 py-3 border border-gray-200 rounded-xl hover:border-primary-300 transition-all focus:ring-2 focus:ring-primary-500"
                                        />
                                        <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Additional Location Info: State & Country */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">State</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Gujarat"
                                        value={formData.location?.state || ''}
                                        onChange={(e) => handleNestedChange('location', 'state', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl hover:border-primary-300 transition-all focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">Country</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., India"
                                        value={formData.location?.country || ''}
                                        onChange={(e) => handleNestedChange('location', 'country', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl hover:border-primary-300 transition-all focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>

                            {/* Salary Section */}
                            <div className="p-6 bg-green-50 rounded-2xl border border-green-100 space-y-4">
                                <label className="text-base font-bold text-green-900 flex items-center gap-2">
                                    <FaRupeeSign className="text-green-600" />
                                    Salary Range & Currency
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-green-700">Min Salary</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={formData.salaryRange?.min || ''}
                                            onChange={(e) => handleNestedChange('salaryRange', 'min', parseInt(e.target.value) || 0)}
                                            className="w-full px-4 py-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-green-700">Max Salary</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={formData.salaryRange?.max || ''}
                                            onChange={(e) => handleNestedChange('salaryRange', 'max', parseInt(e.target.value) || 0)}
                                            className="w-full px-4 py-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-green-700">Currency</label>
                                        <div className="w-full px-4 py-3 border border-green-200 rounded-xl bg-green-50 text-green-800 font-bold flex items-center gap-2">
                                            <FaRupeeSign className="text-sm" />
                                            INR (₹)
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Responsibilities Section */}
                            <div className="p-6 bg-primary-50 rounded-2xl border border-primary-100 space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-base font-bold text-primary-900 flex items-center gap-2">
                                        <FaToolbox className="text-primary-600" />
                                        Key Responsibilities
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleAddResponsibility}
                                        className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 shadow-md transition-all active:scale-95"
                                    >
                                        <FaPlus className="inline mr-2" /> Add Task
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {(formData.responsibilities || []).map((resp, index) => (
                                        <div key={index} className="flex gap-3 items-center bg-white p-3 rounded-xl border border-primary-100 shadow-sm animate-slide-in">
                                            <input
                                                type="text"
                                                placeholder="Describe a responsibility..."
                                                value={resp}
                                                onChange={(e) => handleResponsibilityChange(index, e.target.value)}
                                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                            <button
                                                onClick={() => handleRemoveResponsibility(index)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                            >
                                                <FaTrash size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {(formData.responsibilities || []).length === 0 && (
                                        <div className="text-center py-6 border-2 border-dashed border-primary-200 rounded-xl text-primary-400 text-sm italic">
                                            No responsibilities added yet.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Job Description (Multi-line) */}
                            <div className="space-y-2 pt-4">
                                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <FaInfoCircle className="text-primary-600" />
                                    Job Description *
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description || ''}
                                    onChange={handleChange}
                                    onBlur={() => handleBlur('description')}
                                    rows="5"
                                    className={`w-full px-4 py-4 border rounded-2xl transition-all hover:border-primary-300 focus:ring-2 focus:ring-primary-500 ${formTouched.description && formErrors.description ? 'border-red-500 bg-red-50' : 'border-gray-200'
                                        }`}
                                    placeholder="Provide a comprehensive description of the job opportunity..."
                                />
                                {formErrors.description && (
                                    <p className="text-sm text-red-600 flex items-center gap-1 animate-pulse">
                                        <FaInfoCircle /> {formErrors.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </ModalContainer>

            {/* View Modal */}
            <ModalContainer
                isOpen={viewModal.show}
                onClose={() => setViewModal({ show: false, type: null, data: null })}
                title={`View ${viewModal.type?.slice(0, -1) || ''}`}
                size="large"
            >
                {viewModal.data && (
                    <div className="p-6">
                        {activeTab === 'departments' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500">Department Code</label>
                                        <p className="font-mono font-bold text-primary-700 bg-primary-50 px-3 py-2 rounded-lg mt-1">
                                            {viewModal.data.code}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Department Name</label>
                                        <p className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg mt-1">
                                            {viewModal.data.name}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500">Description</label>
                                    <p className="text-gray-700 bg-gray-50 px-3 py-2 rounded-lg mt-1">
                                        {viewModal.data.description || 'No description provided'}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500">Parent Department</label>
                                    <p className="text-gray-700 bg-gray-50 px-3 py-2 rounded-lg mt-1">
                                        {departments.find(d => d._id === viewModal.data.parentDepartment)?.name || 'None (Top Level)'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500">Created At</label>
                                        <p className="text-gray-700 bg-gray-50 px-3 py-2 rounded-lg mt-1">
                                            {formatDateTime(viewModal.data.createdAt).date} at {formatDateTime(viewModal.data.createdAt).time}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Last Updated</label>
                                        <p className="text-gray-700 bg-gray-50 px-3 py-2 rounded-lg mt-1">
                                            {formatDateTime(viewModal.data.updatedAt).date} at {formatDateTime(viewModal.data.updatedAt).time}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'roles' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500">Role Title</label>
                                        <p className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg mt-1">
                                            {viewModal.data.title}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Department</label>
                                        <p className="text-gray-700 bg-gray-50 px-3 py-2 rounded-lg mt-1">
                                            {viewModal.data.department?.name || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Level</label>
                                        <p className="text-gray-700 bg-gray-50 px-3 py-2 rounded-lg mt-1">
                                            <span className={`px-2 py-1 rounded-md text-xs ${viewModal.data.level === 'Intern' ? 'bg-gray-100 text-gray-700' :
                                                viewModal.data.level === 'Junior' ? 'bg-green-100 text-green-700' :
                                                    viewModal.data.level === 'Mid' ? 'bg-blue-100 text-blue-700' :
                                                        viewModal.data.level === 'Senior' ? 'bg-purple-100 text-purple-700' :
                                                            viewModal.data.level === 'Lead' ? 'bg-orange-100 text-orange-700' :
                                                                'bg-red-100 text-red-700'
                                                }`}>
                                                {viewModal.data.level}
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Employment Type</label>
                                        <p className="text-gray-700 bg-gray-50 px-3 py-2 rounded-lg mt-1">
                                            {viewModal.data.employmentType}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Minimum Education</label>
                                        <p className="text-gray-700 bg-gray-50 px-3 py-2 rounded-lg mt-1 font-medium">
                                            {viewModal.data.education}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 flex items-center gap-2">
                                        <FaCog className="text-primary-600" /> Required Skills (Weighted)
                                    </label>
                                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {viewModal.data.requiredSkills?.length > 0 ? (
                                            viewModal.data.requiredSkills.map((skill, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-800 text-sm">{skill.name}</span>
                                                    </div>
                                                    <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-[10px] font-bold">
                                                        Weight: {skill.weight || 1.0}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-sm col-span-2">No required skills specified</p>
                                        )}
                                    </div>
                                </div>

                                {viewModal.data.preferredSkills?.length > 0 && (
                                    <div>
                                        <label className="text-xs text-gray-500 flex items-center gap-2">
                                            <FaBrain className="text-purple-600" /> Preferred Skills
                                        </label>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {viewModal.data.preferredSkills.map((skill, idx) => (
                                                <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm border border-purple-100">
                                                    <span className="font-medium">{typeof skill === 'object' ? skill.name : skill}</span>
                                                    <span className="text-[10px] bg-purple-200 px-1.5 rounded-full">
                                                        {typeof skill === 'object' ? skill.weight : 0.5}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {viewModal.data.criteriaSet && (
                                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-4">
                                        <label className="text-sm font-bold text-amber-900 flex items-center gap-2">
                                            <FaCheckCircle className="text-amber-600" />
                                            Application Criteria
                                        </label>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            {viewModal.data.criteriaSet.min10thPercentage && (
                                                <div className="bg-white p-2 rounded-xl border border-amber-100">
                                                    <p className="text-[10px] text-gray-500 font-bold">Min 10th%</p>
                                                    <p className="text-sm font-bold text-amber-700">{viewModal.data.criteriaSet.min10thPercentage}%</p>
                                                </div>
                                            )}
                                            {viewModal.data.criteriaSet.min12thPercentage && (
                                                <div className="bg-white p-2 rounded-xl border border-amber-100">
                                                    <p className="text-[10px] text-gray-500 font-bold">Min 12th%</p>
                                                    <p className="text-sm font-bold text-amber-700">{viewModal.data.criteriaSet.min12thPercentage}%</p>
                                                </div>
                                            )}
                                            {viewModal.data.criteriaSet.minGraduationPercentage && (
                                                <div className="bg-white p-2 rounded-xl border border-amber-100">
                                                    <p className="text-[10px] text-gray-500 font-bold">Min Grad%</p>
                                                    <p className="text-sm font-bold text-amber-700">{viewModal.data.criteriaSet.minGraduationPercentage}%</p>
                                                </div>
                                            )}
                                            {viewModal.data.criteriaSet.minPGPercentage && (
                                                <div className="bg-white p-2 rounded-xl border border-amber-100">
                                                    <p className="text-[10px] text-gray-500 font-bold">Min PG%</p>
                                                    <p className="text-sm font-bold text-amber-700">{viewModal.data.criteriaSet.minPGPercentage}%</p>
                                                </div>
                                            )}
                                            {viewModal.data.criteriaSet.minAge && (
                                                <div className="bg-white p-2 rounded-xl border border-amber-100">
                                                    <p className="text-[10px] text-gray-500 font-bold">Min Age</p>
                                                    <p className="text-sm font-bold text-amber-700">{viewModal.data.criteriaSet.minAge} Yrs</p>
                                                </div>
                                            )}
                                            {viewModal.data.criteriaSet.maxAge && (
                                                <div className="bg-white p-2 rounded-xl border border-amber-100">
                                                    <p className="text-[10px] text-gray-500 font-bold">Max Age</p>
                                                    <p className="text-sm font-bold text-amber-700">{viewModal.data.criteriaSet.maxAge} Yrs</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-4 pt-2 border-t border-amber-100">
                                            {viewModal.data.criteriaSet.specificDegrees?.length > 0 && (
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-gray-500 font-bold">Required Degrees</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {viewModal.data.criteriaSet.specificDegrees.map((degree, dIdx) => (
                                                            <span key={dIdx} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                                                                {typeof degree === 'object' ? degree.name : (degreeOptions.find(d => d._id === degree)?.name || 'Degree')}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {viewModal.data.criteriaSet.specializations?.length > 0 && (
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-gray-500 font-bold">Specializations</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {viewModal.data.criteriaSet.specializations.map((spec, sIdx) => (
                                                            <span key={sIdx} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                                                                {spec}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs text-gray-500">Description</label>
                                    <p className="text-gray-700 bg-gray-50 px-3 py-2 rounded-lg mt-1 whitespace-pre-wrap">
                                        {viewModal.data.description}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500">Created At</label>
                                        <p className="text-gray-700 bg-gray-50 px-3 py-2 rounded-lg mt-1">
                                            {formatDateTime(viewModal.data.createdAt).date} at {formatDateTime(viewModal.data.createdAt).time}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Last Updated</label>
                                        <p className="text-gray-700 bg-gray-50 px-3 py-2 rounded-lg mt-1">
                                            {formatDateTime(viewModal.data.updatedAt).date} at {formatDateTime(viewModal.data.updatedAt).time}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'jobs' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500">Job Code</label>
                                        <p className="font-mono font-bold text-primary-700 bg-primary-50 px-3 py-2 rounded-lg mt-1">
                                            {viewModal.data.jobCode}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Department</label>
                                        <p className="text-gray-700 bg-gray-50 px-3 py-2 rounded-lg mt-1">
                                            {viewModal.data.department?.name || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Role</label>
                                        <p className="text-gray-700 bg-gray-50 px-3 py-2 rounded-lg mt-1">
                                            {viewModal.data.role?.title} ({viewModal.data.role?.level})
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Openings</label>
                                        <p className="text-gray-700 bg-gray-50 px-3 py-2 rounded-lg mt-1">
                                            {viewModal.data.openings}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 flex items-center gap-2">
                                        <FaMapMarkerAlt className="text-primary-600" /> Location
                                    </label>
                                    <div className="mt-2 grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-xs text-gray-500">City</p>
                                            <p className="font-medium">{viewModal.data.location?.city || 'N/A'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-xs text-gray-500">State</p>
                                            <p className="font-medium">{viewModal.data.location?.state || 'N/A'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-xs text-gray-500">Country</p>
                                            <p className="font-medium">{viewModal.data.location?.country || 'N/A'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-xs text-gray-500">Remote</p>
                                            <p className="font-medium">{viewModal.data.location?.isRemote ? 'Yes' : 'No'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 flex items-center gap-2">
                                        <FaRupeeSign className="text-primary-600" /> Salary Range
                                    </label>
                                    <div className="mt-2 grid grid-cols-3 gap-4">
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-xs text-gray-500">Min</p>
                                            <p className="font-medium">{viewModal.data.salaryRange?.min || '0'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-xs text-gray-500">Max</p>
                                            <p className="font-medium">{viewModal.data.salaryRange?.max || '0'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-xs text-gray-500">Currency</p>
                                            <p className="font-medium">{viewModal.data.salaryRange?.currency || 'INR'}</p>
                                        </div>
                                    </div>
                                </div>

                                {viewModal.data.responsibilities?.length > 0 && (
                                    <div>
                                        <label className="text-xs text-gray-500 flex items-center gap-2">
                                            <FaToolbox className="text-primary-600" /> Responsibilities
                                        </label>
                                        <ul className="mt-2 space-y-2">
                                            {viewModal.data.responsibilities.map((resp, idx) => (
                                                <li key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2"></span>
                                                    <span className="text-gray-700">{resp}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs text-gray-500">Description</label>
                                    <p className="text-gray-700 bg-gray-50 px-3 py-2 rounded-lg mt-1 whitespace-pre-wrap">
                                        {viewModal.data.description}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500">Application Deadline</label>
                                    <p className={`font-medium bg-gray-50 px-3 py-2 rounded-lg mt-1 ${new Date(viewModal.data.applicationDeadline) < new Date() ? 'text-red-600' : 'text-green-600'
                                        }`}>
                                        {format(new Date(viewModal.data.applicationDeadline), 'dd MMMM yyyy')}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500">Created At</label>
                                        <p className="text-gray-700 bg-gray-50 px-3 py-2 rounded-lg mt-1">
                                            {formatDateTime(viewModal.data.createdAt).date} at {formatDateTime(viewModal.data.createdAt).time}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Last Updated</label>
                                        <p className="text-gray-700 bg-gray-50 px-3 py-2 rounded-lg mt-1">
                                            {formatDateTime(viewModal.data.updatedAt).date} at {formatDateTime(viewModal.data.updatedAt).time}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </ModalContainer>

            {/* Edit Modal */}
            <ModalContainer
                isOpen={editModal.show}
                onClose={() => setEditModal({ show: false, type: null, data: null })}
                title={`Edit ${editModal.type?.slice(0, -1) || ''}`}
                size="large"
                footer={
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={handleUpdate}
                            disabled={submitting}
                            className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {submitting ? <FaSpinner className="animate-spin inline mr-2" /> : <FaEdit className="inline mr-2" />}
                            Update
                        </button>
                        <button
                            onClick={() => setEditModal({ show: false, type: null, data: null })}
                            className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                }
            >
                <div className="p-6">
                    {activeTab === 'departments' && editModal.data && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Department Name */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <FaBuilding className="text-primary-600" />
                                        Department Name *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={formData.name !== undefined ? formData.name : editModal.data.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl hover:border-primary-300 transition-all focus:ring-2 focus:ring-primary-500"
                                            placeholder="e.g., Engineering"
                                        />
                                        <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                </div>

                                {/* Department Code */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <FaIdBadge className="text-primary-600" />
                                        Department Code *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={formData.code !== undefined ? formData.code : editModal.data.code}
                                            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl hover:border-primary-300 transition-all focus:ring-2 focus:ring-primary-500"
                                            placeholder="e.g., ENG"
                                            maxLength="10"
                                        />
                                        <FaIdBadge className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Parent Department */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <FaLayerGroup className="text-primary-600" />
                                    Parent Department
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.parentDepartment !== undefined ? formData.parentDepartment : editModal.data.parentDepartment || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, parentDepartment: e.target.value }))}
                                        className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl appearance-none hover:border-primary-300 transition-all focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">None (Top Level)</option>
                                        {departments
                                            .filter(d => d._id !== editModal.data._id)
                                            .map(dept => (
                                                <option key={dept._id} value={dept._id}>{dept.name}</option>
                                            ))}
                                    </select>
                                    <FaLayerGroup className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <FaChevronDown className="text-gray-400 text-sm" />
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <FaInfoCircle className="text-primary-600" />
                                    Description
                                </label>
                                <textarea
                                    value={formData.description !== undefined ? formData.description : editModal.data.description || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows="3"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl hover:border-primary-300 transition-all focus:ring-2 focus:ring-primary-500"
                                    placeholder="Briefly describe the department's purpose..."
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'roles' && editModal.data && (
                        <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2 scrollbar-thin">
                            {/* Primary Info Card */}
                            <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">Role Title *</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={formData.title !== undefined ? formData.title : editModal.data.title}
                                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                                                placeholder="e.g. Senior Frontend Engineer"
                                            />
                                            <FaUserTie className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">Department *</label>
                                        <div className="relative">
                                            <select
                                                value={formData.department !== undefined ? formData.department : (editModal.data.department?._id || editModal.data.department || '')}
                                                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                                                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl appearance-none"
                                            >
                                                <option value="">Select Department</option>
                                                {departments.map(dept => (
                                                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                                                ))}
                                            </select>
                                            <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">Level *</label>
                                        <select
                                            value={formData.level !== undefined ? formData.level : editModal.data.level || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                                        >
                                            <option value="Intern">Intern</option>
                                            <option value="Junior">Junior</option>
                                            <option value="Mid">Mid</option>
                                            <option value="Senior">Senior</option>
                                            <option value="Lead">Lead</option>
                                            <option value="Manager">Manager</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <FaGraduationCap size={12} className="text-primary-500" /> Education *
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={formData.education !== undefined ? formData.education : editModal.data.education || "Bachelor's"}
                                                onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
                                                className="w-full pl-9 pr-10 py-3 border border-gray-200 rounded-xl appearance-none"
                                            >
                                                <option value="Diploma">Diploma</option>
                                                <option value="Bachelor's">Bachelor's</option>
                                                <option value="Master's">Master's</option>
                                            </select>
                                            <FaGraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <FaIdBadge size={12} className="text-primary-500" /> Employment *
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={formData.employmentType !== undefined ? formData.employmentType : editModal.data.employmentType || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, employmentType: e.target.value }))}
                                                className="w-full pl-9 pr-10 py-3 border border-gray-200 rounded-xl appearance-none"
                                            >
                                                <option value="Full-time">Full-time</option>
                                                <option value="Part-time">Part-time</option>
                                                <option value="Contract">Contract</option>
                                                <option value="Internship">Internship</option>
                                            </select>
                                            <FaIdBadge className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Required Skills Section */}
                            <div className="p-6 bg-primary-50 rounded-2xl border border-primary-100 space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-base font-bold text-primary-900 flex items-center gap-2">
                                        <FaCog className="text-primary-600 animate-spin-slow" />
                                        Required Skills
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleAddSkill}
                                        className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 shadow-md transition-all active:scale-95"
                                    >
                                        <FaPlus className="inline mr-2" /> Add Skill
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {(formData.requiredSkills || []).map((skill, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-3 items-center bg-white p-3 rounded-xl border border-primary-100 shadow-sm animate-slide-in">
                                            <div className="col-span-6">
                                                <input
                                                    type="text"
                                                    placeholder="Skill Name..."
                                                    value={skill.name}
                                                    onChange={(e) => handleSkillChange(index, 'name', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>

                                            <div className="col-span-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-gray-400">Weight:</span>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                        max="1"
                                                        value={skill.weight || 1.0}
                                                        onChange={(e) => handleSkillChange(index, 'weight', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-2 py-2 border border-primary-200 rounded-lg text-center font-bold text-primary-600 bg-primary-50"
                                                        title="Weight (0-1)"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-span-1 text-right">
                                                <button
                                                    onClick={() => handleRemoveSkill(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Preferred Skills Section */}
                            <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100 space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-base font-bold text-purple-900 flex items-center gap-2">
                                        <FaBrain className="text-purple-600" />
                                        Preferred Skills (Weighted)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleAddPreferredSkill}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 shadow-md transition-all active:scale-95"
                                    >
                                        <FaPlus className="inline mr-2" /> Add
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {(formData.preferredSkills || []).map((skill, index) => (
                                        <div key={index} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-purple-100 shadow-sm">
                                            <input
                                                type="text"
                                                placeholder="Skill..."
                                                value={typeof skill === 'object' ? skill.name : skill}
                                                onChange={(e) => handlePreferredSkillChange(index, 'name', e.target.value)}
                                                className="flex-1 px-3 py-1.5 border border-gray-100 rounded-lg text-sm"
                                            />
                                            <div className="flex items-center gap-1 w-20">
                                                <span className="text-[10px] font-bold text-purple-400">W:</span>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="1"
                                                    value={typeof skill === 'object' ? skill.weight : 0.5}
                                                    onChange={(e) => handlePreferredSkillChange(index, 'weight', parseFloat(e.target.value) || 0)}
                                                    className="w-full px-1 py-1 border border-purple-100 rounded-lg text-center text-xs font-bold bg-purple-50 text-purple-700"
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleRemovePreferredSkill(index)}
                                                className="p-1.5 text-red-400 hover:text-red-600"
                                            >
                                                <FaTrash size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Application Criteria Card */}
                            <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-4">
                                <label className="text-base font-bold text-amber-900 flex items-center gap-2">
                                    <FaCheckCircle className="text-amber-600" />
                                    Application Criteria (Strict Validation)
                                </label>

                                <div className="p-3 bg-white/50 rounded-xl border border-amber-200/50 mb-2">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Min Experience *</label>
                                        <input
                                            type="number"
                                            value={formData.criteriaSet?.minimumExperience !== undefined ? formData.criteriaSet.minimumExperience : (editModal.data.criteriaSet?.minimumExperience || '')}
                                            onChange={(e) => handleCriteriaChange('minimumExperience', e.target.value.replace(/\D/g, ''))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-bold"
                                            placeholder="e.g. 2"
                                            min="0"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500">Min 10th%</label>
                                        <input
                                            type="number"
                                            value={formData.criteriaSet?.min10thPercentage || ''}
                                            onChange={(e) => handleCriteriaChange('min10thPercentage', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                                            placeholder="e.g. 60"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500">Min 12th%</label>
                                        <input
                                            type="number"
                                            value={formData.criteriaSet?.min12thPercentage || ''}
                                            onChange={(e) => handleCriteriaChange('min12thPercentage', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                                            placeholder="e.g. 60"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500">Min Grad%</label>
                                        <input
                                            type="number"
                                            value={formData.criteriaSet?.minGraduationPercentage || ''}
                                            onChange={(e) => handleCriteriaChange('minGraduationPercentage', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                                            placeholder="e.g. 60"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500">Min PG%</label>
                                        <input
                                            type="number"
                                            value={formData.criteriaSet?.minPGPercentage || ''}
                                            onChange={(e) => handleCriteriaChange('minPGPercentage', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                                            placeholder="e.g. 60"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500">Min Age</label>
                                        <input
                                            type="number"
                                            value={formData.criteriaSet?.minAge || ''}
                                            onChange={(e) => handleCriteriaChange('minAge', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                                            placeholder="18"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500">Max Age</label>
                                        <input
                                            type="number"
                                            value={formData.criteriaSet?.maxAge || ''}
                                            onChange={(e) => handleCriteriaChange('maxAge', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                                            placeholder="60"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-600">Required Degrees</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {(formData.criteriaSet?.specificDegrees || []).map(degreeId => {
                                            const degree = degreeOptions.find(d => d._id === degreeId);
                                            return (
                                                <span key={degreeId} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs flex items-center gap-2 animate-scale-in">
                                                    {degree?.name || 'Unknown'}
                                                    <FaTimes
                                                        className="cursor-pointer hover:text-amber-900 transition-colors"
                                                        onClick={() => {
                                                            const updated = (formData.criteriaSet.specificDegrees || []).filter(id => id !== degreeId);
                                                            handleCriteriaChange('specificDegrees', updated);
                                                        }}
                                                    />
                                                </span>
                                            );
                                        })}
                                    </div>
                                    <div className="relative">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={degreeSearch}
                                                onFocus={() => setShowDegreeDropdown(true)}
                                                onChange={(e) => setDegreeSearch(e.target.value)}
                                                placeholder="Search degrees..."
                                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 bg-white"
                                            />
                                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                        </div>

                                        {showDegreeDropdown && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-[60]"
                                                    onClick={() => setShowDegreeDropdown(false)}
                                                />
                                                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-[70] scrollbar-thin">
                                                    {degreeOptions
                                                        .filter(d => {
                                                            const searchMatch = d.name.toLowerCase().includes(degreeSearch.toLowerCase());
                                                            const notSelected = !(formData.criteriaSet?.specificDegrees || []).includes(d._id);

                                                            let categoryMatch = true;
                                                            const edu = formData.education || "Bachelor's";
                                                            if (edu === "Bachelor's") categoryMatch = d.category === 'bachelor';
                                                            else if (edu === "Master's") categoryMatch = d.category === 'master';

                                                            return searchMatch && notSelected && categoryMatch;
                                                        }).length > 0 ? (
                                                        degreeOptions
                                                            .filter(d => {
                                                                const searchMatch = d.name.toLowerCase().includes(degreeSearch.toLowerCase());
                                                                const notSelected = !(formData.criteriaSet?.specificDegrees || []).includes(d._id);

                                                                let categoryMatch = true;
                                                                const edu = formData.education || "Bachelor's";
                                                                if (edu === "Bachelor's") categoryMatch = d.category === 'bachelor';
                                                                else if (edu === "Master's") categoryMatch = d.category === 'master';

                                                                return searchMatch && notSelected && categoryMatch;
                                                            }).map(d => (
                                                                <div
                                                                    key={d._id}
                                                                    onClick={() => {
                                                                        handleCriteriaChange('specificDegrees', [...(formData.criteriaSet?.specificDegrees || []), d._id]);
                                                                        setDegreeSearch('');
                                                                        setShowDegreeDropdown(false);
                                                                    }}
                                                                    className="px-4 py-2 hover:bg-amber-50 cursor-pointer text-sm text-gray-700 flex justify-between items-center transition-colors border-b border-gray-50 last:border-0"
                                                                >
                                                                    <span>{d.name}</span>
                                                                    <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{d.category}</span>
                                                                </div>
                                                            ))
                                                    ) : (
                                                        <div className="px-4 py-3 text-xs text-gray-500 text-center italic">No matching degrees found</div>
                                                    )
                                                    }
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-600">Specializations</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {(formData.criteriaSet?.specializations || []).map(spec => (
                                            <span key={spec} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs flex items-center gap-2 animate-scale-in">
                                                {spec}
                                                <FaTimes
                                                    className="cursor-pointer hover:text-amber-900 transition-colors"
                                                    onClick={() => {
                                                        const updated = (formData.criteriaSet.specializations || []).filter(s => s !== spec);
                                                        handleCriteriaChange('specializations', updated);
                                                    }}
                                                />
                                            </span>
                                        ))}
                                    </div>
                                    <div className="relative">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={specSearch}
                                                onFocus={() => setShowSpecDropdown(true)}
                                                onChange={(e) => setSpecSearch(e.target.value)}
                                                placeholder="Search specializations..."
                                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 bg-white"
                                                disabled={!(formData.criteriaSet?.specificDegrees?.length > 0)}
                                            />
                                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                        </div>

                                        {showSpecDropdown && formData.criteriaSet?.specificDegrees?.length > 0 && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-[60]"
                                                    onClick={() => setShowSpecDropdown(false)}
                                                />
                                                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-[70] scrollbar-thin">
                                                    {degreeOptions
                                                        .filter(d => (formData.criteriaSet?.specificDegrees || []).includes(d._id))
                                                        .flatMap(d => d.specializations)
                                                        .filter((spec, index, self) => self.indexOf(spec) === index) // Unique
                                                        .filter(spec =>
                                                            spec.toLowerCase().includes(specSearch.toLowerCase()) &&
                                                            !(formData.criteriaSet?.specializations || []).includes(spec)
                                                        ).length > 0 ? (
                                                        degreeOptions
                                                            .filter(d => (formData.criteriaSet?.specificDegrees || []).includes(d._id))
                                                            .flatMap(d => d.specializations)
                                                            .filter((spec, index, self) => self.indexOf(spec) === index)
                                                            .filter(spec =>
                                                                spec.toLowerCase().includes(specSearch.toLowerCase()) &&
                                                                !(formData.criteriaSet?.specializations || []).includes(spec)
                                                            ).map(spec => (
                                                                <div
                                                                    key={spec}
                                                                    onClick={() => {
                                                                        handleCriteriaChange('specializations', [...(formData.criteriaSet?.specializations || []), spec]);
                                                                        setSpecSearch('');
                                                                        setShowSpecDropdown(false);
                                                                    }}
                                                                    className="px-4 py-2 hover:bg-amber-50 cursor-pointer text-sm text-gray-700 transition-colors border-b border-gray-50 last:border-0"
                                                                >
                                                                    {spec}
                                                                </div>
                                                            ))
                                                    ) : (
                                                        <div className="px-4 py-3 text-xs text-gray-500 text-center italic">
                                                            {formData.criteriaSet?.specificDegrees?.length > 0
                                                                ? "No matching specializations found"
                                                                : "Select a degree first"}
                                                        </div>
                                                    )
                                                    }
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2 pt-2">
                                <label className="block text-sm font-semibold text-gray-700">Role Description *</label>
                                <textarea
                                    value={formData.description !== undefined ? formData.description : editModal.data.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows="5"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'jobs' && editModal.data && (
                        <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2 scrollbar-thin">
                            {/* Primary Details: Job Code & Department */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <FaBriefcase className="text-primary-600" />
                                        Job Code *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={formData.jobCode !== undefined ? formData.jobCode : editModal.data.jobCode}
                                            onChange={(e) => setFormData(prev => ({ ...prev, jobCode: e.target.value.toUpperCase() }))}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                                            placeholder="e.g., ENG-2024-001"
                                        />
                                        <FaBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <FaBuilding className="text-primary-600" />
                                        Department *
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={formData.department !== undefined ? formData.department : editModal.data.department?._id || editModal.data.department}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setFormData(prev => ({ ...prev, department: val }));
                                            }}
                                            className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl appearance-none"
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map(dept => (
                                                <option key={dept._id} value={dept._id}>{dept.name}</option>
                                            ))}
                                        </select>
                                        <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <FaChevronDown className="text-gray-400 text-sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Secondary Details: Role & Location */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <FaUserTie className="text-primary-600" />
                                        Associated Role *
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={formData.role !== undefined ? formData.role : editModal.data.role?._id || editModal.data.role}
                                            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                                            className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl appearance-none"
                                        >
                                            <option value="">Select Role</option>
                                            {roles
                                                .filter(r => {
                                                    const deptId = formData.department !== undefined ? formData.department : editModal.data.department?._id || editModal.data.department;
                                                    return !deptId || r.department === deptId || r.department?._id === deptId;
                                                })
                                                .map(role => (
                                                    <option key={role._id} value={role._id}>{role.title} ({role.level})</option>
                                                ))}
                                        </select>
                                        <FaUserTie className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <FaChevronDown className="text-gray-400 text-sm" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <FaMapMarkerAlt className="text-primary-600" />
                                        Location *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={formData.location?.city !== undefined ? formData.location.city : editModal.data.location?.city || ''}
                                            onChange={(e) => handleNestedChange('location', 'city', e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                                            placeholder="City"
                                        />
                                        <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Openings & Deadline */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <FaUsers className="text-primary-600" />
                                        Openings *
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.openings !== undefined ? formData.openings : editModal.data.openings}
                                        onChange={(e) => setFormData(prev => ({ ...prev, openings: parseInt(e.target.value) || 1 }))}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                                        min="1"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <FaCalendarAlt className="text-primary-600" />
                                        Deadline *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.applicationDeadline !== undefined ? formData.applicationDeadline : editModal.data.applicationDeadline?.split('T')[0]}
                                        onChange={(e) => setFormData(prev => ({ ...prev, applicationDeadline: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                                    />
                                </div>
                            </div>

                            {/* Salary Section */}
                            <div className="p-6 bg-green-50 rounded-2xl border border-green-100 space-y-4 shadow-sm">
                                <label className="text-base font-bold text-green-900 flex items-center gap-2">
                                    <FaRupeeSign className="text-green-600" />
                                    Salary Range
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-green-700">Min</label>
                                        <input
                                            type="number"
                                            value={formData.salaryRange?.min !== undefined ? formData.salaryRange.min : editModal.data.salaryRange?.min || ''}
                                            onChange={(e) => handleNestedChange('salaryRange', 'min', parseInt(e.target.value) || 0)}
                                            className="w-full px-4 py-2 border border-green-200 rounded-lg"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-green-700">Max</label>
                                        <input
                                            type="number"
                                            value={formData.salaryRange?.max !== undefined ? formData.salaryRange.max : editModal.data.salaryRange?.max || ''}
                                            onChange={(e) => handleNestedChange('salaryRange', 'max', parseInt(e.target.value) || 0)}
                                            className="w-full px-4 py-2 border border-green-200 rounded-lg"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-green-700">Currency</label>
                                        <select
                                            value={formData.salaryRange?.currency !== undefined ? formData.salaryRange.currency : editModal.data.salaryRange?.currency || 'INR'}
                                            onChange={(e) => handleNestedChange('salaryRange', 'currency', e.target.value)}
                                            className="w-full px-4 py-2 border border-green-200 rounded-lg bg-white"
                                        >
                                            <option value="INR">INR</option>
                                            <option value="USD">USD</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Responsibilities Section */}
                            <div className="p-6 bg-primary-50 rounded-2xl border border-primary-100 space-y-4 shadow-sm">
                                <div className="flex justify-between items-center">
                                    <label className="text-base font-bold text-primary-900 flex items-center gap-2">
                                        <FaToolbox className="text-primary-600" />
                                        Key Responsibilities
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleAddResponsibility}
                                        className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold shadow-sm"
                                    >
                                        <FaPlus />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {(formData.responsibilities || editModal.data.responsibilities || []).map((resp, index) => (
                                        <div key={index} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-primary-100 shadow-sm">
                                            <input
                                                type="text"
                                                value={resp}
                                                onChange={(e) => handleResponsibilityChange(index, e.target.value)}
                                                className="flex-1 px-3 py-2 border border-gray-100 rounded-lg text-sm"
                                            />
                                            <button
                                                onClick={() => handleRemoveResponsibility(index)}
                                                className="p-2 text-red-500 rounded-lg"
                                            >
                                                <FaTrash size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2 pt-2">
                                <label className="block text-sm font-semibold text-gray-700">Job Description *</label>
                                <textarea
                                    value={formData.description !== undefined ? formData.description : editModal.data.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows="4"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </ModalContainer>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, type: null, id: null, name: '' })}
                onConfirm={handleDelete}
                title={`Delete ${deleteModal.type?.slice(0, -1) || ''}`}
                message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.${activeTab === 'departments' ? ' This will also delete all associated roles and jobs.' :
                    activeTab === 'roles' ? ' This will also delete all associated jobs.' : ''
                    }`}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
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
        </div >
    );
};

export default JobsDeptsRolesSuperintendence;