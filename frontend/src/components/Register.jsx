import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { userAPI } from '../utils/api';
import { validateForm, formatDate } from '../utils/validations';
import { MOBILE_COUNTRIES } from '../utils/constants';
import { 
  FaUser, 
  FaCalendar, 
  FaEnvelope, 
  FaLock, 
  FaPhone, 
  FaCamera, 
  FaFilePdf,
  FaUpload
} from 'react-icons/fa';

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

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (files) {
      const file = files[0];
      
      if (name === 'profileImage') {
        setImagePreview(URL.createObjectURL(file));
      }
      
      setFormData({
        ...formData,
        [name]: file,
      });
    } else {
      let newValue = value;
      
      if (name === 'mobile') {
        newValue = selectedCountry + value.replace(selectedCountry, '');
      }
      
      setFormData({
        ...formData,
        [name]: newValue,
      });
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      dob: date,
    });
    
    if (errors.dob) {
      setErrors({
        ...errors,
        dob: '',
      });
    }
  };

  const handleCountryChange = (e) => {
    const countryCode = e.target.value;
    setSelectedCountry(countryCode);
    
    // Update mobile number with new country code
    const currentNumber = formData.mobile.replace(/^\+\d{1,3}/, '');
    setFormData({
      ...formData,
      mobile: countryCode + currentNumber,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);
    
    // Check if there are any errors
    const hasErrors = Object.values(validationErrors).some(error => error !== '');
    if (hasErrors) {
      toast.error('Please fix all validation errors');
      return;
    }

    setLoading(true);
    
    try {
      const submitData = new FormData();
      submitData.append('fullName', formData.fullName);
      submitData.append('dob', formData.dob.toISOString());
      submitData.append('email', formData.email);
      submitData.append('password', formData.password);
      submitData.append('mobile', formData.mobile);
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
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`form-input ${errors.fullName ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : ''}`}
                  placeholder="Enter your full name"
                  disabled={loading}
                />
                {errors.fullName && (
                  <p className="text-sm text-red-600 animate-slide-up">{errors.fullName}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FaCalendar className="mr-2 text-primary-600" />
                  Date of Birth *
                </label>
                <DatePicker
                  selected={formData.dob}
                  onChange={handleDateChange}
                  dateFormat="dd-MMM-yyyy"
                  placeholderText="Select Date (DD-MMM-YYYY)"
                  className={`form-input w-full ${errors.dob ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : ''}`}
                  showYearDropdown
                  scrollableYearDropdown
                  yearDropdownItemNumber={50}
                  maxDate={new Date()}
                  disabled={loading}
                />
                {errors.dob && (
                  <p className="text-sm text-red-600 animate-slide-up">{errors.dob}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FaEnvelope className="mr-2 text-primary-600" />
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : ''}`}
                  placeholder="Enter your email"
                  disabled={loading}
                />
                {errors.email && (
                  <p className="text-sm text-red-600 animate-slide-up">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FaLock className="mr-2 text-primary-600" />
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-input ${errors.password ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : ''}`}
                  placeholder="Minimum 4 characters"
                  disabled={loading}
                />
                {errors.password && (
                  <p className="text-sm text-red-600 animate-slide-up">{errors.password}</p>
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
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile.replace(selectedCountry, '')}
                    onChange={handleChange}
                    className={`form-input flex-1 ${errors.mobile ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : ''}`}
                    placeholder="1234567890"
                    disabled={loading}
                  />
                </div>
                {errors.mobile && (
                  <p className="text-sm text-red-600 animate-slide-up">{errors.mobile}</p>
                )}
              </div>

              {/* Profile Image */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FaCamera className="mr-2 text-primary-600" />
                  Profile Image (.jpeg only) *
                </label>
                <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                  <label className={`cursor-pointer flex-1 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="file"
                      name="profileImage"
                      onChange={handleChange}
                      accept=".jpg,.jpeg"
                      className="hidden"
                      disabled={loading}
                    />
                    <div className={`card flex items-center justify-center p-8 border-2 border-dashed ${errors.profileImage ? 'border-red-500' : 'border-gray-300'} hover:border-primary-500 transition-all duration-300`}>
                      <div className="text-center">
                        <FaUpload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">
                          {formData.profileImage ? formData.profileImage.name : 'Click to upload profile image'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Max 1MB, JPEG only</p>
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
                  <p className="text-sm text-red-600 animate-slide-up">{errors.profileImage}</p>
                )}
              </div>

              {/* Document */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FaFilePdf className="mr-2 text-primary-600" />
                  Document (.pdf only) *
                </label>
                <label className={`cursor-pointer block ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input
                    type="file"
                    name="document"
                    onChange={handleChange}
                    accept=".pdf"
                    className="hidden"
                    disabled={loading}
                  />
                  <div className={`card flex items-center justify-center p-8 border-2 border-dashed ${errors.document ? 'border-red-500' : 'border-gray-300'} hover:border-primary-500 transition-all duration-300`}>
                    <div className="text-center">
                      <FaFilePdf className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">
                        {formData.document ? formData.document.name : 'Click to upload PDF document'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Max 5MB, PDF only</p>
                    </div>
                  </div>
                </label>
                {errors.document && (
                  <p className="text-sm text-red-600 animate-slide-up">{errors.document}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 py-4 text-lg"
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
              <span className="text-sm font-semibold text-primary-600">
                {Math.round(
                  (Object.values(formData).filter(v => v !== null && v !== '' && v !== '+91').length / 7) * 100
                )}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(Object.values(formData).filter(v => v !== null && v !== '' && v !== '+91').length / 7) * 100}%`
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;