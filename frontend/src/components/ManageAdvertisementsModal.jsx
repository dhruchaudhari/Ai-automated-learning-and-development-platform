import React, { useState, useEffect } from 'react';
import { advertisementAPI } from '../utils/api';
import { toast } from 'react-hot-toast';
import { validateAdForm } from '../utils/validations';
import {
    FaPlus, FaTrash, FaEdit, FaTimes, FaFilePdf,
    FaCalendarAlt, FaCheck, FaTimesCircle, FaBullhorn,
    FaUser, FaClock, FaCalendarCheck
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

    const [formData, setFormData] = useState({
        title: '',
        lastDateToApply: '',
        detail: null,
        isActive: true
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchAdvertisements();
        }
    }, [isOpen]);

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
            isActive: true
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
            isActive: ad.isActive
        });
        setIsFormOpen(true);
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
                    {!isFormOpen && (
                        <div className="flex justify-between items-center bg-purple-50 p-4 rounded-xl border border-purple-100">
                            <div>
                                <h3 className="text-lg font-bold text-purple-800 flex items-center gap-2">
                                    <FaBullhorn />
                                    Job Advertisements
                                </h3>
                                <p className="text-sm text-purple-600">Post new job details for applicants</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsFormOpen(true)}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-all shadow-md active:scale-95"
                                >
                                    <FaPlus /> New Advertisement
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Form Section */}
                    {isFormOpen && (
                        <div className="bg-white border-2 border-purple-200 rounded-2xl p-6 shadow-lg animate-fade-in">
                            <div className="flex justify-between items-center mb-6 border-b pb-4">
                                <h3 className="text-xl font-bold text-gray-800">
                                    {editingAd ? 'Update Advertisement' : 'Create New Advertisement'}
                                </h3>
                                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                                    <FaTimes size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Title */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <FaBullhorn className="text-purple-600" /> Advertisement Title
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => handleInputChange('title', e.target.value)}
                                            placeholder="e.g., Software Engineer Recruitment 2024"
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all ${errors.title ? 'border-red-300 bg-red-50 focus:border-red-500' : 'border-gray-200 focus:border-purple-500'
                                                }`}
                                        />
                                        {errors.title && <p className="text-xs font-bold text-red-500 mt-1">{errors.title}</p>}
                                    </div>

                                    {/* Last Date */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <FaCalendarAlt className="text-purple-600" /> Last Date to Apply
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.lastDateToApply}
                                            onChange={(e) => handleInputChange('lastDateToApply', e.target.value)}
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all ${errors.lastDateToApply ? 'border-red-300 bg-red-50 focus:border-red-500' : 'border-gray-200 focus:border-purple-500'
                                                }`}
                                        />
                                        {errors.lastDateToApply && <p className="text-xs font-bold text-red-500 mt-1">{errors.lastDateToApply}</p>}
                                    </div>

                                    {/* PDF Upload */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <FaFilePdf className="text-purple-600" /> Detail Document (PDF)
                                        </label>
                                        <div className={`relative group border-2 border-dashed rounded-xl p-4 transition-all ${errors.detail ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-purple-400'
                                            }`}>
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                                                    <FaFilePdf />
                                                </div>
                                                <div className="truncate">
                                                    <p className="text-sm font-bold text-gray-700 truncate">
                                                        {formData.detail instanceof File ? formData.detail.name : (editingAd ? 'PDF Document attached' : 'Click or Drag PDF')}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500">Max size 10MB</p>
                                                </div>
                                            </div>
                                        </div>
                                        {errors.detail && <p className="text-xs font-bold text-red-500 mt-1">{errors.detail}</p>}
                                    </div>

                                    {/* Status Toggle */}
                                    <div className="flex items-center gap-4 py-3">
                                        <label className="text-sm font-bold text-gray-700 cursor-pointer" onClick={() => handleInputChange('isActive', !formData.isActive)}>
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
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-6 py-2.5 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg disabled:opacity-50 transition-all active:scale-95"
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Saving...
                                            </span>
                                        ) : (
                                            <>
                                                <FaCheck /> {editingAd ? 'Update Ad' : 'Create Ad'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Table List Section */}
                    {!isFormOpen && (
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <div className="overflow-x-auto border-2 border-gray-100 rounded-2xl">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b-2 border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Advertisement</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Last Date</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Audit</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="5" className="py-20 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
                                                        <p className="text-gray-500 font-medium">Loading advertisements...</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : advertisements.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="py-20 text-center">
                                                    <div className="flex flex-col items-center opacity-40">
                                                        <FaBullhorn size={48} className="text-gray-400 mb-4" />
                                                        <p className="text-gray-500 text-xl font-bold">No Advertisements Yet</p>
                                                        <p className="text-gray-400">Click the button above to create your first post.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            advertisements.map((ad) => (
                                                <tr key={ad._id} className="hover:bg-purple-50/30 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-600 rounded-lg">
                                                                <FaFilePdf />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-800">{ad.title}</p>
                                                                <a
                                                                    href={ad.detail}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-[10px] text-purple-600 hover:underline flex items-center gap-1"
                                                                >
                                                                    View PDF Link
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <FaCalendarCheck className="text-red-400" />
                                                            {ad.lastDateToApply ? format(new Date(ad.lastDateToApply), 'dd MMM yyyy') : 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${ad.isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
                                                            }`}>
                                                            {ad.isActive ? 'Active' : 'Draft'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                                <FaUser className="opacity-50" /> {ad.createdBy?.fullName || 'Admin'}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                                                <FaClock className="opacity-50" /> {format(new Date(ad.createdAt), 'dd/MM/yy HH:mm')}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleEdit(ad)}
                                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                                                                title="Edit"
                                                            >
                                                                <FaEdit />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteModal({ show: true, adId: ad._id })}
                                                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                                                                title="Delete"
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </ModalContainer>

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
