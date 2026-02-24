import React, { useState } from "react";
import { format } from "date-fns";
import {
  FaUser,
  FaCalendar,
  FaEnvelope,
  FaPhone,
  FaCamera,
  FaFilePdf,
  FaSpinner,
  FaEye,
  FaTimes,
  FaMars,
  FaVenus,
  FaTransgender,
  FaMapMarkerAlt,
  FaGraduationCap,
  FaIdCard,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaCode,
  FaLightbulb,
  FaPuzzlePiece,
  FaWrench,
  FaShieldAlt,
  FaClipboardList,
  FaUsers,
  FaBullhorn
} from "react-icons/fa";

const ViewUser = ({ user, advertisementId, onClose, onApprove, onReject, onSetPending, onViewDocument, onViewImage, onAssignPanel }) => {
  const [imageLoading, setImageLoading] = useState(true);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd MMM yyyy");
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd MMM yyyy, hh:mm a");
    } catch {
      return dateString;
    }
  };

  const formatMobile = (mobile) => {
    if (!mobile) return "N/A";
    return mobile;
  };

  const getGenderIcon = (gender) => {
    switch (gender) {
      case 'Male': return <FaMars className="text-blue-500" />;
      case 'Female': return <FaVenus className="text-pink-500" />;
      case 'Other': return <FaTransgender className="text-purple-500" />;
      default: return <FaUser className="text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <FaCheckCircle /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            <FaTimesCircle /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            <FaHourglassHalf /> Pending
          </span>
        );
    }
  };

  if (!user) {
    return (
      <div className="p-12 text-center">
        <FaTimes className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">User Not Found</h2>
        <p className="text-gray-500">The user data could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="bg-white max-h-[85vh] overflow-y-auto">
      {/* Header with Profile */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-8 relative">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Profile Image */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
              {user.profileImage ? (
                <>
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <FaSpinner className="w-6 h-6 text-primary-600 animate-spin" />
                    </div>
                  )}
                  <img
                    src={user.profileImage}
                    alt="Profile"
                    className={`w-full h-full object-cover ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={() => setImageLoading(false)}
                    onError={() => setImageLoading(false)}
                  />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <FaUser className="w-10 h-10 text-gray-400" />
                </div>
              )}
            </div>
            {user.profileImage && (
              <button
                onClick={() => onViewImage(user.profileImage)}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-white text-primary-600 rounded-full flex items-center justify-center shadow-md hover:bg-primary-50 transition-colors"
                title="View Full Image"
              >
                <FaEye className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 text-white text-center md:text-left">
            <h2 className="text-2xl font-bold">{user.fullName || "Unknown User"}</h2>
            <p className="text-white/80 flex items-center justify-center md:justify-start gap-2 mt-1">
              <FaEnvelope className="w-4 h-4" />
              {user.email || "No email"}
            </p>
            <div className="mt-3 flex flex-wrap justify-center md:justify-start items-center gap-3">
              {getStatusBadge(user.status)}

              {/* Action Buttons for All Users */}
              {(!user.status || user.status === 'pending') && (
                <div className="flex gap-2">
                  <button
                    onClick={() => onApprove(user._id)}
                    className="px-4 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-semibold shadow-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onReject(user._id)}
                    className="px-4 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-semibold shadow-sm"
                  >
                    Reject
                  </button>
                </div>
              )}
              {user.status === 'approved' && (
                <div className="flex gap-2">
                  {onSetPending && (
                    <button
                      onClick={() => onSetPending(user._id)}
                      className="px-4 py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-semibold shadow-sm"
                    >
                      Set Pending
                    </button>
                  )}
                  <button
                    onClick={() => onReject(user._id)}
                    className="px-4 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-semibold shadow-sm"
                  >
                    Reject
                  </button>
                </div>
              )}
              {user.status === 'rejected' && (
                <div className="flex gap-2">
                  {onSetPending && (
                    <button
                      onClick={() => onSetPending(user._id)}
                      className="px-4 py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-semibold shadow-sm"
                    >
                      Set Pending
                    </button>
                  )}
                  <button
                    onClick={() => onApprove(user._id)}
                    className="px-4 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-semibold shadow-sm"
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Personal Information */}
        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaIdCard className="text-primary-600" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Full Name</p>
              <p className="text-gray-800 font-medium">{user.fullName || "N/A"}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Gender</p>
              <p className="text-gray-800 font-medium flex items-center gap-2">
                {getGenderIcon(user.gender)}
                {user.gender || "N/A"}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date of Birth</p>
              <p className="text-gray-800 font-medium flex items-center gap-2">
                <FaCalendar className="text-primary-500" />
                {formatDate(user.dob)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Age</p>
              <p className="text-gray-800 font-medium">{user.age ? `${user.age} years` : "N/A"}</p>
            </div>
            {user.advertisements && user.advertisements.length > 0 && (
              <div className="bg-purple-50 rounded-xl p-5 border border-purple-100 md:col-span-2">
                <p className="text-xs text-purple-600 uppercase font-bold tracking-wide mb-3 flex items-center gap-2">
                  <FaBullhorn /> {advertisementId ? "Applied Advertisement Details" : `Applied Advertisements (${user.advertisements.length})`}
                </p>
                <div className="space-y-4">
                  {user.advertisements
                    .filter(ad => !advertisementId || ad._id === advertisementId)
                    .map((ad, idx) => (
                      <div key={ad._id || idx} className={`${idx !== 0 ? 'pt-4 border-t border-purple-100' : ''}`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-gray-800 font-bold">{ad.title || (typeof ad === 'string' ? 'ID: ' + ad : 'N/A')}</p>
                              {ad.lastDateToApply && new Date(ad.lastDateToApply) < new Date().setHours(0, 0, 0, 0) && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black uppercase rounded-lg border border-red-200">
                                  Closed
                                </span>
                              )}
                            </div>
                            {ad.lastDateToApply && (
                              <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                <FaClock className="text-xs" /> Apply by: {formatDate(ad.lastDateToApply)}
                              </p>
                            )}
                            {/* Show interview marks if available for this ad */}
                            {(() => {
                              const adMark = user.advertisementMarks?.find(am => am.advertisementId?.toString() === ad._id?.toString());
                              if (adMark?.interviewMarks !== undefined) {
                                return (
                                  <div className="mt-2 inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded border border-amber-200 uppercase tracking-tighter">
                                    Interview Marks: {parseFloat(adMark.interviewMarks).toFixed(2)} / 100
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          {ad.detail && (
                            <button
                              onClick={() => onViewDocument(ad.detail)}
                              className="flex items-center justify-center gap-2 px-4 py-1.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-lg border border-purple-200 hover:bg-purple-200 transition-all w-fit"
                            >
                              <FaFilePdf /> View Ad PDF
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
            {!user.advertisements && user.advertisement && (
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-100 md:col-span-2">
                <p className="text-xs text-purple-600 uppercase font-bold tracking-wide mb-1">Applied For Advertisement</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-800 font-bold">{user.advertisement.title || (typeof user.advertisement === 'string' ? 'ID: ' + user.advertisement : 'N/A')}</p>
                    {user.advertisement.lastDateToApply && (
                      <p className="text-[10px] text-gray-500">Apply by: {formatDate(user.advertisement.lastDateToApply)}</p>
                    )}
                  </div>
                  {user.advertisement.detail && (
                    <button
                      onClick={() => onViewDocument(user.advertisement.detail)}
                      className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-lg border border-purple-200 hover:bg-purple-200 transition-colors"
                    >
                      View Ad PDF
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Interview & Panel Assignment - Only show if onAssignPanel is provided (Admin/Interview Mode context) */}
        {onAssignPanel && (
          <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FaUsers className="text-emerald-600" />
                Interview Panel Assignment
              </h3>
              <button
                onClick={onAssignPanel}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-sm font-bold shadow-md active:scale-95"
              >
                <FaClipboardList />
                {user.panelAssignments?.length > 0 ? "Change Panel Assignment" : "Assign Interview Panel"}
              </button>
            </div>

            {user.panelAssignments?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.panelAssignments.map((pa, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-4 border border-emerald-50 shadow-sm">
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2">Panel for Advertisement</p>
                    <p className="text-sm text-gray-800 font-bold mb-1 truncate">
                      {pa.advertisementId?.title || "Advertisement ID: " + (pa.advertisementId?._id || pa.advertisementId || "N/A")}
                    </p>
                    <div className="flex items-center gap-2 mt-3 p-2 bg-emerald-50/50 rounded-lg border border-emerald-100">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                        P
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-500 font-bold uppercase leading-none mb-1">Assigned Panel</p>
                        <p className="text-sm text-emerald-700 font-black leading-none">
                          {pa.panelId?.name || "Panel ID: " + (pa.panelId?._id || pa.panelId || "Assigned")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-white/50 rounded-xl border border-dashed border-emerald-200">
                <FaClipboardList className="w-10 h-10 text-emerald-200 mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">No interview panels assigned yet.</p>
                <p className="text-xs text-gray-400 mt-1">Recommended for candidates marked as ELIGIBLE.</p>
              </div>
            )}
          </div>
        )}

        {/* Contact Information */}
        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaPhone className="text-primary-600" />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email Address</p>
              <p className="text-gray-800 font-medium flex items-center gap-2">
                <FaEnvelope className="text-primary-500" />
                {user.email || "N/A"}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Mobile Number</p>
              <p className="text-gray-800 font-medium flex items-center gap-2">
                <FaPhone className="text-primary-500" />
                {formatMobile(user.mobile)}
              </p>
            </div>
            {(user.city || user.state) && (
              <div className="bg-white rounded-lg p-4 border border-gray-100 md:col-span-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Location</p>
                <p className="text-gray-800 font-medium flex items-center gap-2">
                  <FaMapMarkerAlt className="text-primary-500" />
                  {[user.city, user.state].filter(Boolean).join(", ") || "N/A"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Education Details - Always show */}
        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaGraduationCap className="text-primary-600" />
            Education Details
          </h3>
          <div className="space-y-4">
            {/* 10th / Matriculation */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">10</div>
                  <p className="text-sm font-bold text-gray-800 tracking-tight">10th / Matriculation</p>
                </div>
                {user.education?.tenth?.marksheetUrl ? (
                  <button
                    onClick={() => onViewDocument(user.education.tenth.marksheetUrl)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:scale-105 active:scale-95 transition-all text-xs font-semibold border border-red-100 shadow-sm"
                  >
                    <FaFilePdf className="w-3.5 h-3.5" /> View Marksheet
                  </button>
                ) : (
                  <span className="text-xs text-gray-400 font-medium italic">No document</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Board</p>
                  <p className="text-sm text-gray-800 font-semibold truncate">{user.education?.tenth?.board || "N/A"}</p>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg text-center">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Year</p>
                  <p className="text-sm text-gray-800 font-semibold">{user.education?.tenth?.passingYear || "N/A"}</p>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg text-right">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Marks</p>
                  <p className="text-sm text-primary-600 font-bold">{user.education?.tenth?.percentage ? `${user.education.tenth.percentage}%` : "N/A"}</p>
                </div>
              </div>
            </div>

            {/* 12th / Diploma */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center font-bold text-xs">12</div>
                  <p className="text-sm font-bold text-gray-800 tracking-tight">12th / Higher Secondary</p>
                </div>
                {user.education?.twelfth?.marksheetUrl ? (
                  <button
                    onClick={() => onViewDocument(user.education.twelfth.marksheetUrl)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:scale-105 active:scale-95 transition-all text-xs font-semibold border border-red-100 shadow-sm"
                  >
                    <FaFilePdf className="w-3.5 h-3.5" /> View Marksheet
                  </button>
                ) : (
                  <span className="text-xs text-gray-400 font-medium italic">No document</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Board</p>
                  <p className="text-sm text-gray-800 font-semibold truncate">{user.education?.twelfth?.board || "N/A"}</p>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg text-center">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Year</p>
                  <p className="text-sm text-gray-800 font-semibold">{user.education?.twelfth?.passingYear || "N/A"}</p>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg text-right">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Marks</p>
                  <p className="text-sm text-primary-600 font-bold">{user.education?.twelfth?.percentage ? `${user.education.twelfth.percentage}%` : "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Graduation */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center font-bold text-xs">GRD</div>
                  <p className="text-sm font-bold text-gray-800 tracking-tight">Graduation (Bachelor's)</p>
                </div>
                {user.education?.graduation?.marksheetUrl ? (
                  <button
                    onClick={() => onViewDocument(user.education.graduation.marksheetUrl)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:scale-105 active:scale-95 transition-all text-xs font-semibold border border-red-100 shadow-sm"
                  >
                    <FaFilePdf className="w-3.5 h-3.5" /> View Degree
                  </button>
                ) : (
                  <span className="text-xs text-gray-400 font-medium italic">No document</span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Degree</p>
                  <p className="text-sm text-gray-800 font-semibold truncate">{user.education?.graduation?.degree || "N/A"}</p>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg text-center">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Year</p>
                  <p className="text-sm text-gray-800 font-semibold">{user.education?.graduation?.passingYear || "N/A"}</p>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg text-center">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">CGPA</p>
                  <p className="text-sm text-gray-800 font-semibold">{user.education?.graduation?.cgpa || "N/A"}</p>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg text-right">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Marks</p>
                  <p className="text-sm text-primary-600 font-bold">{user.education?.graduation?.percentage ? `${user.education.graduation.percentage}%` : "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Post Graduation / Qualifying Degree */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center font-bold text-xs">QLF</div>
                  <p className="text-sm font-bold text-gray-800 tracking-tight">Post Graduation / Qualifying</p>
                </div>
                {user.education?.qualifyingDegree?.marksheetUrl ? (
                  <button
                    onClick={() => onViewDocument(user.education.qualifyingDegree.marksheetUrl)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:scale-105 active:scale-95 transition-all text-xs font-semibold border border-red-100 shadow-sm"
                  >
                    <FaFilePdf className="w-3.5 h-3.5" /> View Degree
                  </button>
                ) : (
                  <span className="text-xs text-gray-400 font-medium italic">No document</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Degree</p>
                  <p className="text-sm text-gray-800 font-semibold truncate">{user.education?.qualifyingDegree?.degree || "N/A"}</p>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg text-right">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Marks</p>
                  <p className="text-sm text-primary-600 font-bold">{user.education?.qualifyingDegree?.percentage ? `${user.education.qualifyingDegree.percentage}%` : "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Skills & Expertise */}
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100/50">
          <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-3">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
            Skills & Expertise
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Object.entries({
              technical: { label: 'Technical', icon: <FaCode className="size-4" />, color: 'bg-blue-50 text-blue-700 border-blue-100' },
              creative: { label: 'Creative', icon: <FaLightbulb className="size-4" />, color: 'bg-purple-50 text-purple-700 border-purple-100' },
              cognitive: { label: 'Cognitive', icon: <FaPuzzlePiece className="size-4" />, color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
              tools: { label: 'Tools', icon: <FaWrench className="size-4" />, color: 'bg-amber-50 text-amber-700 border-amber-100' },
              ethics: { label: 'Ethics', icon: <FaShieldAlt className="size-4" />, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
            }).map(([key, { label, icon, color }]) => (
              <div key={key} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-2.5 rounded-xl border border-dashed ${color} group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{label} Expertise</h4>
                    <p className="text-[11px] font-bold text-gray-700 leading-none">Categorized Skills</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {user.skillSets?.[key]?.length > 0 ? (
                    user.skillSets[key].map((skill, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-gray-50 text-gray-700 text-[11px] font-black rounded-xl border border-gray-100 hover:bg-white hover:border-amber-200 hover:text-amber-700 transition-all cursor-default">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-gray-300 italic font-bold px-2 py-1">No skills documented</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div className="bg-gray-50 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-3">
            <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
            Verification Documents
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Image Card */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-4">Official Profile Photo</p>
              {user.profileImage ? (
                <div className="space-y-4 w-full">
                  <div className="w-24 h-24 mx-auto rounded-xl overflow-hidden ring-4 ring-gray-50 shadow-inner">
                    <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <button
                    onClick={() => onViewImage(user.profileImage)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm font-bold border border-primary-100"
                  >
                    <FaEye className="w-4 h-4" /> Full Preview
                  </button>
                </div>
              ) : (
                <div className="py-8">
                  <FaUser className="w-12 h-12 text-gray-100 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 italic">No image uploaded</p>
                </div>
              )}
            </div>

            {/* Resume/Document Card */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-4">Professional Resume/CV</p>
              {user.document || user.resumeUrl ? (
                <div className="space-y-4 w-full text-center">
                  <div className="w-24 h-24 mx-auto rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shadow-inner">
                    <FaFilePdf className="w-10 h-10 text-red-500" />
                  </div>
                  <button
                    onClick={() => onViewDocument(user.document || user.resumeUrl)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm font-bold border border-red-100"
                  >
                    <FaEye className="w-4 h-4" /> Open Resume
                  </button>
                </div>
              ) : (
                <div className="py-8">
                  <FaFilePdf className="w-12 h-12 text-gray-100 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 italic">No resume uploaded</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaClock className="text-primary-600" />
            Account Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Account Created</p>
              <p className="text-gray-800 font-medium">{formatDateTime(user.createdAt)}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Last Updated</p>
              <p className="text-gray-800 font-medium">{formatDateTime(user.updatedAt)}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Account Status</p>
              <div className="mt-1">{getStatusBadge(user.status)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewUser;