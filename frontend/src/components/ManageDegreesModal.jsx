import React, { useState, useEffect } from 'react';
import { degreeOptionAPI } from '../utils/api';
import { toast } from 'react-hot-toast';
import {
    FaTimes,
    FaPlus,
    FaEdit,
    FaTrash,
    FaSave,
    FaGraduationCap,
    FaChevronDown,
    FaChevronRight,
    FaSpinner,
    FaTimesCircle
} from 'react-icons/fa';

const ManageDegreesModal = ({ isOpen, onClose, onRefresh }) => {
    const [degrees, setDegrees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    // New degree form
    const [showAddForm, setShowAddForm] = useState(false);
    const [newDegree, setNewDegree] = useState({ name: '', category: 'bachelor', specializations: '' });

    // Edit state
    const [editId, setEditId] = useState(null);
    const [editData, setEditData] = useState({ name: '', category: 'bachelor', specializations: '' });

    // Delete confirmation
    const [deleteId, setDeleteId] = useState(null);

    // New specialization input for existing degree
    const [newSpecInput, setNewSpecInput] = useState('');

    useEffect(() => {
        if (isOpen) fetchDegrees();
    }, [isOpen]);

    const fetchDegrees = async () => {
        try {
            setLoading(true);
            const res = await degreeOptionAPI.getAll();
            setDegrees(res.data.data || []);
        } catch (err) {
            console.error('Failed to load degree options', err);
            toast.error('Failed to load degree options');
        } finally {
            setLoading(false);
        }
    };

    // ─── Create ────────────────────────────────
    const handleCreate = async () => {
        if (!newDegree.name.trim()) {
            toast.error('Degree name is required');
            return;
        }
        try {
            const specs = newDegree.specializations
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);

            await degreeOptionAPI.create({
                name: newDegree.name.trim(),
                category: newDegree.category,
                specializations: specs
            });
            toast.success('Degree added');
            setNewDegree({ name: '', category: 'bachelor', specializations: '' });
            setShowAddForm(false);
            fetchDegrees();
            if (onRefresh) onRefresh();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create');
        }
    };

    // ─── Edit ──────────────────────────────────
    const startEdit = (deg) => {
        setEditId(deg._id);
        setEditData({
            name: deg.name,
            category: deg.category,
            specializations: (deg.specializations || []).join(', ')
        });
    };

    const handleUpdate = async () => {
        if (!editData.name.trim()) {
            toast.error('Degree name is required');
            return;
        }
        try {
            const specs = editData.specializations
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);

            await degreeOptionAPI.update(editId, {
                name: editData.name.trim(),
                category: editData.category,
                specializations: specs
            });
            toast.success('Degree updated');
            setEditId(null);
            fetchDegrees();
            if (onRefresh) onRefresh();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update');
        }
    };

    // ─── Add specialization to existing degree ─
    const handleAddSpec = async (degId) => {
        if (!newSpecInput.trim()) return;
        const deg = degrees.find(d => d._id === degId);
        if (!deg) return;

        const updatedSpecs = [...(deg.specializations || []), newSpecInput.trim()];
        try {
            await degreeOptionAPI.update(degId, {
                name: deg.name,
                category: deg.category,
                specializations: updatedSpecs
            });
            toast.success('Specialization added');
            setNewSpecInput('');
            fetchDegrees();
            if (onRefresh) onRefresh();
        } catch (err) {
            toast.error('Failed to add specialization');
        }
    };

    // ─── Remove single specialization ──────────
    const handleRemoveSpec = async (degId, specToRemove) => {
        const deg = degrees.find(d => d._id === degId);
        if (!deg) return;

        const updatedSpecs = (deg.specializations || []).filter(s => s !== specToRemove);
        try {
            await degreeOptionAPI.update(degId, {
                name: deg.name,
                category: deg.category,
                specializations: updatedSpecs
            });
            toast.success('Specialization removed');
            fetchDegrees();
            if (onRefresh) onRefresh();
        } catch (err) {
            toast.error('Failed to remove specialization');
        }
    };

    // ─── Delete ────────────────────────────────
    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await degreeOptionAPI.delete(deleteId);
            toast.success('Degree deleted');
            setDeleteId(null);
            if (expandedId === deleteId) setExpandedId(null);
            fetchDegrees();
            if (onRefresh) onRefresh();
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    if (!isOpen) return null;

    const bachelorDegrees = degrees.filter(d => d.category === 'bachelor');
    const masterDegrees = degrees.filter(d => d.category === 'master');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[90] p-4 animate-fade-in">
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
                    <div className="flex items-center gap-3">
                        <FaGraduationCap className="w-5 h-5" />
                        <h3 className="text-lg font-semibold">Manage Degrees & Specializations</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <FaSpinner className="w-8 h-8 text-primary-600 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Add new button / form */}
                            {!showAddForm ? (
                                <button
                                    onClick={() => setShowAddForm(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    <FaPlus /> Add New Degree
                                </button>
                            ) : (
                                <div className="p-4 border-2 border-dashed border-primary-300 rounded-xl bg-primary-50 space-y-3">
                                    <h4 className="font-semibold text-primary-700">Add New Degree</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Degree name, e.g. Bachelor of Science"
                                            value={newDegree.name}
                                            onChange={e => setNewDegree(prev => ({ ...prev, name: e.target.value }))}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                        <select
                                            value={newDegree.category}
                                            onChange={e => setNewDegree(prev => ({ ...prev, category: e.target.value }))}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        >
                                            <option value="bachelor">Bachelor's (Graduation)</option>
                                            <option value="master">Master's (Qualifying Degree)</option>
                                        </select>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Specializations (comma-separated), e.g. CSE, IT, Data Science"
                                        value={newDegree.specializations}
                                        onChange={e => setNewDegree(prev => ({ ...prev, specializations: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                            <FaSave /> Save
                                        </button>
                                        <button onClick={() => { setShowAddForm(false); setNewDegree({ name: '', category: 'bachelor', specializations: '' }); }}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Degree Lists */}
                            {[
                                { label: "Bachelor's / Graduation Degrees", list: bachelorDegrees },
                                { label: "Master's / Qualifying Degrees", list: masterDegrees }
                            ].map(({ label, list }) => (
                                <div key={label}>
                                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</h4>
                                    {list.length === 0 ? (
                                        <p className="text-gray-400 italic text-sm ml-2">No degrees added yet</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {list.map(deg => (
                                                <div key={deg._id} className="border border-gray-200 rounded-xl overflow-hidden">
                                                    {/* Degree Header */}
                                                    <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                                                        <button
                                                            onClick={() => setExpandedId(expandedId === deg._id ? null : deg._id)}
                                                            className="flex items-center gap-2 flex-1 text-left font-medium text-gray-800"
                                                        >
                                                            {expandedId === deg._id ? <FaChevronDown className="text-gray-400" /> : <FaChevronRight className="text-gray-400" />}
                                                            <FaGraduationCap className="text-primary-500" />
                                                            {deg.name}
                                                            <span className="text-xs text-gray-400 ml-2">
                                                                ({(deg.specializations || []).length} specializations)
                                                            </span>
                                                        </button>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => startEdit(deg)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Edit"
                                                            >
                                                                <FaEdit />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteId(deg._id)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete"
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Expanded content */}
                                                    {expandedId === deg._id && (
                                                        <div className="p-4 border-t border-gray-200 space-y-3">
                                                            {/* Edit form */}
                                                            {editId === deg._id ? (
                                                                <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                        <input
                                                                            type="text"
                                                                            value={editData.name}
                                                                            onChange={e => setEditData(prev => ({ ...prev, name: e.target.value }))}
                                                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                            placeholder="Degree name"
                                                                        />
                                                                        <select
                                                                            value={editData.category}
                                                                            onChange={e => setEditData(prev => ({ ...prev, category: e.target.value }))}
                                                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                        >
                                                                            <option value="bachelor">Bachelor's</option>
                                                                            <option value="master">Master's</option>
                                                                        </select>
                                                                    </div>
                                                                    <textarea
                                                                        value={editData.specializations}
                                                                        onChange={e => setEditData(prev => ({ ...prev, specializations: e.target.value }))}
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                        rows={2}
                                                                        placeholder="Comma-separated specializations"
                                                                    />
                                                                    <div className="flex gap-2">
                                                                        <button onClick={handleUpdate} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors">
                                                                            <FaSave /> Save
                                                                        </button>
                                                                        <button onClick={() => setEditId(null)} className="px-3 py-1.5 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm transition-colors">
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    {/* Specialization chips */}
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {(deg.specializations || []).map((spec, idx) => (
                                                                            <span
                                                                                key={idx}
                                                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700 border border-primary-200"
                                                                            >
                                                                                {spec}
                                                                                <button
                                                                                    onClick={() => handleRemoveSpec(deg._id, spec)}
                                                                                    className="text-primary-400 hover:text-red-600 transition-colors"
                                                                                    title="Remove"
                                                                                >
                                                                                    <FaTimesCircle className="w-3 h-3" />
                                                                                </button>
                                                                            </span>
                                                                        ))}
                                                                        {(deg.specializations || []).length === 0 && (
                                                                            <span className="text-gray-400 italic text-sm">No specializations</span>
                                                                        )}
                                                                    </div>

                                                                    {/* Add specialization input */}
                                                                    <div className="flex gap-2 mt-2">
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Add specialization…"
                                                                            value={expandedId === deg._id ? newSpecInput : ''}
                                                                            onChange={e => setNewSpecInput(e.target.value)}
                                                                            onKeyDown={e => e.key === 'Enter' && handleAddSpec(deg._id)}
                                                                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                                        />
                                                                        <button
                                                                            onClick={() => handleAddSpec(deg._id)}
                                                                            className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm transition-colors"
                                                                        >
                                                                            <FaPlus className="w-3 h-3" /> Add
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {degrees.length === 0 && !loading && (
                                <div className="text-center py-8 text-gray-500">
                                    <FaGraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p>No degree options configured yet.</p>
                                    <p className="text-sm">Click "Add New Degree" to get started.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Delete confirmation overlay */}
                {deleteId && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                        <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
                            <h4 className="font-semibold text-lg mb-2">Delete Degree?</h4>
                            <p className="text-gray-600 text-sm mb-4">
                                This will permanently remove this degree and all its specializations. This action cannot be undone.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => setDeleteId(null)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageDegreesModal;
