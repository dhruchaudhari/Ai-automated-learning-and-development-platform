import React, { useState, useEffect } from "react";
import {
    FaFilter,
    FaCalendarAlt,
    FaClock,
    FaTrashAlt,
    FaSortAmountDown,
    FaSortAmountUp,
    FaSortAlphaDown,
    FaSortAlphaUp,
    FaGraduationCap,
    FaPercent,
    FaBullhorn,
    FaChartLine,
    FaUserClock,
    FaBriefcase,
    FaInfoCircle,
    FaChevronDown,
    FaChevronUp,
    FaMagic,
    FaAward,
    FaTrophy
} from "react-icons/fa";

const MeritFilterPanel = ({
    meritFilters,
    onMeritFilterChange,
    onClearMeritFilters,
    onMeritSortChange,
    meritSortBy,
    meritFilterCounts = {},
    advertisements = [],
    degreeOptions = [],
    degreeSpecMap = {},
    filteredUsers = [],
    onMeritFiltersUpdate
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const [isCriteriaApplied, setIsCriteriaApplied] = useState(false);
    const [previousFilters, setPreviousFilters] = useState(null);

    // Reset application state when advertisement selection changes
    useEffect(() => {
        setIsCriteriaApplied(false);
        setPreviousFilters(null);
    }, [meritFilters.advertisement]);

    const sortOptions = [
        { value: 'rank-asc', label: 'Rank-wise', icon: <FaTrophy className="text-amber-500" /> },
        { value: 'latest', label: 'Latest first', icon: <FaSortAmountDown /> },
        { value: 'oldest', label: 'Oldest first', icon: <FaSortAmountUp /> },
        { value: 'name-asc', label: 'Name A-Z', icon: <FaSortAlphaDown /> },
        { value: 'name-desc', label: 'Name Z-A', icon: <FaSortAlphaUp /> },
        { value: 'marks-high', label: 'Marks high→low', icon: <FaChartLine /> },
        { value: 'marks-low', label: 'Marks low→high', icon: <FaChartLine className="rotate-180" /> }
    ];

    // Find the selected advertisement object
    const selectedAd = meritFilters.advertisement
        ? advertisements.find(a => a._id === meritFilters.advertisement)
        : null;

    // Extract criteriaSet from advertisement's role (or job's role)
    const criteriaSet = selectedAd?.role?.criteriaSet
        || selectedAd?.job?.role?.criteriaSet
        || null;

    const toggleCriteriaFilters = () => {
        if (isCriteriaApplied && previousFilters) {
            onMeritFiltersUpdate(previousFilters);
            setIsCriteriaApplied(false);
            setPreviousFilters(null);
        } else {
            // Store current filters to allow undo
            setPreviousFilters({ ...meritFilters });

            const autoFilters = {
                ...meritFilters,
                tenth: { ...meritFilters.tenth, min: criteriaSet.min10thPercentage || meritFilters.tenth.min },
                twelfth: { ...meritFilters.twelfth, min: criteriaSet.min12thPercentage || meritFilters.twelfth.min },
                graduation: { ...meritFilters.graduation, min: criteriaSet.minGraduationPercentage || meritFilters.graduation.min },
                pg: { ...meritFilters.pg, min: criteriaSet.minPGPercentage || meritFilters.pg.min },
                experience: { ...meritFilters.experience, min: criteriaSet.minimumExperience || meritFilters.experience.min },
                age: {
                    min: criteriaSet.minAge || meritFilters.age.min,
                    max: criteriaSet.maxAge || meritFilters.age.max
                },
                degree: criteriaSet.specificDegrees?.length > 0
                    ? criteriaSet.specificDegrees.map(d => typeof d === 'object' ? d.name : d)
                    : meritFilters.degree,
                specialization: criteriaSet.specializations?.length > 0
                    ? criteriaSet.specializations
                    : meritFilters.specialization
            };

            onMeritFiltersUpdate(autoFilters);
            setIsCriteriaApplied(true);
        }
    };

    // Helper to render a min/max range input pair
    const renderRangeFilter = (label, icon, filterKey, min = 0, max = 100, step = 1, suffix = '%') => {
        const values = meritFilters[filterKey] || { min: '', max: '' };
        const count = meritFilterCounts[filterKey];
        return (
            <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    {icon && <span className="text-primary-600 flex items-center">{icon}</span>}
                    <span>{label}</span>
                    {count !== undefined && (values.min || values.max) && (
                        <span className="ml-1 text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-200">
                            {count} matching
                        </span>
                    )}
                </label>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        min={min}
                        max={max}
                        step={step}
                        value={values.min}
                        onChange={(e) => onMeritFilterChange(filterKey, { ...values, min: e.target.value })}
                        placeholder="Min"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <span className="text-xs text-gray-400">to</span>
                    <input
                        type="number"
                        min={min}
                        max={max}
                        step={step}
                        value={values.max}
                        onChange={(e) => onMeritFilterChange(filterKey, { ...values, max: e.target.value })}
                        placeholder="Max"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {suffix && <span className="text-xs text-gray-500">{suffix}</span>}
                </div>
            </div>
        );
    };

    return (
        <div className="mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        {isOpen ? 'Hide Filters' : 'Show Filters'}
                    </button>

                    <button
                        onClick={onClearMeritFilters}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                        <FaTrashAlt />
                        Clear All Filters
                    </button>
                </div>
            </div>

            {isOpen && (
                <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-6">

                            {/* Sorting */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                                    <FaClock className="text-primary-600" />
                                    <span>Sort display</span>
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {sortOptions.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => onMeritSortChange(option.value)}
                                            className={`flex flex-col items-center justify-center gap-1 px-2 py-3 text-[10px] rounded-lg transition-all ${meritSortBy === option.value
                                                ? 'bg-orange-100 text-orange-700 border-2 border-orange-300 shadow-sm'
                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                                }`}
                                        >
                                            {option.icon}
                                            <span>{option.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Advertisement Dropdown */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                                    <FaBullhorn className="text-primary-600" />
                                    <span>Advertisement</span>
                                </label>
                                <select
                                    value={meritFilters.advertisement || ''}
                                    onChange={(e) => onMeritFilterChange('advertisement', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-sm"
                                >
                                    <option value="">All advertisements</option>
                                    {advertisements.map(ad => {
                                        const isExpired = ad.lastDateToApply && new Date(ad.lastDateToApply) < new Date().setHours(0, 0, 0, 0);
                                        return (
                                            <option key={ad._id} value={ad._id}>
                                                {ad.title} {isExpired ? '(Closed)' : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                                {meritFilters.advertisement && meritFilterCounts.advertisement !== undefined && (
                                    <p className="mt-1 text-xs text-blue-600 font-medium">
                                        {meritFilterCounts.advertisement} candidates for this advertisement
                                    </p>
                                )}

                                {/* CriteriaSet Note Display */}
                                {selectedAd && criteriaSet && (
                                    <div className="mt-4 p-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-xl border border-indigo-100 shadow-md">
                                        <div className="flex items-center justify-between mb-3 border-b border-indigo-100/50 pb-2">
                                            <div className="flex items-center gap-2">
                                                <FaInfoCircle className="text-secondary-500 text-sm" />
                                                <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700">
                                                    Advertisement Selection Criteria
                                                </span>
                                            </div>
                                            <button
                                                onClick={toggleCriteriaFilters}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-normal transition-all duration-300 shadow-sm active:scale-95 border ${isCriteriaApplied
                                                    ? 'bg-[#880808] text-white border-[#880808] shadow-[#880808]/20'
                                                    : 'bg-gradient-to-r from-black to-gray-800 text-white border-transparent hover:from-gray-900 hover:to-rose-900 hover:border-rose-400/50'
                                                    } active:bg-[#880808] active:border-[#880808] focus:outline-none focus:ring-2 focus:ring-[#880808]/50`}
                                            >
                                                {isCriteriaApplied ? <FaTrashAlt className="text-[10px]" /> : <FaMagic className="text-[10px]" />}
                                                {isCriteriaApplied ? 'Undo Auto-Filters' : 'Apply Criteria Filters'}
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                            {criteriaSet.min10thPercentage !== undefined && criteriaSet.min10thPercentage !== null && (
                                                <div className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 flex items-center justify-between">
                                                    <span className="opacity-70">10th Min: </span>
                                                    <span className="text-xs">{criteriaSet.min10thPercentage}%</span>
                                                </div>
                                            )}
                                            {criteriaSet.min12thPercentage !== undefined && criteriaSet.min12thPercentage !== null && (
                                                <div className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100 flex items-center justify-between">
                                                    <span className="opacity-70">12th Min: </span>
                                                    <span className="text-xs">{criteriaSet.min12thPercentage}%</span>
                                                </div>
                                            )}
                                            {criteriaSet.minGraduationPercentage !== undefined && criteriaSet.minGraduationPercentage !== null && (
                                                <div className="text-[11px] font-semibold bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg border border-purple-100 flex items-center justify-between">
                                                    <span className="opacity-70">Graduation: </span>
                                                    <span className="text-xs">{criteriaSet.minGraduationPercentage}%</span>
                                                </div>
                                            )}
                                            {criteriaSet.minPGPercentage !== undefined && criteriaSet.minPGPercentage !== null && (
                                                <div className="text-[11px] font-semibold bg-pink-50 text-pink-700 px-3 py-1.5 rounded-lg border border-pink-100 flex items-center justify-between">
                                                    <span className="opacity-70">PG Min: </span>
                                                    <span className="text-xs">{criteriaSet.minPGPercentage}%</span>
                                                </div>
                                            )}
                                            {(criteriaSet.minAge || criteriaSet.maxAge) && (
                                                <div className="text-[11px] font-semibold bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-100 flex items-center justify-between">
                                                    <span className="opacity-70">Age: </span>
                                                    <span className="text-xs">{criteriaSet.minAge || 'Any'}–{criteriaSet.maxAge || 'Any'}</span>
                                                </div>
                                            )}
                                            {criteriaSet.minimumExperience !== undefined && criteriaSet.minimumExperience !== null && (
                                                <div className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center justify-between">
                                                    <span className="opacity-70">Exp Min: </span>
                                                    <span className="text-xs">{criteriaSet.minimumExperience} yrs</span>
                                                </div>
                                            )}
                                        </div>
                                        {criteriaSet.specificDegrees?.length > 0 && (
                                            <div className="mt-3 p-2.5 bg-rose-50/50 rounded-lg border border-rose-100">
                                                <p className="text-[10px] font-bold text-rose-400 tracking-wider mb-1">Required Degrees</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {criteriaSet.specificDegrees.map((d, i) => (
                                                        <span key={i} className="text-[10px] font-bold bg-white text-rose-700 px-2 py-0.5 rounded border border-rose-100 shadow-sm">
                                                            {typeof d === 'object' ? d.name : d}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {criteriaSet.specializations?.length > 0 && (
                                            <div className="mt-2 text-[11px] font-normal text-gray-500 flex items-center gap-2 pl-1">
                                                <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full"></span>
                                                <span>Specializations: <span className="font-bold text-indigo-900">{criteriaSet.specializations.join(', ')}</span></span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Degree & Specialization Filters - MOVED TO LEFT */}
                            <div className="pt-2">
                                <label className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-3">
                                    <div className="flex items-center gap-2">
                                        <FaGraduationCap className="text-primary-600" />
                                        <span>Degrees & specializations</span>
                                        {meritFilters.degree.length > 0 && meritFilterCounts.total !== undefined && (
                                            <span className="ml-1 text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-200">
                                                {meritFilterCounts.total} matching
                                            </span>
                                        )}
                                    </div>
                                    {meritFilters.degree.length > 0 && (
                                        <button
                                            onClick={() => {
                                                onMeritFilterChange('degree', []);
                                                onMeritFilterChange('specialization', []);
                                            }}
                                            className="text-xs text-primary-600 hover:text-primary-700 font-medium ml-auto px-2"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </label>
                                <div className="max-h-[450px] overflow-y-auto p-3 bg-white border border-gray-300 rounded-lg space-y-2 custom-scrollbar">
                                    {(degreeOptions.length > 0 ? [
                                        {
                                            label: "Bachelor's degrees",
                                            options: degreeOptions.filter(d => d.category === 'bachelor').map(d => d.name)
                                        },
                                        {
                                            label: "Master's degrees",
                                            options: degreeOptions.filter(d => d.category === 'master').map(d => d.name)
                                        }
                                    ] : [
                                        {
                                            label: "Bachelor's degrees", options: [
                                                "Bachelor Technology / Bachelor Engineering",
                                                "Bachelor of Computer Applications (BCA)",
                                                "Bachelor of Science"
                                            ]
                                        },
                                        {
                                            label: "Master's degrees", options: [
                                                "Master of Technology / Master of Engineering (M.Tech / M.E.)",
                                                "Master of Computer Applications (MCA)",
                                                "Master of Science (M.Sc.)"
                                            ]
                                        }
                                    ]).map((group) => (
                                        <div key={group.label} className="mb-2 last:mb-0">
                                            <p className="text-[10px] font-semibold text-gray-400 tracking-wider mb-2 uppercase">{group.label}</p>
                                            <div className="space-y-1">
                                                {group.options.map((option) => {
                                                    const isChecked = meritFilters.degree.includes(option);
                                                    const specs = degreeSpecMap[option] || [];
                                                    return (
                                                        <div key={option}>
                                                            <label className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all ${isChecked ? 'bg-primary-50 text-primary-700 border border-primary-100 shadow-sm' : 'hover:bg-gray-50 border border-transparent'}`}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={(e) => {
                                                                        const newDegrees = e.target.checked
                                                                            ? [...meritFilters.degree, option]
                                                                            : meritFilters.degree.filter(d => d !== option);
                                                                        onMeritFilterChange('degree', newDegrees);
                                                                        if (!e.target.checked && meritFilters.specialization) {
                                                                            const newSpecs = (meritFilters.specialization || []).filter(s => !specs.includes(s));
                                                                            onMeritFilterChange('specialization', newSpecs);
                                                                        }
                                                                    }}
                                                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                                                />
                                                                <span className="text-sm font-medium">{option}</span>
                                                                {meritFilterCounts.degrees?.[option] !== undefined && (
                                                                    <span className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full ${isChecked ? 'bg-primary-200' : 'bg-gray-100'}`}>
                                                                        {meritFilterCounts.degrees[option]}
                                                                    </span>
                                                                )}
                                                            </label>

                                                            {/* Specialization sub-checkboxes */}
                                                            {isChecked && specs.length > 0 && (
                                                                <div className="ml-8 mt-1 mb-2 pl-3 border-l-2 border-primary-100 space-y-1">
                                                                    {specs.map((spec) => {
                                                                        const isSpecChecked = (meritFilters.specialization || []).includes(spec);
                                                                        return (
                                                                            <label key={spec} className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs transition-colors ${isSpecChecked ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-600'}`}>
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={isSpecChecked}
                                                                                    onChange={(e) => {
                                                                                        const currentSpecs = meritFilters.specialization || [];
                                                                                        const newSpecs = e.target.checked
                                                                                            ? [...currentSpecs, spec]
                                                                                            : currentSpecs.filter(s => s !== spec);
                                                                                        onMeritFilterChange('specialization', newSpecs);
                                                                                    }}
                                                                                    className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                                                />
                                                                                <span>{spec}</span>
                                                                                {meritFilterCounts.specializations?.[spec] !== undefined && (
                                                                                    <span className={`ml-auto text-[9px] font-medium px-1.5 py-0.5 rounded-full ${isSpecChecked ? 'bg-blue-200' : 'bg-gray-100'}`}>
                                                                                        {meritFilterCounts.specializations[spec]}
                                                                                    </span>
                                                                                )}
                                                                            </label>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-2 text-[11px] text-gray-500 italic">
                                    {meritFilters.degree.length === 0 ? "No degrees selected (showing all)" : `Selected ${meritFilters.degree.length} degree(s)${(meritFilters.specialization || []).length > 0 ? `, ${(meritFilters.specialization || []).length} specialization(s)` : ''}`}
                                </p>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">

                            {/* 10th % Range */}
                            {renderRangeFilter('10th percentage', <FaPercent className="text-xs" />, 'tenth', 0, 100, 1, '%')}

                            {/* 12th % Range */}
                            {renderRangeFilter('12th percentage', <FaPercent className="text-xs" />, 'twelfth', 0, 100, 1, '%')}

                            {/* Graduation % Range */}
                            {renderRangeFilter('Graduation percentage', <FaGraduationCap className="text-xs" />, 'graduation', 0, 100, 1, '%')}

                            {/* Graduation CPI Range */}
                            {renderRangeFilter('Graduation CPI', <FaGraduationCap className="text-xs" />, 'graduationCpi', 0, 10, 0.1, '/ 10')}

                            {/* PG % Range */}
                            {renderRangeFilter('PG percentage', <FaGraduationCap className="text-xs" />, 'pg', 0, 100, 1, '%')}

                            {/* PG CPI Range */}
                            {renderRangeFilter('PG CPI', <FaGraduationCap className="text-xs" />, 'pgCpi', 0, 10, 0.1, '/ 10')}

                            {/* Assigned Marks Range */}
                            {renderRangeFilter('Assigned marks', <FaChartLine className="text-xs" />, 'assignedMarks', 0, 100, 0.01, '/ 100')}

                            {/* Age Range */}
                            {renderRangeFilter('Age', <FaUserClock className="text-xs" />, 'age', 14, 100, 1, 'yrs')}

                            {/* Experience Range */}
                            {renderRangeFilter('Experience', <FaBriefcase className="text-xs" />, 'experience', 0, 50, 1, 'yrs')}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeritFilterPanel;
