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
  FaBullhorn
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
  filterCounts = {},
  degreeOptions = [],
  degreeSpecMap = {},
  advertisements = [],
  onManageDegrees,
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
            {/* Left Column - Administrative & Structure */}
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
            </div>

            {/* Right Column - User Attributes & Academic Details */}
            <div className="space-y-6">
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
                  {advertisements.map(ad => (
                    <option key={ad._id} value={ad._id}>
                      {ad.title}
                    </option>
                  ))}
                </select>
                {filters.advertisement && filterCounts.advertisement !== undefined && (
                  <p className="mt-1 text-xs text-blue-600 font-bold">
                    {filterCounts.advertisement} users matching this ad
                  </p>
                )}
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
          </div>

          {/* Bulk Actions Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
              <FaToggleOn className="text-primary-600" />
              Bulk Operations
            </label>
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
            <p className="mt-3 text-xs text-gray-500 italic flex items-center gap-1">
              <FaHourglassHalf className="text-gray-400" />
              * Bulk actions are permanent and affect all users matching the criteria across all pages.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;