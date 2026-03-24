import React, { useState } from "react";
import { toast } from "react-hot-toast";
import {
  FaFilter,
  FaCalendarAlt,
  FaMars,
  FaVenus,
  FaTransgender,
  FaClock,
  FaTrashAlt,
  FaToggleOn,
  FaSortAmountDown,
  FaSortAmountUp,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaCalendar,
  FaGraduationCap,
  FaPercent,
  FaHourglassHalf,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaBullhorn,
  FaBrain,
  FaToolbox,
  FaShieldAlt,
  FaCog,
  FaPalette,
  FaUsers
} from "react-icons/fa";
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { calculateActivationDuration } from "../utils/durationUtils";
import { DEGREE_SPECIALIZATIONS } from "../utils/constants";

const FilterPanel = ({
  filters,
  onFilterChange,
  onClearFilters,
  onSortChange,
  sortBy,
  users,
  filteredUsers,
  qualificationMatchedUsers = [],
  onBulkReject,
  onBulkEligible,
  onBulkPending,
  onBulkDelete,
  selectedUsers = [],
  onSelectAllFiltered,
  onClearSelection,
  onTogglePageSelection,
  totalPages = 1,
  rowsPerPage = 10,
  filterCounts = {},
  degreeOptions = [],
  degreeSpecMap = {},
  advertisements = [],
  onManageDegrees,
  availableSkills = {},
  isAdmin
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });

  const genderOptions = [
    { value: '', label: 'All Genders' },
    { value: 'Male', label: 'Male', icon: <FaMars /> },
    { value: 'Female', label: 'Female', icon: <FaVenus /> },
    { value: 'Other', label: 'Other', icon: <FaTransgender /> }
  ];

  const dateRangeOptions = [
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const sortOptions = [
    { value: 'latest', label: 'Latest First', icon: <FaSortAmountDown /> },
    { value: 'oldest', label: 'Oldest First', icon: <FaSortAmountUp /> },
    { value: 'name-asc', label: 'Name A-Z', icon: <FaSortAlphaDown /> },
    { value: 'name-desc', label: 'Name Z-A', icon: <FaSortAlphaUp /> }
  ];

  // Approval status options for admin filtering
  const approvalStatusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending', icon: <FaHourglassHalf className="text-yellow-500" /> },
    { value: 'approved', label: 'Approved', icon: <FaCheckCircle className="text-green-500" /> },
    { value: 'eligible', label: 'Eligible', icon: <FaCheckCircle className="text-blue-500" /> },
    { value: 'rejected', label: 'Rejected', icon: <FaTimesCircle className="text-red-500" /> }
  ];

  // Generate passout year options (last 20 years)
  const currentYear = new Date().getFullYear();
  const passoutYearOptions = [
    { value: '', label: 'All Years' },
    ...Array.from({ length: 20 }, (_, i) => ({
      value: (currentYear - i).toString(),
      label: (currentYear - i).toString()
    }))
  ];

  const handleDateRangeChange = (value) => {
    if (value === 'custom') {
      setIsOpen(true);
      onFilterChange('dateRange', {
        value: 'custom',
        startDate: customDateRange.start ? startOfDay(new Date(customDateRange.start)) : null,
        endDate: customDateRange.end ? endOfDay(new Date(customDateRange.end)) : null
      });
      return;
    }

    let startDate = null;
    let endDate = null;
    const today = new Date();

    switch (value) {
      case 'today':
        startDate = startOfDay(today);
        endDate = endOfDay(today);
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        startDate = startOfDay(yesterday);
        endDate = endOfDay(yesterday);
        break;
      case 'last7days':
        startDate = subDays(today, 7);
        endDate = endOfDay(today);
        break;
      case 'last30days':
        startDate = subDays(today, 30);
        endDate = endOfDay(today);
        break;
      case 'last90days':
        startDate = subDays(today, 90);
        endDate = endOfDay(today);
        break;
      case 'thisMonth':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case 'thisYear':
        startDate = startOfYear(today);
        endDate = endOfYear(today);
        break;
      default:
        startDate = null;
        endDate = null;
    }

    onFilterChange('dateRange', { value, startDate, endDate });
  };

  const handleCustomDateApply = () => {
    if (customDateRange.start && customDateRange.end) {
      const startDate = startOfDay(new Date(customDateRange.start));
      const endDate = endOfDay(new Date(customDateRange.end));

      if (startDate <= endDate) {
        onFilterChange('dateRange', {
          value: 'custom',
          startDate,
          endDate
        });
      } else {
        toast.error('Start date must be before end date');
      }
    }
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
            onClick={() => onClearFilters('')}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          >
            <FaTrashAlt />
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Filter Content */}
      {isOpen && (
        <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Registration Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <FaCalendar className="inline mr-2 text-primary-600" />
                  Registration Date
                </label>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {dateRangeOptions.slice(0, -1).map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleDateRangeChange(option.value)}
                        className={`px-3 py-2 text-sm rounded-lg transition-all ${filters.dateRange?.value === option.value
                          ? 'bg-purple-100 text-purple-700 border-2 border-purple-300 shadow-sm'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                          }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Date Range */}
                  {filters.dateRange?.value === 'custom' && (
                    <div className="bg-white p-3 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-3 mb-3">
                        <FaCalendarAlt className="text-purple-500" />
                        <span className="text-sm font-medium text-gray-700">Custom Date Range</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={customDateRange.start}
                            onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">End Date</label>
                          <input
                            type="date"
                            value={customDateRange.end}
                            onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleCustomDateApply}
                        disabled={!customDateRange.start || !customDateRange.end}
                        className="mt-3 w-full px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Apply Custom Range
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Approval Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <FaCheckCircle className="inline mr-2 text-primary-600" />
                  Approval Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {approvalStatusOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => onClearFilters(option.value)}
                      className={`flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg transition-all ${filters.approvalStatus === option.value
                        ? option.value === 'approved'
                          ? 'bg-green-100 text-green-700 border-2 border-green-300 shadow-sm'
                          : option.value === 'rejected'
                            ? 'bg-red-100 text-red-700 border-2 border-red-300 shadow-sm'
                            : option.value === 'pending'
                              ? 'bg-amber-100 text-amber-700 border-2 border-amber-300 shadow-sm'
                              : 'bg-blue-100 text-blue-700 border-2 border-blue-300 shadow-sm'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                        }`}
                    >
                      {option.icon}
                      {option.label}
                      {filterCounts.approvalStatus?.[option.value] !== undefined && (
                        <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filters.approvalStatus === option.value ? 'bg-white/50' : 'bg-gray-100'}`}>
                          {filterCounts.approvalStatus[option.value]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <FaMars className="inline mr-2 text-primary-600" />
                  Gender
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {genderOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => onFilterChange('gender', option.value)}
                      className={`flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg transition-all ${filters.gender === option.value
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300 shadow-sm'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                        }`}
                    >
                      {option.icon}
                      {option.label}
                      {filterCounts.gender?.[option.value] !== undefined && (
                        <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filters.gender === option.value ? 'bg-blue-200' : 'bg-gray-100'}`}>
                          {filterCounts.gender[option.value]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sorting Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <FaClock className="inline mr-2 text-primary-600" />
                  Sort Display
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {sortOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => onSortChange(option.value)}
                      className={`flex flex-col items-center justify-center gap-1 px-2 py-3 text-[10px] rounded-lg transition-all ${sortBy === option.value
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
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Degree Filter (Multi-select) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 flex justify-between items-center">
                  <span>
                    <FaGraduationCap className="inline mr-2 text-primary-600" />
                    Degrees
                    {filters.degree.length > 0 && filterCounts.total !== undefined && (
                      <span className="ml-2 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 animate-pulse">
                        {filterCounts.total} matching
                      </span>
                    )}
                  </span>
                  {filters.degree.length > 0 && (
                    <button
                      onClick={() => onFilterChange('degree', [])}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium ml-auto"
                    >
                      Clear
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={onManageDegrees}
                      className="ml-2 text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded border border-primary-200 hover:bg-primary-100 transition-colors uppercase"
                      title="Manage degrees and specializations"
                    >
                      Manage
                    </button>
                  )}
                </label>
                <div className="max-h-56 overflow-y-auto p-3 bg-white border border-gray-300 rounded-lg space-y-2 custom-scrollbar">
                  {(degreeOptions.length > 0 ? [
                    {
                      label: "Bachelor's Degrees",
                      options: degreeOptions.filter(d => d.category === 'bachelor').map(d => d.name)
                    },
                    {
                      label: "Master's Degrees",
                      options: degreeOptions.filter(d => d.category === 'master').map(d => d.name)
                    }
                  ] : [
                    {
                      label: "Bachelor's Degrees", options: [
                        "Bachelor Technology / Bachelor Engineering",
                        "Bachelor of Computer Applications (BCA)",
                        "Bachelor of Science"
                      ]
                    },
                    {
                      label: "Master's Degrees", options: [
                        "Master of Technology / Master of Engineering (M.Tech / M.E.)",
                        "Master of Computer Applications (MCA)",
                        "Master of Science (M.Sc.)"
                      ]
                    }
                  ]).map((group) => (
                    <div key={group.label}>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{group.label}</p>
                      <div className="space-y-1">
                        {group.options.map((option) => {
                          const isChecked = filters.degree.includes(option);
                          const specs = degreeSpecMap[option] || [];
                          return (
                            <div key={option}>
                              <label className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${isChecked ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'}`}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const newDegrees = e.target.checked
                                      ? [...filters.degree, option]
                                      : filters.degree.filter(d => d !== option);
                                    onFilterChange('degree', newDegrees);
                                    // Clear specializations for this degree when unchecked
                                    if (!e.target.checked && filters.specialization) {
                                      const newSpecs = (filters.specialization || []).filter(s => !specs.includes(s));
                                      onFilterChange('specialization', newSpecs);
                                    }
                                  }}
                                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                />
                                <span className="text-sm">{option}</span>
                                {filterCounts.degrees?.[option] !== undefined && (
                                  <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isChecked ? 'bg-primary-200' : 'bg-gray-100'}`}>
                                    {filterCounts.degrees[option]}
                                  </span>
                                )}
                              </label>

                              {/* Specialization sub-checkboxes */}
                              {isChecked && specs.length > 0 && (
                                <div className="ml-8 mt-1 mb-2 pl-3 border-l-2 border-primary-200 space-y-1">
                                  {specs.map((spec) => {
                                    const isSpecChecked = (filters.specialization || []).includes(spec);
                                    return (
                                      <label key={spec} className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs transition-colors ${isSpecChecked ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-600'}`}>
                                        <input
                                          type="checkbox"
                                          checked={isSpecChecked}
                                          onChange={(e) => {
                                            const currentSpecs = filters.specialization || [];
                                            const newSpecs = e.target.checked
                                              ? [...currentSpecs, spec]
                                              : currentSpecs.filter(s => s !== spec);
                                            onFilterChange('specialization', newSpecs);
                                          }}
                                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span>{spec}</span>
                                        {filterCounts.specializations?.[spec] !== undefined && (
                                          <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isSpecChecked ? 'bg-blue-200' : 'bg-gray-100'}`}>
                                            {filterCounts.specializations[spec]}
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
                <p className="mt-2 text-[11px] text-gray-500">
                  {filters.degree.length === 0 ? "No degrees selected (Show All)" : `Selected ${filters.degree.length} degree(s)${(filters.specialization || []).length > 0 ? `, ${(filters.specialization || []).length} specialization(s)` : ''}`}
                </p>
              </div>

              {/* Passout Year Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <FaGraduationCap className="inline mr-2 text-primary-600" />
                  Graduation Passout Year
                  {filters.passoutYear && filterCounts.total !== undefined && (
                    <span className="ml-2 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 animate-pulse">
                      {filterCounts.total} matching
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { value: 'exact', label: 'Exact Year' },
                    { value: 'before', label: 'Before' },
                    { value: 'after', label: 'After' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => onFilterChange('passoutYearMode', option.value)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${(filters.passoutYearMode || 'exact') === option.value
                        ? 'bg-primary-100 text-primary-700 border-2 border-primary-300 shadow-sm'
                        : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <select
                  value={filters.passoutYear || ''}
                  onChange={(e) => onFilterChange('passoutYear', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                >
                  {passoutYearOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {filters.passoutYear && (
                  <p className="mt-1 text-xs text-gray-500">
                    Showing users {(filters.passoutYearMode || 'exact') === 'exact' ? 'from' : (filters.passoutYearMode || 'exact') === 'before' ? 'before' : 'after'} {filters.passoutYear}
                  </p>
                )}
              </div>

              {/* Minimum Percentage Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <FaPercent className="inline mr-2 text-primary-600" />
                  Minimum Graduation Percentage
                  {filters.minPercentage && filterCounts.total !== undefined && (
                    <span className="ml-2 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 animate-pulse">
                      {filterCounts.total} matching
                    </span>
                  )}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={filters.minPercentage || ''}
                    onChange={(e) => onFilterChange('minPercentage', e.target.value)}
                    placeholder="e.g., 60"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>

              {/* Advertisement Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <FaBullhorn className="inline mr-2 text-primary-600" />
                  Advertisement Source
                </label>
                <select
                  value={filters.advertisement || ''}
                  onChange={(e) => onFilterChange('advertisement', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                >
                  <option value="">All Advertisements</option>
                  {advertisements.map(ad => {
                    const isExpired = ad.lastDateToApply && new Date(ad.lastDateToApply) < new Date().setHours(0, 0, 0, 0);
                    return (
                      <option key={ad._id} value={ad._id}>
                        {ad.title} {isExpired ? '(Closed)' : ''}
                      </option>
                    );
                  })}
                </select>
                {filters.advertisement && filterCounts.advertisement !== undefined && (
                  <p className="mt-1 text-xs text-blue-600 font-bold">
                    {filterCounts.advertisement} users matching this ad
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Skill Filters - Full Width */}
          {Object.entries(availableSkills).some(([_, list]) => list.length > 0) && (
            <div className="mt-6 pt-5 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-900 mb-4">Skill Set Filters</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {[
                  { id: 'technical', label: 'Technical Skills', icon: <FaCog />, border: 'border-blue-200', bg: 'bg-blue-50/60', iconColor: 'text-blue-500', labelColor: 'text-blue-700', activeBg: 'bg-blue-100', activeBorder: 'border-blue-300', activeText: 'text-blue-700', activeBadge: 'bg-blue-200' },
                  { id: 'creative', label: 'Creative Skills', icon: <FaPalette />, border: 'border-purple-200', bg: 'bg-purple-50/60', iconColor: 'text-purple-500', labelColor: 'text-purple-700', activeBg: 'bg-purple-100', activeBorder: 'border-purple-300', activeText: 'text-purple-700', activeBadge: 'bg-purple-200' },
                  { id: 'cognitive', label: 'Cognitive Skills', icon: <FaBrain />, border: 'border-indigo-200', bg: 'bg-indigo-50/60', iconColor: 'text-indigo-500', labelColor: 'text-indigo-700', activeBg: 'bg-indigo-100', activeBorder: 'border-indigo-300', activeText: 'text-indigo-700', activeBadge: 'bg-indigo-200' },
                  { id: 'tools', label: 'Tools & Technologies', icon: <FaToolbox />, border: 'border-amber-200', bg: 'bg-amber-50/60', iconColor: 'text-amber-500', labelColor: 'text-amber-700', activeBg: 'bg-amber-100', activeBorder: 'border-amber-300', activeText: 'text-amber-700', activeBadge: 'bg-amber-200' },
                  { id: 'ethics', label: 'Ethics & Values', icon: <FaShieldAlt />, border: 'border-emerald-200', bg: 'bg-emerald-50/60', iconColor: 'text-emerald-500', labelColor: 'text-emerald-700', activeBg: 'bg-emerald-100', activeBorder: 'border-emerald-300', activeText: 'text-emerald-700', activeBadge: 'bg-emerald-200' }
                ].map(category => {
                  const skills = availableSkills[category.id] || [];
                  if (skills.length === 0) return null;

                  const selectedCount = (filters.skills?.[category.id] || []).length;

                  return (
                    <div key={category.id} className={`p-3 rounded-lg border ${category.border} ${category.bg}`}>
                      <div className="flex justify-between items-center mb-2">
                        <label className={`text-xs font-semibold flex items-center gap-2 ${category.labelColor}`}>
                          <span className={category.iconColor}>{category.icon}</span>
                          {category.label}
                        </label>
                        {selectedCount > 0 && (
                          <button
                            onClick={() => {
                              const newSkills = { ...filters.skills, [category.id]: [] };
                              onFilterChange('skills', newSkills);
                            }}
                            className={`text-[10px] ${category.activeText} hover:opacity-80 font-bold`}
                          >
                            Clear ({selectedCount})
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map(skill => {
                          const isChecked = (filters.skills?.[category.id] || []).includes(skill);
                          const count = filterCounts.skills?.[category.id]?.[skill] || 0;

                          return (
                            <button
                              key={skill}
                              onClick={() => {
                                const currentSelected = filters.skills?.[category.id] || [];
                                const newSelected = isChecked
                                  ? currentSelected.filter(s => s !== skill)
                                  : [...currentSelected, skill];

                                onFilterChange('skills', {
                                  ...filters.skills,
                                  [category.id]: newSelected
                                });
                              }}
                              className={`px-2 py-1 rounded text-[10px] border transition-all flex items-center gap-1.5 ${isChecked
                                ? `${category.activeBg} ${category.activeBorder} ${category.activeText} font-bold shadow-sm`
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                            >
                              {skill}
                              {count > 0 && (
                                <span className={`px-1 rounded-full text-[9px] ${isChecked ? category.activeBadge : 'bg-gray-100'}`}>
                                  {count}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {/* Bulk Actions Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
              <FaToggleOn className="text-primary-600" />
              Bulk Operations
            </label>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <button
                    onClick={onBulkEligible}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95 group w-full"
                    title="Mark all users in the current visible grid as eligible"
                  >
                    <FaCheckCircle className="text-blue-100 group-hover:text-white transition-colors" />
                    Mark {filteredUsers.length} Filtered as Eligible
                  </button>
                  <button
                    onClick={() => onClearFilters('eligible')}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-blue-600 text-xs font-bold rounded-lg border border-blue-600 hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95 transition-all shadow-sm"
                  >
                    <FaEye /> View All Eligible
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={onBulkPending}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-all shadow-md hover:shadow-lg active:scale-95 group w-full"
                    title="Mark all users in the current visible grid as pending"
                  >
                    <FaHourglassHalf className="text-amber-100 group-hover:text-white transition-colors" />
                    Mark {filteredUsers.length} Filtered as Pending
                  </button>
                  <button
                    onClick={() => onClearFilters('pending')}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-amber-600 text-xs font-bold rounded-lg border border-amber-600 hover:bg-amber-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 active:scale-95 transition-all shadow-sm"
                  >
                    <FaEye /> View All Pending
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={onBulkReject}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-all shadow-md hover:shadow-lg active:scale-95 group w-full"
                    title="Reject all users who DO NOT match qualitative filters (Degree, Year, etc.)"
                  >
                    <FaTimesCircle className="text-red-100 group-hover:text-white transition-colors" />
                    Reject {users.length - qualificationMatchedUsers.length} Non-Matching Users
                  </button>
                  <button
                    onClick={() => onClearFilters('rejected')}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-red-600 text-xs font-bold rounded-lg border border-red-600 hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 active:scale-95 transition-all shadow-sm"
                  >
                    <FaEye /> View All Rejected
                  </button>
                </div>
              </div>

              {/* Selected Users Actions */}
              <div className={`p-4 rounded-xl border transition-all duration-300 ${selectedUsers.length > 0 ? 'bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-indigo-200 shadow-md' : 'bg-slate-100/50 border-slate-200'}`}>
                <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
                  {/* Left: Info & Global Select */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${selectedUsers.length > 0 ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-200' : 'bg-gray-200'}`}>
                        <FaUsers size={20} className={`transition-colors ${selectedUsers.length > 0 ? 'text-white' : 'text-gray-400'}`} />
                      </div>
                      {selectedUsers.length > 0 && (
                        <>
                          <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] flex items-center justify-center px-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-black rounded-full shadow-md border-2 border-white animate-bounce">
                            {selectedUsers.length}
                          </span>
                        </>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <p className={`text-sm font-bold transition-colors whitespace-nowrap ${selectedUsers.length > 0 ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600' : 'text-gray-500'}`}>
                          {selectedUsers.length > 0 ? `${selectedUsers.length} Selected` : 'None Selected'}
                        </p>
                        <button
                          onClick={() => selectedUsers.length === filteredUsers.length ? onClearSelection() : onSelectAllFiltered()}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border whitespace-nowrap ${selectedUsers.length === filteredUsers.length
                            ? 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200'
                            : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 shadow-sm'
                            }`}
                        >
                          {selectedUsers.length === filteredUsers.length ? 'Unselect All' : `Select All ${filteredUsers.length}`}
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">Manage selections across pages</p>
                    </div>
                  </div>

                  {/* Middle: Per-Page Selection */}
                  {totalPages > 1 && (
                    <div className="flex flex-col gap-2">
                      <p className="text-[11px] font-bold text-gray-500 tracking-tight ml-1">Select By Page</p>
                      <div className="flex flex-wrap items-center gap-1.5 max-w-[500px]">
                        {Array.from({ length: totalPages }).map((_, i) => {
                          const pageIndex = i + 1;
                          const start = i * rowsPerPage;
                          const end = (i + 1) * rowsPerPage;
                          const pageUserIds = filteredUsers.slice(start, end).map(u => u._id);
                          const isPageSelected = pageUserIds.length > 0 && pageUserIds.every(id => selectedUsers.includes(id));

                          return (
                            <button
                              key={pageIndex}
                              onClick={() => onTogglePageSelection(pageIndex)}
                              className={`w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-bold transition-all border ${isPageSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                                }`}
                              title={`Toggle selection for Page ${pageIndex}`}
                            >
                              {pageIndex}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Right: Actions */}
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => onBulkDelete()}
                      disabled={selectedUsers.length === 0}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <FaTrashAlt /> Permanent Delete {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-500 italic flex items-center gap-1">
              <FaHourglassHalf className="text-gray-400" />
              * Bulk actions are permanent and affect all matching users. Permanent delete cannot be undone.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
