import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { toast } from 'react-hot-toast';
import { DEGREE_SPECIALIZATIONS } from '../utils/constants';
import { userAPI, authAPI, degreeOptionAPI, advertisementAPI } from '../utils/api';
import {
  validateFullName,
  validateEmail,
  validatePassword,
  validateMobile,
  validateDOB,
  validatePasswordRequirements,
  preventPasswordCopyPaste,
  parseDateInput,
  formatName
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
  FaRedo,
  FaCheckCircle,
  FaTimesCircle,
  FaGraduationCap,
  FaBook,
  FaUniversity,
  FaFileAlt,
  FaMapMarkerAlt,
  FaHome,
  FaExclamationTriangle,
  FaBullhorn,
  FaBrain,
  FaToolbox,
  FaShieldAlt,
  FaCog
} from 'react-icons/fa';
import 'react-datepicker/dist/react-datepicker.css';

// OTP Verification Component
const OTPVerification = ({ email, name, onVerified, onCancel }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(300);
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
              className={`btn-primary flex-1 py-3 ${otp.join('').length !== 6 || countdown === 0 || success ? 'opacity-50 cursor-not-allowed' : ''
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

// Password Requirements Display Component
const PasswordRequirements = ({ password, confirmPassword = '', isConfirm = false }) => {
  const [requirements, setRequirements] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    noCommonPatterns: false,
    noRepeatingChars: false
  });

  const [confirmRequirements, setConfirmRequirements] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    noCommonPatterns: false,
    noRepeatingChars: false,
    matchesPassword: false
  });

  useEffect(() => {
    if (password) {
      const reqs = validatePasswordRequirements(password);
      setRequirements(reqs);
    } else {
      setRequirements({
        minLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false,
        noCommonPatterns: false,
        noRepeatingChars: false
      });
    }
  }, [password]);

  useEffect(() => {
    if (confirmPassword) {
      const reqs = validatePasswordRequirements(confirmPassword);
      setConfirmRequirements({
        ...reqs,
        matchesPassword: confirmPassword === password
      });
    } else {
      setConfirmRequirements({
        minLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false,
        noCommonPatterns: false,
        noRepeatingChars: false,
        matchesPassword: false
      });
    }
  }, [confirmPassword, password]);

  const calculateStrength = (password) => {
    if (!password) return 0;

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

    return Math.min(100, strength);
  };

  const getStrengthColor = (strength) => {
    if (strength < 40) return 'bg-red-500';
    if (strength < 70) return 'bg-yellow-500';
    if (strength < 90) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = (strength) => {
    if (strength < 40) return 'Weak';
    if (strength < 70) return 'Fair';
    if (strength < 90) return 'Good';
    return 'Strong';
  };

  const renderRequirementsList = (requirements, isConfirm = false) => {
    const requirementsList = [
      {
        key: 'minLength',
        text: 'At least 8 characters long',
        met: requirements.minLength
      },
      {
        key: 'hasUpperCase',
        text: 'At least one uppercase letter (A-Z)',
        met: requirements.hasUpperCase
      },
      {
        key: 'hasLowerCase',
        text: 'At least one lowercase letter (a-z)',
        met: requirements.hasLowerCase
      },
      {
        key: 'hasNumber',
        text: 'At least one number (0-9)',
        met: requirements.hasNumber
      },
      {
        key: 'hasSpecialChar',
        text: 'At least one special character (!@#$%^&*)',
        met: requirements.hasSpecialChar
      },
      {
        key: 'noCommonPatterns',
        text: 'No common patterns (password, 123456, qwerty)',
        met: requirements.noCommonPatterns
      },
      {
        key: 'noRepeatingChars',
        text: 'No repeating characters (aaaa, 1111)',
        met: requirements.noRepeatingChars
      }
    ];

    if (isConfirm) {
      requirementsList.push({
        key: 'matchesPassword',
        text: 'Passwords match',
        met: requirements.matchesPassword
      });
    }

    return (
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
    );
  };

  const passwordStrength = calculateStrength(password);
  const confirmPasswordStrength = calculateStrength(confirmPassword);

  if (isConfirm) {
    if (!confirmPassword) return null;

    return (
      <div className="mt-4">
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 animate-slide-up">
          <div className="flex items-center mb-2">
            <FaInfoCircle className="text-purple-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Confirm Password Requirements:</span>
          </div>
          {renderRequirementsList(confirmRequirements, true)}

          <div className="mt-3 pt-2 border-t border-purple-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Password Strength:</span>
              <span className={`text-xs font-medium ${confirmPasswordStrength < 40 ? 'text-red-600' :
                confirmPasswordStrength < 70 ? 'text-yellow-600' :
                  confirmPasswordStrength < 90 ? 'text-blue-600' : 'text-green-600'
                }`}>
                {getStrengthText(confirmPasswordStrength)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(confirmPasswordStrength)}`}
                style={{ width: `${confirmPasswordStrength}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!password) return null;

  return (
    <div className="mt-4">
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 animate-slide-up">
        <div className="flex items-center mb-2">
          <FaInfoCircle className="text-blue-600 mr-2" />
          <span className="text-sm font-medium text-gray-700">Password Requirements:</span>
        </div>
        {renderRequirementsList(requirements)}

        <div className="mt-3 pt-2 border-t border-blue-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Password Strength:</span>
            <span className={`text-xs font-medium ${passwordStrength < 40 ? 'text-red-600' :
              passwordStrength < 70 ? 'text-yellow-600' :
                passwordStrength < 90 ? 'text-blue-600' : 'text-green-600'
              }`}>
              {getStrengthText(passwordStrength)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`}
              style={{ width: `${passwordStrength}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// File Validation Helper
const validateFile = (file, fileType, maxSizeMB = 10) => {
  if (!file) {
    return 'This file is required';
  }

  if (!(file instanceof File)) {
    return 'Invalid file object';
  }

  const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes

  if (file.size > maxSize) {
    return `File size exceeds ${maxSizeMB}MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`;
  }

  // Get file extension
  const fileName = file.name.toLowerCase();

  if (fileType === 'image') {
    const allowedExtensions = ['.jpg', '.jpeg'];
    const allowedMimeTypes = ['image/jpeg', 'image/jpg'];

    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    const hasValidMimeType = allowedMimeTypes.includes(file.type);

    if (!hasValidExtension && !hasValidMimeType) {
      return 'Only JPEG, JPG images allowed';
    }
  } else if (fileType === 'document') {
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    const hasValidMimeType = allowedMimeTypes.includes(file.type);

    if (!hasValidExtension && !hasValidMimeType) {
      return 'Only PDF, DOC, DOCX files allowed';
    }
  }

  return '';
};

// Email validation helper
const validateEmailFormat = (email) => {
  if (!email || email.trim() === '') return 'Email is required';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address (e.g., user@example.com)';
  }

  // Additional email validation
  if (email.length > 254) return 'Email is too long (max 254 characters)';
  if (email.indexOf('..') !== -1) return 'Email contains consecutive dots';
  if (email.startsWith('.') || email.endsWith('.')) return 'Email cannot start or end with a dot';

  return '';
};

// Required field validation helper
const validateRequiredField = (value, fieldName) => {
  if (!value) {
    return `${fieldName} is required`;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return `${fieldName} is required`;
  }
  return '';
};

// Phone number validation helper
const validatePhoneNumber = (phone, countryCode = '+91') => {
  if (!phone || phone.trim() === '') return 'Mobile number is required';

  // Remove any formatting
  const cleanPhone = phone.replace(/\D/g, '');

  if (cleanPhone.length === 0) return 'Please enter a valid mobile number';

  const fullNumber = countryCode + cleanPhone;
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;

  if (!phoneRegex.test(fullNumber)) {
    return 'Please enter a valid mobile number';
  }

  // Country-specific validation
  const country = MOBILE_COUNTRIES.find(c => c.code === countryCode);
  if (country && country.digits) {
    if (cleanPhone.length !== country.digits) {
      return `${country.name} phone numbers must have ${country.digits} digits`;
    }
  }

  return '';
};

// Main Register Component
const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Details
    fullName: '',
    fathersName: '',
    dob: null,
    gender: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    permanentAddress: '',
    state: '',

    // Education Details - 10th
    tenthBoard: '',
    tenthPassingYear: '',
    tenthPercentage: '',

    // Education Details - 12th
    twelfthBoard: '',
    twelfthPassingYear: '',
    twelfthPercentage: '',

    // Education Details - Graduation
    graduationDegree: '',
    graduationSpecialization: '',
    graduationPassingYear: '',
    graduationCGPA: '',
    graduationPercentage: '',

    // Education Details - Qualifying Degree (Optional)
    qualifyingDegree: '',
    qualifyingSpecialization: '',
    qualifyingPercentage: '',

    // Files
    profileImage: null,
    resume: null,
    tenthMarksheet: null,
    twelfthMarksheet: null,
    graduationMarksheet: null,
    qualifyingMarksheet: null,
    identityProof: null,
    advertisements: [],
    skillSets: {
      technical: [],
      creative: [],
      cognitive: [],
      tools: [],
      ethics: []
    }
  });

  const [errors, setErrors] = useState({});
  const [selectedCountry, setSelectedCountry] = useState('+91');
  const [imagePreview, setImagePreview] = useState(null);
  const [resumePreview, setResumePreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldTouched, setFieldTouched] = useState({
    fullName: false,
    fathersName: false,
    dob: false,
    gender: false,
    email: false,
    password: false,
    confirmPassword: false,
    mobile: false,
    permanentAddress: false,
    state: false,
    tenthBoard: false,
    tenthPassingYear: false,
    tenthPercentage: false,
    twelfthBoard: false,
    twelfthPassingYear: false,
    twelfthPercentage: false,
    graduationDegree: false,
    graduationSpecialization: false,
    graduationPassingYear: false,
    graduationCGPA: false,
    graduationPercentage: false,
    profileImage: false,
    resume: false,
    identityProof: false,
    tenthMarksheet: false,
    twelfthMarksheet: false,
    graduationMarksheet: false,
    advertisements: false
  });

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const datePickerRef = useRef(null);
  const mobileInputRef = useRef(null);

  // OTP Verification States
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredName, setRegisteredName] = useState('');
  const currentYear = new Date().getFullYear();

  // Dynamic degree options from API
  const [degreeOptions, setDegreeOptions] = useState([]);
  const [degreeSpecMap, setDegreeSpecMap] = useState(DEGREE_SPECIALIZATIONS);
  const [activeAds, setActiveAds] = useState([]);
  const [selectedAdsDetails, setSelectedAdsDetails] = useState([]);

  // Skill sets categories
  const SKILL_CATEGORIES = [
    { id: 'technical', label: 'Technical Skills', placeholder: 'e.g. React, Node.js, Python' },
    { id: 'creative', label: 'Creative Skills', placeholder: 'e.g. UI Design, Content Writing' },
    { id: 'cognitive', label: 'Cognitive Skills', placeholder: 'e.g. Problem Solving, Critical Thinking' },
    { id: 'tools', label: 'Tools & Technologies', placeholder: 'e.g. Git, Docker, AWS' },
    { id: 'ethics', label: 'Ethics & Values', placeholder: 'e.g. Integrity, Data Privacy' }
  ];

  const [skillInputs, setSkillInputs] = useState({
    technical: '',
    creative: '',
    cognitive: '',
    tools: '',
    ethics: ''
  });

  const handleAddSkill = (category, value) => {
    if (!value.trim()) return;

    // Split by comma if user enters multiple
    const newSkills = value.split(',').map(s => s.trim()).filter(s => s !== '');

    setFormData(prev => {
      const updatedSkills = [...new Set([...prev.skillSets[category], ...newSkills])];

      // Clear error if skills are added
      if (updatedSkills.length > 0) {
        setErrors(errs => ({ ...errs, [category]: '' }));
      }

      return {
        ...prev,
        skillSets: {
          ...prev.skillSets,
          [category]: updatedSkills
        }
      };
    });

    setSkillInputs(prev => ({ ...prev, [category]: '' }));
    setFieldTouched(prev => ({ ...prev, [category]: true }));
  };

  const handleRemoveSkill = (category, skillToRemove) => {
    const updatedSkills = formData.skillSets[category].filter(skill => skill !== skillToRemove);

    setFormData(prev => ({
      ...prev,
      skillSets: {
        ...prev.skillSets,
        [category]: updatedSkills
      }
    }));

    // Trigger validation on removal
    const error = validateField(category, updatedSkills);
    setErrors(prev => ({ ...prev, [category]: error }));
    setFieldTouched(prev => ({ ...prev, [category]: true }));
  };

  const handleSkillKeyDown = (category, e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill(category, e.target.value);
    }
  };

  useEffect(() => {
    const fetchActiveAds = async () => {
      try {
        const res = await advertisementAPI.getActive();
        setActiveAds(res.data.data || []);
      } catch (err) {
        console.warn('Could not fetch active advertisements');
      }
    };
    fetchActiveAds();
  }, []);

  useEffect(() => {
    const fetchDegreeOptions = async () => {
      try {
        const res = await degreeOptionAPI.getAll();
        const options = res.data.data || [];
        setDegreeOptions(options);
        // Build a DEGREE_SPECIALIZATIONS-compatible map
        const map = {};
        options.forEach(opt => {
          map[opt.name] = opt.specializations || [];
        });
        if (Object.keys(map).length > 0) {
          setDegreeSpecMap(map);
        }
      } catch (err) {
        console.warn('Could not fetch degree options, using defaults', err);
      }
    };
    fetchDegreeOptions();
  }, []);

  // Validate field function
  const validateField = useCallback((name, value, countryCode = '+91', passwordToCompare = '') => {
    // Return validation result immediately (synchronous)
    switch (name) {
      case 'fullName':
        const fullNameError = validateRequiredField(value, 'Full name');
        if (fullNameError) return fullNameError;
        if (value.length < 3) return 'Full name must be at least 3 characters';
        if (value.length > 100) return 'Full name is too long (max 100 characters)';
        if (!/^[A-Za-z\s.]+$/.test(value)) return 'Full name should contain only letters, spaces, and dots';
        return '';

      case 'fathersName':
        const fathersNameError = validateRequiredField(value, 'Father\'s name');
        if (fathersNameError) return fathersNameError;
        if (value.length < 3) return 'Father\'s name must be at least 3 characters';
        if (value.length > 100) return 'Father\'s name is too long (max 100 characters)';
        if (!/^[A-Za-z\s.]+$/.test(value)) return 'Father\'s name should contain only letters, spaces, and dots';
        return '';

      case 'gender':
        return validateRequiredField(value, 'Gender');

      case 'email':
        return validateEmailFormat(value);

      case 'password':
        const passwordError = validateRequiredField(value, 'Password');
        if (passwordError) return passwordError;
        if (value.length < 8) return 'Password must be at least 8 characters long';
        return '';

      case 'confirmPassword':
        const confirmPasswordError = validateRequiredField(value, 'Confirm password');
        if (confirmPasswordError) return confirmPasswordError;
        if (value !== passwordToCompare) return 'Passwords do not match';
        return '';

      case 'mobile':
        return validatePhoneNumber(value, countryCode);

      case 'dob':
        const dobError = validateRequiredField(value, 'Date of birth');
        if (dobError) return dobError;
        if (value > new Date()) return 'Date of birth cannot be in the future';
        return '';

      case 'permanentAddress':
        const addressError = validateRequiredField(value, 'Permanent address');
        if (addressError) return addressError;
        if (value.length < 10) return 'Address must be at least 10 characters long';
        if (value.length > 500) return 'Address cannot exceed 500 characters';
        return '';

      case 'state':
        return validateRequiredField(value, 'State');

      case 'tenthBoard':
        return validateRequiredField(value, '10th Board');

      case 'tenthPassingYear':
        const tenthYearError = validateRequiredField(value, '10th Passing Year');
        if (tenthYearError) return tenthYearError;
        const tenthYear = parseInt(value);
        if (isNaN(tenthYear)) return 'Please enter a valid year';
        if (tenthYear < 1950 || tenthYear > currentYear) return `Year must be between 1950 and ${currentYear}`;
        return '';

      case 'tenthPercentage':
        const tenthPercentError = validateRequiredField(value, '10th Percentage');
        if (tenthPercentError) return tenthPercentError;
        const tenthPercentage = parseFloat(value);
        if (isNaN(tenthPercentage)) return 'Please enter a valid percentage';
        if (tenthPercentage < 0 || tenthPercentage > 100) return 'Percentage must be between 0 and 100';
        return '';

      case 'twelfthBoard':
        return validateRequiredField(value, '12th Board');

      case 'twelfthPassingYear':
        const twelfthYearError = validateRequiredField(value, '12th Passing Year');
        if (twelfthYearError) return twelfthYearError;
        const twelfthYear = parseInt(value);
        if (isNaN(twelfthYear)) return 'Please enter a valid year';
        if (twelfthYear < 1950 || twelfthYear > currentYear) return `Year must be between 1950 and ${currentYear}`;
        return '';

      case 'twelfthPercentage':
        const twelfthPercentError = validateRequiredField(value, '12th Percentage');
        if (twelfthPercentError) return twelfthPercentError;
        const twelfthPercentage = parseFloat(value);
        if (isNaN(twelfthPercentage)) return 'Please enter a valid percentage';
        if (twelfthPercentage < 0 || twelfthPercentage > 100) return 'Percentage must be between 0 and 100';
        return '';

      case 'graduationDegree':
        return validateRequiredField(value, 'Graduation Degree');

      case 'graduationSpecialization':
        return validateRequiredField(value, 'Graduation Specialization');

      case 'technical':
      case 'creative':
      case 'cognitive':
      case 'tools':
      case 'ethics':
        const categoryLabel = SKILL_CATEGORIES.find(c => c.id === name)?.label || name;
        if (!value || !Array.isArray(value) || value.length === 0) {
          return `At least one ${categoryLabel.toLowerCase()} is required`;
        }
        return '';

      case 'graduationPassingYear':
        const gradYearError = validateRequiredField(value, 'Graduation Passing Year');
        if (gradYearError) return gradYearError;
        const gradYear = parseInt(value);
        if (isNaN(gradYear)) return 'Please enter a valid year';
        if (gradYear < 1950 || gradYear > currentYear) return `Year must be between 1950 and ${currentYear}`;
        return '';

      case 'graduationPercentage':
        const gradPercentError = validateRequiredField(value, 'Graduation Percentage');
        if (gradPercentError) return gradPercentError;
        const gradPercentage = parseFloat(value);
        if (isNaN(gradPercentage)) return 'Please enter a valid percentage';
        if (gradPercentage < 0 || gradPercentage > 100) return 'Percentage must be between 0 and 100';
        return '';

      case 'graduationCGPA':
        if (value && value.trim() !== '') {
          const cgpa = parseFloat(value);
          if (isNaN(cgpa)) return 'Please enter a valid CGPA';
          if (cgpa < 0 || cgpa > 10) return 'CGPA must be between 0 and 10';
        }
        return '';

      case 'profileImage':
        return validateFile(value, 'image', 10);

      case 'resume':
        return validateFile(value, 'document', 10);

      case 'tenthMarksheet':
        return validateFile(value, 'document', 10);

      case 'twelfthMarksheet':
        return validateFile(value, 'document', 10);

      case 'graduationMarksheet':
        return validateFile(value, 'document', 10);

      case 'advertisements':
        if (!value || value.length === 0) return 'At least one advertisement must be selected';
        return '';

      default:
        return '';
    }
  }, [selectedCountry, currentYear]);

  // Helper function to get error count (excluding empty error strings)
  const getErrorCount = () => {
    return Object.values(errors).filter(error => error && error.trim() !== '').length;
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

    // Validate on blur
    const value = formData[fieldName];
    let validationError;

    if (fieldName === 'confirmPassword') {
      validationError = validateField(fieldName, value, selectedCountry, formData.password);
    } else if (fieldName === 'mobile') {
      validationError = validateField(fieldName, value, selectedCountry);
    } else {
      validationError = validateField(fieldName, value);
    }

    if (validationError) {
      setErrors(prev => ({ ...prev, [fieldName]: validationError }));
    } else {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
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
        if (name === 'resume') setResumePreview(null);

        // Validate empty file
        const validationError = validateField(name, null);
        setErrors(prev => ({ ...prev, [name]: validationError }));
        return;
      }

      // Validate file
      let fileType = 'document';
      if (name === 'profileImage') fileType = 'image';

      const validationError = validateFile(file, fileType, 10);

      if (validationError) {
        setErrors(prev => ({
          ...prev,
          [name]: validationError
        }));

        // Clear the file input
        e.target.value = '';

        // Clear previews and form data
        if (name === 'profileImage') {
          setImagePreview(null);
          setFormData(prev => ({
            ...prev,
            [name]: null
          }));
        } else if (name === 'resume') {
          setResumePreview(null);
          setFormData(prev => ({
            ...prev,
            [name]: null
          }));
        }
        return;
      }

      // Clear any previous errors
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));

      // Create preview if it's an image or PDF
      if (name === 'profileImage') {
        setImagePreview(URL.createObjectURL(file));
      } else if (name === 'resume') {
        setResumePreview(URL.createObjectURL(file));
      }

      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
    } else {
      let newValue = value;

      if (name === 'fullName' || name === 'fathersName') {
        newValue = value.replace(/[^a-zA-Z\s.]/g, '');
        newValue = newValue.replace(/\s{2,}/g, ' ');
      } else if (name === 'mobile') {
        newValue = value.replace(/[^\d]/g, '');
      } else if (name === 'email') {
        newValue = value.toLowerCase().replace(/[^\w@.-]/g, '');
      } else if (name.includes('Percentage') || name === 'graduationCGPA') {
        newValue = value.replace(/[^\d.]/g, '');
      } else if (name.includes('PassingYear')) {
        newValue = value.replace(/\D/g, '');
      }

      setFormData(prev => {
        const updated = { ...prev, [name]: newValue };
        // Auto-clear specialization when degree changes
        if (name === 'graduationDegree') {
          updated.graduationSpecialization = '';
        }
        if (name === 'qualifyingDegree') {
          updated.qualifyingSpecialization = '';
        }
        return updated;
      });

      // Validate on change for immediate feedback
      let validationError;
      if (name === 'confirmPassword') {
        validationError = validateField(name, newValue, selectedCountry, formData.password);
      } else if (name === 'mobile') {
        validationError = validateField(name, newValue, selectedCountry);
      } else {
        validationError = validateField(name, newValue);
      }
      setErrors(prev => ({ ...prev, [name]: validationError }));
    }
  };

  const handleFullNameBlur = (e) => {
    const value = e.target.value;
    if (value.trim()) {
      const formattedName = formatName(value);
      setFormData(prev => ({
        ...prev,
        fullName: formattedName
      }));
    }
    handleBlur('fullName');
  };

  const handleFathersNameBlur = (e) => {
    const value = e.target.value;
    if (value.trim()) {
      const formattedName = formatName(value);
      setFormData(prev => ({
        ...prev,
        fathersName: formattedName
      }));
    }
    handleBlur('fathersName');
  };

  const handleEmailBlur = (e) => {
    const value = e.target.value.trim().toLowerCase();
    setFormData(prev => ({
      ...prev,
      email: value
    }));
    handleBlur('email');
  };

  const handleDobInputChange = (e) => {
    const value = e.target.value;
    handleTouch('dob');

    const parsedDate = parseDateInput(value);

    if (parsedDate) {
      setFormData(prev => ({
        ...prev,
        dob: parsedDate
      }));

      // Validate immediately
      const validationError = validateField('dob', parsedDate);
      setErrors(prev => ({ ...prev, dob: validationError }));
    } else if (value.trim() === '') {
      setFormData(prev => ({
        ...prev,
        dob: null
      }));
      setErrors(prev => ({ ...prev, dob: 'Date of birth is required' }));
    } else {
      setFormData(prev => ({
        ...prev,
        dob: value
      }));
      setErrors(prev => ({ ...prev, dob: 'Please enter a valid date (DD/MM/YYYY or DD-MM-YYYY)' }));
    }
  };

  const handleCalendarChange = (date) => {
    setFormData(prev => ({
      ...prev,
      dob: date
    }));

    // Validate immediately
    const validationError = validateField('dob', date);
    setErrors(prev => ({ ...prev, dob: validationError }));

    setIsCalendarOpen(false);
  };

  const toggleCalendar = () => {
    setIsCalendarOpen(!isCalendarOpen);
  };

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

    setFormData(prev => ({
      ...prev,
      mobile: ''
    }));

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

  // Debug function to see what's missing
  const debugFormCompletion = () => {
    console.log('=== FORM COMPLETION DEBUG ===');

    const requiredFields = [
      'fullName', 'fathersName', 'gender', 'email', 'password', 'confirmPassword',
      'mobile', 'dob', 'permanentAddress', 'state', 'profileImage', 'resume',
      'tenthBoard', 'tenthPassingYear', 'tenthPercentage',
      'twelfthBoard', 'twelfthPassingYear', 'twelfthPercentage',
      'graduationDegree', 'graduationPassingYear', 'graduationPercentage',
      'tenthMarksheet', 'twelfthMarksheet', 'graduationMarksheet'
    ];

    requiredFields.forEach(field => {
      const value = formData[field];
      let status = '❌ MISSING';

      if (field === 'profileImage' || field === 'resume' ||
        field === 'tenthMarksheet' || field === 'twelfthMarksheet' ||
        field === 'graduationMarksheet') {
        status = value instanceof File ? '✅ FILLED' : '❌ MISSING';
      } else if (value && (typeof value === 'string' && value.trim() !== '')) {
        status = '✅ FILLED';
      } else if (value instanceof Date) {
        status = '✅ FILLED';
      }

      console.log(`${field}: ${status} (${JSON.stringify(value)})`);
    });

    console.log('Current errors:', errors);
    console.log('Error count:', getErrorCount());
    console.log('=== END DEBUG ===');
  };

  const calculateCompletion = () => {
    const requiredFields = [
      // Personal Details
      'fullName', 'fathersName', 'gender', 'email', 'password', 'confirmPassword',
      'mobile', 'dob', 'permanentAddress', 'state', 'profileImage', 'resume', 'identityProof',

      // Skill Sets
      'technical', 'creative', 'cognitive', 'tools', 'ethics',

      // Education Details
      'tenthBoard', 'tenthPassingYear', 'tenthPercentage',
      'twelfthBoard', 'twelfthPassingYear', 'twelfthPercentage',
      'graduationDegree', 'graduationSpecialization', 'graduationPassingYear',

      // Marksheets
      'tenthMarksheet', 'twelfthMarksheet', 'graduationMarksheet',
      // Advertisement
      'advertisements'
    ];

    // File fields that need actual File objects
    const fileFields = ['profileImage', 'resume', 'tenthMarksheet', 'twelfthMarksheet', 'graduationMarksheet'];

    // Text fields that need non-empty strings
    const textFields = requiredFields.filter(field => !fileFields.includes(field));

    let filledCount = 0;

    textFields.forEach(field => {
      const value = formData[field];
      if (value && (typeof value === 'string' && value.trim() !== '')) {
        filledCount++;
      } else if (value instanceof Date) {
        filledCount++;
      }
    });

    fileFields.forEach(field => {
      if (formData[field] instanceof File) {
        filledCount++;
      }
    });

    // Skill Sets Check
    const skillCategories = ['technical', 'creative', 'cognitive', 'tools', 'ethics'];
    skillCategories.forEach(cat => {
      if (formData.skillSets[cat] && formData.skillSets[cat].length > 0) {
        filledCount++;
      }
    });

    // Special Check: Graduation Percentage OR CGPA
    if ((formData.graduationPercentage && formData.graduationPercentage.trim() !== '') ||
      (formData.graduationCGPA && formData.graduationCGPA.trim() !== '')) {
      filledCount++;
    }

    const totalFields = requiredFields.length + 1; // +1 for the Percentage/CGPA field
    return Math.round((filledCount / totalFields) * 100);
  };

  // Helper to get names of missing required fields for debugging
  const getMissingFields = () => {
    const fields = [
      { name: 'fullName', label: 'Full Name' },
      { name: 'fathersName', label: "Father's Name" },
      { name: 'gender', label: 'Gender' },
      { name: 'email', label: 'Email' },
      { name: 'password', label: 'Password' },
      { name: 'confirmPassword', label: 'Confirm Password' },
      { name: 'mobile', label: 'Mobile' },
      { name: 'dob', label: 'Date of Birth' },
      { name: 'permanentAddress', label: 'Address' },
      { name: 'state', label: 'State' },
      { name: 'profileImage', label: 'Profile Photo' },
      { name: 'resume', label: 'Resume' },
      { name: 'tenthBoard', label: '10th Board' },
      { name: 'tenthPassingYear', label: '10th Year' },
      { name: 'tenthPercentage', label: '10th %' },
      { name: 'twelfthBoard', label: '12th Board' },
      { name: 'twelfthPassingYear', label: '12th Year' },
      { name: 'twelfthPercentage', label: '12th %' },
      { name: 'graduationDegree', label: 'Grad degree' },
      { name: 'graduationPassingYear', label: 'Grad year' },
      { name: 'tenthMarksheet', label: '10th Marksheet' },
      { name: 'twelfthMarksheet', label: '12th Marksheet' },
      { name: 'graduationMarksheet', label: 'Grad Marksheet' },
      { name: 'advertisements', label: 'Advertisements' },
      { name: 'technical', label: 'Technical Skills' },
      { name: 'creative', label: 'Creative Skills' },
      { name: 'cognitive', label: 'Cognitive Skills' },
      { name: 'tools', label: 'Tools & Technologies' },
      { name: 'ethics', label: 'Ethics & Values' }
    ];

    const missing = fields.filter(f => {
      const val = formData[f.name];
      if (f.name === 'profileImage' || f.name === 'resume' || f.name.includes('Marksheet')) {
        return !(val instanceof File);
      }
      if (['technical', 'creative', 'cognitive', 'tools', 'ethics'].includes(f.name)) {
        return !(formData.skillSets[f.name] && formData.skillSets[f.name].length > 0);
      }
      return !(val && (typeof val === 'string' ? val.trim() !== '' : true));
    }).map(f => f.label);

    // Add graduation percentage/CGPA combined check
    if (!(formData.graduationPercentage?.trim()) && !(formData.graduationCGPA?.trim())) {
      missing.push('Grad Percentage/CGPA');
    }

    return missing;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Debug first
    debugFormCompletion();

    // Mark all fields as touched
    const allTouched = Object.keys(fieldTouched).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setFieldTouched(allTouched);

    // Validate all required fields synchronously
    const validationFields = [
      'fullName', 'fathersName', 'gender', 'email', 'password', 'confirmPassword',
      'mobile', 'dob', 'permanentAddress', 'state', 'tenthBoard', 'tenthPassingYear',
      'tenthPercentage', 'twelfthBoard', 'twelfthPassingYear', 'twelfthPercentage',
      'graduationDegree', 'graduationPassingYear', 'graduationPercentage',
      'profileImage', 'resume', 'tenthMarksheet', 'twelfthMarksheet', 'graduationMarksheet',
      'advertisements', 'technical', 'creative', 'cognitive', 'tools', 'ethics'
    ];

    const validationErrors = {};
    let hasErrors = false;

    // Validate each field
    validationFields.forEach(field => {
      let value = formData[field];
      let error = '';

      if (field === 'confirmPassword') {
        error = validateField(field, value, selectedCountry, formData.password);
      } else if (field === 'mobile') {
        error = validateField(field, value, selectedCountry);
      } else if (['technical', 'creative', 'cognitive', 'tools', 'ethics'].includes(field)) {
        error = validateField(field, formData.skillSets[field]);
      } else {
        error = validateField(field, value);
      }

      if (error) {
        validationErrors[field] = error;
        hasErrors = true;
      }
    });

    // Set all errors at once
    setErrors(prev => ({ ...prev, ...validationErrors }));

    console.log('Validation errors:', validationErrors);
    console.log('Has errors:', hasErrors);

    if (hasErrors) {
      toast.error('Please fix all validation errors before submitting');

      // Find first error field and scroll to it
      const firstErrorField = Object.keys(validationErrors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => element.focus(), 300);
        }
      }
      return;
    }

    // If no validation errors, proceed with submission
    setLoading(true);

    try {
      // Create FormData for submission
      const submitData = new FormData();

      // Append personal details - using correct field names
      submitData.append('fullName', formData.fullName.trim());
      submitData.append('fathersName', formData.fathersName.trim());
      submitData.append('gender', formData.gender);
      submitData.append('email', formData.email.trim().toLowerCase());
      submitData.append('password', formData.password);
      submitData.append('confirmPassword', formData.confirmPassword);
      submitData.append('mobile', selectedCountry + formData.mobile);
      submitData.append('permanentAddress', formData.permanentAddress.trim());
      submitData.append('state', formData.state.trim());

      // Handle DOB
      if (formData.dob instanceof Date) {
        submitData.append('dob', formData.dob.toISOString().split('T')[0]);
      } else if (formData.dob) {
        submitData.append('dob', formData.dob);
      }

      // Append education details - use consistent field names
      submitData.append('tenthBoard', formData.tenthBoard || '');
      submitData.append('tenthPassingYear', formData.tenthPassingYear || '');
      submitData.append('tenthPercentage', formData.tenthPercentage || '');

      submitData.append('twelfthBoard', formData.twelfthBoard || '');
      submitData.append('twelfthPassingYear', formData.twelfthPassingYear || '');
      submitData.append('twelfthPercentage', formData.twelfthPercentage || '');

      submitData.append('graduationDegree', formData.graduationDegree || '');
      submitData.append('graduationSpecialization', formData.graduationSpecialization || '');
      submitData.append('graduationPassingYear', formData.graduationPassingYear || '');
      submitData.append('graduationCGPA', formData.graduationCGPA || '');
      submitData.append('graduationPercentage', formData.graduationPercentage || '');

      if (formData.qualifyingDegree && formData.qualifyingDegree.trim() !== '') {
        submitData.append('qualifyingDegree', formData.qualifyingDegree);
        submitData.append('qualifyingSpecialization', formData.qualifyingSpecialization || '');
        submitData.append('qualifyingPercentage', formData.qualifyingPercentage || '');
      }

      if (formData.advertisements && formData.advertisements.length > 0) {
        submitData.append('advertisements', JSON.stringify(formData.advertisements));
      }

      // Append skill sets
      submitData.append('skillSets', JSON.stringify(formData.skillSets));

      // Append files - use correct field names that match server expectations
      if (formData.profileImage) {
        submitData.append('profileImage', formData.profileImage);
      }

      if (formData.resume) {
        submitData.append('resume', formData.resume);
      }

      if (formData.tenthMarksheet) {
        submitData.append('tenthMarksheet', formData.tenthMarksheet);
      }

      if (formData.twelfthMarksheet) {
        submitData.append('twelfthMarksheet', formData.twelfthMarksheet);
      }

      if (formData.graduationMarksheet) {
        submitData.append('graduationMarksheet', formData.graduationMarksheet);
      }

      if (formData.qualifyingMarksheet) {
        submitData.append('qualifyingMarksheet', formData.qualifyingMarksheet);
      }

      if (formData.identityProof) {
        submitData.append('identityProof', formData.identityProof);
      }

      console.log('=== REGISTRATION SUBMISSION ===');
      console.log('Form Data to be sent:');
      for (let pair of submitData.entries()) {
        console.log(`${pair[0]}:`,
          typeof pair[1] === 'string' ?
            (pair[0].includes('password') ? '***HIDDEN***' : pair[1].substring(0, 50)) :
            `${pair[1].constructor.name} - ${pair[1].name || 'No name'}`
        );
      }

      // Call enhanced registration endpoint
      const response = await userAPI.registerEnhanced(submitData);

      console.log('Registration response:', response);

      if (response.data && response.data.success) {
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
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);

        errorMessage = error.response.data?.message ||
          error.response.data?.error ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        console.error('Error request:', error.request);
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        console.error('Error message:', error.message);
        errorMessage = error.message || errorMessage;
      }

      // Handle specific error cases - check mobile FIRST since "already registered" is in both messages
      if (errorMessage.toLowerCase().includes('mobile') || errorMessage.toLowerCase().includes('phone')) {
        setErrors(prev => ({ ...prev, mobile: 'Mobile number already registered' }));
        toast.error('Mobile number already registered');
      } else if (errorMessage.toLowerCase().includes('email')) {
        setErrors(prev => ({ ...prev, email: 'Email already registered' }));
        toast.error('Email already registered');
      } else if (errorMessage.includes('Network error')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else if (errorMessage.includes('Unexpected file field')) {
        toast.error('File upload error: Please make sure all files are in correct format.');
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

  const formatPhoneNumber = (number) => {
    if (!number) return '';

    const digits = number.replace(/\D/g, '');
    const country = MOBILE_COUNTRIES.find(c => c.code === selectedCountry);

    switch (selectedCountry) {
      case '+1':
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
      case '+44':
        if (digits.length <= 5) return digits;
        if (digits.length <= 8) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
        return `${digits.slice(0, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)}`;
      case '+91':
        if (digits.length <= 5) return digits;
        return `${digits.slice(0, 5)}-${digits.slice(5, 10)}`;
      default:
        return digits;
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

  const getGenderIcon = (gender) => {
    switch (gender) {
      case 'Male': return <FaMars className="text-blue-500" />;
      case 'Female': return <FaVenus className="text-pink-500" />;
      case 'Other': return <FaTransgender className="text-purple-500" />;
      default: return <FaGenderless className="text-gray-500" />;
    }
  };

  // File upload handler for marksheets with validation
  const handleFileUpload = (fieldName, label) => {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label} *
        </label>
        <input
          type="file"
          name={fieldName}
          onChange={handleChange}
          onBlur={() => handleBlur(fieldName)}
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="form-input"
          disabled={loading}
        />
        {/* Error message for file upload */}
        {errors[fieldName] && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-600 flex items-center">
              <FaExclamationTriangle className="mr-2" />
              {errors[fieldName]}
            </p>
          </div>
        )}
        {/* Success message for file upload */}
        {formData[fieldName] && !errors[fieldName] && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-700 flex items-center">
              <FaCheckCircle className="mr-2" />
              File uploaded: {formData[fieldName].name} ({Math.round(formData[fieldName].size / 1024)}KB)
            </p>
          </div>
        )}
        <p className="text-xs text-gray-500">Max 10MB, PDF, DOC, DOCX files allowed</p>
      </div>
    );
  };

  const renderEducationSection = (level, title, icon) => {
    const isGraduation = level === 'graduation';
    const boardField = isGraduation ? 'graduationDegree' : `${level}Board`;

    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-center mb-4">
          {icon}
          <h3 className="text-lg font-semibold text-gray-800 ml-2">{title}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Board/University or Degree Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {isGraduation ? 'Degree' : 'Board/University'} *
            </label>
            <div className="relative">
              {isGraduation ? (
                <select
                  name={boardField}
                  value={formData[boardField]}
                  onChange={handleChange}
                  onBlur={() => handleBlur(boardField)}
                  className={`form-input w-full ${isFieldInvalid(boardField) ? 'border-red-500' : isFieldValid(boardField) ? 'border-green-500' : 'border-gray-300'}`}
                  disabled={loading}
                >
                  <option value="">Select Degree</option>
                  {degreeOptions.length > 0 ? (
                    degreeOptions
                      .filter(d => d.category === 'bachelor')
                      .map(d => (
                        <option key={d._id} value={d.name}>{d.name}</option>
                      ))
                  ) : (
                    Object.keys(DEGREE_SPECIALIZATIONS).map(deg => (
                      <option key={deg} value={deg}>{deg}</option>
                    ))
                  )}
                </select>
              ) : (
                <input
                  type="text"
                  name={boardField}
                  value={formData[boardField]}
                  onChange={handleChange}
                  onBlur={() => handleBlur(boardField)}
                  className={`form-input w-full ${isFieldInvalid(boardField) ? 'border-red-500' : isFieldValid(boardField) ? 'border-green-500' : 'border-gray-300'}`}
                  placeholder="e.g., CBSE, GSEB"
                  disabled={loading}
                />
              )}
              {fieldTouched[boardField] && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {isFieldValid(boardField) && <FaCheck className="text-green-600" />}
                  {isFieldInvalid(boardField) && <FaTimes className="text-red-600" />}
                </div>
              )}
            </div>
            {errors[boardField] && (
              <p className="text-sm text-red-600 animate-slide-up flex items-center">
                <FaTimes className="mr-1" /> {errors[boardField]}
              </p>
            )}
          </div>

          {/* Passing Year Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Passing Year *
            </label>
            <div className="relative">
              <input
                type="text"
                name={`${level}PassingYear`}
                value={formData[`${level}PassingYear`]}
                onChange={handleChange}
                onBlur={() => handleBlur(`${level}PassingYear`)}
                className={`form-input w-full ${isFieldInvalid(`${level}PassingYear`) ? 'border-red-500' : isFieldValid(`${level}PassingYear`) ? 'border-green-500' : 'border-gray-300'}`}
                placeholder="YYYY"
                maxLength="4"
                disabled={loading}
              />
              {fieldTouched[`${level}PassingYear`] && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {isFieldValid(`${level}PassingYear`) && <FaCheck className="text-green-600" />}
                  {isFieldInvalid(`${level}PassingYear`) && <FaTimes className="text-red-600" />}
                </div>
              )}
            </div>
            {errors[`${level}PassingYear`] && (
              <p className="text-sm text-red-600 animate-slide-up flex items-center">
                <FaTimes className="mr-1" /> {errors[`${level}PassingYear`]}
              </p>
            )}
          </div>

          {/* Percentage Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Percentage (%) *
            </label>
            <div className="relative">
              <input
                type="text"
                name={`${level}Percentage`}
                value={formData[`${level}Percentage`]}
                onChange={handleChange}
                onBlur={() => handleBlur(`${level}Percentage`)}
                className={`form-input w-full ${isFieldInvalid(`${level}Percentage`) ? 'border-red-500' : isFieldValid(`${level}Percentage`) ? 'border-green-500' : 'border-gray-300'}`}
                placeholder="e.g., 85.50"
                disabled={loading}
              />
              {fieldTouched[`${level}Percentage`] && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {isFieldValid(`${level}Percentage`) && <FaCheck className="text-green-600" />}
                  {isFieldInvalid(`${level}Percentage`) && <FaTimes className="text-red-600" />}
                </div>
              )}
            </div>
            {errors[`${level}Percentage`] && (
              <p className="text-sm text-red-600 animate-slide-up flex items-center">
                <FaTimes className="mr-1" /> {errors[`${level}Percentage`]}
              </p>
            )}
          </div>

          {/* CGPA Field (only for graduation) */}
          {isGraduation && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                CGPA (if applicable)
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="graduationCGPA"
                  value={formData.graduationCGPA}
                  onChange={handleChange}
                  onBlur={() => handleBlur('graduationCGPA')}
                  className={`form-input w-full ${isFieldInvalid('graduationCGPA') ? 'border-red-500' : isFieldValid('graduationCGPA') ? 'border-green-500' : 'border-gray-300'}`}
                  placeholder="e.g., 8.5"
                  disabled={loading}
                />
                {fieldTouched.graduationCGPA && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isFieldValid('graduationCGPA') && <FaCheck className="text-green-600" />}
                    {isFieldInvalid('graduationCGPA') && <FaTimes className="text-red-600" />}
                  </div>
                )}
              </div>
              {errors.graduationCGPA && (
                <p className="text-sm text-red-600 animate-slide-up flex items-center">
                  <FaTimes className="mr-1" /> {errors.graduationCGPA}
                </p>
              )}
            </div>
          )}

          {/* Specialization Field (only for graduation) */}
          {isGraduation && formData.graduationDegree && degreeSpecMap[formData.graduationDegree] && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Specialization *
              </label>
              <div className="relative">
                <select
                  name="graduationSpecialization"
                  value={formData.graduationSpecialization}
                  onChange={handleChange}
                  onBlur={() => handleBlur('graduationSpecialization')}
                  className={`form-input w-full ${isFieldInvalid('graduationSpecialization') ? 'border-red-500' : isFieldValid('graduationSpecialization') ? 'border-green-500' : 'border-gray-300'}`}
                  disabled={loading}
                >
                  <option value="">Select Specialization</option>
                  {degreeSpecMap[formData.graduationDegree].map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
                {fieldTouched.graduationSpecialization && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isFieldValid('graduationSpecialization') && <FaCheck className="text-green-600" />}
                    {isFieldInvalid('graduationSpecialization') && <FaTimes className="text-red-600" />}
                  </div>
                )}
              </div>
              {errors.graduationSpecialization && (
                <p className="text-sm text-red-600 animate-slide-up flex items-center">
                  <FaTimes className="mr-1" /> {errors.graduationSpecialization}
                </p>
              )}
            </div>
          )}

          {/* Marksheet Upload */}
          <div className="md:col-span-2 space-y-2">
            {handleFileUpload(
              `${level}Marksheet`,
              level === 'tenth' ? '10th Marksheet' :
                level === 'twelfth' ? '12th Marksheet' :
                  'Graduation Marksheet'
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen py-8 px-4 animate-fade-in">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 animate-slide-down">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              Create Your Account
            </h1>
            <p className="text-gray-600 text-lg">Complete your application with educational details</p>
          </div>

          <div className="card backdrop-blur-xl shadow-2xl">
            {/* Debug button - remove in production */}
            <div className="mb-4 flex justify-end">
              {/* <button
                type="button"
                onClick={debugFormCompletion}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm"
              >
                Debug Form
              </button> */}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* JOB ADVERTISEMENT SELECTION (MULTI) */}
              <div className="bg-purple-50 p-6 rounded-2xl border-2 border-purple-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white shadow-md">
                    <FaBullhorn />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Job Advertisements</h2>
                    <p className="text-sm text-purple-600 font-medium">Select one or more positions you are applying for</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeAds.length > 0 ? (
                      activeAds.map(ad => {
                        const isSelected = formData.advertisements.includes(ad._id);
                        return (
                          <div
                            key={ad._id}
                            onClick={() => {
                              const newAds = isSelected
                                ? formData.advertisements.filter(id => id !== ad._id)
                                : [...formData.advertisements, ad._id];

                              setFormData(prev => ({ ...prev, advertisements: newAds }));

                              // Update selected details for display
                              const details = activeAds.filter(a => newAds.includes(a._id));
                              setSelectedAdsDetails(details);

                              // Trigger validation
                              const error = validateField('advertisements', newAds);
                              setErrors(prev => ({ ...prev, advertisements: error }));
                              setFieldTouched(prev => ({ ...prev, advertisements: true }));
                            }}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${isSelected
                              ? 'border-purple-600 bg-purple-100 shadow-md'
                              : 'border-gray-200 bg-white hover:border-purple-300'
                              }`}
                          >
                            <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
                              }`}>
                              {isSelected && <FaCheck className="text-white text-xs" />}
                            </div>
                            <div className="flex-1">
                              <p className={`font-bold transition-colors ${isSelected ? 'text-purple-900' : 'text-gray-700'}`}>
                                {ad.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Apply by: {format(new Date(ad.lastDateToApply), 'dd MMM yyyy')}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-full p-8 text-center bg-gray-100 rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500 font-medium">No active advertisements available at the moment</p>
                      </div>
                    )}
                  </div>

                  {errors.advertisements && fieldTouched.advertisements && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <FaTimes className="mr-1" /> {errors.advertisements}
                    </p>
                  )}

                  {selectedAdsDetails.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Selected Position Details</p>
                      {selectedAdsDetails.map(ad => (
                        <div key={ad._id} className="p-4 bg-white rounded-xl border border-purple-100 animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-base font-bold text-gray-800">{ad.title}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                                <FaClock /> Last Date: {format(new Date(ad.lastDateToApply), 'dd MMM yyyy')}
                              </span>
                            </div>
                          </div>
                          <a
                            href={ad.detail}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-6 py-2 bg-purple-50 text-purple-700 font-bold rounded-lg hover:bg-purple-100 transition-all border border-purple-200 text-sm"
                          >
                            <FaFilePdf /> View PDF
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Personal Details Section */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <FaUser className="mr-3 text-primary-600" />
                  Personal Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Profile Image *
                    </label>

                    <div className="flex items-center gap-4">
                      {/* Profile Image Preview */}
                      <div className="relative">
                        <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-300 bg-gray-100 flex items-center justify-center">
                          {imagePreview ? (
                            <img
                              src={imagePreview}
                              alt="Profile Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center p-4">
                              <FaUser className="w-8 h-8 text-gray-400 mx-auto" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Upload Section */}
                      <div className="flex-1">
                        <input
                          type="file"
                          id="profileImageInput"
                          name="profileImage"
                          onChange={handleChange}
                          accept=".jpg,.jpeg,.png"
                          className="hidden"
                        />

                        <button
                          type="button"
                          onClick={() => document.getElementById('profileImageInput').click()}
                          onBlur={() => handleBlur('profileImage')}
                          className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          {formData.profileImage ? 'Change Photo' : 'Upload Photo'}
                        </button>

                        {/* Show any error message */}
                        {errors.profileImage && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                            <p className="text-sm text-red-600 flex items-center">
                              <FaExclamationTriangle className="mr-2" />
                              {errors.profileImage}
                            </p>
                          </div>
                        )}

                        {/* Show file info only when successfully uploaded AND no errors */}
                        {formData.profileImage && !errors.profileImage && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                            <p className="text-sm text-green-700 flex items-center">
                              <FaCheckCircle className="mr-2" />
                              File uploaded: {formData.profileImage.name} ({Math.round(formData.profileImage.size / 1024)}KB)
                            </p>
                          </div>
                        )}

                        <p className="text-xs text-gray-500 mt-1">
                          Supports: JPG, JPEG, PNG • Max 10MB
                        </p>
                      </div>
                    </div>
                  </div>

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
                        onBlur={handleFullNameBlur}
                        className={`form-input w-full ${isFieldInvalid('fullName') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('fullName') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'}`}
                        placeholder="Dhru Chaudhari"
                        disabled={loading}
                        maxLength={100}
                      />
                      {fieldTouched.fullName && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {isFieldValid('fullName') && <FaCheck className="text-green-600" />}
                          {isFieldInvalid('fullName') && <FaTimes className="text-red-600" />}
                        </div>
                      )}
                    </div>
                    {errors.fullName && (
                      <p className="text-sm text-red-600 animate-slide-up flex items-center">
                        <FaTimes className="mr-1" /> {errors.fullName}
                      </p>
                    )}
                  </div>

                  {/* Father's Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <FaUser className="mr-2 text-primary-600" />
                      Father's Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="fathersName"
                        value={formData.fathersName}
                        onChange={handleChange}
                        onBlur={handleFathersNameBlur}
                        className={`form-input w-full ${isFieldInvalid('fathersName') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('fathersName') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'}`}
                        placeholder="Father's Name"
                        disabled={loading}
                        maxLength={100}
                      />
                      {fieldTouched.fathersName && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {isFieldValid('fathersName') && <FaCheck className="text-green-600" />}
                          {isFieldInvalid('fathersName') && <FaTimes className="text-red-600" />}
                        </div>
                      )}
                    </div>
                    {errors.fathersName && (
                      <p className="text-sm text-red-600 animate-slide-up flex items-center">
                        <FaTimes className="mr-1" /> {errors.fathersName}
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
                        onChange={handleChange}
                        onBlur={() => handleBlur('gender')}
                        className={`form-input w-full ${isFieldInvalid('gender') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('gender') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'}`}
                        disabled={loading}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      {fieldTouched.gender && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {isFieldValid('gender') && <FaCheck className="text-green-600" />}
                          {isFieldInvalid('gender') && <FaTimes className="text-red-600" />}
                        </div>
                      )}
                    </div>
                    {errors.gender && (
                      <p className="text-sm text-red-600 animate-slide-up flex items-center">
                        <FaTimes className="mr-1" /> {errors.gender}
                      </p>
                    )}
                  </div>

                  {/* Date of Birth */}
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
                          placeholder="DD/MMM/YYYY or DD-MM-YYYY"
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
                          />
                        </div>
                      )}

                      {fieldTouched.dob && (
                        <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
                          {isFieldValid('dob') && <FaCheck className="text-green-600" />}
                          {isFieldInvalid('dob') && <FaTimes className="text-red-600" />}
                        </div>
                      )}
                    </div>

                    {errors.dob && (
                      <p className="text-sm text-red-600 animate-slide-up flex items-center">
                        <FaTimes className="mr-1" /> {errors.dob}
                      </p>
                    )}
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
                        onBlur={handleEmailBlur}
                        className={`form-input w-full ${isFieldInvalid('email') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('email') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'}`}
                        placeholder="vatsalraj@example.com"
                        disabled={loading}
                        maxLength={254}
                        autoComplete="email"
                      />
                      {fieldTouched.email && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {isFieldValid('email') && <FaCheck className="text-green-600" />}
                          {isFieldInvalid('email') && <FaTimes className="text-red-600" />}
                        </div>
                      )}
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-600 animate-slide-up flex items-center">
                        <FaTimes className="mr-1" /> {errors.email}
                      </p>
                    )}
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
                        {fieldTouched.mobile && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            {isFieldValid('mobile') && <FaCheck className="text-green-600" />}
                            {isFieldInvalid('mobile') && <FaTimes className="text-red-600" />}
                          </div>
                        )}
                      </div>
                    </div>
                    {errors.mobile && (
                      <p className="text-sm text-red-600 animate-slide-up flex items-center">
                        <FaTimes className="mr-1" /> {errors.mobile}
                      </p>
                    )}
                  </div>

                  {/* State */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-primary-600" />
                      State *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        onBlur={() => handleBlur('state')}
                        className={`form-input w-full ${isFieldInvalid('state') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('state') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'}`}
                        placeholder="e.g., Gujarat"
                        disabled={loading}
                      />
                      {fieldTouched.state && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {isFieldValid('state') && <FaCheck className="text-green-600" />}
                          {isFieldInvalid('state') && <FaTimes className="text-red-600" />}
                        </div>
                      )}
                    </div>
                    {errors.state && (
                      <p className="text-sm text-red-600 animate-slide-up flex items-center">
                        <FaTimes className="mr-1" /> {errors.state}
                      </p>
                    )}
                  </div>

                  {/* Permanent Address */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <FaHome className="mr-2 text-primary-600" />
                      Permanent Address *
                    </label>
                    <div className="relative">
                      <textarea
                        name="permanentAddress"
                        value={formData.permanentAddress}
                        onChange={handleChange}
                        onBlur={() => handleBlur('permanentAddress')}
                        className={`form-input min-h-[100px] w-full ${isFieldInvalid('permanentAddress') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('permanentAddress') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'}`}
                        placeholder="Enter your complete permanent address"
                        disabled={loading}
                        maxLength={500}
                      />
                      {fieldTouched.permanentAddress && (
                        <div className="absolute right-3 top-3">
                          {isFieldValid('permanentAddress') && <FaCheck className="text-green-600" />}
                          {isFieldInvalid('permanentAddress') && <FaTimes className="text-red-600" />}
                        </div>
                      )}
                    </div>
                    {errors.permanentAddress && (
                      <p className="text-sm text-red-600 animate-slide-up flex items-center">
                        <FaTimes className="mr-1" /> {errors.permanentAddress}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        className={`form-input w-full pr-10 ${isFieldInvalid('password') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('password') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'}`}
                        placeholder="Minimum 8 characters"
                        disabled={loading}
                        maxLength={128}
                        autoComplete="new-password"
                      />
                      {fieldTouched.password && (
                        <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                          {isFieldValid('password') && <FaCheck className="text-green-600" />}
                          {isFieldInvalid('password') && <FaTimes className="text-red-600" />}
                        </div>
                      )}
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary-600"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    <PasswordRequirements password={formData.password} />
                    {errors.password && (
                      <p className="text-sm text-red-600 animate-slide-up flex items-center">
                        <FaTimes className="mr-1" /> {errors.password}
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
                        className={`form-input w-full pr-10 ${isFieldInvalid('confirmPassword') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('confirmPassword') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'}`}
                        placeholder="Re-enter your password"
                        disabled={loading}
                        maxLength={128}
                        autoComplete="new-password"
                      />
                      {fieldTouched.confirmPassword && (
                        <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                          {isFieldValid('confirmPassword') && <FaCheck className="text-green-600" />}
                          {isFieldInvalid('confirmPassword') && <FaTimes className="text-red-600" />}
                        </div>
                      )}
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary-600"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={loading}
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    <PasswordRequirements
                      password={formData.password}
                      confirmPassword={formData.confirmPassword}
                      isConfirm={true}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-600 animate-slide-up flex items-center">
                        <FaTimes className="mr-1" /> {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Skills & Expertise Section */}
              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-primary-50 rounded-xl text-primary-600">
                    <FaToolbox className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Skills & Expertise</h2>
                    <p className="text-sm text-gray-500">Provide your expertise across different domains. Type and press Enter or use commas.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {SKILL_CATEGORIES.map((category) => (
                    <div key={category.id} className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        {category.id === 'technical' && <FaCog className="text-blue-500" />}
                        {category.id === 'creative' && <FaCamera className="text-purple-500" />}
                        {category.id === 'cognitive' && <FaBrain className="text-pink-500" />}
                        {category.id === 'tools' && <FaToolbox className="text-orange-500" />}
                        {category.id === 'ethics' && <FaShieldAlt className="text-green-500" />}
                        {category.label}
                      </label>

                      <div className="relative">
                        <input
                          type="text"
                          value={skillInputs[category.id]}
                          onChange={(e) => setSkillInputs(prev => ({ ...prev, [category.id]: e.target.value }))}
                          onKeyDown={(e) => handleSkillKeyDown(category.id, e)}
                          placeholder={category.placeholder}
                          className="form-input w-full pr-12 focus:ring-primary-500 focus:border-primary-500"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSkill(category.id, skillInputs[category.id])}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          disabled={loading || !skillInputs[category.id].trim()}
                        >
                          <FaCheck className="w-4 h-4" />
                        </button>
                      </div>

                      <div className={`flex flex-wrap gap-2 min-h-[40px] p-3 bg-gray-50 rounded-xl border border-dashed ${errors[category.id] && fieldTouched[category.id] ? 'border-red-300' : 'border-gray-300'}`}>
                        {formData.skillSets[category.id].length === 0 ? (
                          <span className="text-xs text-gray-400 italic flex items-center gap-1">
                            No skills added
                          </span>
                        ) : (
                          formData.skillSets[category.id].map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-full shadow-sm hover:border-primary-300 transition-all group"
                            >
                              {skill}
                              <button
                                type="button"
                                onClick={() => handleRemoveSkill(category.id, skill)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                                disabled={loading}
                              >
                                <FaTimes className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                      {errors[category.id] && fieldTouched[category.id] && (
                        <p className="text-xs text-red-500 flex items-center gap-1 animate-slide-up">
                          <FaTimesCircle className="w-3 h-3" /> {errors[category.id]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Education Section */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <FaGraduationCap className="mr-3 text-primary-600" />
                  Educational Qualifications
                </h2>
                <div className="space-y-6">
                  {/* 10th/Matriculation */}
                  {renderEducationSection('tenth', '10th/Matriculation Details', <FaBook className="text-blue-600" />)}

                  {/* 12th/Diploma */}
                  {renderEducationSection('twelfth', '12th/Diploma Details', <FaBook className="text-green-600" />)}

                  {/* Graduation */}
                  {renderEducationSection('graduation', 'Graduation Details (Bachelor\'s Degree)', <FaUniversity className="text-purple-600" />)}

                  {/* Qualifying Degree (Optional) */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center mb-4">
                      <FaFileAlt className="text-orange-600" />
                      <h3 className="text-lg font-semibold text-gray-800 ml-2">Qualifying Degree (Optional)</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Degree
                        </label>
                        <select
                          name="qualifyingDegree"
                          value={formData.qualifyingDegree}
                          onChange={handleChange}
                          className="form-input w-full border-gray-300"
                          disabled={loading}
                        >
                          <option value="">Select Master's Degree</option>
                          <option value="Master of Technology / Master of Engineering (M.Tech / M.E.)">Master of Technology / Master of Engineering (M.Tech / M.E.)</option>
                          <option value="Master of Computer Applications (MCA)">Master of Computer Applications (MCA)</option>
                          <option value="Master of Science (M.Sc.)">Master of Science (M.Sc.)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Percentage (%)
                        </label>
                        <input
                          type="text"
                          name="qualifyingPercentage"
                          value={formData.qualifyingPercentage}
                          onChange={handleChange}
                          className="form-input w-full border-gray-300"
                          placeholder="e.g., 80.50"
                          disabled={loading}
                        />
                      </div>

                      {/* Qualifying Specialization */}
                      {formData.qualifyingDegree && DEGREE_SPECIALIZATIONS[formData.qualifyingDegree] && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Specialization
                          </label>
                          <select
                            name="qualifyingSpecialization"
                            value={formData.qualifyingSpecialization}
                            onChange={handleChange}
                            className="form-input w-full border-gray-300"
                            disabled={loading}
                          >
                            <option value="">Select Specialization (Optional)</option>
                            {DEGREE_SPECIALIZATIONS[formData.qualifyingDegree].map(spec => (
                              <option key={spec} value={spec}>{spec}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="md:col-span-2 space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Qualifying Degree Marksheet
                        </label>
                        <input
                          type="file"
                          name="qualifyingMarksheet"
                          onChange={handleChange}
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          className="form-input"
                          disabled={loading}
                        />
                        <p className="text-xs text-gray-500">Max 10MB, PDF, DOC, DOCX files allowed</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* File Uploads Section */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <FaUpload className="mr-3 text-primary-600" />
                  Upload Documents
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Resume */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <FaFilePdf className="mr-2 text-primary-600" />
                      Resume/CV *
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="file"
                        id="resumeInput"
                        name="resume"
                        onChange={handleChange}
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => document.getElementById('resumeInput').click()}
                        onBlur={() => handleBlur('resume')}
                        className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        {formData.resume ? 'Change Resume' : 'Upload Resume'}
                      </button>

                      {resumePreview && (
                        <div className="relative">
                          <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-white shadow bg-red-50 flex items-center justify-center">
                            <FaFilePdf className="w-10 h-10 text-red-500" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Show any error message */}
                    {errors.resume && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-600 flex items-center">
                          <FaExclamationTriangle className="mr-2" />
                          {errors.resume}
                        </p>
                      </div>
                    )}

                    {/* Show file info only when successfully uploaded AND no errors */}
                    {formData.resume && !errors.resume && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                        <p className="text-sm text-green-700 flex items-center">
                          <FaCheckCircle className="mr-2" />
                          File uploaded: {formData.resume.name} ({Math.round(formData.resume.size / 1024)}KB)
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-gray-500">Max 10MB, PDF, DOC, DOCX allowed</p>
                  </div>

                  {/* Identity Proof */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <FaFilePdf className="mr-2 text-primary-600" />
                      Identity Proof *
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="file"
                        id="identityProofInput"
                        name="identityProof"
                        onChange={handleChange}
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => document.getElementById('identityProofInput').click()}
                        onBlur={() => handleBlur('identityProof')}
                        className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        {formData.identityProof ? 'Change Identity Proof' : 'Upload Identity Proof'}
                      </button>

                      {formData.identityProof && !errors.identityProof && (
                        <div className="relative">
                          <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-white shadow bg-red-50 flex items-center justify-center">
                            <FaFilePdf className="w-10 h-10 text-red-500" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Show any error message */}
                    {errors.identityProof && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-600 flex items-center">
                          <FaExclamationTriangle className="mr-2" />
                          {errors.identityProof}
                        </p>
                      </div>
                    )}

                    {/* Show file info only when successfully uploaded AND no errors */}
                    {formData.identityProof && !errors.identityProof && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                        <p className="text-sm text-green-700 flex items-center">
                          <FaCheckCircle className="mr-2" />
                          File uploaded: {formData.identityProof.name} ({Math.round(formData.identityProof.size / 1024)}KB)
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-gray-500">Max 10MB, PDF, DOC, DOCX allowed</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col md:flex-row gap-4 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className={`btn-primary flex-1 py-4 text-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className="spinner mr-3"></div>
                      Submitting Application...
                    </span>
                  ) : (
                    <>
                      <FaUpload className="inline mr-2" />
                      Submit Application
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
                <span className="text-sm text-gray-600">Application Completion</span>
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
                {getErrorCount() > 0 ? (
                  <span className="text-red-600">
                    {getErrorCount()} validation error(s) remaining
                  </span>
                ) : calculateCompletion() === 100 ? (
                  <span className="text-green-600">
                    ✓ All fields are valid! Ready to submit.
                  </span>
                ) : (
                  <div className="flex flex-col gap-1">
                    <span>
                      Fill all required fields to complete the application ({calculateCompletion()}% complete)
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mr-1">Remaining:</span>
                      {getMissingFields().map((field, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] border border-gray-200">
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
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