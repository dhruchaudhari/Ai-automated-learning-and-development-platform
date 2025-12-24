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
  FaToggleOff,
  FaSortAmountDown,
  FaSortAmountUp,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaCalendar
} from "react-icons/fa";
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

// Calculate activation duration (simplified)
const calculateActivationDuration = (activationHistory) => {
  if (!activationHistory || activationHistory.length === 0) {
    return { active: false };
  }
  const lastEntry = activationHistory[activationHistory.length - 1];
  return { active: lastEntry && lastEntry.status === 'active' };
};

const FilterPanel = ({ 
  filters, 
  onFilterChange, 
  onClearFilters,
  onSortChange,
  sortBy,
  users
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

  const activationOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active', icon: <FaToggleOn /> },
    { value: 'inactive', label: 'Inactive', icon: <FaToggleOff /> }
  ];

  const dateRangeOptions = [
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'last90days', label: 'Last 90 Days' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const sortOptions = [
    { value: 'latest', label: 'Latest First', icon: <FaSortAmountDown /> },
    { value: 'oldest', label: 'Oldest First', icon: <FaSortAmountUp /> },
    { value: 'name-asc', label: 'Name A-Z', icon: <FaSortAlphaDown /> },
    { value: 'name-desc', label: 'Name Z-A', icon: <FaSortAlphaUp /> },
    { value: 'recent-active', label: 'Recently Active', icon: <FaClock /> },
    { value: 'most-active', label: 'Most Active', icon: <FaToggleOn /> }
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
    
    switch(value) {
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

  // Calculate filter statistics
  const filteredCount = users.length;
  const activeUsers = users.filter(user => 
    calculateActivationDuration(user.activationHistory || []).active
  ).length;
  const maleUsers = users.filter(user => user.gender === 'Male').length;
  const femaleUsers = users.filter(user => user.gender === 'Female').length;

  return (
    <div className="mb-6">
      {/* Filter Header with Statistics */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <FaFilter className="text-primary-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Filters & Sorting</h3>
            <p className="text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <FaClock className="text-green-500 animate-pulse" />
                Live Stats
              </span>
              • {filteredCount} users • {activeUsers} active • {maleUsers} male • {femaleUsers} female
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {isOpen ? 'Hide Filters' : 'Show Filters'}
          </button>
          
          <button
            onClick={onClearFilters}
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
            {/* Left Column - Basic Filters */}
            <div className="space-y-6">
              {/* Gender Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Gender
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {genderOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => onFilterChange('gender', option.value)}
                      className={`flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg transition-all ${
                        filters.gender === option.value
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-300 shadow-sm'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activation Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Activation Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {activationOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => onFilterChange('activationStatus', option.value)}
                      className={`flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg transition-all ${
                        filters.activationStatus === option.value
                          ? option.value === 'active'
                            ? 'bg-green-100 text-green-700 border-2 border-green-300 shadow-sm'
                            : 'bg-red-100 text-red-700 border-2 border-red-300 shadow-sm'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Date & Sort */}
            <div className="space-y-6">
              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Registration Date
                </label>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {dateRangeOptions.slice(0, -1).map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleDateRangeChange(option.value)}
                        className={`px-3 py-2 text-sm rounded-lg transition-all ${
                          filters.dateRange?.value === option.value
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

              {/* Sorting Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Sort By
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {sortOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => onSortChange(option.value)}
                      className={`flex flex-col items-center justify-center gap-1 px-2 py-3 text-xs rounded-lg transition-all ${
                        sortBy === option.value
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
        </div>
      )}
    </div>
  );
};

export default FilterPanel;