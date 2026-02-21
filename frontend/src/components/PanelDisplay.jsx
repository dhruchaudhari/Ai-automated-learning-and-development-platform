import React, { useState } from 'react';
import { FaUsers, FaBuilding, FaBriefcase, FaClock, FaThList, FaThLarge } from 'react-icons/fa';

const PanelDisplay = ({ panels, loading }) => {
    const [viewType, setViewType] = useState('compact'); // 'compact' or 'cards'

    const getPanelColor = (idx) => {
        const colors = [
            { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-400', hover: 'hover:border-blue-400', badge: 'bg-white/50 border-blue-100', accent: 'from-blue-50/50 to-indigo-50/50', icon: 'text-blue-500', expertBadge: 'text-blue-500 border-blue-50' },
            { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-400', hover: 'hover:border-indigo-400', badge: 'bg-white/50 border-indigo-100', accent: 'from-indigo-50/50 to-blue-50/50', icon: 'text-indigo-500', expertBadge: 'text-indigo-500 border-indigo-50' },
            { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-400', hover: 'hover:border-emerald-400', badge: 'bg-white/50 border-emerald-100', accent: 'from-emerald-50/50 to-teal-50/50', icon: 'text-emerald-500', expertBadge: 'text-emerald-500 border-emerald-50' },
            { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-400', hover: 'hover:border-amber-400', badge: 'bg-white/50 border-amber-100', accent: 'from-amber-50/50 to-orange-50/50', icon: 'text-amber-500', expertBadge: 'text-amber-500 border-amber-50' },
            { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-400', hover: 'hover:border-rose-400', badge: 'bg-white/50 border-rose-100', accent: 'from-rose-50/50 to-pink-50/50', icon: 'text-rose-500', expertBadge: 'text-rose-500 border-rose-50' }
        ];
        return colors[idx % colors.length];
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!panels || panels.length === 0) {
        return null;
    }

    return (
        <div className="mb-6 animate-fade-in">
            {/* Header with Title and View Switcher - Matches FilterPanel Style */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FaUsers className="text-primary-600" />
                    <span className="tracking-wide">Active interview panels</span>
                    {panels.length > 0 && (
                        <span className="ml-2 text-[10px] font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200 tracking-tight">
                            {panels.length} panels
                        </span>
                    )}
                </label>

                {/* View Switcher In Header */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => setViewType('compact')}
                        className={`flex items-center justify-center gap-2 px-3 py-1.5 text-[10px] rounded-lg transition-all tracking-wide ${viewType === 'compact'
                            ? 'bg-primary-100 text-primary-700 border-2 border-primary-300 shadow-sm'
                            : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                            }`}
                        title="Compact List"
                    >
                        <FaThList size={10} />
                        <span>Compact</span>
                    </button>
                    <button
                        onClick={() => setViewType('cards')}
                        className={`flex items-center justify-center gap-2 px-3 py-1.5 text-[10px] rounded-lg transition-all tracking-wide ${viewType === 'cards'
                            ? 'bg-primary-100 text-primary-700 border-2 border-primary-300 shadow-sm'
                            : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                            }`}
                        title="Detailed Cards"
                    >
                        <FaThLarge size={10} />
                        <span>Cards</span>
                    </button>
                </div>
            </div>

            {/* Content Container - Simplified with White-Slate Gradient */}
            <div className="p-4 bg-gradient-to-br from-white to-slate-50 rounded-xl border border-gray-200 shadow-sm">
                {viewType === 'compact' ? (
                    /* Compact View - Matches Filter Chip Style */
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                        {panels.map((panel, idx) => {
                            const color = getPanelColor(idx);
                            return (
                                <div key={panel._id || idx} className={`flex items-center justify-center gap-2 px-3 py-2.5 ${color.bg} ${color.text} border-2 ${color.border} rounded-xl shadow-sm ${color.hover} transition-all group cursor-default`}>
                                    <div className="text-[11px] font-medium truncate tracking-tight" title={panel.name}>
                                        {panel.name || `Panel #${idx + 1}`}
                                    </div>
                                    <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${color.badge}`}>
                                        {panel.experts.length}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Card View */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {panels.map((panel, idx) => {
                            const color = getPanelColor(idx);
                            return (
                                <div key={panel._id || idx} className={`bg-white rounded-xl border-2 ${color.border} shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group`}>
                                    <div className={`bg-gradient-to-r ${color.accent} px-3 py-2 border-b-2 ${color.border} flex justify-between items-center`}>
                                        <span className={`text-[11px] font-semibold ${color.text} truncate max-w-[60%] tracking-tight`}>{panel.name || `Panel #${idx + 1}`}</span>
                                        <span className={`text-[10px] font-medium ${color.expertBadge} bg-white px-2 py-1 rounded-full border shadow-sm`}>
                                            {panel.experts.length} Experts
                                        </span>
                                    </div>
                                    <div className="p-3 space-y-3">
                                        {panel.experts.map((expert, eIdx) => (
                                            <div key={eIdx} className={`relative pl-3 border-l-2 ${color.border} py-1`}>
                                                <div className="text-gray-800 text-[11px] truncate font-semibold tracking-tight" title={expert.name}>
                                                    {expert.name}
                                                </div>
                                                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                                    <div className="flex items-center gap-1 text-[9px] text-gray-500 font-medium">
                                                        <FaBuilding className={`${color.icon} w-2.5`} /> {expert.department}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[9px] text-gray-500 font-medium">
                                                        <FaBriefcase className={`${color.icon} w-2.5`} /> {expert.role}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[9px] text-gray-700 font-semibold">
                                                        <FaClock className={`${color.icon} w-2.5`} /> {expert.seniority}Y Exp
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PanelDisplay;
