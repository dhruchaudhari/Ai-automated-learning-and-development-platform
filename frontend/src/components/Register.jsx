// Register.jsx - COMPLETE WITH OTP VERIFICATION - FIXED VERSION
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { toast } from 'react-hot-toast';
import { userAPI, authAPI } from '../utils/api';
import { 
  validateFullName, 
  validateEmail, 
  validatePassword, 
  validateMobile, 
  validateDOB, 
  validateProfileImage, 
  validateDocument,
  preventPasswordCopyPaste,
  parseDateInput
} from '../utils/validations';
import { MOBILE_COUNTRIES, APP_CONSTANTS, PHONE_EXAMPLES } from '../utils/constants';
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
  FaTimes,
  FaInfoCircle,
  FaTransgender,
  FaMars,
  FaVenus,
  FaGenderless,
  FaClock,
  FaRedo
} from 'react-icons/fa';
import 'react-datepicker/dist/react-datepicker.css';

// OTP Verification Component
const OTPVerification = ({ email, name, onVerified, onCancel }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [resendAttempts, setResendAttempts] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
    
    setError('');
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.verifyEmail(email, otpString);
      
      if (response.data.success) {
        setSuccess('Email verified successfully! Redirecting to login...');
        toast.success('Email verified successfully!');
        setTimeout(() => {
          onVerified();
        }, 2000);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Verification failed';
      setError(errorMsg);
      toast.error(errorMsg);
      
      // If OTP expired, allow resend
      if (errorMsg.includes('expired')) {
        setCountdown(0);
      }
    }
    
    setLoading(false);
  };

  const handleResendOtp = async () => {
    if (resendAttempts >= 3) {
      toast.error('Maximum resend attempts reached. Please contact support.');
      return;
    }

    if (countdown > 30) {
      toast.error(`Please wait ${Math.ceil((countdown - 30) / 60)} minutes before resending`);
      return;
    }

    try {
      const response = await authAPI.resendVerificationOtp(email);
      
      if (response.data.success) {
        toast.success('New OTP sent to your email!');
        setCountdown(300);
        setResendAttempts(prev => prev + 1);
        setOtp(['', '', '', '', '', '']);
        setError('');
        setSuccess('');
        
        // Focus first input
        const firstInput = document.getElementById('otp-0');
        if (firstInput) firstInput.focus();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to resend OTP';
      toast.error(errorMsg);
    }
  };

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaEnvelope className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Email</h3>
          <p className="text-gray-600">
            Enter the 6-digit code sent to <span className="font-semibold">{email}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">Welcome, {name}!</p>
        </div>

        <div className="space-y-6">
          {/* OTP Inputs */}
          <div className="flex justify-center space-x-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-colors"
                maxLength={1}
                inputMode="numeric"
                disabled={loading || success}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="text-center">
              <p className="text-red-600 text-sm flex items-center justify-center">
                <FaTimes className="mr-2" /> {error}
              </p>
            </div>
          )}
          
          {success && (
            <div className="text-center">
              <p className="text-green-600 text-sm flex items-center justify-center">
                <FaCheck className="mr-2" /> {success}
              </p>
            </div>
          )}

          {/* Countdown and Resend */}
          <div className="text-center">
            {countdown > 0 ? (
              <div className="flex items-center justify-center text-gray-600">
                <FaClock className="mr-2" />
                <span className="font-medium">OTP expires in: {formatCountdown(countdown)}</span>
              </div>
            ) : (
              <button
                onClick={handleResendOtp}
                className="text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={resendAttempts >= 3 || loading || success}
              >
                <FaRedo className="mr-2" />
                Resend OTP {resendAttempts > 0 && `(${3 - resendAttempts} left)`}
              </button>
            )}
          </div>

          {/* Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={onCancel}
              className="btn-secondary flex-1 py-3"
              disabled={loading || success}
            >
              Cancel
            </button>
            <button
              onClick={handleVerify}
              disabled={loading || otp.join('').length !== 6 || countdown === 0 || success}
              className={`btn-primary flex-1 py-3 ${
                otp.join('').length !== 6 || countdown === 0 || success ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="spinner mr-3"></div>
                  Verifying...
                </span>
              ) : (
                <>
                  <FaCheck className="inline mr-2" />
                  Verify Email
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Didn't receive the code? Check your spam folder.
            {resendAttempts >= 3 && ' Maximum resend attempts reached.'}
          </p>
        </div>
      </div>
    </div>
  );
};

// Custom hook for debouncing
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

// Main Register Component
const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    dob: null,
    gender: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    profileImage: null,
    document: null,
  });
  const [errors, setErrors] = useState({});
  const [selectedCountry, setSelectedCountry] = useState('+91');
  const [imagePreview, setImagePreview] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldTouched, setFieldTouched] = useState({
    fullName: false,
    dob: false,
    gender: false,
    email: false,
    password: false,
    confirmPassword: false,
    mobile: false,
    profileImage: false,
    document: false,
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [confirmPasswordStrength, setConfirmPasswordStrength] = useState(0);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const datePickerRef = useRef(null);
  const mobileInputRef = useRef(null);
  
  // OTP Verification States
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredName, setRegisteredName] = useState('');

  const validateField = useCallback(async (name, value, countryCode = '+91', passwordToCompare = '') => {
    switch (name) {
      case 'fullName':
        return validateFullName(value);
      case 'gender':
        if (!value) return 'Gender is required';
        if (!['Male', 'Female', 'Other'].includes(value)) {
          return 'Please select a valid gender';
        }
        return '';
      case 'email':
        return validateEmail(value);
      case 'password':
        const error = validatePassword(value, true);
        calculatePasswordStrength(value);
        return error;
      case 'confirmPassword':
        // First validate password requirements
        const passwordError = validatePassword(value, true);
        if (passwordError) {
          return passwordError;
        }
        // Then check if passwords match
        if (value && passwordToCompare && value !== passwordToCompare) {
          return 'Passwords do not match';
        }
        return '';
      case 'mobile':
        // Pass the country code for proper validation
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

  const debouncedFormData = useDebounce(formData, 500);

  useEffect(() => {
    const validateFormLive = async () => {
      const newErrors = {};
      
      for (const [field, value] of Object.entries(debouncedFormData)) {
        if (fieldTouched[field] || value) {
          if (field === 'mobile') {
            newErrors[field] = await validateField(field, value, selectedCountry);
          } else if (field === 'dob') {
            newErrors[field] = await validateField(field, value);
          } else if (field === 'confirmPassword') {
            // For confirm password, we need to pass the original password for comparison
            newErrors[field] = await validateField(field, value, '+91', formData.password);
          } else if (field === 'profileImage' || field === 'document') {
            if (value) {
              const result = await validateField(field, value);
              newErrors[field] = result;
            } else if (fieldTouched[field]) {
              newErrors[field] = `${field === 'profileImage' ? 'Profile image' : 'Document'} is required`;
            }
          } else {
            newErrors[field] = await validateField(field, value);
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
  }, [debouncedFormData, fieldTouched, validateField, selectedCountry, formData.password]);

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

  const calculatePasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }
    
    let strength = 0;
    
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/\d/.test(password)) strength += 15;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 15;
    
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 5;
    if (/\d/.test(password) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 5;
    
    if (/password|123456|qwerty/i.test(password)) strength = Math.max(0, strength - 30);
    if (/(.)\1{3,}/.test(password)) strength = Math.max(0, strength - 20);
    
    setPasswordStrength(Math.min(100, strength));
  };

  const calculateConfirmPasswordStrength = (password) => {
    if (!password) {
      setConfirmPasswordStrength(0);
      return;
    }
    
    let strength = 0;
    
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/\d/.test(password)) strength += 15;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 15;
    
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 5;
    if (/\d/.test(password) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 5;
    
    if (/password|123456|qwerty/i.test(password)) strength = Math.max(0, strength - 30);
    if (/(.)\1{3,}/.test(password)) strength = Math.max(0, strength - 20);
    
    // Bonus for matching passwords
    if (formData.password && password === formData.password) {
      strength = Math.min(100, strength + 10);
    }
    
    setConfirmPasswordStrength(Math.min(100, strength));
  };

  const getPasswordStrengthColor = (strength) => {
    if (strength < 40) return 'bg-red-500';
    if (strength < 70) return 'bg-yellow-500';
    if (strength < 90) return 'bg-blue-500';
    return 'bg-green-500';
  };

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
        if (name === 'profileImage') setImagePreview(null);
        if (name === 'document') setDocumentPreview(null);
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
        // Create document preview URL
        setDocumentPreview(URL.createObjectURL(file));
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
    } else {
      let newValue = value;
      
      if (name === 'mobile') {
        // Only allow digits
        newValue = value.replace(/[^\d]/g, '');
        
        // Get max digits for selected country
        const countryInfo = getCountryInfo(selectedCountry);
        const maxDigits = countryInfo.digits || 15;
        
        // Limit length based on country
        if (typeof maxDigits === 'number') {
          newValue = newValue.substring(0, maxDigits);
        } else if (typeof maxDigits === 'string' && maxDigits.includes('-')) {
          const [min, max] = maxDigits.split('-').map(Number);
          newValue = newValue.substring(0, max);
        }
        
      } else if (name === 'fullName') {
        newValue = value.replace(/[^a-zA-Z\s\-\']/g, '');
      } else if (name === 'email') {
        newValue = value.toLowerCase();
      } else if (name === 'password') {
        // When password changes, recalculate strength for both passwords
        calculatePasswordStrength(value);
        if (formData.confirmPassword) {
          calculateConfirmPasswordStrength(formData.confirmPassword);
        }
      } else if (name === 'confirmPassword') {
        // When confirm password changes, calculate its strength
        calculateConfirmPasswordStrength(value);
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: newValue
      }));
    }
  };

  // Handle gender change
  const handleGenderChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      gender: value
    }));
    handleTouch('gender');
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

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
    
    // Focus on mobile input after country change
    setTimeout(() => {
      if (mobileInputRef.current) {
        mobileInputRef.current.focus();
      }
    }, 100);
  };

  const handlePasswordCopy = (e) => {
    preventPasswordCopyPaste(e);
  };

  const handlePasswordPaste = (e) => {
    preventPasswordCopyPaste(e);
  };

  const handlePasswordCut = (e) => {
    preventPasswordCopyPaste(e);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const allTouched = Object.keys(fieldTouched).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setFieldTouched(allTouched);
    
    // Validate all fields
    const validationResults = await Promise.all([
      validateField('fullName', formData.fullName),
      validateField('gender', formData.gender),
      validateField('email', formData.email),
      validateField('password', formData.password),
      validateField('confirmPassword', formData.confirmPassword, '+91', formData.password),
      validateField('mobile', formData.mobile, selectedCountry),
      validateField('dob', formData.dob),
      validateField('profileImage', formData.profileImage),
      validateField('document', formData.document)
    ]);
    
    const finalErrors = {
      fullName: validationResults[0],
      gender: validationResults[1],
      email: validationResults[2],
      password: validationResults[3],
      confirmPassword: validationResults[4],
      mobile: validationResults[5],
      dob: validationResults[6],
      profileImage: validationResults[7],
      document: validationResults[8]
    };
    
    const filteredErrors = Object.fromEntries(
      Object.entries(finalErrors).filter(([_, error]) => error !== '')
    );
    
    setErrors(filteredErrors);
    
    if (Object.keys(filteredErrors).length > 0) {
      toast.error('Please fix all validation errors before submitting');
      
      // Scroll to first error
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
      // Create FormData for submission
      const submitData = new FormData();
      
      // Append text fields
      submitData.append('fullName', formData.fullName.trim());
      submitData.append('gender', formData.gender);
      submitData.append('email', formData.email.trim().toLowerCase());
      submitData.append('password', formData.password);
      submitData.append('mobile', selectedCountry + formData.mobile);
      
      // Handle DOB - ensure it's a proper date string
      let dobValue;
      if (formData.dob instanceof Date) {
        dobValue = formData.dob.toISOString().split('T')[0]; // YYYY-MM-DD format
      } else if (formData.dob) {
        // Try to parse if it's a string
        const parsedDate = new Date(formData.dob);
        if (!isNaN(parsedDate.getTime())) {
          dobValue = parsedDate.toISOString().split('T')[0];
        } else {
          dobValue = formData.dob; // Send as-is and let backend handle
        }
      }
      
      if (dobValue) {
        submitData.append('dob', dobValue);
      }
      
      // Append files
      if (formData.profileImage) {
        submitData.append('profileImage', formData.profileImage);
      }
      
      if (formData.document) {
        submitData.append('document', formData.document);
      }
      
      // Debug: Log FormData contents
      console.log('=== REGISTRATION SUBMISSION ===');
      console.log('Form Data:', {
        fullName: formData.fullName,
        gender: formData.gender,
        email: formData.email,
        password: '***HIDDEN***',
        mobile: selectedCountry + formData.mobile,
        dob: dobValue,
        profileImage: formData.profileImage?.name,
        document: formData.document?.name
      });
      
      // Call API with proper error handling
      const response = await userAPI.register(submitData);
      
      console.log('Registration response:', response);
      
      if (response.data && response.data.success) {
        // Show OTP verification modal
        setRegisteredEmail(formData.email);
        setRegisteredName(formData.fullName);
        setShowOtpVerification(true);
        toast.success('Registration successful! Please verify your email with the OTP sent.');
      } else {
        throw new Error(response.data?.message || 'Registration failed: No success response');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
        errorMessage = error.message || errorMessage;
      }
      
      // Handle specific error cases
      if (errorMessage.toLowerCase().includes('email') || errorMessage.includes('already registered')) {
        setErrors(prev => ({ ...prev, email: 'Email already registered' }));
        toast.error('Email already registered');
      } else if (errorMessage.toLowerCase().includes('mobile') || errorMessage.toLowerCase().includes('phone')) {
        setErrors(prev => ({ ...prev, mobile: 'Mobile number already registered' }));
        toast.error('Mobile number already registered');
      } else if (errorMessage.toLowerCase().includes('password')) {
        setErrors(prev => ({ ...prev, password: 'Password validation failed' }));
        toast.error('Password validation failed');
      } else if (errorMessage.toLowerCase().includes('gender')) {
        setErrors(prev => ({ ...prev, gender: 'Gender validation failed' }));
        toast.error('Gender validation failed');
      } else if (errorMessage.toLowerCase().includes('dob') || errorMessage.toLowerCase().includes('date')) {
        setErrors(prev => ({ ...prev, dob: 'Invalid date of birth' }));
        toast.error('Invalid date of birth');
      } else if (errorMessage.includes('Network error')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerified = () => {
    setShowOtpVerification(false);
    setTimeout(() => {
      navigate('/login');
    }, 1000);
  };

  const handleOtpCancel = () => {
    setShowOtpVerification(false);
    toast.info('Please verify your email to login. You can verify later from login page.');
  };

  const calculateCompletion = () => {
    const fields = Object.values(formData);
    const filledFields = fields.filter(value => {
      if (value === null || value === '') return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      return true;
    });
    return Math.round((filledFields.length / 9) * 100);
  };

  const isFieldValid = (fieldName) => {
    return fieldTouched[fieldName] && formData[fieldName] && !errors[fieldName];
  };

  const isFieldInvalid = (fieldName) => {
    return fieldTouched[fieldName] && errors[fieldName];
  };

  const getCountryInfo = (code) => {
    const country = MOBILE_COUNTRIES.find(c => c.code === code);
    return country || { code: '+91', name: 'India', flag: '🇮🇳', digits: 10 };
  };

  const formatPhoneExample = () => {
    const example = PHONE_EXAMPLES[selectedCountry];
    if (!example) return 'Enter valid phone number';
    
    return `Format: ${example.format} (e.g., ${example.example})`;
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
    const country = getCountryInfo(selectedCountry);
    
    switch (selectedCountry) {
      case '+1': // US/Canada
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `(${digits.slice(0,3)}) ${digits.slice(3)}`;
        return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6,10)}`;
      
      case '+44': // UK
        if (digits.length <= 5) return digits;
        if (digits.length <= 8) return `${digits.slice(0,5)} ${digits.slice(5)}`;
        return `${digits.slice(0,5)} ${digits.slice(5,8)} ${digits.slice(8,10)}`;
      
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
    
    // Store digits only in form data
    setFormData(prev => ({
      ...prev,
      mobile: digitsOnly
    }));
  };

  // Check if passwords match
  const doPasswordsMatch = () => {
    return formData.password && formData.confirmPassword && 
           formData.password === formData.confirmPassword;
  };

  // Get gender icon
  const getGenderIcon = (gender) => {
    switch (gender) {
      case 'Male': return <FaMars className="text-blue-500" />;
      case 'Female': return <FaVenus className="text-pink-500" />;
      case 'Other': return <FaTransgender className="text-purple-500" />;
      default: return <FaGenderless className="text-gray-500" />;
    }
  };

  return (
    <>
      <div className="min-h-screen py-8 px-4 animate-fade-in">
        <div className="max-w-6xl mx-auto">
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
                      placeholder="Vatsalraj Solanki"
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

                {/* Gender */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    {getGenderIcon(formData.gender)}
                    <span className="ml-2">Gender *</span>
                  </label>
                  <div className="relative">
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleGenderChange}
                      onBlur={() => handleBlur('gender')}
                      className={`form-input ${isFieldInvalid('gender') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('gender') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'}`}
                      disabled={loading}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {isFieldValid('gender') && <FaCheck className="text-green-600" />}
                      {isFieldInvalid('gender') && <FaTimes className="text-red-600" />}
                    </div>
                  </div>
                  {errors.gender && (
                    <p className="text-sm text-red-600 animate-slide-up flex items-center">
                      <FaTimes className="mr-1" /> {errors.gender}
                    </p>
                  )}
                  {isFieldValid('gender') && (
                    <p className="text-sm text-green-600 animate-slide-up flex items-center">
                      <FaCheck className="mr-1" /> Valid gender selected
                    </p>
                  )}
                </div>

                {/* Date of Birth - Combined Calendar and Manual Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <FaCalendar className="mr-2 text-primary-600" />
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
                        className={`form-input flex-1 ${isFieldInvalid('dob') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('dob') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'}`}
                        placeholder="DD/MMM/YYYY or DD-MM-YYYY (e.g., 15/Jan/1990 or 15-12-1990)"
                        disabled={loading}
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={toggleCalendar}
                        className={`ml-2 px-4 border ${isFieldInvalid('dob') ? 'border-red-500' : isFieldValid('dob') ? 'border-green-500' : 'border-gray-300'} rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center`}
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
                          strictParsing
                          allowSameDay={false}
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
                    <FaEnvelope className="mr-2 text-primary-600" />
                    Email Address *
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      (Max 254 chars)
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={() => handleBlur('email')}
                      onKeyDown={(e) => {
                        // Prevent space key in email
                        if (e.key === ' ') {
                          e.preventDefault();
                          toast.error('Email cannot contain spaces');
                        }
                      }}
                      className={`form-input ${isFieldInvalid('email') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('email') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'}`}
                      placeholder="vatsalraj@example.com"
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
                  <div className="text-xs text-gray-500">
                    <FaInfoCircle className="inline mr-1" />
                    Standard email format (no spaces, max 254 characters)
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <FaLock className="mr-2 text-primary-600" />
                    Password *
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
                      placeholder="Minimum 8 characters with special chars"
                      disabled={loading}
                      maxLength={128}
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
                  
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Password Strength:</span>
                        <span className="text-xs font-medium">
                          {passwordStrength < 40 ? 'Weak' : 
                           passwordStrength < 70 ? 'Fair' : 
                           passwordStrength < 90 ? 'Good' : 'Strong'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                          style={{ width: `${passwordStrength}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
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
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <FaLock className="mr-2 text-primary-600" />
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={() => handleBlur('confirmPassword')}
                      onCopy={handlePasswordCopy}
                      onPaste={handlePasswordPaste}
                      onCut={handlePasswordCut}
                      className={`form-input pr-10 ${isFieldInvalid('confirmPassword') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('confirmPassword') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'}`}
                      placeholder="Re-enter your password"
                      disabled={loading}
                      maxLength={128}
                      autoComplete="new-password"
                    />
                    <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                      {isFieldValid('confirmPassword') && doPasswordsMatch() && <FaCheck className="text-green-600" />}
                      {isFieldInvalid('confirmPassword') && <FaTimes className="text-red-600" />}
                    </div>
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  
                  {formData.confirmPassword && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Password Match:</span>
                        <span className="text-xs font-medium">
                          {doPasswordsMatch() ? (
                            <span className="text-green-600">✓ Passwords match</span>
                          ) : formData.password && formData.confirmPassword ? (
                            <span className="text-red-600">✗ Passwords don't match</span>
                          ) : 'Enter password to check'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-300 ${getPasswordStrengthColor(confirmPasswordStrength)}`}
                          style={{ width: `${confirmPasswordStrength}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600 animate-slide-up flex items-center">
                      <FaTimes className="mr-1" /> {errors.confirmPassword}
                    </p>
                  )}
                  {isFieldValid('confirmPassword') && doPasswordsMatch() && (
                    <p className="text-sm text-green-600 animate-slide-up flex items-center">
                      <FaCheck className="mr-1" /> Passwords match
                    </p>
                  )}
                </div>

                {/* Mobile Number */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <FaPhone className="mr-2 text-primary-600" />
                    Mobile Number *
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      ({getCountryInfo(selectedCountry).name})
                    </span>
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
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        {selectedCountry}
                      </div>
                      <input
                        ref={mobileInputRef}
                        type="tel"
                        name="mobile"
                        value={formatPhoneNumber(formData.mobile)}
                        onChange={handleChange}
                        onBlur={() => handleBlur('mobile')}
                        className={`form-input w-full pl-14 ${isFieldInvalid('mobile') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('mobile') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'}`}
                        placeholder={PHONE_EXAMPLES[selectedCountry]?.example || "Enter phone number"}
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
                      <FaCheck className="mr-1" /> Valid phone number
                    </p>
                  )}
                  <div className="text-xs text-gray-500">
                    <FaInfoCircle className="inline mr-1" />
                    {getCountryValidationMessage(selectedCountry)}
                  </div>
                </div>

                {/* Profile Image */}
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <FaCamera className="mr-2 text-primary-600" />
                    Profile Image *
                    {isFieldValid('profileImage') && (
                      <span className="ml-2 text-xs text-green-600 flex items-center">
                        <FaCheck className="mr-1" /> Valid
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
                    Document *
                    {isFieldValid('document') && (
                      <span className="ml-2 text-xs text-green-600 flex items-center">
                        <FaCheck className="mr-1" /> Valid
                      </span>
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
                      <div className={`card flex items-center justify-center p-8 border-2 border-dashed ${isFieldInvalid('document') ? 'border-red-500' : isFieldValid('document') ? 'border-green-500' : 'border-gray-300'} hover:border-primary-500 transition-all duration-300`}>
                        <div className="text-center">
                          <FaUpload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600">
                            {formData.document ? formData.document.name : 'Click to upload PDF document'}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">Max 5MB, PDF only (.pdf)</p>
                        </div>
                      </div>
                    </label>
                    
                    {documentPreview && (
                      <div className="relative">
                        <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-red-50 flex items-center justify-center">
                          <div className="text-center">
                            <FaFilePdf className="w-12 h-12 text-red-500 mx-auto mb-2" />
                            <p className="text-xs text-gray-700 font-medium truncate max-w-[100px]">
                              {formData.document?.name}
                            </p>
                            <p className="text-xs text-gray-500">PDF Document</p>
                          </div>
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center">
                          <FaFilePdf className="w-4 h-4" />
                        </div>
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
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col md:flex-row gap-4 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading || Object.keys(errors).length > 0 || calculateCompletion() < 100}
                  className={`btn-primary flex-1 py-4 text-lg ${Object.keys(errors).length > 0 || calculateCompletion() < 100 ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    ✓ All fields are valid! Ready to submit.
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

      {/* OTP Verification Modal */}
      {showOtpVerification && (
        <OTPVerification
          email={registeredEmail}
          name={registeredName}
          onVerified={handleOtpVerified}
          onCancel={handleOtpCancel}
        />
      )}
    </>
  );
};

export default Register;