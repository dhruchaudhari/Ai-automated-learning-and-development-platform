import React from 'react';
import {
  FaUser, FaEnvelope, FaPhone, FaCalendarAlt,
  FaGraduationCap, FaFilePdf, FaImage, FaClock
} from 'react-icons/fa';

const ViewUser = ({
  user,
  onClose,
  onViewDocument,
  onViewImage
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

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
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
      {/* Header - Columns 1 & 4 */}
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
            </div>
          </div>
          <div className="shrink-0">
            <div className={`px-4 py-1.5 rounded-full border text-xs font-medium ${getStatusStyles(user.status)}`}>
              {user.status || 'Pending'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Column 2: Registration Date */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Registration details</h3>
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <FaCalendarAlt className="text-primary-500 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-700">{formatDate(user.createdAt)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatTime(user.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Column 3: Gender */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Personal info</h3>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <FaUser className="text-primary-500" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-tighter">Gender</p>
                <p className="text-sm font-medium text-gray-700">{user.gender || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Column 5: Education */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Education summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
                <FaGraduationCap />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {user.education?.qualifyingDegree?.degree || user.education?.graduation?.degree || 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Class of {user.education?.graduation?.passingYear || user.education?.qualifyingDegree?.passingYear || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Column 6: Skillset */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Skillset expertise</h3>
          <div className="flex flex-wrap gap-2">
            {user.skillSets && Object.values(user.skillSets).flat().length > 0 ? (
              Object.entries(user.skillSets).map(([category, skills]) =>
                skills.length > 0 && skills.map((skill, idx) => (
                  <span key={`${category}-${idx}`} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium border border-gray-200">
                    {skill}
                  </span>
                ))
              )
            ) : (
              <p className="text-xs text-gray-400 italic">No skills documented</p>
            )}
          </div>
        </div>

        {/* Column 7: Advertisement */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Applied advertisements</h3>
          <div className="space-y-3">
            {ads.length > 0 ? ads.map((ad, idx) => (
              <div key={ad._id || idx} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-primary-400"></span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{ad.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Reference No: {ad.advtNo || 'N/A'}</p>
                  </div>
                </div>
                {ad.detail && (
                  <button
                    onClick={() => onViewDocument(ad.detail)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 text-xs font-medium rounded-lg hover:bg-rose-100 transition-colors border border-rose-100"
                  >
                    <FaFilePdf size={12} />
                    View PDF
                  </button>
                )}
              </div>
            )) : (
              <p className="text-xs text-gray-400 italic">No active applications</p>
            )}
          </div>
        </div>

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

export default ViewUser;