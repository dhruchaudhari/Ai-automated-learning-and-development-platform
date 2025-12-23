import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  validateEmail, 
  validatePassword, 
  preventPasswordCopyPaste, 
  validateMobile,
  validatePasswordRequirements 
} from '../utils/validations';
import { authAPI } from '../utils/api';
import { toast } from 'react-hot-toast';
import { 
  FaEye, 
  FaEyeSlash, 
  FaUser, 
  FaLock, 
  FaEnvelope, 
  FaCheck, 
  FaTimes, 
  FaInfoCircle,
  FaArrowLeft,
  FaSyncAlt,
  FaKey,
  FaPhone,
  FaAt,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';

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

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState('login'); // 'login', 'forgot-password', 'verify-otp', 'reset-password', 'forgot-email'
  
  // Login form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  // Forgot password state
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
    resetToken: ''
  });
  
  // Forgot email state
  const [forgotEmailData, setForgotEmailData] = useState({
    mobile: '',
    countryCode: '+91'
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [fieldTouched, setFieldTouched] = useState({
    email: false,
    password: false,
    mobile: false,
    otp: false,
    newPassword: false,
    confirmPassword: false
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    noCommonPatterns: false,
    noRepeatingChars: false
  });
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [resendAttempts, setResendAttempts] = useState(0);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [forgotEmailSuccess, setForgotEmailSuccess] = useState(false);
  const [recoveredEmail, setRecoveredEmail] = useState('');

  // Country code options for phone number
  const countryCodes = [
    { value: '+91', label: '+91 (India)', flag: '🇮🇳' },
    { value: '+1', label: '+1 (USA/Canada)', flag: '🇺🇸' },
    { value: '+44', label: '+44 (UK)', flag: '🇬🇧' },
    { value: '+61', label: '+61 (Australia)', flag: '🇦🇺' },
    { value: '+49', label: '+49 (Germany)', flag: '🇩🇪' },
    { value: '+33', label: '+33 (France)', flag: '🇫🇷' },
    { value: '+81', label: '+81 (Japan)', flag: '🇯🇵' },
    { value: '+86', label: '+86 (China)', flag: '🇨🇳' },
  ];

  const validateField = useCallback(async (name, value) => {
    switch (name) {
      case 'email':
        return validateEmail(value);
      case 'password':
        const error = validatePassword(value, false);
        calculatePasswordStrength(value);
        validatePasswordRequirementsList(value);
        return error;
      case 'otp':
        if (!value) return 'OTP is required';
        if (!/^\d{6}$/.test(value)) return 'OTP must be 6 digits';
        return '';
      case 'newPassword':
        const newPasswordError = validatePassword(value, true);
        validatePasswordRequirementsList(value);
        return newPasswordError;
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== forgotPasswordData.newPassword) return 'Passwords do not match';
        return '';
      case 'mobile':
        return validateMobile(value, forgotEmailData.countryCode);
      default:
        return '';
    }
  }, [forgotPasswordData.newPassword, forgotEmailData.countryCode]);

  const debouncedFormData = useDebounce(formData, 500);
  const debouncedForgotPasswordData = useDebounce(forgotPasswordData, 500);
  const debouncedForgotEmailData = useDebounce(forgotEmailData, 500);

  useEffect(() => {
    const validateFormLive = async () => {
      const newErrors = {};
      
      if (mode === 'login') {
        for (const [field, value] of Object.entries(debouncedFormData)) {
          if (fieldTouched[field] || value) {
            newErrors[field] = await validateField(field, value);
          }
        }
      } else if (mode === 'forgot-password') {
        if (fieldTouched.email || forgotPasswordData.email) {
          newErrors.email = await validateField('email', forgotPasswordData.email);
        }
      } else if (mode === 'verify-otp') {
        if (fieldTouched.otp || forgotPasswordData.otp) {
          newErrors.otp = await validateField('otp', forgotPasswordData.otp);
        }
      } else if (mode === 'reset-password') {
        if (fieldTouched.newPassword || forgotPasswordData.newPassword) {
          newErrors.newPassword = await validateField('newPassword', forgotPasswordData.newPassword);
        }
        if (fieldTouched.confirmPassword || forgotPasswordData.confirmPassword) {
          newErrors.confirmPassword = await validateField('confirmPassword', forgotPasswordData.confirmPassword);
        }
      } else if (mode === 'forgot-email') {
        if (fieldTouched.mobile || forgotEmailData.mobile) {
          newErrors.mobile = await validateField('mobile', forgotEmailData.mobile);
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
  }, [debouncedFormData, debouncedForgotPasswordData, debouncedForgotEmailData, fieldTouched, validateField, mode]);

  // Countdown timer for OTP
  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [otpCountdown]);

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
    if (/(.)\1{4,}/.test(password)) strength = Math.max(0, strength - 20);
    
    setPasswordStrength(Math.min(100, strength));
  };

  const validatePasswordRequirementsList = (password) => {
    if (!password) {
      setPasswordRequirements({
        minLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false,
        noCommonPatterns: false,
        noRepeatingChars: false
      });
      return;
    }

    const requirements = validatePasswordRequirements(password);
    setPasswordRequirements(requirements);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return 'bg-red-500';
    if (passwordStrength < 70) return 'bg-yellow-500';
    if (passwordStrength < 90) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 70) return 'Fair';
    if (passwordStrength < 90) return 'Good';
    return 'Strong';
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    handleTouch(name);
    
    let newValue = value;
    
    if (name === 'email' || name === 'forgotEmail') {
      // Convert to lowercase
      newValue = value.toLowerCase();
      
      // Remove any invalid characters
      newValue = newValue.replace(/[^a-zA-Z0-9$_.@\-]/g, '');
      
    } else if (name === 'otp') {
      // Only allow digits, max 6
      newValue = value.replace(/\D/g, '').slice(0, 6);
    } else if (name === 'password' || name === 'newPassword' || name === 'confirmPassword') {
      newValue = value;
      if (name === 'password' || name === 'newPassword') {
        calculatePasswordStrength(newValue);
        validatePasswordRequirementsList(newValue);
      }
    } else if (name === 'mobile') {
      // Only allow digits and plus sign
      newValue = value.replace(/[^\d+]/g, '');
      
      // Remove leading zeros if any
      if (newValue.startsWith('0')) {
        newValue = newValue.substring(1);
      }
    }
    
    if (mode === 'login') {
      setFormData(prev => ({
        ...prev,
        [name]: newValue
      }));
    } else if (mode === 'forgot-email') {
      setForgotEmailData(prev => ({
        ...prev,
        [name]: newValue
      }));
    } else {
      setForgotPasswordData(prev => ({
        ...prev,
        [name]: newValue
      }));
    }
  };

  const handleEmailKeyDown = (e) => {
    const allowedChars = /[a-zA-Z0-9$_.@\-]/;
    
    // Allow control keys
    if (e.ctrlKey || e.altKey || e.metaKey) {
      return;
    }
    
    // Allow navigation keys
    if ([
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 
      'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End'
    ].includes(e.key)) {
      return;
    }
    
    // Check if character is allowed
    if (!allowedChars.test(e.key) && e.key.length === 1) {
      e.preventDefault();
      toast.error('Email can only contain letters, numbers, and: $ . _ - @');
    }
    
    // Check for multiple @ symbols
    if (e.key === '@' && e.target.value.includes('@')) {
      e.preventDefault();
      toast.error('Email can only contain one @ symbol');
    }
    
    // Prevent spaces
    if (e.key === ' ') {
      e.preventDefault();
      toast.error('Email cannot contain spaces');
    }
  };

  const handleEmailBlur = (e) => {
    const value = e.target.value.trim().toLowerCase();
    
    // Remove any invalid characters on blur
    const cleanedValue = value.replace(/[^a-zA-Z0-9$_.@\-]/g, '');
    
    if (mode === 'login') {
      setFormData(prev => ({
        ...prev,
        email: cleanedValue
      }));
    } else {
      setForgotPasswordData(prev => ({
        ...prev,
        email: cleanedValue
      }));
    }
    
    handleBlur('email');
  };

  const handleMobileKeyDown = (e) => {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
    
    if (allowedKeys.includes(e.key)) {
      return;
    }
    
    // Allow only digits
    if (!/^\d$/.test(e.key) && e.key !== '+') {
      e.preventDefault();
      toast.error('Please enter only numbers');
    }
  };

  const handleMobileBlur = () => {
    const mobile = forgotEmailData.mobile;
    
    // Remove any non-digit characters
    const cleanedMobile = mobile.replace(/\D/g, '');
    
    // Remove leading zeros
    const finalMobile = cleanedMobile.replace(/^0+/, '');
    
    setForgotEmailData(prev => ({
      ...prev,
      mobile: finalMobile
    }));
    
    handleBlur('mobile');
  };

  const isFieldValid = (fieldName, value) => {
    if (mode === 'login') {
      return fieldTouched[fieldName] && formData[fieldName] && !errors[fieldName];
    } else if (mode === 'forgot-email') {
      return fieldTouched[fieldName] && value && !errors[fieldName];
    }
    return fieldTouched[fieldName] && value && !errors[fieldName];
  };

  const isFieldInvalid = (fieldName) => {
    return fieldTouched[fieldName] && errors[fieldName];
  };

  const handlePasswordCopy = (e) => {
    preventPasswordCopyPaste(e);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (mode === 'login') {
      await handleLogin();
    } else if (mode === 'forgot-password') {
      await handleForgotPassword();
    } else if (mode === 'verify-otp') {
      await handleVerifyOtp();
    } else if (mode === 'reset-password') {
      await handleResetPassword();
    } else if (mode === 'forgot-email') {
      await handleForgotEmail();
    }
  };

  const handleLogin = async () => {
    const allTouched = Object.keys(fieldTouched).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setFieldTouched(allTouched);
    
    const validationResults = await Promise.all([
      validateField('email', formData.email),
      validateField('password', formData.password)
    ]);
    
    const finalErrors = {
      email: validationResults[0],
      password: validationResults[1]
    };
    
    const filteredErrors = Object.fromEntries(
      Object.entries(finalErrors).filter(([_, error]) => error !== '')
    );
    
    setErrors(filteredErrors);
    
    if (Object.keys(filteredErrors).length > 0) {
      toast.error('Please fix validation errors');
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
      const result = await login(formData.email, formData.password);
      
      if (result && result.success) {
        setTimeout(() => {
          navigate('/grid');
        }, 300);
      } else if (result && result.requiresVerification) {
        setRequiresVerification(true);
        setMode('verify-email');
        toast.error('Please verify your email first');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
    
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordData.email) {
      setFieldTouched({ email: true });
      setErrors({ email: 'Email is required' });
      return;
    }

    const emailError = await validateField('email', forgotPasswordData.email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    setLoading(true);
    
    try {
      const response = await authAPI.forgotPassword(forgotPasswordData.email);
      
      if (response.data.success) {
        toast.success('OTP sent to your email!');
        setMode('verify-otp');
        setOtpCountdown(300); // 5 minutes
        setResendAttempts(0);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      toast.error(errorMsg || 'Failed to send OTP');
    }
    
    setLoading(false);
  };

  const handleForgotEmail = async () => {
    if (!forgotEmailData.mobile) {
      setFieldTouched({ mobile: true });
      setErrors({ mobile: 'Mobile number is required' });
      return;
    }

    const mobileError = await validateField('mobile', forgotEmailData.mobile);
    if (mobileError) {
      setErrors({ mobile: mobileError });
      return;
    }

    setLoading(true);
    
    try {
      const response = await authAPI.forgotEmail(forgotEmailData.mobile);
      
      if (response.data.success) {
        setForgotEmailSuccess(true);
        setRecoveredEmail(response.data.email);
        toast.success('Email sent to your registered email address!');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      toast.error(errorMsg || 'Failed to retrieve email');
      
      if (error.response?.status === 404) {
        toast.error('No account found with this mobile number');
      }
    }
    
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (!forgotPasswordData.otp) {
      setFieldTouched({ otp: true });
      setErrors({ otp: 'OTP is required' });
      return;
    }

    const otpError = await validateField('otp', forgotPasswordData.otp);
    if (otpError) {
      setErrors({ otp: otpError });
      return;
    }

    setLoading(true);
    
    try {
      const response = await authAPI.verifyPasswordResetOtp(
        forgotPasswordData.email,
        forgotPasswordData.otp
      );
      
      if (response.data.success) {
        setForgotPasswordData(prev => ({
          ...prev,
          resetToken: response.data.resetToken
        }));
        toast.success('OTP verified! Set your new password');
        setMode('reset-password');
        setOtpCountdown(0);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      toast.error(errorMsg || 'OTP verification failed');
      
      // If attempts exceeded, reset to forgot password
      if (error.response?.status === 429) {
        setMode('forgot-password');
        setForgotPasswordData(prev => ({ ...prev, otp: '' }));
      }
    }
    
    setLoading(false);
  };

  const handleResetPassword = async () => {
    const validationResults = await Promise.all([
      validateField('newPassword', forgotPasswordData.newPassword),
      validateField('confirmPassword', forgotPasswordData.confirmPassword)
    ]);
    
    const finalErrors = {
      newPassword: validationResults[0],
      confirmPassword: validationResults[1]
    };
    
    const filteredErrors = Object.fromEntries(
      Object.entries(finalErrors).filter(([_, error]) => error !== '')
    );
    
    setErrors(filteredErrors);
    
    if (Object.keys(filteredErrors).length > 0) {
      toast.error('Please fix validation errors');
      return;
    }

    setLoading(true);
    
    try {
      const response = await authAPI.resetPassword(
        forgotPasswordData.resetToken,
        forgotPasswordData.newPassword,
        forgotPasswordData.confirmPassword
      );
      
      if (response.data.success) {
        toast.success('Password reset successfully!');
        setMode('login');
        resetForgotPasswordForm();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      toast.error(errorMsg || 'Password reset failed');
    }
    
    setLoading(false);
  };

  const handleResendOtp = async () => {
    if (resendAttempts >= 3) {
      toast.error('Maximum resend attempts reached');
      return;
    }

    if (otpCountdown > 0) {
      toast.error(`Please wait ${otpCountdown} seconds before resending`);
      return;
    }

    try {
      const response = await authAPI.resendVerificationOtp(forgotPasswordData.email);
      
      if (response.data.success) {
        toast.success('New OTP sent!');
        setResendAttempts(prev => prev + 1);
        setOtpCountdown(300);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      toast.error(errorMsg || 'Failed to resend OTP');
    }
  };

  const resetForgotPasswordForm = () => {
    setForgotPasswordData({
      email: '',
      otp: '',
      newPassword: '',
      confirmPassword: '',
      resetToken: ''
    });
    setErrors({});
    setFieldTouched({});
    setResendAttempts(0);
    setOtpCountdown(0);
    setPasswordStrength(0);
    setPasswordRequirements({
      minLength: false,
      hasUpperCase: false,
      hasLowerCase: false,
      hasNumber: false,
      hasSpecialChar: false,
      noCommonPatterns: false,
      noRepeatingChars: false
    });
  };

  const resetForgotEmailForm = () => {
    setForgotEmailData({
      mobile: '',
      countryCode: '+91'
    });
    setForgotEmailSuccess(false);
    setRecoveredEmail('');
    setErrors({});
    setFieldTouched({});
  };

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const maskEmail = (email) => {
    if (!email || !email.includes('@')) return email;
    
    const [name, domain] = email.split('@');
    const maskedName = name.length > 2 
      ? name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1)
      : '*'.repeat(name.length);
    return `${maskedName}@${domain}`;
  };

  // Render password requirements checklist
  const renderPasswordRequirements = () => {
    const currentPassword = mode === 'login' ? formData.password : forgotPasswordData.newPassword;
    
    if (!currentPassword) return null;

    const requirementsList = [
      {
        key: 'minLength',
        text: 'At least 8 characters long',
        met: passwordRequirements.minLength
      },
      {
        key: 'hasUpperCase',
        text: 'At least one uppercase letter (A-Z)',
        met: passwordRequirements.hasUpperCase
      },
      {
        key: 'hasLowerCase',
        text: 'At least one lowercase letter (a-z)',
        met: passwordRequirements.hasLowerCase
      },
      {
        key: 'hasNumber',
        text: 'At least one number (0-9)',
        met: passwordRequirements.hasNumber
      },
      {
        key: 'hasSpecialChar',
        text: 'At least one special character (!@#$%^&*)',
        met: passwordRequirements.hasSpecialChar
      },
      {
        key: 'noCommonPatterns',
        text: 'No common patterns (password, 123456, qwerty)',
        met: passwordRequirements.noCommonPatterns
      },
      {
        key: 'noRepeatingChars',
        text: 'No repeating characters (aaaa, 1111)',
        met: passwordRequirements.noRepeatingChars
      }
    ];

    return (
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-slide-up">
        <div className="flex items-center mb-2">
          <FaInfoCircle className="text-blue-600 mr-2" />
          <span className="text-sm font-medium text-gray-700">Password Requirements:</span>
        </div>
        <ul className="space-y-1 text-xs">
          {requirementsList.map((req) => (
            <li 
              key={req.key} 
              className={`flex items-center transition-all duration-200 ${req.met ? 'text-green-600' : 'text-gray-500'}`}
            >
              {req.met ? (
                <FaCheckCircle className="mr-2 text-green-600 flex-shrink-0" />
              ) : (
                <FaTimesCircle className="mr-2 text-gray-400 flex-shrink-0" />
              )}
              <span>{req.text}</span>
            </li>
          ))}
        </ul>
        
        {currentPassword && (
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Password Strength:</span>
              <span className={`text-xs font-medium ${
                passwordStrength < 40 ? 'text-red-600' :
                passwordStrength < 70 ? 'text-yellow-600' :
                passwordStrength < 90 ? 'text-blue-600' : 'text-green-600'
              }`}>
                {getPasswordStrengthText()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                style={{ width: `${passwordStrength}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="relative w-full max-w-md">
        {/* Animated Background Card */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-3xl transform rotate-3 opacity-20"></div>
        
        <div className="relative card backdrop-blur-xl shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              {mode === 'login' ? (
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : mode === 'forgot-email' ? (
                <FaAt className="w-10 h-10 text-white" />
              ) : (
                <FaKey className="w-10 h-10 text-white" />
              )}
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'forgot-password' && 'Reset Password'}
              {mode === 'verify-otp' && 'Verify OTP'}
              {mode === 'reset-password' && 'Set New Password'}
              {mode === 'forgot-email' && 'Forgot Email?'}
            </h2>
            <p className="text-gray-600">
              {mode === 'login' && 'Sign in to your account'}
              {mode === 'forgot-password' && 'Enter your email to receive OTP'}
              {mode === 'verify-otp' && 'Enter 6-digit OTP sent to your email'}
              {mode === 'reset-password' && 'Create a new password'}
              {mode === 'forgot-email' && 'Enter your mobile number to retrieve email'}
            </p>
          </div>

          {/* Back button for non-login modes */}
          {mode !== 'login' && !forgotEmailSuccess && (
            <button
              onClick={() => {
                if (mode === 'forgot-password' || mode === 'forgot-email') {
                  setMode('login');
                } else if (mode === 'verify-otp') {
                  setMode('forgot-password');
                } else if (mode === 'reset-password') {
                  setMode('verify-otp');
                }
                resetForgotPasswordForm();
                resetForgotEmailForm();
              }}
              className="flex items-center text-primary-600 hover:text-primary-700 mb-6"
            >
              <FaArrowLeft className="mr-2" />
              Back to Login
            </button>
          )}

          {/* Success message for forgot email */}
          {forgotEmailSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-slide-up">
              <div className="flex items-center mb-2">
                <FaCheck className="text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-green-800">Email Sent Successfully!</h3>
              </div>
              <p className="text-green-700 mb-4">
                Your registered email has been sent to: <strong>{maskEmail(recoveredEmail)}</strong>
              </p>
              <p className="text-green-600 text-sm mb-4">
                Please check your email inbox (and spam folder). The email contains your registered email address.
              </p>
              <button
                onClick={() => {
                  setMode('login');
                  resetForgotEmailForm();
                }}
                className="btn-primary w-full"
              >
                Return to Login
              </button>
            </div>
          )}

          {!forgotEmailSuccess && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Login Form */}
              {mode === 'login' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FaEnvelope className="mr-2 text-primary-600" />
                      Email Address *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleEmailBlur}
                        onKeyDown={handleEmailKeyDown}
                        className={`form-input pl-12 ${isFieldInvalid('email') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('email', formData.email) ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'}`}
                        placeholder="vatsalraj@example.com"
                        disabled={loading}
                        maxLength={254}
                        autoComplete="email"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUser className="text-gray-400" />
                      </div>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {isFieldValid('email', formData.email) && <FaCheck className="text-green-600" />}
                        {isFieldInvalid('email') && <FaTimes className="text-red-600" />}
                      </div>
                    </div>
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600 animate-slide-up flex items-center">
                        <FaTimes className="mr-1" /> {errors.email}
                      </p>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      <FaInfoCircle className="inline mr-1" />
                      Allowed characters: letters, numbers, and: $ . _ - @ (only one @)
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
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
                        onPaste={handlePasswordCopy}
                        onCut={handlePasswordCopy}
                        className={`form-input pl-12 pr-12 ${isFieldInvalid('password') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('password', formData.password) ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'}`}
                        placeholder="Enter your password"
                        disabled={loading}
                        maxLength={128}
                        autoComplete="current-password"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="text-gray-400" />
                      </div>
                      <div className="absolute inset-y-0 right-10 flex items-center">
                        {isFieldValid('password', formData.password) && <FaCheck className="text-green-600" />}
                        {isFieldInvalid('password') && <FaTimes className="text-red-600" />}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        disabled={loading}
                      >
                        {showPassword ? (
                          <FaEyeSlash className="text-gray-400 hover:text-gray-600" />
                        ) : (
                          <FaEye className="text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    
                    {/* Password Requirements and Strength */}
                    {renderPasswordRequirements()}
                    
                    {errors.password && (
                      <p className="mt-2 text-sm text-red-600 animate-slide-up flex items-center">
                        <FaTimes className="mr-1" /> {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Forgot Password and Email Links */}
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => setMode('forgot-email')}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      disabled={loading}
                    >
                      Forgot Email?
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('forgot-password')}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      disabled={loading}
                    >
                      Forgot Password?
                    </button>
                  </div>
                </>
              )}

              {/* Forgot Password Form */}
              {mode === 'forgot-password' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaEnvelope className="mr-2 text-primary-600" />
                    Email Address *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={forgotPasswordData.email}
                      onChange={handleChange}
                      onBlur={handleEmailBlur}
                      onKeyDown={handleEmailKeyDown}
                      className={`form-input pl-12 ${isFieldInvalid('email') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('email', forgotPasswordData.email) ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'}`}
                      placeholder="Enter your registered email"
                      disabled={loading}
                      maxLength={254}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="text-gray-400" />
                    </div>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {isFieldValid('email', forgotPasswordData.email) && <FaCheck className="text-green-600" />}
                      {isFieldInvalid('email') && <FaTimes className="text-red-600" />}
                    </div>
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 animate-slide-up flex items-center">
                      <FaTimes className="mr-1" /> {errors.email}
                    </p>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    <FaInfoCircle className="inline mr-1" />
                    Allowed characters: letters, numbers, and: $ . _ - @ (only one @)
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    We'll send a 6-digit OTP to your email to reset your password.
                  </p>
                </div>
              )}

              {/* Forgot Email Form */}
              {mode === 'forgot-email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaPhone className="mr-2 text-primary-600" />
                    Mobile Number *
                  </label>
                  <div className="flex gap-2">
                    <div className="relative w-32">
                      <select
                        value={forgotEmailData.countryCode}
                        onChange={(e) => setForgotEmailData(prev => ({
                          ...prev,
                          countryCode: e.target.value
                        }))}
                        className={`form-input pl-10 pr-3 ${fieldTouched.countryCode ? 'border-blue-300' : ''}`}
                        disabled={loading}
                        onBlur={() => handleBlur('countryCode')}
                      >
                        {countryCodes.map((country) => (
                          <option key={country.value} value={country.value}>
                            {country.flag} {country.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400">🌍</span>
                      </div>
                    </div>
                    <div className="relative flex-1">
                      <input
                        type="tel"
                        name="mobile"
                        value={forgotEmailData.mobile}
                        onChange={handleChange}
                        onBlur={handleMobileBlur}
                        onKeyDown={handleMobileKeyDown}
                        className={`form-input pl-12 pr-12 ${isFieldInvalid('mobile') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('mobile', forgotEmailData.mobile) ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'}`}
                        placeholder={`Enter mobile number`}
                        disabled={loading}
                        maxLength={15}
                        inputMode="tel"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaPhone className="text-gray-400" />
                      </div>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {isFieldValid('mobile', forgotEmailData.mobile) && <FaCheck className="text-green-600" />}
                        {isFieldInvalid('mobile') && <FaTimes className="text-red-600" />}
                      </div>
                    </div>
                  </div>
                  {errors.mobile && (
                    <p className="mt-2 text-sm text-red-600 animate-slide-up flex items-center">
                      <FaTimes className="mr-1" /> {errors.mobile}
                    </p>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    <FaInfoCircle className="inline mr-1" />
                    Enter your registered mobile number with country code. We'll send your email to the registered email address.
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-2">
                    Your registered email will be sent to you. Please check both inbox and spam folder.
                  </p>
                </div>
              )}

              {/* Verify OTP Form */}
              {mode === 'verify-otp' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <FaEnvelope className="mr-2 text-primary-600" />
                      6-Digit OTP *
                    </label>
                    {otpCountdown > 0 ? (
                      <span className="text-sm font-medium text-red-600">
                        Expires in: {formatCountdown(otpCountdown)}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                        disabled={resendAttempts >= 3}
                      >
                        <FaSyncAlt className="mr-1" />
                        Resend OTP {resendAttempts > 0 && `(${3 - resendAttempts} left)`}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      name="otp"
                      value={forgotPasswordData.otp}
                      onChange={handleChange}
                      onBlur={() => handleBlur('otp')}
                      className={`form-input text-center text-2xl tracking-widest ${isFieldInvalid('otp') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('otp', forgotPasswordData.otp) ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'}`}
                      placeholder="000000"
                      disabled={loading}
                      maxLength={6}
                      inputMode="numeric"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {isFieldValid('otp', forgotPasswordData.otp) && <FaCheck className="text-green-600" />}
                      {isFieldInvalid('otp') && <FaTimes className="text-red-600" />}
                    </div>
                  </div>
                  {errors.otp && (
                    <p className="mt-2 text-sm text-red-600 animate-slide-up flex items-center">
                      <FaTimes className="mr-1" /> {errors.otp}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    Enter the 6-digit code sent to {forgotPasswordData.email}
                  </p>
                </div>
              )}

              {/* Reset Password Form */}
              {mode === 'reset-password' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FaLock className="mr-2 text-primary-600" />
                      New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        value={forgotPasswordData.newPassword}
                        onChange={handleChange}
                        onBlur={() => handleBlur('newPassword')}
                        className={`form-input pl-12 pr-12 ${isFieldInvalid('newPassword') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('newPassword', forgotPasswordData.newPassword) ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'}`}
                        placeholder="Enter new password"
                        disabled={loading}
                        maxLength={128}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="text-gray-400" />
                      </div>
                      <div className="absolute inset-y-0 right-10 flex items-center">
                        {isFieldValid('newPassword', forgotPasswordData.newPassword) && <FaCheck className="text-green-600" />}
                        {isFieldInvalid('newPassword') && <FaTimes className="text-red-600" />}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        disabled={loading}
                      >
                        {showNewPassword ? (
                          <FaEyeSlash className="text-gray-400 hover:text-gray-600" />
                        ) : (
                          <FaEye className="text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    
                    {/* Password Requirements and Strength for Reset Password */}
                    {renderPasswordRequirements()}
                    
                    {errors.newPassword && (
                      <p className="mt-2 text-sm text-red-600 animate-slide-up flex items-center">
                        <FaTimes className="mr-1" /> {errors.newPassword}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FaLock className="mr-2 text-primary-600" />
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={forgotPasswordData.confirmPassword}
                        onChange={handleChange}
                        onBlur={() => handleBlur('confirmPassword')}
                        className={`form-input pl-12 pr-12 ${isFieldInvalid('confirmPassword') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('confirmPassword', forgotPasswordData.confirmPassword) ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'}`}
                        placeholder="Confirm new password"
                        disabled={loading}
                        maxLength={128}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="text-gray-400" />
                      </div>
                      <div className="absolute inset-y-0 right-10 flex items-center">
                        {isFieldValid('confirmPassword', forgotPasswordData.confirmPassword) && 
                         forgotPasswordData.newPassword === forgotPasswordData.confirmPassword && 
                         <FaCheck className="text-green-600" />}
                        {isFieldInvalid('confirmPassword') && <FaTimes className="text-red-600" />}
                      </div>
                    </div>
                    
                    {errors.confirmPassword && (
                      <p className="mt-2 text-sm text-red-600 animate-slide-up flex items-center">
                        <FaTimes className="mr-1" /> {errors.confirmPassword}
                      </p>
                    )}
                    
                    {forgotPasswordData.newPassword && forgotPasswordData.confirmPassword && 
                     forgotPasswordData.newPassword === forgotPasswordData.confirmPassword && !errors.confirmPassword && (
                      <p className="mt-2 text-sm text-green-600 animate-slide-up flex items-center">
                        <FaCheck className="mr-1" /> Passwords match
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || 
                  (mode === 'login' && (Object.keys(errors).length > 0 || !formData.email || !formData.password)) ||
                  (mode === 'forgot-password' && (errors.email || !forgotPasswordData.email)) ||
                  (mode === 'forgot-email' && (errors.mobile || !forgotEmailData.mobile)) ||
                  (mode === 'verify-otp' && (errors.otp || !forgotPasswordData.otp || otpCountdown === 0)) ||
                  (mode === 'reset-password' && (Object.keys(errors).length > 0 || !forgotPasswordData.newPassword || !forgotPasswordData.confirmPassword))
                }
                className={`btn-primary w-full py-4 text-lg ${
                  (mode === 'login' && (Object.keys(errors).length > 0 || !formData.email || !formData.password)) ||
                  (mode === 'forgot-password' && (errors.email || !forgotPasswordData.email)) ||
                  (mode === 'forgot-email' && (errors.mobile || !forgotEmailData.mobile)) ||
                  (mode === 'verify-otp' && (errors.otp || !forgotPasswordData.otp || otpCountdown === 0)) ||
                  (mode === 'reset-password' && (Object.keys(errors).length > 0 || !forgotPasswordData.newPassword || !forgotPasswordData.confirmPassword))
                    ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="spinner mr-3"></div>
                    {mode === 'login' && 'Signing In...'}
                    {mode === 'forgot-password' && 'Sending OTP...'}
                    {mode === 'forgot-email' && 'Retrieving Email...'}
                    {mode === 'verify-otp' && 'Verifying OTP...'}
                    {mode === 'reset-password' && 'Resetting Password...'}
                  </span>
                ) : (
                  <>
                    {mode === 'login' && 'Sign In'}
                    {mode === 'forgot-password' && 'Send OTP'}
                    {mode === 'forgot-email' && 'Retrieve Email'}
                    {mode === 'verify-otp' && 'Verify OTP'}
                    {mode === 'reset-password' && 'Reset Password'}
                  </>
                )}
              </button>
            </form>
          )}

          {/* Divider for login mode only */}
          {mode === 'login' && !forgotEmailSuccess && (
            <>
              <div className="my-8 flex items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="mx-4 text-gray-500 text-sm">OR</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              {/* Register Link */}
              <div className="text-center">
                <p className="text-gray-600 mb-4">Don't have an account?</p>
                <Link
                  to="/register"
                  className="btn-secondary inline-flex items-center justify-center w-full"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Create New Account
                </Link>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              {mode === 'login' && 'By signing in, you agree to our Terms and Privacy Policy'}
              {mode === 'forgot-password' && 'OTP will expire in 5 minutes'}
              {mode === 'forgot-email' && 'We\'ll send your registered email to you'}
              {mode === 'verify-otp' && 'Maximum 3 OTP verification attempts allowed'}
              {mode === 'reset-password' && 'Password must meet all security requirements'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;