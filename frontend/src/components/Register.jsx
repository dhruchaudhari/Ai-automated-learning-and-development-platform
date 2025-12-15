import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { toast } from 'react-hot-toast';
import { userAPI } from '../utils/api';
import { 
  validateFullName, 
  validateEmail, 
  validatePassword, 
  validateMobile, 
  validateDOB, 
  validateProfileImage, 
  validateDocument,
  preventPasswordCopyPaste
} from '../utils/validations';
import { MOBILE_COUNTRIES, APP_CONSTANTS } from '../utils/constants';
import { 
  FaUser, 
  FaCalendar, 
  FaEnvelope, 
  FaLock, 
  FaPhone, 
  FaCamera, 
  FaFilePdf,
  FaUpload,
  FaEye,
  FaEyeSlash,
  FaCheck,
  FaTimes
} from 'react-icons/fa';

// Debounce function for live validation
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

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    dob: null,
    email: '',
    password: '',
    mobile: '',
    profileImage: null,
    document: null,
  });
  const [errors, setErrors] = useState({});
  const [selectedCountry, setSelectedCountry] = useState('+91');
  const [imagePreview, setImagePreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordCopied, setIsPasswordCopied] = useState(false);
  const [fieldTouched, setFieldTouched] = useState({
    fullName: false,
    dob: false,
    email: false,
    password: false,
    mobile: false,
    profileImage: false,
    document: false,
  });

  // Live validation for fields
  const validateField = useCallback(async (name, value, countryCode = '+91') => {
    switch (name) {
      case 'fullName':
        return validateFullName(value);
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value, true);
      case 'mobile':
        return validateMobile(countryCode + value.replace(countryCode, ''), countryCode);
      case 'dob':
        if (value instanceof Date) {
          return validateDOB(value);
        }
        return validateDOB(value);
      case 'profileImage':
        if (value instanceof File) {
          return validateProfileImage(value);
        }
        return value ? '' : 'Profile image is required';
      case 'document':
        if (value instanceof File) {
          return validateDocument(value);
        }
        return value ? '' : 'Document is required';
      default:
        return '';
    }
  }, []);

  // Debounced form data for validation
  const debouncedFormData = useDebounce(formData, 300);

  // Live validation effect
  useEffect(() => {
    const validateFormLive = async () => {
      const newErrors = {};
      
      // Only validate fields that have been touched or have value
      for (const [field, value] of Object.entries(debouncedFormData)) {
        if (fieldTouched[field] || value) {
          if (field === 'mobile') {
            newErrors[field] = await validateField(field, value.replace(selectedCountry, ''), selectedCountry);
          } else if (field === 'dob') {
            newErrors[field] = await validateField(field, value);
          } else if (field === 'profileImage' || field === 'document') {
            if (value) {
              newErrors[field] = await validateField(field, value);
            } else if (fieldTouched[field]) {
              newErrors[field] = `${field === 'profileImage' ? 'Profile image' : 'Document'} is required`;
            }
          } else {
            newErrors[field] = await validateField(field, value);
          }
        }
      }
      
      // Filter out empty errors
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
        return;
      }
      
      if (name === 'profileImage') {
        // Validate before setting preview
        const error = await validateProfileImage(file);
        if (error) {
          e.target.value = ''; // Clear file input
          toast.error(error);
          setFormData(prev => ({
            ...prev,
            profileImage: null
          }));
          setImagePreview(null);
          return;
        }
        setImagePreview(URL.createObjectURL(file));
      } else if (name === 'document') {
        // Validate PDF
        const error = await validateDocument(file);
        if (error) {
          e.target.value = ''; // Clear file input
          toast.error(error);
          setFormData(prev => ({
            ...prev,
            document: null
          }));
          return;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
    } else {
      let newValue = value;
      
      if (name === 'mobile') {
        // Only allow digits, limit to 10
        const digitsOnly = value.replace(/\D/g, '').substring(0, 10);
        newValue = digitsOnly;
        
        // If user tries to type more than 10 digits, show error immediately
        if (value.replace(/\D/g, '').length > 10) {
          toast.error('Mobile number cannot exceed 10 digits');
        }
      } else if (name === 'fullName') {
        // Only allow letters and spaces
        newValue = value.replace(/[^a-zA-Z\s]/g, '');
      } else if (name === 'password') {
        // Check for copy/paste attempt
        if (isPasswordCopied) {
          setIsPasswordCopied(false);
        }
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: newValue
      }));
    }
  };

  const handleDateChange = (date) => {
    handleTouch('dob');
    setFormData(prev => ({
      ...prev,
      dob: date
    }));
  };

  const handleCountryChange = (e) => {
    const countryCode = e.target.value;
    setSelectedCountry(countryCode);
    
    // Update mobile number with new country code
    const currentNumber = formData.mobile.replace(/\D/g, '');
    setFormData(prev => ({
      ...prev,
      mobile: currentNumber
    }));
  };

  const handlePasswordCopy = (e) => {
    e.preventDefault();
    setIsPasswordCopied(true);
    toast.error('Copying password is not allowed!');
    return false;
  };

  const handlePasswordPaste = (e) => {
    e.preventDefault();
    toast.error('Pasting into password field is not allowed!');
    return false;
  };

  const handlePasswordCut = (e) => {
    e.preventDefault();
    toast.error('Cutting from password field is not allowed!');
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched for final validation
    const allTouched = Object.keys(fieldTouched).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setFieldTouched(allTouched);
    
    // Final validation
    const validationResults = await Promise.all([
      validateField('fullName', formData.fullName),
      validateField('email', formData.email),
      validateField('password', formData.password),
      validateField('mobile', formData.mobile, selectedCountry),
      validateField('dob', formData.dob),
      validateField('profileImage', formData.profileImage),
      validateField('document', formData.document)
    ]);
    
    const finalErrors = {
      fullName: validationResults[0],
      email: validationResults[1],
      password: validationResults[2],
      mobile: validationResults[3],
      dob: validationResults[4],
      profileImage: validationResults[5],
      document: validationResults[6]
    };
    
    const filteredErrors = Object.fromEntries(
      Object.entries(finalErrors).filter(([_, error]) => error !== '')
    );
    
    setErrors(filteredErrors);
    
    if (Object.keys(filteredErrors).length > 0) {
      toast.error('Please fix all validation errors');
      // Scroll to first error
      const firstErrorField = Object.keys(filteredErrors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      return;
    }

    setLoading(true);
    
    try {
      const submitData = new FormData();
      submitData.append('fullName', formData.fullName.trim());
      
      // Format date properly
      let dobValue;
      if (formData.dob instanceof Date) {
        dobValue = formData.dob.toISOString();
      } else if (typeof formData.dob === 'string') {
        // Parse string date
        dobValue = new Date(formData.dob).toISOString();
      }
      submitData.append('dob', dobValue);
      
      submitData.append('email', formData.email.trim());
      submitData.append('password', formData.password);
      submitData.append('mobile', selectedCountry + formData.mobile);
      submitData.append('profileImage', formData.profileImage);
      submitData.append('document', formData.document);

      const response = await userAPI.register(submitData);
      
      if (response.data.success) {
        toast.success('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate form completion percentage
  const calculateCompletion = () => {
    const fields = Object.values(formData);
    const filledFields = fields.filter(value => {
      if (value === null || value === '') return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      return true;
    });
    return Math.round((filledFields.length / 7) * 100);
  };

  // Check if field has valid content
  const isFieldValid = (fieldName) => {
    return fieldTouched[fieldName] && formData[fieldName] && !errors[fieldName];
  };

  // Check if field has error
  const isFieldInvalid = (fieldName) => {
    return fieldTouched[fieldName] && errors[fieldName];
  };

  return (
    <div className="min-h-screen py-8 px-4 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 animate-slide-down">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Create Your Account
          </h1>
          <p className="text-gray-600 text-lg">Join our community with just a few steps</p>
        </div>

        <div className="card backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FaUser className="mr-2 text-primary-600" />
                  Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('fullName')}
                    className={`form-input ${isFieldInvalid('fullName') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('fullName') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'}`}
                    placeholder="Enter your full name (letters and spaces only)"
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
                  <FaCalendar className="mr-2 text-primary-600" />
                  Date of Birth *
                </label>
                <div className="relative">
                  <DatePicker
                    selected={formData.dob}
                    onChange={handleDateChange}
                    onBlur={() => handleBlur('dob')}
                    dateFormat="dd-MMM-yyyy"
                    placeholderText="DD/MMM/YYYY or DD-MMM-YYYY"
                    className={`form-input w-full ${isFieldInvalid('dob') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('dob') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'}`}
                    showYearDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={50}
                    maxDate={new Date()}
                    minDate={new Date(1900, 0, 1)}
                    disabled={loading}
                    peekNextMonth
                    showMonthDropdown
                    dropdownMode="select"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
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
                  Format: DD/MMM/YYYY (e.g., 15/Jan/1990) or DD-MMM-YYYY
                </p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FaEnvelope className="mr-2 text-primary-600" />
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur('email')}
                    className={`form-input ${isFieldInvalid('email') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('email') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'}`}
                    placeholder="example@domain.com"
                    disabled={loading}
                    maxLength={254}
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
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FaLock className="mr-2 text-primary-600" />
                  Password *
                  {isPasswordCopied && (
                    <span className="ml-2 text-xs text-red-600 animate-pulse flex items-center">
                      <FaTimes className="mr-1" /> Copy not allowed!
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={() => handleBlur('password')}
                    onCopy={handlePasswordCopy}
                    onPaste={handlePasswordPaste}
                    onCut={handlePasswordCut}
                    className={`form-input pr-10 ${isFieldInvalid('password') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('password') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'}`}
                    placeholder="Minimum 4 characters"
                    disabled={loading}
                    maxLength={100}
                    autoComplete="new-password"
                  />
                  <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                    {isFieldValid('password') && <FaCheck className="text-green-600" />}
                    {isFieldInvalid('password') && <FaTimes className="text-red-600" />}
                  </div>
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary-600"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 animate-slide-up flex items-center">
                    <FaTimes className="mr-1" /> {errors.password}
                  </p>
                )}
                {isFieldValid('password') && (
                  <p className="text-sm text-green-600 animate-slide-up flex items-center">
                    <FaCheck className="mr-1" /> Strong password
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Password cannot be copied or pasted
                </p>
              </div>

              {/* Mobile Number */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FaPhone className="mr-2 text-primary-600" />
                  Mobile Number *
                </label>
                <div className="flex space-x-2">
                  <select
                    value={selectedCountry}
                    onChange={handleCountryChange}
                    className="form-input w-32"
                    disabled={loading}
                  >
                    {MOBILE_COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.code}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      onBlur={() => handleBlur('mobile')}
                      className={`form-input w-full ${isFieldInvalid('mobile') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('mobile') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'}`}
                      placeholder="10-digit number"
                      disabled={loading}
                      maxLength={10}
                      pattern="[0-9]*"
                      inputMode="numeric"
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
                    <FaCheck className="mr-1" /> Valid mobile number
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {selectedCountry === '+91' ? 'Indian numbers start with 6,7,8,9' : 'Enter 10 digits'}
                </p>
              </div>

              {/* Profile Image */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FaCamera className="mr-2 text-primary-600" />
                  Profile Image (.jpeg only) *
                  {isFieldValid('profileImage') && (
                    <span className="ml-2 text-xs text-green-600 flex items-center">
                      <FaCheck className="mr-1" /> Valid image
                    </span>
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
                    <div className={`card flex items-center justify-center p-8 border-2 border-dashed ${isFieldInvalid('profileImage') ? 'border-red-500' : isFieldValid('profileImage') ? 'border-green-500' : 'border-gray-300'} hover:border-primary-500 transition-all duration-300`}>
                      <div className="text-center">
                        <FaUpload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">
                          {formData.profileImage ? formData.profileImage.name : 'Click to upload profile image'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Max 1MB, JPEG only (.jpg, .jpeg)</p>
                      </div>
                    </div>
                  </label>
                  
                  {imagePreview && (
                    <div className="relative">
                      <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-lg">
                        <img
                          src={imagePreview}
                          alt="Profile Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center">
                        <FaCamera className="w-4 h-4" />
                      </div>
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
              </div>

              {/* Document */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FaFilePdf className="mr-2 text-primary-600" />
                  Document (.pdf only) *
                  {isFieldValid('document') && (
                    <span className="ml-2 text-xs text-green-600 flex items-center">
                      <FaCheck className="mr-1" /> Valid document
                    </span>
                  )}
                </label>
                <label className={`cursor-pointer block ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input
                    type="file"
                    name="document"
                    onChange={handleChange}
                    onBlur={() => handleBlur('document')}
                    accept=".pdf,application/pdf"
                    className="hidden"
                    disabled={loading}
                  />
                  <div className={`card flex items-center justify-center p-8 border-2 border-dashed ${isFieldInvalid('document') ? 'border-red-500' : isFieldValid('document') ? 'border-green-500' : 'border-gray-300'} hover:border-primary-500 transition-all duration-300`}>
                    <div className="text-center">
                      <FaFilePdf className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">
                        {formData.document ? formData.document.name : 'Click to upload PDF document'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Max 5MB, PDF only (.pdf)</p>
                    </div>
                  </div>
                </label>
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
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading || Object.keys(errors).length > 0}
                className={`btn-primary flex-1 py-4 text-lg ${Object.keys(errors).length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="spinner mr-3"></div>
                    Creating Account...
                  </span>
                ) : (
                  <>
                    <FaUpload className="inline mr-2" />
                    Create Account
                  </>
                )}
              </button>
              
              <Link
                to="/login"
                className="btn-secondary py-4 text-lg"
              >
                Back to Login
              </Link>
            </div>
          </form>

          {/* Form Progress */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Form Completion</span>
              <span className={`text-sm font-semibold ${calculateCompletion() === 100 ? 'text-green-600' : 'text-primary-600'}`}>
                {calculateCompletion()}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${calculateCompletion() === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-primary-500 to-secondary-500'}`}
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
                  All fields are valid! You can submit the form.
                </span>
              ) : (
                <span>
                  Fill all required fields to complete the form
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;