import React from 'react';
import {
    FaUser, FaEnvelope, FaPhone, FaCalendarAlt,
    FaGraduationCap, FaFilePdf, FaCheckCircle,
    FaBullhorn, FaImage, FaClock, FaClipboardList
} from 'react-icons/fa';

const InterviewViewDetails = ({
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

    const getStatusStyles = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved':
            case 'eligible':
                return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'rejected':
                return 'bg-rose-50 text-rose-700 border-rose-100';
            default:
                return 'bg-amber-50 text-amber-700 border-amber-100';
        }
    };

    const ads = (user.advertisements && user.advertisements.length > 0)
        ? user.advertisements
        : (user.advertisement ? [user.advertisement] : []);

    return (
        <div className="flex flex-col h-full bg-white font-sans text-gray-800">
            {/* Header - Column 1 (Personal Details) + Normal Mode Status Merge */}
            <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                <div className="flex flex-col md:flex-row items-center gap-6">
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
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-1">{user.fullName}</h2>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1.5"><FaEnvelope className="text-gray-400" /> {user.email}</span>
                            <span className="flex items-center gap-1.5"><FaPhone className="text-gray-400" /> {user.mobile}</span>
                            <span className="flex items-center gap-1.5 text-xs text-gray-400 border-l border-gray-200 pl-4 ml-0">
                                Registered: {formatDate(user.createdAt)}
                            </span>
                            <span className="text-xs text-gray-400 px-2 py-0.5 bg-gray-100 rounded-md">
                                {user.gender || 'N/A'}
                            </span>
                        </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Normal status</p>
                        <div className={`px-4 py-1.5 rounded-full border text-xs font-medium ${getStatusStyles(user.status)}`}>
                            {user.status || 'Pending'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">

                {/* Column 2: Education */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <FaGraduationCap className="text-primary-500" />
                        <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Academic qualification</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { level: 'Post Graduation', data: user.education?.qualifyingDegree },
                            { level: 'Graduation', data: user.education?.graduation },
                            { level: 'Intermediate', data: user.education?.twelfth },
                            { level: 'High School', data: user.education?.tenth }
                        ].map((item, idx) => item.data && (
                            <div key={idx} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm space-y-2">
                                <p className="text-[10px] text-gray-400 font-medium uppercase truncate">{item.level}</p>
                                <p className="text-sm font-semibold text-gray-800 truncate">{item.data.degree || item.data.board}</p>
                                <div className="flex justify-between items-center text-[10px] text-gray-500">
                                    <span>{item.data.passingYear}</span>
                                    <span className="font-bold text-primary-600">{item.data.percentage || item.data.cgpa || 'N/A'} {item.data.percentage ? '%' : (item.data.cgpa ? 'CPI' : '')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Column 3: Skillset */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <FaCheckCircle className="text-emerald-500" size={14} />
                        <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Skillset categories</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {user.skillSets && Object.values(user.skillSets).flat().length > 0 ? (
                            Object.entries(user.skillSets).map(([category, skills]) =>
                                skills.length > 0 && skills.map((skill, idx) => (
                                    <span key={`${category}-${idx}`} className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium border border-gray-100">
                                        {skill}
                                    </span>
                                ))
                            )
                        ) : (
                            <p className="text-xs text-gray-400 italic">No skills documented</p>
                        )}
                    </div>
                </section>

                {/* Columns 4, 5, 6: Advertisement, Panels, Schedule & Email */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <FaClipboardList className="text-indigo-500" />
                        <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Interview assignments</h3>
                    </div>
                    <div className="space-y-4">
                        {ads.length > 0 ? ads.map((ad, idx) => {
                            const assignedPanel = user.panelAssignments?.find(pa => (pa.advertisementId?._id || pa.advertisementId)?.toString() === ad._id?.toString());
                            const panelInfo = panels.find(p => p._id === (assignedPanel?.panelId?._id || assignedPanel?.panelId));
                            const adMark = user.advertisementMarks?.find(am => (am.advertisementId?._id || am.advertisementId)?.toString() === ad._id?.toString());
                            const scheduledDate = adMark?.interviewSchedule?.scheduledDate || user.interviewSchedule?.scheduledDate;
                            const emailSent = adMark?.interviewEmailSent?.sent || user.interviewEmailSent?.sent;

                            return (
                                <div key={ad._id || idx} className="p-6 bg-gray-50/50 border border-gray-100 rounded-2xl space-y-6">
                                    {/* Column 4: Advertisement */}
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <FaBullhorn className="text-primary-400" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{ad.title}</p>
                                                <p className="text-[10px] text-gray-400 leading-none mt-1">Ref No: {ad.advtNo || 'N/A'}</p>
                                            </div>
                                        </div>
                                        {ad.detail && (
                                            <button
                                                onClick={() => onViewDocument(ad.detail)}
                                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                                            >
                                                <FaFilePdf size={14} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Column 5: Panels */}
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] text-gray-400 font-medium uppercase">Assigned panel</p>
                                            <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm flex items-center gap-2">
                                                <FaUser className="text-indigo-400 size-3" />
                                                <span className="text-xs font-semibold text-indigo-700">
                                                    {panelInfo?.name || 'Pending assignment'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Column 6: Schedule */}
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] text-gray-400 font-medium uppercase">Scheduled date</p>
                                            <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm flex items-center gap-2">
                                                <FaClock className="text-pink-400 size-3" />
                                                <span className="text-xs font-medium text-gray-700">
                                                    {scheduledDate ? formatDate(scheduledDate) : 'Not scheduled'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Column 6: Email Status */}
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] text-gray-400 font-medium uppercase">Email invitation</p>
                                            <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm flex items-center gap-2">
                                                <FaCheckCircle className={emailSent ? 'text-emerald-500 size-3' : 'text-amber-400 size-3'} />
                                                <span className={`text-xs font-medium ${emailSent ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                    {emailSent ? 'Accepted/Sent' : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <p className="text-xs text-gray-400 italic">No interview assignments found</p>
                        )}
                    </div>
                </section>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex justify-end">
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

export default InterviewViewDetails;
