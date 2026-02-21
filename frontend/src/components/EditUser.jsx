import React, { useState, useEffect, useCallback, useRef } from "react";
import DatePicker from "react-datepicker";
import { toast } from "react-hot-toast";
import { userAPI, degreeOptionAPI, advertisementAPI } from "../utils/api";
import {
  validateFullName,
  validateEmail,
  validateMobile,
  validateDOB,
  validateProfileImage,
  validateDocument,
  parseDateInput
} from "../utils/validations";
import { MOBILE_COUNTRIES, PHONE_EXAMPLES, DEGREE_SPECIALIZATIONS } from "../utils/constants";
import {
  FaUser,
  FaCalendar,
  FaEnvelope,
  FaPhone,
  FaCamera,
  FaFilePdf,
  FaUpload,
  FaSave,
  FaSpinner,
  FaTrash,
  FaEye,
  FaCheck,
  FaTimes,
  FaInfoCircle,
  FaMars,
  FaVenus,
  FaTransgender,
  FaGraduationCap,
  FaBullhorn,
  FaClock,
  FaCode,
  FaLightbulb,
  FaPuzzlePiece,
  FaWrench,
  FaShieldAlt,
  FaPlus
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

// Function to extract country code from mobile number
const extractCountryCode = (mobileNumber) => {
  if (!mobileNumber) return { countryCode: '+91', number: '' };

  // Check for common country codes
  const countryCodes = ['+1', '+44', '+91', '+61', '+81', '+86'];

  for (const code of countryCodes) {
    if (mobileNumber.startsWith(code)) {
      return {
        countryCode: code,
        number: mobileNumber.replace(code, '')
      };
    }
  }

  // Default to India if no country code found
  return { countryCode: '+91', number: mobileNumber };
};

// Function to format Indian mobile number with dashes
const formatIndianMobile = (number) => {
  if (!number) return '';

  const digits = number.replace(/\D/g, '');

  if (digits.length <= 5) {
    return digits;
  } else if (digits.length <= 10) {
    return `${digits.slice(0, 5)} -${digits.slice(5, 10)} `;
  }

  return `${digits.slice(0, 5)} -${digits.slice(5, 10)} `;
};

// Get gender icon
const getGenderIcon = (gender) => {
  switch (gender) {
    case 'Male': return <FaMars className="text-blue-500" />;
    case 'Female': return <FaVenus className="text-pink-500" />;
    case 'Other': return <FaTransgender className="text-purple-500" />;
    default: return <FaTransgender className="text-gray-500" />;
  }
};

const EditUser = ({ user, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    dob: null,
    gender: '',
    email: '',
    mobile: '',
    profileImage: null,
    document: null,
    graduationDegree: '',
    graduationPassingYear: '',
    graduationPercentage: '',
    graduationCGPA: '',
    tenthBoard: '',
    tenthPassingYear: '',
    tenthPercentage: '',
    twelfthBoard: '',
    twelfthPassingYear: '',
    twelfthPercentage: '',
    qualifyingDegree: '',
    qualifyingPercentage: '',
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
  const [documentPreview, setDocumentPreview] = useState(null);
  const [existingProfileImage, setExistingProfileImage] = useState(null);
  const [existingDocument, setExistingDocument] = useState(null);
  const [fieldTouched, setFieldTouched] = useState({
    fullName: false,
    dob: false,
    gender: false,
    email: false,
    mobile: false,
    profileImage: false,
    document: false,
    advertisements: false,
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const datePickerRef = useRef(null);
  const mobileInputRef = useRef(null);

  // Dynamic degree options
  const [degreeOptions, setDegreeOptions] = useState([]);
  const [degreeSpecMap, setDegreeSpecMap] = useState(DEGREE_SPECIALIZATIONS);
  const [activeAds, setActiveAds] = useState([]);
  const [selectedAdsDetails, setSelectedAdsDetails] = useState([]);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await advertisementAPI.getAll();
        setActiveAds(res.data.data || []);
      } catch (err) {
        console.warn('Could not fetch advertisements in EditUser');
      }
    };
    fetchAds();
  }, []);

  useEffect(() => {
    const fetchDegreeOptions = async () => {
      try {
        const res = await degreeOptionAPI.getAll();
        const options = res.data.data || [];
        setDegreeOptions(options);
        const map = {};
        options.forEach(opt => {
          map[opt.name] = opt.specializations || [];
        });
        if (Object.keys(map).length > 0) {
          setDegreeSpecMap(map);
        }
      } catch (err) {
        console.warn('Could not fetch degree options in edit form', err);
      }
    };
    fetchDegreeOptions();
  }, []);

  useEffect(() => {
    if (user) {
      initializeFormData();
    }
  }, [user]);

  const initializeFormData = () => {
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

    // Extract country code and mobile number
    let mobileNumber = user.mobile || "";
    const { countryCode, number } = extractCountryCode(mobileNumber);

    // Extract advertisements
    const advertisements = user.advertisements ?
      user.advertisements.map(ad => ad._id || ad) : [];

    setFormData({
      fullName: user.fullName || "",
      dob: dobDate,
      gender: user.gender || "",
      email: user.email || "",
      mobile: number, // Store only the number without country code
      profileImage: null,
      document: null,
      graduationDegree: user.education?.graduation?.degree || '',
      graduationPassingYear: user.education?.graduation?.passingYear || '',
      graduationPercentage: user.education?.graduation?.percentage || '',
      graduationCGPA: user.education?.graduation?.cgpa || '',
      tenthBoard: user.education?.tenth?.board || '',
      tenthPassingYear: user.education?.tenth?.passingYear || '',
      tenthPercentage: user.education?.tenth?.percentage || '',
      twelfthBoard: user.education?.twelfth?.board || '',
      twelfthPassingYear: user.education?.twelfth?.passingYear || '',
      twelfthPercentage: user.education?.twelfth?.percentage || '',
      qualifyingPercentage: user.education?.qualifyingDegree?.percentage || '',
      advertisements: advertisements,
      skillSets: user.skillSets || {
        technical: [],
        creative: [],
        cognitive: [],
        tools: [],
        ethics: []
      }
    });

    // Update selected details for display (need to match with activeAds if possible)
    // This might need the activeAds to be loaded first, so we use an effect for it
    setSelectedAdsDetails([]); // Will be updated in a separate useEffect or when activeAds changes

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
  };

  // Sync selectedAdsDetails when activeAds or formData.advertisements changes
  useEffect(() => {
    if (activeAds.length > 0 && formData.advertisements.length > 0) {
      const details = activeAds.filter(ad => formData.advertisements.includes(ad._id));
      setSelectedAdsDetails(details);
    }
  }, [activeAds, formData.advertisements]);

  const validateField = useCallback(async (name, value, countryCode = '+91') => {
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
        return '';
      case 'document':
        if (value instanceof File) {
          return validateDocument(value);
        }
        return '';
      case 'advertisements':
        if (!value || value.length === 0) return 'At least one advertisement must be selected';
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
        return `${day} -${month} -${year} `;
      }
      return date;
    }
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${day} -${month} -${year} `;
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

    return `${country.name}: ${example.format} ${example.note ? `(${example.note})` : ''} `;
  };

  const formatPhoneNumber = (number) => {
    if (!number) return '';

    const digits = number.replace(/\D/g, '');

    switch (selectedCountry) {
      case '+91': // India
        return formatIndianMobile(digits);
      case '+1': // US/Canada
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)} `;
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)} -${digits.slice(6, 10)} `;
      case '+44': // UK
        if (digits.length <= 5) return digits;
        if (digits.length <= 8) return `${digits.slice(0, 5)} ${digits.slice(5)} `;
        return `${digits.slice(0, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} `;
      default:
        return digits;
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    handleTouch('mobile');

    // Extract digits only for storage
    const digitsOnly = value.replace(/\D/g, '');

    // Format for display based on selected country
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

  const handleGenderChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      gender: value
    }));
    handleTouch('gender');
    setIsDirty(true);

    // Clear error when user selects gender
    if (errors.gender) {
      setErrors(prev => ({
        ...prev,
        gender: '',
      }));
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

        // Limit length based on country
        const countryInfo = getCountryInfo(selectedCountry);
        newValue = newValue.substring(0, countryInfo.digits);

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

  const handleCalendarChange = (date) => {
    setFormData(prev => ({
      ...prev,
      dob: date
    }));

    if (errors.dob) {
      setErrors(prev => ({ ...prev, dob: '' }));
    }

    setIsCalendarOpen(false);
    setIsDirty(true);
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

  const handleAddSkill = (category, value) => {
    if (!value?.trim()) return;
    if (formData.skillSets[category].includes(value.trim())) {
      toast.error('Skill already exists');
      return;
    }
    setFormData(prev => ({
      ...prev,
      skillSets: {
        ...prev.skillSets,
        [category]: [...prev.skillSets[category], value.trim()]
      }
    }));
    setIsDirty(true);
  };

  const handleRemoveSkill = (category, skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skillSets: {
        ...prev.skillSets,
        [category]: prev.skillSets[category].filter(skill => skill !== skillToRemove)
      }
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
      validateField('gender', formData.gender),
      validateField('email', formData.email),
      validateField('mobile', formData.mobile, selectedCountry),
      validateField('dob', formData.dob),
    ]);

    const finalErrors = {
      fullName: validationResults[0],
      gender: validationResults[1],
      email: validationResults[2],
      mobile: validationResults[3],
      dob: validationResults[4],
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
      const element = document.querySelector(`[name = "${firstErrorField}"]`);
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
      submitData.append('gender', formData.gender);

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

      // Combine country code with mobile number
      const fullMobileNumber = selectedCountry + formData.mobile;
      submitData.append('mobile', fullMobileNumber);

      // Handle advertisements
      if (formData.advertisements && formData.advertisements.length > 0) {
        submitData.append('advertisements', JSON.stringify(formData.advertisements));
      }

      // Handle skillSets
      if (formData.skillSets) {
        submitData.append('skillSets', JSON.stringify(formData.skillSets));
      }

      // Handle profile image
      if (formData.profileImage instanceof File) {
        submitData.append('profileImage', formData.profileImage);
      } else if (!existingProfileImage && !formData.profileImage) {
        submitData.append('profileImage', '');
      }

      // Handle document
      if (formData.document instanceof File) {
        submitData.append('document', formData.document);
      } else if (!existingDocument && !formData.document) {
        submitData.append('document', '');
      }

      // Education fields
      submitData.append('graduationDegree', formData.graduationDegree);
      submitData.append('graduationPassingYear', formData.graduationPassingYear);
      submitData.append('graduationPercentage', formData.graduationPercentage);
      submitData.append('graduationCGPA', formData.graduationCGPA);
      submitData.append('tenthBoard', formData.tenthBoard);
      submitData.append('tenthPassingYear', formData.tenthPassingYear);
      submitData.append('tenthPercentage', formData.tenthPercentage);
      submitData.append('twelfthBoard', formData.twelfthBoard);
      submitData.append('twelfthPassingYear', formData.twelfthPassingYear);
      submitData.append('twelfthPercentage', formData.twelfthPercentage);
      submitData.append('qualifyingDegree', formData.qualifyingDegree);
      submitData.append('qualifyingPercentage', formData.qualifyingPercentage);

      const response = await userAPI.updateUser(user._id, submitData);

      if (response.data.success) {
        toast.success('User updated successfully!');
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Update error:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        const errorMsg = error.response?.data?.message || error.message;

        if (errorMsg?.includes('email') || errorMsg?.includes('Email')) {
          setErrors(prev => ({ ...prev, email: 'Email already registered' }));
          toast.error('Email already registered');
        } else if (errorMsg?.includes('mobile') || errorMsg?.includes('phone')) {
          setErrors(prev => ({ ...prev, mobile: 'Mobile number already registered' }));
          toast.error('Mobile number already registered');
        } else if (errorMsg?.includes('gender')) {
          setErrors(prev => ({ ...prev, gender: 'Gender validation failed' }));
          toast.error('Gender validation failed');
        } else {
          toast.error(errorMsg || 'Update failed. Please try again.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletion = () => {
    const requiredFields = ['fullName', 'gender', 'email', 'mobile', 'dob', 'advertisements'];
    const filledFields = requiredFields.filter(field => {
      const value = formData[field];
      if (!value) return false;
      if (Array.isArray(value) && value.length === 0) return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      return true;
    }).length;

    return Math.round((filledFields / 6) * 100);
  };

  // Get formatted phone number for display
  const getDisplayPhoneNumber = () => {
    if (!formData.mobile) return '';
    return formatIndianMobile(formData.mobile);
  };

  return (
    <div className="p-4 md:p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* JOB ADVERTISEMENT SELECTION (MULTI) */}
        <div className="bg-purple-50 p-6 rounded-2xl border-2 border-purple-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white shadow-md">
              <FaBullhorn />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Job Advertisements</h2>
              <p className="text-sm text-purple-600 font-medium">Select one or more advertisements</p>
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
                        setIsDirty(true);

                        // Error handling
                        if (errors.advertisements) {
                          setErrors(prev => ({ ...prev, advertisements: '' }));
                        }
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
                        <div className="flex items-center gap-2">
                          <p className={`font-bold transition-colors ${isSelected ? 'text-purple-900' : 'text-gray-700'}`}>
                            {ad.title}
                          </p>
                          {ad.lastDateToApply && new Date(ad.lastDateToApply) < new Date().setHours(0, 0, 0, 0) && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[8px] font-black uppercase rounded-md border border-red-200">
                              Closed
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Apply by: {format(new Date(ad.lastDateToApply), 'dd MMM yyyy')}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full p-4 text-center bg-gray-100 rounded-xl border border-dashed border-gray-300">
                  <p className="text-gray-500">No active advertisements available</p>
                </div>
              )}
            </div>

            {errors.advertisements && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <FaTimes className="mr-1" /> {errors.advertisements}
              </p>
            )}

            {selectedAdsDetails.length > 0 && (
              <div className="mt-6 space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Selected Position Details</p>
                {selectedAdsDetails.map(ad => (
                  <div key={ad._id} className="p-4 bg-white rounded-xl border border-purple-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
                className={`form - input py - 3 ${isFieldInvalid('fullName') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('fullName') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'} `}
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

          {/* Gender */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              <span className="mr-2">{getGenderIcon(formData.gender)}</span>
              Gender *
            </label>
            <div className="relative">
              <select
                name="gender"
                value={formData.gender}
                onChange={handleGenderChange}
                onBlur={() => handleBlur('gender')}
                className={`form - input py - 3 ${isFieldInvalid('gender') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('gender') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'} `}
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
                  className={`form - input flex - 1 py - 3 ${isFieldInvalid('dob') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('dob') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'} `}
                  placeholder="DD/MMM/YYYY or DD-MM-YYYY"
                  disabled={loading}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={toggleCalendar}
                  className={`ml - 2 px - 4 border ${isFieldInvalid('dob') ? 'border-red-500' : isFieldValid('dob') ? 'border-green-500' : 'border-gray-300'} rounded - lg bg - gray - 50 hover: bg - gray - 100 transition - colors flex items - center justify - center`}
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
                onKeyDown={(e) => {
                  if (e.key === ' ') {
                    e.preventDefault();
                    toast.error('Email cannot contain spaces');
                  }
                }}
                className={`form - input py - 3 ${isFieldInvalid('email') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('email') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'} `}
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
          </div>

          {/* Mobile Number - FIXED SECTION */}
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
                className="form-input w-32 py-3"
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
                  value={getDisplayPhoneNumber()}
                  onChange={handlePhoneChange}
                  onBlur={() => handleBlur('mobile')}
                  className={`form - input w - full pl - 14 py - 3 ${isFieldInvalid('mobile') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('mobile') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'} `}
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
                <FaCheck className="mr-1" /> Valid {getCountryInfo(selectedCountry).name} number
              </p>
            )}
            <div className="text-xs text-gray-500">
              <FaInfoCircle className="inline mr-1" />
              {selectedCountry === '+91' ? 'Format: XXXXX-XXXXX (e.g., 98765-43210)' : getCountryValidationMessage(selectedCountry)}
            </div>
          </div>

          {/* Profile Image */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              <FaCamera className="mr-2 text-primary-600" />
              Profile Image
              {isFieldValid('profileImage') && (
                <span className="ml-2 text-xs text-green-600 flex items-center">
                  <FaCheck className="mr-1" /> Valid
                </span>
              )}
              {existingProfileImage && !formData.profileImage && (
                <span className="ml-2 text-xs text-green-600">(Existing image will be kept)</span>
              )}
            </label>
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
              <label className={`cursor - pointer flex - 1 ${loading ? 'opacity-50 cursor-not-allowed' : ''} `}>
                <input
                  type="file"
                  name="profileImage"
                  onChange={handleChange}
                  onBlur={() => handleBlur('profileImage')}
                  accept=".jpg,.jpeg,image/jpeg"
                  className="hidden"
                  disabled={loading}
                />
                <div className={`card flex items - center justify - center p - 6 border - 2 border - dashed ${isFieldInvalid('profileImage') ? 'border-red-500' : isFieldValid('profileImage') ? 'border-green-500' : 'border-gray-300'} hover: border - primary - 500 transition - all duration - 300`}>
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
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-white shadow-lg">
                    <img
                      src={imagePreview || existingProfileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center">
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
          </div>

          {/* Document */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              <FaFilePdf className="mr-2 text-primary-600" />
              Document
              {isFieldValid('document') && (
                <span className="ml-2 text-xs text-green-600 flex items-center">
                  <FaCheck className="mr-1" /> Valid
                </span>
              )}
              {existingDocument && !formData.document && (
                <span className="ml-2 text-xs text-green-600">(Existing document will be kept)</span>
              )}
            </label>
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
              <label className={`cursor - pointer flex - 1 ${loading ? 'opacity-50 cursor-not-allowed' : ''} `}>
                <input
                  type="file"
                  name="document"
                  onChange={handleChange}
                  onBlur={() => handleBlur('document')}
                  accept=".pdf,application/pdf"
                  className="hidden"
                  disabled={loading}
                />
                <div className={`card flex items - center justify - center p - 6 border - 2 border - dashed ${isFieldInvalid('document') ? 'border-red-500' : isFieldValid('document') ? 'border-green-500' : 'border-gray-300'} hover: border - primary - 500 transition - all duration - 300`}>
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
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-red-50 flex items-center justify-center">
                    <div className="text-center">
                      <FaFilePdf className="w-12 h-12 text-red-500 mx-auto mb-2" />
                      <p className="text-xs text-gray-700 font-medium truncate max-w-[100px]">
                        {formData.document?.name || 'PDF Document'}
                      </p>
                      <p className="text-xs text-gray-500">PDF Document</p>
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <FaFilePdf className="w-4 h-4" />
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
          </div>
        </div>

        {/* Education Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaGraduationCap className="mr-2 text-primary-600" />
            Academic Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Graduation */}
            <div className="md:col-span-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Graduation</p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Degree</label>
              <select
                name="graduationDegree"
                value={formData.graduationDegree}
                onChange={handleChange}
                className="form-input py-3 border-gray-300"
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
                  [
                    'Bachelor Technology / Bachelor Engineering',
                    'Bachelor of Computer Applications (BCA)',
                    'Bachelor of Science'
                  ].map(deg => (
                    <option key={deg} value={deg}>{deg}</option>
                  ))
                )}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Passing Year</label>
              <input type="number" name="graduationPassingYear" value={formData.graduationPassingYear} onChange={handleChange} className="form-input py-3 border-gray-300" placeholder="2024" disabled={loading} />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Percentage</label>
              <input type="text" name="graduationPercentage" value={formData.graduationPercentage} onChange={handleChange} className="form-input py-3 border-gray-300" placeholder="85%" disabled={loading} />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">CGPA</label>
              <input type="text" name="graduationCGPA" value={formData.graduationCGPA} onChange={handleChange} className="form-input py-3 border-gray-300" placeholder="8.5" disabled={loading} />
            </div>

            {/* 10th */}
            <div className="md:col-span-2 mt-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">10th / SSC</p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Board</label>
              <input type="text" name="tenthBoard" value={formData.tenthBoard} onChange={handleChange} className="form-input py-3 border-gray-300" placeholder="CBSE, GSEB" disabled={loading} />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Percentage</label>
              <input type="number" name="tenthPercentage" value={formData.tenthPercentage} onChange={handleChange} className="form-input py-3 border-gray-300" placeholder="85" disabled={loading} />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Passing Year</label>
              <input type="number" name="tenthPassingYear" value={formData.tenthPassingYear} onChange={handleChange} className="form-input py-3 border-gray-300" placeholder="2018" disabled={loading} />
            </div>

            {/* 12th */}
            <div className="md:col-span-2 mt-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">12th / HSC / Diploma</p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Board</label>
              <input type="text" name="twelfthBoard" value={formData.twelfthBoard} onChange={handleChange} className="form-input py-3 border-gray-300" placeholder="CBSE, GSEB" disabled={loading} />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Percentage</label>
              <input type="number" name="twelfthPercentage" value={formData.twelfthPercentage} onChange={handleChange} className="form-input py-3 border-gray-300" placeholder="80" disabled={loading} />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Passing Year</label>
              <input type="number" name="twelfthPassingYear" value={formData.twelfthPassingYear} onChange={handleChange} className="form-input py-3 border-gray-300" placeholder="2020" disabled={loading} />
            </div>

            {/* Qualifying Degree */}
            <div className="md:col-span-2 mt-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Qualifying Degree (Master's - Optional)</p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Degree</label>
              <select
                name="qualifyingDegree"
                value={formData.qualifyingDegree}
                onChange={handleChange}
                className="form-input py-3 border-gray-300"
                disabled={loading}
              >
                <option value="">Select Degree</option>
                {degreeOptions.length > 0 ? (
                  degreeOptions
                    .filter(d => d.category === 'master')
                    .map(d => (
                      <option key={d._id} value={d.name}>{d.name}</option>
                    ))
                ) : (
                  [
                    'Master of Technology / Master of Engineering (M.Tech / M.E.)',
                    'Master of Computer Applications (MCA)',
                    'Master of Science (M.Sc.)'
                  ].map(deg => (
                    <option key={deg} value={deg}>{deg}</option>
                  ))
                )}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Percentage</label>
              <input type="number" name="qualifyingPercentage" value={formData.qualifyingPercentage} onChange={handleChange} className="form-input py-3 border-gray-300" placeholder="80" disabled={loading} />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading || Object.keys(errors).length > 0 || !isDirty}
            className={`btn - primary flex - 1 py - 4 text - lg ${loading || Object.keys(errors).length > 0 || !isDirty ? 'opacity-50 cursor-not-allowed' : ''} `}
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
            onClick={onClose}
            className="btn-secondary py-4 text-lg"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Form Progress */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Form Completion</span>
          <span className={`text - sm font - semibold ${calculateCompletion() === 100 ? 'text-green-600' : 'text-primary-600'} `}>
            {calculateCompletion()}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h - 2 rounded - full transition - all duration - 500 ${calculateCompletion() === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-primary-500 to-secondary-500'} `}
            style={{
              width: `${calculateCompletion()}% `
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
  );
};

export default EditUser;