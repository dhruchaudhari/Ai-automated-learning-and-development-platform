import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { userAPI } from "../utils/api";
import { 
  validateFullName, 
  validateEmail, 
  validateMobile, 
  validateDOB, 
  validateProfileImage, 
  validateDocument,
  parseDateInput
} from "../utils/validations";
import { MOBILE_COUNTRIES, PHONE_EXAMPLES } from "../utils/constants";
import {
  FaUser,
  FaCalendar,
  FaEnvelope,
  FaPhone,
  FaCamera,
  FaFilePdf,
  FaUpload,
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaTrash,
  FaEye,
  FaCheck,
  FaTimes,
  FaInfoCircle
} from "react-icons/fa";
import "react-datepicker/dist/react-datepicker.css";

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const EditUser = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    dob: null,
    email: '',
    mobile: '',
    profileImage: null,
    document: null,
  });
  const [errors, setErrors] = useState({});
  const [selectedCountry, setSelectedCountry] = useState('+91');
  const [imagePreview, setImagePreview] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [existingProfileImage, setExistingProfileImage] = useState(null);
  const [existingDocument, setExistingDocument] = useState(null);
  const [fieldTouched, setFieldTouched] = useState({
    fullName: false,
    dob: false,
    email: false,
    mobile: false,
    profileImage: false,
    document: false,
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const datePickerRef = useRef(null);
  const mobileInputRef = useRef(null);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setFetching(true);
      const response = await userAPI.getUserById(id);
      const user = response.data.data;
      
      if (!user) {
        toast.error("User not found");
        navigate("/grid");
        return;
      }
      
      // Parse date
      let dobDate = null;
      if (user.dob) {
        try {
          dobDate = new Date(user.dob);
          if (isNaN(dobDate.getTime())) {
            dobDate = null;
          }
        } catch (error) {
          console.error("Error parsing date:", error);
          dobDate = null;
        }
      }
      
      // Format mobile number
      let mobileNumber = user.mobile || "";
      let countryCode = "+91";
      if (mobileNumber) {
        // Extract country code
        const match = mobileNumber.match(/^\+\d{1,3}/);
        if (match) {
          countryCode = match[0];
          mobileNumber = mobileNumber.replace(countryCode, '');
        }
      }
      
      setFormData({
        fullName: user.fullName || "",
        dob: dobDate,
        email: user.email || "",
        mobile: mobileNumber,
        profileImage: null,
        document: null,
      });
      
      setSelectedCountry(countryCode);
      
      // Set existing files for preview
      if (user.profileImage) {
        setExistingProfileImage(user.profileImage);
        setImagePreview(user.profileImage);
      }
      
      if (user.document) {
        setExistingDocument(user.document);
        setDocumentPreview(user.document);
      }
      
      setIsDirty(false);
      
    } catch (error) {
      console.error("Error fetching user for edit:", error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else if (error.response?.status === 404) {
        toast.error("User not found");
        navigate("/grid");
      } else {
        toast.error("Failed to load user details");
        navigate("/grid");
      }
    } finally {
      setFetching(false);
    }
  };

  const validateField = useCallback(async (name, value, countryCode = '+91') => {
    switch (name) {
      case 'fullName':
        return validateFullName(value);
      case 'email':
        return validateEmail(value);
      case 'mobile':
        return validateMobile(value, countryCode);
      case 'dob':
        if (value instanceof Date) {
          return validateDOB(value);
        }
        return value ? validateDOB(value) : 'Date of birth is required';
      case 'profileImage':
        if (value instanceof File) {
          return validateProfileImage(value);
        }
        // For edit, profile image is optional
        return '';
      case 'document':
        if (value instanceof File) {
          return validateDocument(value);
        }
        // For edit, document is optional
        return '';
      default:
        return '';
    }
  }, []);

  const debouncedFormData = useDebounce(formData, 500);

  useEffect(() => {
    const validateFormLive = async () => {
      const newErrors = {};
      
      for (const [field, value] of Object.entries(debouncedFormData)) {
        if (fieldTouched[field] || value) {
          if (field === 'mobile') {
            newErrors[field] = await validateField(field, value, selectedCountry);
          } else if (field === 'profileImage' || field === 'document') {
            if (value instanceof File) {
              const result = await validateField(field, value);
              if (result) newErrors[field] = result;
            }
          } else {
            const error = await validateField(field, value);
            if (error) newErrors[field] = error;
          }
        }
      }
      
      const filteredErrors = Object.fromEntries(
        Object.entries(newErrors).filter(([_, error]) => error !== '')
      );
      
      setErrors(prevErrors => {
        if (JSON.stringify(prevErrors) !== JSON.stringify(filteredErrors)) {
          return filteredErrors;
        }
        return prevErrors;
      });
    };

    validateFormLive();
  }, [debouncedFormData, fieldTouched, validateField, selectedCountry]);

  const handleTouch = (fieldName) => {
    setFieldTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));
  };

  const handleBlur = (fieldName) => {
    setFieldTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));
  };

  const isFieldValid = (fieldName) => {
    return fieldTouched[fieldName] && formData[fieldName] && !errors[fieldName];
  };

  const isFieldInvalid = (fieldName) => {
    return fieldTouched[fieldName] && errors[fieldName];
  };

  const formatDateForInput = (date) => {
    if (!date) return '';
    if (typeof date === 'string') {
      const parsed = parseDateInput(date);
      if (parsed) {
        const d = new Date(parsed);
        const day = d.getDate().toString().padStart(2, '0');
        const month = d.toLocaleDateString('en-US', { month: 'short' });
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      }
      return date;
    }
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleChange = async (e) => {
    const { name, value, files } = e.target;
    
    handleTouch(name);
    
    if (files) {
      const file = files[0];
      
      if (!file) {
        setFormData(prev => ({
          ...prev,
          [name]: null
        }));
        if (name === 'profileImage') setImagePreview(null);
        if (name === 'document') setDocumentPreview(null);
        setIsDirty(true);
        return;
      }
      
      if (name === 'profileImage') {
        const error = await validateProfileImage(file);
        if (error) {
          e.target.value = '';
          toast.error(error);
          setFormData(prev => ({ ...prev, profileImage: null }));
          setImagePreview(null);
          return;
        }
        setImagePreview(URL.createObjectURL(file));
      } else if (name === 'document') {
        const error = await validateDocument(file);
        if (error) {
          e.target.value = '';
          toast.error(error);
          setFormData(prev => ({ ...prev, document: null }));
          setDocumentPreview(null);
          return;
        }
        setDocumentPreview(URL.createObjectURL(file));
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
      setIsDirty(true);
      
    } else {
      let newValue = value;
      
      if (name === 'mobile') {
        // Only allow digits
        const digitsOnly = value.replace(/\D/g, '');
        newValue = digitsOnly;
        
        // Limit length for India
        if (selectedCountry === '+91') {
          newValue = newValue.substring(0, 10);
        }
        
      } else if (name === 'fullName') {
        newValue = value.replace(/[^a-zA-Z\s\-\']/g, '');
      } else if (name === 'email') {
        newValue = value.toLowerCase();
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: newValue
      }));
      setIsDirty(true);
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Handle DOB input change
  const handleDobInputChange = (e) => {
    const value = e.target.value;
    handleTouch('dob');
    
    // Parse the input
    const parsedDate = parseDateInput(value);
    
    if (parsedDate) {
      // Valid date format
      setFormData(prev => ({
        ...prev,
        dob: parsedDate
      }));
      
      // Clear error if valid
      if (errors.dob) {
        setErrors(prev => ({ ...prev, dob: '' }));
      }
    } else if (value.trim() === '') {
      // Empty input
      setFormData(prev => ({
        ...prev,
        dob: null
      }));
    } else {
      // Invalid date, keep as string for validation
      setFormData(prev => ({
        ...prev,
        dob: value
      }));
    }
    setIsDirty(true);
  };

  // Handle calendar date selection
  const handleCalendarChange = (date) => {
    setFormData(prev => ({
      ...prev,
      dob: date
    }));
    
    // Clear error if valid
    if (errors.dob) {
      setErrors(prev => ({ ...prev, dob: '' }));
    }
    
    setIsCalendarOpen(false);
    setIsDirty(true);
  };

  // Toggle calendar
  const toggleCalendar = () => {
    setIsCalendarOpen(!isCalendarOpen);
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCountryChange = (e) => {
    const countryCode = e.target.value;
    setSelectedCountry(countryCode);
    
    // Reset mobile number when country changes
    setFormData(prev => ({
      ...prev,
      mobile: ''
    }));
    setIsDirty(true);
    
    // Focus on mobile input after country change
    setTimeout(() => {
      if (mobileInputRef.current) {
        mobileInputRef.current.focus();
      }
    }, 100);
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      profileImage: null
    }));
    setImagePreview(null);
    setExistingProfileImage(null);
    setIsDirty(true);
    
    if (errors.profileImage) {
      setErrors(prev => ({ ...prev, profileImage: '' }));
    }
  };

  const handleRemoveDocument = () => {
    setFormData(prev => ({
      ...prev,
      document: null
    }));
    setDocumentPreview(null);
    setExistingDocument(null);
    setIsDirty(true);
    
    if (errors.document) {
      setErrors(prev => ({ ...prev, document: '' }));
    }
  };

  const getCountryInfo = (code) => {
    const country = MOBILE_COUNTRIES.find(c => c.code === code);
    return country || { code: '+91', name: 'India', flag: '🇮🇳', digits: 10 };
  };

  const getCountryValidationMessage = (code) => {
    const country = getCountryInfo(code);
    const example = PHONE_EXAMPLES[code];
    
    if (!example) {
      return `Enter a valid ${country.name} phone number`;
    }
    
    return `${country.name}: ${example.format} ${example.note ? `(${example.note})` : ''}`;
  };

  // Format phone number for display
  const formatPhoneNumber = (number) => {
    if (!number) return '';
    
    const digits = number.replace(/\D/g, '');
    
    switch (selectedCountry) {
      case '+91': // India
        if (digits.length <= 5) return digits;
        return `${digits.slice(0,5)}-${digits.slice(5,10)}`;
      default:
        return digits;
    }
  };

  // Handle phone input with formatting
  const handlePhoneChange = (e) => {
    const value = e.target.value;
    handleTouch('mobile');
    
    // Extract digits only for storage
    const digitsOnly = value.replace(/\D/g, '');
    
    // Format for display
    const formatted = formatPhoneNumber(digitsOnly);
    
    // Update input value with formatting
    e.target.value = formatted;
    
    // Store digits only in form data
    setFormData(prev => ({
      ...prev,
      mobile: digitsOnly
    }));
    setIsDirty(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = Object.keys(fieldTouched).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setFieldTouched(allTouched);
    
    // Validate required fields
    const validationResults = await Promise.all([
      validateField('fullName', formData.fullName),
      validateField('email', formData.email),
      validateField('mobile', formData.mobile, selectedCountry),
      validateField('dob', formData.dob),
    ]);
    
    const finalErrors = {
      fullName: validationResults[0],
      email: validationResults[1],
      mobile: validationResults[2],
      dob: validationResults[3],
    };
    
    // Validate files if they exist
    if (formData.profileImage instanceof File) {
      finalErrors.profileImage = await validateField('profileImage', formData.profileImage);
    }
    
    if (formData.document instanceof File) {
      finalErrors.document = await validateField('document', formData.document);
    }
    
    const filteredErrors = Object.fromEntries(
      Object.entries(finalErrors).filter(([_, error]) => error !== '')
    );
    
    setErrors(filteredErrors);
    
    if (Object.keys(filteredErrors).length > 0) {
      toast.error('Please fix all validation errors');
      const firstErrorField = Object.keys(filteredErrors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => element.focus(), 300);
      }
      return;
    }

    setLoading(true);
    
    try {
      const submitData = new FormData();
      submitData.append('fullName', formData.fullName.trim());
      
      let dobValue;
      if (formData.dob instanceof Date) {
        dobValue = formData.dob.toISOString();
      } else if (typeof formData.dob === 'string') {
        const parsed = parseDateInput(formData.dob);
        dobValue = parsed ? parsed.toISOString() : formData.dob;
      } else {
        dobValue = formData.dob;
      }
      
      submitData.append('dob', dobValue);
      submitData.append('email', formData.email.trim().toLowerCase());
      submitData.append('mobile', selectedCountry + formData.mobile);
      
      // Handle profile image
      if (formData.profileImage instanceof File) {
        // New file uploaded
        submitData.append('profileImage', formData.profileImage);
      } else if (!existingProfileImage && !formData.profileImage) {
        // No existing image and no new image - send empty to clear
        submitData.append('profileImage', '');
      }
      // If existingProfileImage exists and no new file, don't send anything (keep existing)
      
      // Handle document
      if (formData.document instanceof File) {
        // New file uploaded
        submitData.append('document', formData.document);
      } else if (!existingDocument && !formData.document) {
        // No existing document and no new document - send empty to clear
        submitData.append('document', '');
      }
      // If existingDocument exists and no new file, don't send anything (keep existing)

      console.log('Updating user with data:', {
        fullName: formData.fullName,
        email: formData.email,
        mobile: selectedCountry + formData.mobile,
        hasProfileImage: !!(formData.profileImage || existingProfileImage),
        hasDocument: !!(formData.document || existingDocument)
      });

      const response = await userAPI.updateUser(id, submitData);
      
      if (response.data.success) {
        toast.success('User updated successfully!');
        navigate('/grid');
      }
    } catch (error) {
      console.error('Update error:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else {
        const errorMsg = error.response?.data?.message || error.message;
        
        if (errorMsg?.includes('email') || errorMsg?.includes('Email')) {
          setErrors(prev => ({ ...prev, email: 'Email already registered' }));
          toast.error('Email already registered');
        } else if (errorMsg?.includes('mobile') || errorMsg?.includes('phone')) {
          setErrors(prev => ({ ...prev, mobile: 'Mobile number already registered' }));
          toast.error('Mobile number already registered');
        } else {
          toast.error(errorMsg || 'Update failed. Please try again.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletion = () => {
    const requiredFields = ['fullName', 'email', 'mobile', 'dob'];
    const filledFields = requiredFields.filter(field => {
      const value = formData[field];
      if (!value) return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      return true;
    }).length;
    
    // Files are optional in edit mode, so they don't count toward completion
    return Math.round((filledFields / 4) * 100);
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
          <FaSpinner className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading User Details</h3>
          <p className="text-gray-500">Please wait while we fetch the user information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 py-8 px-4 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        {/* Header - Matching registration form style */}
        <div className="text-center mb-8 animate-slide-down">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full shadow-lg mb-4">
            <FaUser className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            Edit User
          </h1>
          <p className="text-gray-600">Update user information</p>
          <div className="mt-4 inline-block bg-yellow-50 text-yellow-700 text-sm font-medium py-2 px-4 rounded-full border border-yellow-200">
            <FaInfoCircle className="inline mr-2" />
            Files are optional. Leave unchanged to keep existing files.
          </div>
        </div>

        {/* Main Card - Matching registration form card style */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                  <FaUser className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Edit User Information</h2>
                  <p className="text-blue-100 text-sm">Update the user details below</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/grid")}
                className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 px-4 rounded-lg transition-all duration-300"
              >
                <FaArrowLeft />
                Back to Grid
              </button>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <FaUser className="mr-2 text-blue-600" />
                    Full Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      onBlur={() => handleBlur('fullName')}
                      className={`w-full px-4 py-3 border ${isFieldInvalid('fullName') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('fullName') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                      placeholder="Enter full name"
                      disabled={loading}
                      maxLength={100}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {isFieldValid('fullName') && <FaCheck className="text-green-600" />}
                      {isFieldInvalid('fullName') && <FaTimes className="text-red-600" />}
                    </div>
                  </div>
                  {errors.fullName && (
                    <p className="text-sm text-red-600 animate-slide-up flex items-center">
                      <FaTimes className="mr-1" /> {errors.fullName}
                    </p>
                  )}
                  {isFieldValid('fullName') && (
                    <p className="text-sm text-green-600 animate-slide-up flex items-center">
                      <FaCheck className="mr-1" /> Valid full name
                    </p>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <FaCalendar className="mr-2 text-blue-600" />
                    Date of Birth *
                  </label>
                  
                  <div className="relative" ref={datePickerRef}>
                    <div className="flex">
                      <input
                        type="text"
                        name="dob"
                        value={formatDateForInput(formData.dob)}
                        onChange={handleDobInputChange}
                        onBlur={() => handleBlur('dob')}
                        onClick={() => setIsCalendarOpen(true)}
                        className={`w-full px-4 py-3 border ${isFieldInvalid('dob') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('dob') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'} rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                        placeholder="DD/MMM/YYYY or DD-MM-YYYY"
                        disabled={loading}
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={toggleCalendar}
                        className={`px-4 border ${isFieldInvalid('dob') ? 'border-red-500' : isFieldValid('dob') ? 'border-green-500' : 'border-gray-300'} border-l-0 rounded-r-lg bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center`}
                        disabled={loading}
                      >
                        <FaCalendar className="text-gray-600" />
                      </button>
                    </div>
                    
                    {/* Calendar dropdown */}
                    {isCalendarOpen && (
                      <div className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl">
                        <DatePicker
                          selected={formData.dob instanceof Date ? formData.dob : null}
                          onChange={handleCalendarChange}
                          inline
                          showYearDropdown
                          scrollableYearDropdown
                          yearDropdownItemNumber={100}
                          maxDate={new Date()}
                          minDate={new Date(1900, 0, 1)}
                          disabled={loading}
                          peekNextMonth
                          showMonthDropdown
                          dropdownMode="select"
                        />
                      </div>
                    )}
                    
                    <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
                      {isFieldValid('dob') && <FaCheck className="text-green-600" />}
                      {isFieldInvalid('dob') && <FaTimes className="text-red-600" />}
                    </div>
                  </div>
                  
                  {errors.dob && (
                    <p className="text-sm text-red-600 animate-slide-up flex items-center">
                      <FaTimes className="mr-1" /> {errors.dob}
                    </p>
                  )}
                  {isFieldValid('dob') && (
                    <p className="text-sm text-green-600 animate-slide-up flex items-center">
                      <FaCheck className="mr-1" /> Valid date of birth
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Type or click calendar. Accepts: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY or DD/MMM/YYYY, DD-MMM-YYYY
                  </p>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <FaEnvelope className="mr-2 text-blue-600" />
                    Email Address *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={() => handleBlur('email')}
                      onKeyDown={(e) => {
                        if (e.key === ' ') {
                          e.preventDefault();
                          toast.error('Email cannot contain spaces');
                        }
                      }}
                      className={`w-full px-4 py-3 border ${isFieldInvalid('email') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('email') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                      placeholder="Enter email address"
                      disabled={loading}
                      maxLength={254}
                      minLength={6}
                      autoComplete="email"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {isFieldValid('email') && <FaCheck className="text-green-600" />}
                      {isFieldInvalid('email') && <FaTimes className="text-red-600" />}
                    </div>
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600 animate-slide-up flex items-center">
                      <FaTimes className="mr-1" /> {errors.email}
                    </p>
                  )}
                  {isFieldValid('email') && (
                    <p className="text-sm text-green-600 animate-slide-up flex items-center">
                      <FaCheck className="mr-1" /> Valid email address
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Standard email format (no spaces, max 254 characters)
                  </p>
                </div>

                {/* Mobile Number */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <FaPhone className="mr-2 text-blue-600" />
                    Mobile Number *
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={selectedCountry}
                      onChange={handleCountryChange}
                      className="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      disabled={loading}
                    >
                      {MOBILE_COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.code}
                        </option>
                      ))}
                    </select>
                    <div className="relative flex-1">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        {selectedCountry}
                      </div>
                      <input
                        ref={mobileInputRef}
                        type="tel"
                        name="mobile"
                        value={formatPhoneNumber(formData.mobile)}
                        onChange={handlePhoneChange}
                        onBlur={() => handleBlur('mobile')}
                        className={`w-full pl-14 px-4 py-3 border ${isFieldInvalid('mobile') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('mobile') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                        placeholder="Enter phone number"
                        disabled={loading}
                        inputMode="tel"
                        maxLength={25}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {isFieldValid('mobile') && <FaCheck className="text-green-600" />}
                        {isFieldInvalid('mobile') && <FaTimes className="text-red-600" />}
                      </div>
                    </div>
                  </div>
                  {errors.mobile && (
                    <p className="text-sm text-red-600 animate-slide-up flex items-center">
                      <FaTimes className="mr-1" /> {errors.mobile}
                    </p>
                  )}
                  {isFieldValid('mobile') && (
                    <p className="text-sm text-green-600 animate-slide-up flex items-center">
                      <FaCheck className="mr-1" /> Valid {getCountryInfo(selectedCountry).name} number
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {getCountryValidationMessage(selectedCountry)}
                  </p>
                </div>

                {/* Profile Image */}
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <FaCamera className="mr-2 text-blue-600" />
                    Profile Image
                    {existingProfileImage && !formData.profileImage && (
                      <span className="ml-2 text-xs text-green-600">(Existing image will be kept)</span>
                    )}
                  </label>
                  <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                    <label className={`cursor-pointer flex-1 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="file"
                        name="profileImage"
                        onChange={handleChange}
                        onBlur={() => handleBlur('profileImage')}
                        accept=".jpg,.jpeg,image/jpeg"
                        className="hidden"
                        disabled={loading}
                      />
                      <div className={`border-2 border-dashed rounded-xl p-8 ${isFieldInvalid('profileImage') ? 'border-red-500' : isFieldValid('profileImage') ? 'border-green-500' : 'border-gray-300'} hover:border-blue-500 transition-all duration-300 bg-gray-50`}>
                        <div className="text-center">
                          <FaUpload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600">
                            {formData.profileImage ? formData.profileImage.name : 
                             existingProfileImage ? 'Click to change profile image (optional)' : 
                             'Click to upload profile image (optional)'}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">Max 1MB, JPEG only (.jpg, .jpeg)</p>
                        </div>
                      </div>
                    </label>
                    
                    {(imagePreview || existingProfileImage) && (
                      <div className="relative">
                        <div className="w-32 h-32 rounded-xl overflow-hidden border-4 border-white shadow-lg">
                          <img
                            src={imagePreview || existingProfileImage}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center">
                          <FaCamera className="w-4 h-4" />
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute -top-2 -left-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          title="Remove image"
                          disabled={loading}
                        >
                          <FaTrash className="w-3 h-3" />
                        </button>
                        {(existingProfileImage || (formData.profileImage && typeof formData.profileImage === 'string')) && (
                          <button
                            type="button"
                            onClick={() => window.open(imagePreview || existingProfileImage, "_blank")}
                            className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                            title="View image"
                            disabled={loading}
                          >
                            <FaEye className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {errors.profileImage && (
                    <p className="text-sm text-red-600 animate-slide-up flex items-center">
                      <FaTimes className="mr-1" /> {errors.profileImage}
                    </p>
                  )}
                  {isFieldValid('profileImage') && (
                    <p className="text-sm text-green-600 animate-slide-up flex items-center">
                      <FaCheck className="mr-1" /> Valid JPEG image uploaded
                    </p>
                  )}
                  {!formData.profileImage && existingProfileImage && (
                    <p className="text-sm text-blue-600 animate-slide-up flex items-center">
                      <FaInfoCircle className="mr-1" /> Existing image will be kept if not changed
                    </p>
                  )}
                </div>

                {/* Document */}
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <FaFilePdf className="mr-2 text-blue-600" />
                    Document
                    {existingDocument && !formData.document && (
                      <span className="ml-2 text-xs text-green-600">(Existing document will be kept)</span>
                    )}
                  </label>
                  <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                    <label className={`cursor-pointer flex-1 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="file"
                        name="document"
                        onChange={handleChange}
                        onBlur={() => handleBlur('document')}
                        accept=".pdf,application/pdf"
                        className="hidden"
                        disabled={loading}
                      />
                      <div className={`border-2 border-dashed rounded-xl p-8 ${isFieldInvalid('document') ? 'border-red-500' : isFieldValid('document') ? 'border-green-500' : 'border-gray-300'} hover:border-blue-500 transition-all duration-300 bg-gray-50`}>
                        <div className="text-center">
                          <FaUpload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600">
                            {formData.document ? formData.document.name : 
                             existingDocument ? 'Click to change PDF document (optional)' : 
                             'Click to upload PDF document (optional)'}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">Max 5MB, PDF only (.pdf)</p>
                        </div>
                      </div>
                    </label>
                    
                    {(documentPreview || existingDocument) && (
                      <div className="relative">
                        <div className="w-32 h-32 rounded-xl overflow-hidden border-4 border-white shadow-lg bg-red-50 flex items-center justify-center">
                          <div className="text-center">
                            <FaFilePdf className="w-12 h-12 text-red-500 mx-auto mb-2" />
                            <p className="text-xs text-gray-700 font-medium truncate max-w-[100px]">
                              {formData.document?.name || 'PDF Document'}
                            </p>
                            <p className="text-xs text-gray-500">PDF Document</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveDocument}
                          className="absolute -top-2 -left-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          title="Remove document"
                          disabled={loading}
                        >
                          <FaTrash className="w-3 h-3" />
                        </button>
                        {(existingDocument || (formData.document && typeof formData.document === 'string')) && (
                          <button
                            type="button"
                            onClick={() => window.open(documentPreview || existingDocument, "_blank")}
                            className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                            title="View document"
                            disabled={loading}
                          >
                            <FaEye className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {errors.document && (
                    <p className="text-sm text-red-600 animate-slide-up flex items-center">
                      <FaTimes className="mr-1" /> {errors.document}
                    </p>
                  )}
                  {isFieldValid('document') && (
                    <p className="text-sm text-green-600 animate-slide-up flex items-center">
                      <FaCheck className="mr-1" /> Valid PDF document uploaded
                    </p>
                  )}
                  {!formData.document && existingDocument && (
                    <p className="text-sm text-blue-600 animate-slide-up flex items-center">
                      <FaInfoCircle className="mr-1" /> Existing document will be kept if not changed
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={loading || Object.keys(errors).length > 0 || !isDirty}
                    className={`flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${loading || Object.keys(errors).length > 0 || !isDirty ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <FaSpinner className="animate-spin mr-3" />
                        Updating User...
                      </span>
                    ) : (
                      <>
                        <FaSave className="inline mr-2" />
                        Update User
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => navigate('/grid')}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all duration-300 border border-gray-300"
                  >
                    <FaArrowLeft className="inline mr-2" />
                    Cancel
                  </button>
                </div>
              </div>
            </form>

            {/* Form Progress */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Form Completion</span>
                <span className={`text-sm font-semibold ${calculateCompletion() === 100 ? 'text-green-600' : 'text-blue-600'}`}>
                  {calculateCompletion()}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${calculateCompletion() === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`}
                  style={{
                    width: `${calculateCompletion()}%`
                  }}
                ></div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {Object.keys(errors).length > 0 ? (
                  <span className="text-red-600">
                    {Object.keys(errors).length} validation error(s) remaining
                  </span>
                ) : calculateCompletion() === 100 ? (
                  <span className="text-green-600">
                    ✓ All required fields are valid!
                  </span>
                ) : (
                  <span>
                    Fill all required fields (marked with *) to enable update
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Fields marked with * are required. Files are optional - leave unchanged to keep existing files.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EditUser;