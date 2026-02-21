import React, { useState, useEffect, useMemo } from 'react';
import { panelAPI } from '../utils/api';
import { toast } from 'react-hot-toast';
import {
    FaTimes,
    FaPlus,
    FaEdit,
    FaTrash,
    FaSave,
    FaUsers,
    FaUserPlus,
    FaChevronDown,
    FaChevronRight,
    FaSpinner,
    FaExclamationCircle,
    FaBriefcase,
    FaBuilding,
    FaClock
} from 'react-icons/fa';

const ManagePanelsModal = ({ isOpen, onClose, onRefresh }) => {
    const [panels, setPanels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    // Initial state for an empty expert
    const emptyExpert = { name: '', department: '', role: '', seniority: '' };

    // New panel form
    const [showAddForm, setShowAddForm] = useState(false);
    const [newPanel, setNewPanel] = useState({ name: '', experts: [{ ...emptyExpert }] });
    const [newPanelErrors, setNewPanelErrors] = useState([]);
    const [newPanelNameError, setNewPanelNameError] = useState('');

    // Edit state
    const [editId, setEditId] = useState(null);
    const [editData, setEditData] = useState({ name: '', experts: [] });
    const [editErrors, setEditErrors] = useState([]);
    const [editNameError, setEditNameError] = useState('');

    // Delete confirmation
    const [deleteId, setDeleteId] = useState(null);

    useEffect(() => {
        if (isOpen) fetchPanels();
    }, [isOpen]);

    const fetchPanels = async () => {
        try {
            setLoading(true);
            const res = await panelAPI.getAll();
            setPanels(res.data.data || []);
        } catch (err) {
            console.error('Failed to load panels', err);
            toast.error('Failed to load panels');
        } finally {
            setLoading(false);
        }
    };

    // Live Validation Logic
    const validateExperts = (experts) => {
        return experts.map(expert => {
            const errors = {};
            if (!expert.name || !expert.name.trim()) errors.name = 'Name is required';
            if (!expert.department || !expert.department.trim()) errors.department = 'Department is required';
            if (!expert.role || !expert.role.trim()) errors.role = 'Role is required';

            const seniorVal = expert.seniority;
            if (seniorVal === '' || seniorVal === null || seniorVal === undefined) {
                errors.seniority = 'Seniority is required';
            } else {
                const num = Number(seniorVal);
                if (isNaN(num)) {
                    errors.seniority = 'Must be a number';
                } else if (num < 5) {
                    errors.seniority = 'Minimum 5 years required';
                }
            }
            return errors;
        });
    };

    const validatePanelName = (name) => {
        if (!name || !name.trim()) return 'Panel name is required';
        if (name.trim().length < 3) return 'Name is too short';
        return '';
    };

    // ─── Create Panel Logic ────────────────────
    const handleAddExpertToNew = () => {
        setNewPanel(prev => ({
            ...prev,
            experts: [...prev.experts, { ...emptyExpert }]
        }));
    };

    const handleRemoveExpertFromNew = (index) => {
        setNewPanel(prev => {
            if (prev.experts.length === 1) {
                toast.error('At least one expert is required');
                return prev;
            }
            const updatedExperts = [...prev.experts];
            updatedExperts.splice(index, 1);
            return { ...prev, experts: updatedExperts };
        });
    };

    const handleNewExpertChange = (index, field, value) => {
        setNewPanel(prev => {
            const updatedExperts = [...prev.experts];
            updatedExperts[index] = { ...updatedExperts[index], [field]: value };
            return { ...prev, experts: updatedExperts };
        });
    };

    // Live validation for new panel
    useEffect(() => {
        setNewPanelErrors(validateExperts(newPanel.experts));
        setNewPanelNameError(validatePanelName(newPanel.name));
    }, [newPanel.experts, newPanel.name]);

    const handleCreate = async () => {
        const expertErrors = validateExperts(newPanel.experts);
        const nameError = validatePanelName(newPanel.name);
        const hasExpertErrors = expertErrors.some(err => Object.keys(err).length > 0);

        if (hasExpertErrors || nameError) {
            setNewPanelErrors(expertErrors);
            setNewPanelNameError(nameError);
            toast.error('Please fix the errors before saving');
            return;
        }

        try {
            await panelAPI.create(newPanel);
            toast.success('Panel created successfully');
            setNewPanel({ name: '', experts: [{ ...emptyExpert }] });
            setShowAddForm(false);
            fetchPanels();
            if (onRefresh) onRefresh();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create panel');
        }
    };

    // ─── Edit Panel Logic ──────────────────────
    const startEdit = (panel) => {
        setEditId(panel._id);
        const expertsCopy = JSON.parse(JSON.stringify(panel.experts));
        setEditData({ name: panel.name || '', experts: expertsCopy });
        setEditErrors(validateExperts(expertsCopy));
        setEditNameError(validatePanelName(panel.name || ''));
    };

    const handleAddExpertToEdit = () => {
        setEditData(prev => ({
            ...prev,
            experts: [...prev.experts, { ...emptyExpert }]
        }));
    };

    const handleRemoveExpertFromEdit = (index) => {
        setEditData(prev => {
            if (prev.experts.length === 1) {
                toast.error('At least one expert is required');
                return prev;
            }
            const updatedExperts = [...prev.experts];
            updatedExperts.splice(index, 1);
            return { ...prev, experts: updatedExperts };
        });
    };

    const handleEditExpertChange = (index, field, value) => {
        setEditData(prev => {
            const updatedExperts = [...prev.experts];
            updatedExperts[index] = { ...updatedExperts[index], [field]: value };
            return { ...prev, experts: updatedExperts };
        });
    };

    // Live validation for edit panel
    useEffect(() => {
        setEditErrors(validateExperts(editData.experts));
        setEditNameError(validatePanelName(editData.name));
    }, [editData.experts, editData.name]);

    const handleUpdate = async () => {
        const expertErrors = validateExperts(editData.experts);
        const nameError = validatePanelName(editData.name);
        const hasExpertErrors = expertErrors.some(err => Object.keys(err).length > 0);

        if (hasExpertErrors || nameError) {
            setEditErrors(expertErrors);
            setEditNameError(nameError);
            toast.error('Please fix the errors before saving');
            return;
        }

        try {
            await panelAPI.update(editId, editData);
            toast.success('Panel updated successfully');
            setEditId(null);
            fetchPanels();
            if (onRefresh) onRefresh();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update panel');
        }
    };

    // ─── Delete Logic ──────────────────────────
    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await panelAPI.delete(deleteId);
            toast.success('Panel deleted');
            setDeleteId(null);
            if (expandedId === deleteId) setExpandedId(null);
            fetchPanels();
            if (onRefresh) onRefresh();
        } catch (err) {
            toast.error('Failed to delete panel');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[90] p-4 animate-fade-in font-normal">
            <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white">
                    <div className="flex items-center gap-3">
                        <FaUsers className="w-5 h-5 text-blue-200" />
                        <h3 className="text-lg">Manage Interview Panels</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all focus:ring-2 focus:ring-white/20 outline-none"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <FaSpinner className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Add Panel Form */}
                            {!showAddForm ? (
                                <button
                                    onClick={() => setShowAddForm(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm active:scale-95"
                                >
                                    <FaPlus className="text-sm" /> Create New Panel
                                </button>
                            ) : (
                                <div className="p-6 border border-blue-100 rounded-2xl bg-blue-50/30 space-y-4 animate-slide-down">
                                    <h4 className="text-blue-800 text-lg flex items-center gap-2">
                                        <FaUserPlus className="text-blue-600" /> Create New Interview Panel
                                    </h4>

                                    <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm">
                                        <div className="mb-4">
                                            <label className="text-xs text-gray-500 ml-1 mb-1 block">Panel Name <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Senior Frontend Panel"
                                                value={newPanel.name}
                                                onChange={e => setNewPanel(prev => ({ ...prev, name: e.target.value }))}
                                                className={`w-full max-w-md px-4 py-2 bg-gray-50 border rounded-lg text-sm focus:bg-white focus:ring-2 outline-none transition-all ${newPanelNameError ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'}`}
                                            />
                                            {newPanelNameError && (
                                                <p className="text-[11px] text-red-500 mt-1 ml-1 flex items-center gap-1">
                                                    <FaExclamationCircle className="text-[10px]" /> {newPanelNameError}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <h5 className="text-[11px] text-gray-400 uppercase tracking-wider font-medium ml-1">Expert Details</h5>
                                            {newPanel.experts.map((expert, idx) => (
                                                <div key={idx} className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm relative group">
                                                    <div className="absolute -top-2.5 left-4 bg-blue-600 text-white text-[11px] px-3 py-0.5 rounded-full">
                                                        Expert #{idx + 1}
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveExpertFromNew(idx)}
                                                        className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded-full"
                                                        title="Remove Expert"
                                                    >
                                                        <FaTimesCircle className="w-4 h-4" />
                                                    </button>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
                                                        <div>
                                                            <label className="text-[11px] text-gray-500 ml-1 mb-1 block">Expert name <span className="text-red-500">*</span></label>
                                                            <input
                                                                type="text"
                                                                placeholder="Full name"
                                                                value={expert.name}
                                                                onChange={e => handleNewExpertChange(idx, 'name', e.target.value)}
                                                                className={`w-full px-4 py-2 bg-gray-50 border rounded-lg text-sm focus:bg-white focus:ring-2 outline-none transition-all ${newPanelErrors[idx]?.name ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'}`}
                                                            />
                                                            {newPanelErrors[idx]?.name && (
                                                                <p className="text-[11px] text-red-500 mt-1 ml-1 flex items-center gap-1">
                                                                    <FaExclamationCircle className="text-[10px]" /> {newPanelErrors[idx].name}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="text-[11px] text-gray-500 ml-1 mb-1 block">Department <span className="text-red-500">*</span></label>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. Engineering"
                                                                value={expert.department}
                                                                onChange={e => handleNewExpertChange(idx, 'department', e.target.value)}
                                                                className={`w-full px-4 py-2 bg-gray-50 border rounded-lg text-sm focus:bg-white focus:ring-2 outline-none transition-all ${newPanelErrors[idx]?.department ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'}`}
                                                            />
                                                            {newPanelErrors[idx]?.department && (
                                                                <p className="text-[11px] text-red-500 mt-1 ml-1 flex items-center gap-1">
                                                                    <FaExclamationCircle className="text-[10px]" /> {newPanelErrors[idx].department}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="text-[11px] text-gray-500 ml-1 mb-1 block">Role <span className="text-red-500">*</span></label>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. Tech Lead"
                                                                value={expert.role}
                                                                onChange={e => handleNewExpertChange(idx, 'role', e.target.value)}
                                                                className={`w-full px-4 py-2 bg-gray-50 border rounded-lg text-sm focus:bg-white focus:ring-2 outline-none transition-all ${newPanelErrors[idx]?.role ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'}`}
                                                            />
                                                            {newPanelErrors[idx]?.role && (
                                                                <p className="text-[11px] text-red-500 mt-1 ml-1 flex items-center gap-1">
                                                                    <FaExclamationCircle className="text-[10px]" /> {newPanelErrors[idx].role}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="text-[11px] text-gray-500 ml-1 mb-1 block">Exp (years) <span className="text-red-500">*</span></label>
                                                            <input
                                                                type="number"
                                                                placeholder="5"
                                                                min="5"
                                                                value={expert.seniority}
                                                                onChange={e => handleNewExpertChange(idx, 'seniority', e.target.value)}
                                                                className={`w-full px-4 py-2 bg-gray-50 border rounded-lg text-sm focus:bg-white focus:ring-2 outline-none transition-all ${newPanelErrors[idx]?.seniority ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'}`}
                                                            />
                                                            {newPanelErrors[idx]?.seniority && (
                                                                <p className="text-[11px] text-red-500 mt-1 ml-1 flex items-center gap-1">
                                                                    <FaExclamationCircle className="text-[10px]" /> {newPanelErrors[idx].seniority}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex flex-wrap gap-3 pt-2">
                                            <button
                                                onClick={handleAddExpertToNew}
                                                className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                                            >
                                                <FaPlus className="text-xs" /> Add Another Expert
                                            </button>
                                            <div className="flex-1" />
                                            <button
                                                onClick={handleCreate}
                                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm active:scale-95 text-sm"
                                            >
                                                <FaSave className="text-xs" /> Save Panel
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowAddForm(false);
                                                    setNewPanel({ experts: [{ ...emptyExpert }] });
                                                }}
                                                className="px-6 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-all text-sm"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Panels list */}
                            <div>
                                <h4 className="text-xs text-gray-400 tracking-widest mb-4">Existing Panels</h4>
                                {panels.length === 0 ? (
                                    <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl">
                                        <FaUsers className="w-12 h-12 text-gray-100 mx-auto mb-3" />
                                        <p className="text-gray-400 text-sm">No interview panels created yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {panels.map((panel, pIdx) => (
                                            <div key={panel._id} className={`border rounded-xl overflow-hidden transition-all duration-300 ${expandedId === panel._id ? 'border-blue-200 ring-2 ring-blue-50/50 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}>
                                                {/* Panel Accordion Header */}
                                                <div className={`flex items-center justify-between p-4 transition-colors ${expandedId === panel._id ? 'bg-blue-50/30' : 'bg-white hover:bg-gray-50/50'}`}>
                                                    <button
                                                        onClick={() => setExpandedId(expandedId === panel._id ? null : panel._id)}
                                                        className="flex items-center gap-4 flex-1 text-left"
                                                    >
                                                        <div className="flex -space-x-2">
                                                            {panel.experts.slice(0, 3).map((expert, i) => (
                                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-blue-600 text-[11px]">
                                                                    {expert.name.charAt(0)}
                                                                </div>
                                                            ))}
                                                            {panel.experts.length > 3 && (
                                                                <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-600 text-white text-[11px] flex items-center justify-center">
                                                                    +{panel.experts.length - 3}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="text-gray-900 font-medium text-sm">
                                                                {panel.name}
                                                            </div>
                                                            <div className="text-[11px] text-gray-500 truncate max-w-md">
                                                                {panel.experts.map(e => e.name).join(', ')}
                                                            </div>
                                                        </div>
                                                        <div className="ml-auto">
                                                            {expandedId === panel._id ? <FaChevronDown className="text-blue-500 w-3 h-3" /> : <FaChevronRight className="text-gray-300 w-3 h-3" />}
                                                        </div>
                                                    </button>

                                                    <div className="flex items-center gap-1 pl-4 border-l border-gray-100 ml-4">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); startEdit(panel); setExpandedId(panel._id); }}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit Panel"
                                                        >
                                                            <FaEdit className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setDeleteId(panel._id); }}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Panel"
                                                        >
                                                            <FaTrash className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Expanded content */}
                                                {expandedId === panel._id && (
                                                    <div className="p-5 border-t border-gray-100 bg-white space-y-4 animate-slide-up">
                                                        {editId === panel._id ? (
                                                            /* Edit form */
                                                            <div className="space-y-5">
                                                                <div className="bg-blue-50/30 p-5 rounded-xl border border-blue-100">
                                                                    <label className="text-xs text-gray-500 ml-1 mb-1 block">Panel Name <span className="text-red-500">*</span></label>
                                                                    <input
                                                                        type="text"
                                                                        value={editData.name}
                                                                        onChange={e => setEditData(prev => ({ ...prev, name: e.target.value }))}
                                                                        className={`w-full max-w-md px-4 py-2 border rounded-lg text-sm focus:ring-2 outline-none transition-all ${editNameError ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'}`}
                                                                    />
                                                                    {editNameError && (
                                                                        <p className="text-[11px] text-red-500 mt-1 ml-1 flex items-center gap-1">
                                                                            <FaExclamationCircle className="text-[10px]" /> {editNameError}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                <div className="space-y-4">
                                                                    <div className="flex items-center justify-between">
                                                                        <h5 className="text-[11px] text-gray-400 uppercase tracking-wider font-medium ml-1">Expert Details</h5>
                                                                        <button
                                                                            onClick={handleAddExpertToEdit}
                                                                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                                                        >
                                                                            <FaPlus className="text-[10px]" /> Add Expert
                                                                        </button>
                                                                    </div>
                                                                    {editData.experts.map((expert, idx) => (
                                                                        <div key={idx} className="bg-gray-50/50 p-5 rounded-xl border border-blue-50 relative group">
                                                                            <div className="absolute -top-2.5 left-4 bg-blue-600 text-white text-[11px] px-3 py-0.5 rounded-full">
                                                                                Expert #{idx + 1}
                                                                            </div>
                                                                            <button
                                                                                onClick={() => handleRemoveExpertFromEdit(idx)}
                                                                                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded-full"
                                                                            >
                                                                                <FaTimesCircle className="w-4 h-4" />
                                                                            </button>

                                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
                                                                                <div>
                                                                                    <label className="text-[11px] text-gray-500 ml-1 mb-1 block">Expert name <span className="text-red-500">*</span></label>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={expert.name}
                                                                                        onChange={e => handleEditExpertChange(idx, 'name', e.target.value)}
                                                                                        className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 outline-none transition-all ${editErrors[idx]?.name ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'}`}
                                                                                    />
                                                                                    {editErrors[idx]?.name && <p className="text-[11px] text-red-500 mt-1 ml-1 flex items-center gap-1"><FaExclamationCircle className="text-[10px]" /> {editErrors[idx].name}</p>}
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-[11px] text-gray-500 ml-1 mb-1 block">Department <span className="text-red-500">*</span></label>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={expert.department}
                                                                                        onChange={e => handleEditExpertChange(idx, 'department', e.target.value)}
                                                                                        className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 outline-none transition-all ${editErrors[idx]?.department ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'}`}
                                                                                    />
                                                                                    {editErrors[idx]?.department && <p className="text-[11px] text-red-500 mt-1 ml-1 flex items-center gap-1"><FaExclamationCircle className="text-[10px]" /> {editErrors[idx].department}</p>}
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-[11px] text-gray-500 ml-1 mb-1 block">Role <span className="text-red-500">*</span></label>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={expert.role}
                                                                                        onChange={e => handleEditExpertChange(idx, 'role', e.target.value)}
                                                                                        className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 outline-none transition-all ${editErrors[idx]?.role ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'}`}
                                                                                    />
                                                                                    {editErrors[idx]?.role && <p className="text-[11px] text-red-500 mt-1 ml-1 flex items-center gap-1"><FaExclamationCircle className="text-[10px]" /> {editErrors[idx].role}</p>}
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-[11px] text-gray-500 ml-1 mb-1 block">Exp (years) <span className="text-red-500">*</span></label>
                                                                                    <input
                                                                                        type="number"
                                                                                        min="5"
                                                                                        value={expert.seniority}
                                                                                        onChange={e => handleEditExpertChange(idx, 'seniority', e.target.value)}
                                                                                        className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 outline-none transition-all ${editErrors[idx]?.seniority ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'}`}
                                                                                    />
                                                                                    {editErrors[idx]?.seniority && <p className="text-[11px] text-red-500 mt-1 ml-1 flex items-center gap-1"><FaExclamationCircle className="text-[10px]" /> {editErrors[idx].seniority}</p>}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={handleAddExpertToEdit}
                                                                        className="flex items-center gap-2 px-3 py-1.5 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 text-xs transition-colors"
                                                                    >
                                                                        <FaPlus className="text-[10px]" /> Add Expert
                                                                    </button>
                                                                    <div className="flex-1" />
                                                                    <button onClick={handleUpdate} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm shadow-sm active:scale-95 transition-all">
                                                                        <FaSave className="text-xs" /> Update Panel
                                                                    </button>
                                                                    <button onClick={() => setEditId(null)} className="px-6 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm transition-colors">
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            /* Display Details */
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                {panel.experts.map((expert, idx) => (
                                                                    <div key={idx} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2 relative overflow-hidden group">
                                                                        <div className="absolute right-[-10px] bottom-[-10px] text-blue-100/30 scale-150 rotate-[-15deg] group-hover:scale-175 transition-all duration-500">
                                                                            <FaUsers size={60} />
                                                                        </div>
                                                                        <div className="text-gray-800 flex items-center gap-2 relative z-10 text-sm">
                                                                            <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">
                                                                                {idx + 1}
                                                                            </div>
                                                                            {expert.name}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-xs text-gray-500 relative z-10">
                                                                            <FaBuilding className="text-blue-300 w-3" /> {expert.department}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-xs text-gray-500 relative z-10">
                                                                            <FaBriefcase className="text-blue-300 w-3" /> {expert.role}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-xs text-gray-500 relative z-10">
                                                                            <FaClock className="text-blue-300 w-3" /> {expert.seniority} Years exp.
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-white">
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-8 py-2.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all text-sm"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>

                {/* Delete Confirmation Overlay */}
                {deleteId && (
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-[100] animate-fade-in">
                        <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 shadow-xl border border-gray-100 animate-zoom-in">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4">
                                <FaTrash size={24} />
                            </div>
                            <h4 className="text-xl mb-2 text-center text-gray-800">Delete Panel?</h4>
                            <p className="text-gray-500 text-sm mb-6 text-center leading-relaxed">
                                Are you sure you want to remove this interview panel? This action will remove all expert details associated with it.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all text-sm">
                                    No, Keep it
                                </button>
                                <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-100 text-sm">
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Help helper
const FaTimesCircle = (props) => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1.2em" width="1.2em" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm121.6 313.1c4.7 4.7 4.7 12.3 0 17L338.3 377.7c-4.7 4.7-12.3 4.7-17 0L256 312.4l-65.3 65.3c-4.7 4.7-12.3 4.7-17 0L134.4 338.4c-4.7-4.7-4.7-12.3 0-17l65.3-65.3-65.3-65.3c-4.7-4.7-4.7-12.3 0-17l39.3-39.3c4.7-4.7 12.3-4.7 17 0l65.3 65.3 65.3-65.3c4.7-4.7 12.3-4.7 17 0l39.3 39.3c4.7 4.7 4.7 12.3 0 17l-65.3 65.3 65.3 65.3z"></path>
    </svg>
);

export default ManagePanelsModal;
