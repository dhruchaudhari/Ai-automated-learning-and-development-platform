import React from 'react';
import { FaTimes, FaCalendarAlt, FaFilePdf, FaBullhorn, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import ModalContainer from './ModalContainer';
import { format } from 'date-fns';

const AdDetailsModal = ({ isOpen, onClose, advertisement, onViewDocument }) => {
    if (!advertisement) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
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
            size="medium"
        >
            <div className="p-4 space-y-6">
                {/* Header Information */}
                <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100 flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg">
                        <FaBullhorn size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 leading-tight mb-1">{advertisement.title || 'Untitled Advertisement'}</h3>
                        <div className="flex flex-wrap items-center gap-3">
                            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${advertisement.isActive
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : 'bg-gray-100 text-gray-600 border-gray-200'
                                }`}>
                                {advertisement.isActive ? <FaCheckCircle /> : <FaTimesCircle />}
                                {advertisement.isActive ? 'Active' : 'Draft'}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1.5">
                                <FaCalendarAlt className="text-purple-400" />
                                Posted: {formatDate(advertisement.createdAt)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Important Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                        <p className="text-[10px] text-red-600 uppercase font-bold tracking-wider mb-1">Last Date to Apply</p>
                        <p className="text-gray-900 font-bold flex items-center gap-2">
                            <FaCalendarAlt className="text-red-400" />
                            {formatDate(advertisement.lastDateToApply)}
                        </p>
                    </div>
                    {advertisement.detail && (
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <p className="text-[10px] text-blue-600 uppercase font-bold tracking-wider mb-1">Detailed Document</p>
                            <button
                                onClick={() => onViewDocument(advertisement.detail)}
                                className="flex items-center gap-2 text-primary-600 font-bold hover:underline"
                            >
                                <FaFilePdf className="text-red-500" />
                                View Full PDF
                            </button>
                        </div>
                    )}
                </div>

                {/* Description/Notes if any */}
                {advertisement.description && (
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <h4 className="text-sm font-bold text-gray-800 mb-2">Description</h4>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {advertisement.description}
                        </p>
                    </div>
                )}
            </div>
        </ModalContainer>
    );
};

export default AdDetailsModal;
