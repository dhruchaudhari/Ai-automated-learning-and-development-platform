import React, { useMemo } from 'react';
import {
    FaUser, FaEnvelope, FaCalendarAlt,
    FaGraduationCap, FaFilePdf, FaCheckCircle,
    FaBullhorn, FaImage, FaClock, FaAward, FaChartLine
} from 'react-icons/fa';

const MeritViewDetails = ({
    user,
    advertisementId,
    onClose,
    onViewDocument,
    onViewImage,
    panels = []
}) => {
    if (!user) return null;

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const ads = useMemo(() => user.advertisements || [], [user]);

    const activeAd = useMemo(() => {
        if (!advertisementId) return ads[0];
        return ads.find(a => a._id === advertisementId) || ads[0];
    }, [ads, advertisementId]);

    const marksData = useMemo(() => {
        return user.advertisementMarks?.find(m =>
            (m.advertisementId?._id || m.advertisementId)?.toString() === activeAd?._id?.toString()
        );
    }, [user, activeAd]);

    const panelData = useMemo(() => {
        return user.panelAssignments?.find(p =>
            (p.advertisementId?._id || p.advertisementId)?.toString() === activeAd?._id?.toString()
        );
    }, [user, activeAd]);

    return (
        <div className="flex flex-col h-full bg-white font-sans text-gray-800">
            {/* Header - Column 1 (Details) + Performance Summary */}
            <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="relative">
                        {user.profileImage ? (
                            <img
                                src={user.profileImage}
                                alt={user.fullName}
                                className="w-24 h-24 rounded-2xl object-cover border border-gray-200 shadow-sm cursor-pointer hover:border-primary-400 transition-colors"
                                onClick={() => onViewImage(user.profileImage)}
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-2xl bg-white border border-dashed border-gray-300 flex items-center justify-center text-gray-300">
                                <FaImage size={32} />
                            </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm border border-white">
                            Merit
                        </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-1">{user.fullName}</h2>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1.5"><FaEnvelope className="text-gray-400" /> {user.email}</span>
                            <span className="flex items-center gap-2 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium border border-indigo-100">
                                <FaAward className="size-3" /> Merit candidate
                            </span>
                        </div>
                    </div>
                    <div className="shrink-0">
                        <div className="text-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mb-1">Interview score</p>
                            <p className="text-3xl font-bold text-gray-900 leading-none">
                                {marksData?.marks !== undefined ? parseFloat(marksData.marks).toFixed(2) : (user.interviewMarks !== undefined ? parseFloat(user.interviewMarks).toFixed(2) : '00.00')}
                                <span className="text-xs text-gray-400 font-normal ml-1">/ 100</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">

                {/* Column 2: Advertisement */}
                {activeAd && (
                    <section className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col md:flex-row gap-6 items-center">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <FaBullhorn className="text-primary-500" />
                                <h3 className="text-sm font-semibold text-gray-900">Active advertisement</h3>
                            </div>
                            <p className="text-base font-medium text-gray-800 line-clamp-1">{activeAd.title}</p>
                            <p className="text-xs text-gray-400 mt-1">Ref No: {activeAd.advtNo || 'N/A'}</p>
                        </div>
                        {activeAd.detail && (
                            <button
                                onClick={() => onViewDocument(activeAd.detail)}
                                className="shrink-0 flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 text-xs font-medium rounded-xl hover:bg-rose-100 transition-colors border border-rose-100"
                            >
                                <FaFilePdf /> View PDF
                            </button>
                        )}
                    </section>
                )}

                {/* Columns 3, 4, 5, 6: Merit Marks */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <FaChartLine className="text-primary-500" />
                        <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Academic merit breakdown</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'PG % & CPI', val: user.education?.qualifyingDegree, color: 'text-rose-600' },
                            { label: 'Graduation % & CPI', val: user.education?.graduation, color: 'text-amber-600' },
                            { label: 'Intermediate 12th', val: user.education?.twelfth, color: 'text-indigo-600' },
                            { label: 'High School 10th', val: user.education?.tenth, color: 'text-emerald-600' }
                        ].map((item, idx) => (
                            <div key={idx} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col items-center text-center">
                                <p className="text-[10px] text-gray-400 font-medium uppercase mb-3">{item.label}</p>
                                <p className={`text-lg font-bold ${item.color}`}>
                                    {item.val?.percentage ? `${item.val.percentage}%` : 'N/A'}
                                </p>
                                {item.val?.cgpa && (
                                    <p className="text-[10px] text-gray-500 font-medium mt-1">CPI: {item.val.cgpa}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Merge: Interview Mode Details (Panel, Schedule, Email) */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <FaClock className="text-indigo-500" />
                        <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Interview session summary</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-indigo-50/30 border border-indigo-100/50 rounded-2xl flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white border border-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                                <FaUser size={14} />
                            </div>
                            <div>
                                <p className="text-[10px] text-indigo-400 font-medium uppercase tracking-tight">Assigned panel</p>
                                <p className="text-sm font-semibold text-indigo-900">{panelData?.panelId?.name || 'Not assigned'}</p>
                            </div>
                        </div>

                        <div className="p-4 bg-pink-50/30 border border-pink-100/50 rounded-2xl flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white border border-pink-50 flex items-center justify-center text-pink-500 shrink-0">
                                <FaCalendarAlt size={14} />
                            </div>
                            <div>
                                <p className="text-[10px] text-pink-400 font-medium uppercase tracking-tight">Scheduled on</p>
                                <p className="text-sm font-semibold text-pink-900">{marksData?.interviewSchedule?.scheduledDate ? formatDate(marksData.interviewSchedule.scheduledDate) : 'Not scheduled'}</p>
                            </div>
                        </div>

                        <div className="p-4 bg-emerald-50/30 border border-emerald-100/50 rounded-2xl flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white border border-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                                <FaCheckCircle size={14} />
                            </div>
                            <div>
                                <p className="text-[10px] text-emerald-400 font-medium uppercase tracking-tight">Email status</p>
                                <p className="text-sm font-semibold text-emerald-900">
                                    {marksData?.interviewEmailSent?.sent || user.interviewEmailSent?.sent ? 'Invitation sent' : 'Sent pending'}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex justify-end items-center gap-4">
                <p className="text-xs text-gray-400 font-medium mr-auto">Standard verified merit profile</p>
                <button
                    onClick={onClose}
                    className="px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-black transition-all shadow-sm active:scale-95"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default MeritViewDetails;
