import React, { useState, useEffect } from 'react';
import { FaBuilding, FaBriefcase, FaUserCheck, FaBullhorn, FaFilePdf, FaCalendarCheck, FaGlobe, FaMapMarkerAlt } from 'react-icons/fa';
import ModalContainer from './ModalContainer';
import { format } from 'date-fns';
import { advertisementAPI } from '../utils/api';

const AdDetailsModal = ({ isOpen, onClose, advertisement: initialAdvertisement, onViewDocument }) => {
    const [advertisement, setAdvertisement] = useState(initialAdvertisement);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && initialAdvertisement) {
            const hasFullDetails = initialAdvertisement.job && typeof initialAdvertisement.job === 'object' && initialAdvertisement.job.jobCode;

            if (!hasFullDetails && initialAdvertisement._id) {
                fetchFullDetails(initialAdvertisement._id);
            } else {
                setAdvertisement(initialAdvertisement);
            }
        }
    }, [isOpen, initialAdvertisement]);

    const fetchFullDetails = async (id) => {
        setLoading(true);
        try {
            const res = await advertisementAPI.getById(id);
            setAdvertisement(res.data.data);
        } catch (err) {
            console.error('Failed to fetch full ad details', err);
            setAdvertisement(initialAdvertisement);
        } finally {
            setLoading(false);
        }
    };

    if (!advertisement && !loading) return null;

    const job = advertisement?.job;
    const role = advertisement?.role || (typeof job === 'object' ? job?.role : null);
    const department = advertisement?.department || (typeof job === 'object' ? job?.department : null);

    const formatDate = (dateString, fallback = 'N/A') => {
        if (!dateString) return fallback;
        try {
            return format(new Date(dateString), 'dd MMM yyyy');
        } catch (e) {
            return dateString;
        }
    };

    return (
        <ModalContainer
            isOpen={isOpen}
            onClose={onClose}
            title="Advertisement Details"
            size="large"
        >
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                    <p className="mt-4 text-gray-500">Fetching complete details...</p>
                </div>
            ) : (
                <div className="flex flex-col h-full overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto text-gray-700">
                    {/* Header Section */}
                    <div className="border-b pb-5 flex flex-col md:flex-row justify-between items-start md:items-center bg-white gap-4">
                        <div>
                            <h3 className="text-xl text-gray-800 tracking-tight flex items-center gap-2 leading-tight">
                                <FaBullhorn className="text-purple-600 flex-shrink-0" />
                                <span>{advertisement?.title || 'Untitled Advertisement'}</span>
                            </h3>
                            <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                    Job ID: {job?.jobCode || 'N/A'}
                                </span>
                                {job?.location?.isRemote && (
                                    <span className="text-[11px] text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-1">
                                        <FaGlobe size={10} /> Remote Available
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-left md:text-right bg-red-50/50 p-3 rounded-lg border border-red-100 min-w-[180px]">
                            <p className="text-red-500 text-[10px] uppercase tracking-wider mb-0.5">Application Deadline</p>
                            <p className="text-lg text-gray-800 flex items-center gap-2 md:justify-end">
                                <FaCalendarCheck className="text-red-400" size={16} />
                                {formatDate(advertisement?.lastDateToApply)}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Department Details */}
                        <div className="bg-blue-50/30 p-5 rounded-xl border border-blue-100/50">
                            <h4 className="text-blue-800 text-[11px] flex items-center gap-2 mb-4 uppercase tracking-widest border-b border-blue-100 pb-2">
                                <FaBuilding className="text-blue-500" /> Department Information
                            </h4>
                            {department ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] text-blue-400 uppercase tracking-widest mb-1">Name</p>
                                            <p className="text-md text-gray-800 leading-tight">{department.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-blue-400 uppercase tracking-widest mb-1">Code</p>
                                            <p className="text-sm text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-100 inline-block">
                                                {department.code}
                                            </p>
                                        </div>
                                    </div>
                                    {department.description && (
                                        <div>
                                            <p className="text-[10px] text-blue-400 uppercase tracking-widest mb-1">Overview</p>
                                            <p className="text-sm text-gray-600 leading-relaxed bg-white/50 p-3 rounded-lg border border-blue-50">
                                                {department.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-4 text-center">
                                    <p className="text-sm text-gray-400 italic">No department data found</p>
                                </div>
                            )}
                        </div>

                        {/* Role Details */}
                        <div className="bg-purple-50/30 p-5 rounded-xl border border-purple-100/50">
                            <h4 className="text-purple-800 text-[11px] flex items-center gap-2 mb-4 uppercase tracking-widest border-b border-purple-100 pb-2">
                                <FaUserCheck className="text-purple-500" /> Role Specifications
                            </h4>
                            {role ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white p-2 rounded-lg border border-purple-100">
                                            <p className="text-[10px] text-purple-400 uppercase tracking-widest mb-0.5">Level</p>
                                            <p className="text-sm text-gray-800">{role.level}</p>
                                        </div>
                                        <div className="bg-white p-2 rounded-lg border border-purple-100">
                                            <p className="text-[10px] text-purple-400 uppercase tracking-widest mb-0.5">Employment</p>
                                            <p className="text-sm text-gray-800">{role.employmentType}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-purple-400 uppercase tracking-widest mb-1.5">Education</p>
                                        <p className="text-sm text-gray-800 leading-relaxed bg-white p-2.5 rounded-lg border border-purple-100 shadow-sm">
                                            {role.education}
                                        </p>
                                    </div>
                                    {/* Skills Combined */}
                                    {(role.requiredSkills?.length > 0 || role.preferredSkills?.length > 0) && (
                                        <div>
                                            <p className="text-[10px] text-purple-400 uppercase tracking-widest mb-2">Capabilities</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {role.requiredSkills?.map((s, idx) => (
                                                    <span key={`req-${idx}`} className="px-2 py-1 bg-purple-600 text-white rounded text-[10px] border border-purple-700">
                                                        {(s.name || s)} {s.weight ? `(${Math.round(s.weight * 100)}%)` : ''}
                                                    </span>
                                                ))}
                                                {role.preferredSkills?.map((s, idx) => (
                                                    <span key={`pref-${idx}`} className="px-2 py-1 bg-white border border-indigo-100 text-indigo-700 rounded text-[10px]">
                                                        {(s.name || s)} {s.weight ? `(${Math.round(s.weight * 100)}%)` : ''}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-4 text-center">
                                    <p className="text-sm text-gray-400 italic">No role details found</p>
                                </div>
                            )}
                        </div>

                        {/* Job Details - Full Column */}
                        <div className="bg-white border border-gray-100 p-6 rounded-2xl lg:col-span-2 shadow-sm relative overflow-hidden">
                            <h4 className="text-gray-800 text-[11px] flex items-center gap-2 mb-6 uppercase tracking-widest border-b pb-2">
                                <FaBriefcase className="text-indigo-600" /> Job Profile & Requirements
                            </h4>
                            {job ? (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                <FaMapMarkerAlt size={10} /> Location
                                            </p>
                                            <p className="text-sm text-gray-800">
                                                {job.location?.city || 'N/A'}{job.location?.state ? `, ${job.location.state}` : ''}{job.location?.country ? `, ${job.location.country}` : ''}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Openings</p>
                                            <p className="text-md text-indigo-600">{job.openings} positions</p>
                                        </div>
                                        <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100 md:col-span-2">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Salary Range</p>
                                            <p className="text-sm text-green-600">
                                                {job.salaryRange?.currency || 'INR'} {job.salaryRange?.min?.toLocaleString()} - {job.salaryRange?.max?.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-50">
                                        <div>
                                            <p className="text-[10px] text-indigo-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <span className="w-4 h-[1px] bg-indigo-500" /> Description
                                            </p>
                                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap pl-3 border-l-2 border-indigo-50">
                                                {job.description}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-indigo-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <span className="w-4 h-[1px] bg-indigo-500" /> Responsibilities
                                            </p>
                                            <ul className="space-y-2.5">
                                                {job.responsibilities?.map((r, idx) => (
                                                    <li key={idx} className="text-sm text-gray-650 flex gap-3 p-2 rounded-lg bg-gray-50/30 border border-gray-50/50">
                                                        <span className="text-indigo-400 mt-1 flex-shrink-0">•</span>
                                                        {r}
                                                    </li>
                                                ))}
                                                {(!job.responsibilities || job.responsibilities.length === 0) && (
                                                    <p className="text-xs text-gray-400 italic">No specific responsibilities listed.</p>
                                                )}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Criteria Set - Comprehensive */}
                                    {role?.criteriaSet && (
                                        <div className="mt-8 pt-6 border-t border-gray-100 bg-gray-50/30 -mx-6 -mb-6 p-6 rounded-b-2xl">
                                            <p className="text-[11px] text-gray-800 uppercase tracking-widest mb-5 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                                                Eligibility Matrix
                                            </p>
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-4">
                                                {Object.entries(role.criteriaSet)
                                                    .filter(([k, v]) => v !== undefined && k !== '_id' && !Array.isArray(v) && v !== null && v !== '')
                                                    .map(([key, value]) => (
                                                        <div key={key}>
                                                            <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">
                                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                                            </p>
                                                            <div className="flex items-baseline gap-0.5">
                                                                <p className="text-md text-gray-800">
                                                                    {typeof value === 'boolean' ? (value ? 'Required' : 'N/A') : value}
                                                                </p>
                                                                {typeof value === 'number' && key.toLowerCase().includes('percentage') &&
                                                                    <span className="text-[10px] text-gray-400">%</span>
                                                                }
                                                                {typeof value === 'number' && key.toLowerCase().includes('experience') &&
                                                                    <span className="text-[9px] text-gray-400 uppercase ml-0.5">Years</span>
                                                                }
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                            {/* Specialized Degrees & Specific Degrees */}
                                            <div className="mt-6 pt-5 border-t border-gray-200">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {(role.criteriaSet.specialization) && (
                                                        <div>
                                                            <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1.5">Preferred Specialization</p>
                                                            <p className="text-sm text-gray-700 bg-white px-2.5 py-1 rounded border border-gray-100 inline-block">
                                                                {role.criteriaSet.specialization}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {role.criteriaSet.specificDegrees?.length > 0 && (
                                                        <div>
                                                            <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1.5">Mandatory Disciplines</p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {role.criteriaSet.specificDegrees.map((degree, idx) => (
                                                                    <span key={idx} className="px-2.5 py-1 bg-white text-purple-700 text-[10px] rounded border border-purple-50 shadow-sm">
                                                                        {typeof degree === 'object' ? degree.name : degree}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <p className="text-sm text-gray-400 italic">Job profile documentation pending finalization.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* PDF Viewing Section */}
                    {advertisement?.detail && (
                        <div className="pt-6 border-t border-gray-100 flex justify-center pb-2">
                            <button
                                onClick={() => onViewDocument(advertisement.detail)}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-10 py-3.5 rounded-xl transition-all flex items-center gap-3 shadow-md hover:shadow-lg active:scale-95"
                            >
                                <FaFilePdf className="text-lg" />
                                <span className="text-sm tracking-wider">Download Advertisement PDF</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </ModalContainer>
    );
};

export default AdDetailsModal;
