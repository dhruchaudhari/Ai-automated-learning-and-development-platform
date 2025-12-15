import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { userAPI } from '../utils/api';
import { validateEditForm } from '../utils/validations';
import { MOBILE_COUNTRIES } from '../utils/constants';
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
  FaEye
} from 'react-icons/fa';

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
  const [originalData, setOriginalData] = useState({});
  const [errors, setErrors] = useState({});
  const [selectedCountry, setSelectedCountry] = useState('+91');
  const [imagePreview, setImagePreview] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [existingProfileImage, setExistingProfileImage] = useState(null);
  const [existingDocument, setExistingDocument] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

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
      
      setFormData({
        fullName: user.fullName || "",
        dob: user.dob ? new Date(user.dob) : null,
        email: user.email || "",
        mobile: user.mobile || "",
        profileImage: null, // Will be handled separately
        document: null, // Will be handled separately
      });
      
      setOriginalData({
        fullName: user.fullName,
        dob: user.dob,
        email: user.email,
        mobile: user.mobile,
        profileImage: user.profileImage,
        document: user.document
      });
      
      // Set existing files for preview
      if (user.profileImage) {
        setExistingProfileImage(user.profileImage);
        setImagePreview(user.profileImage);
      }
      
      if (user.document) {
        setExistingDocument(user.document);
        setDocumentPreview(user.document);
      }
      
      // Extract country code from mobile
      if (user.mobile) {
        const match = user.mobile.match(/^\+\d{1,3}/);
        if (match) {
          setSelectedCountry(match[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching user for edit:", error);
      if (error.response?.status !== 401) {
        toast.error("Failed to load user details");
        navigate("/grid");
      }
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (files) {
      const file = files[0];
      
      // Validate file type and size
      if (name === 'profileImage') {
        if (file) {
          if (!file.type.includes('jpeg') && !file.type.includes('jpg')) {
            setErrors({
              ...errors,
              profileImage: 'Only JPEG/JPG images are allowed'
            });
            return;
          }
          if (file.size > 1024 * 1024) { // 1MB
            setErrors({
              ...errors,
              profileImage: 'Image size should be less than 1MB'
            });
            return;
          }
          setImagePreview(URL.createObjectURL(file));
        }
      }
      
      if (name === 'document') {
        if (file) {
          if (file.type !== 'application/pdf') {
            setErrors({
              ...errors,
              document: 'Only PDF files are allowed'
            });
            return;
          }
          if (file.size > 5 * 1024 * 1024) { // 5MB
            setErrors({
              ...errors,
              document: 'PDF size should be less than 5MB'
            });
            return;
          }
          setDocumentPreview(URL.createObjectURL(file));
        }
      }
      
      setFormData({
        ...formData,
        [name]: file,
      });
      setIsDirty(true);
      
      // Clear error if file is valid
      if (errors[name]) {
        setErrors({
          ...errors,
          [name]: '',
        });
      }
    } else {
      let newValue = value;
      
      if (name === 'mobile') {
        newValue = selectedCountry + value.replace(selectedCountry, '');
      }
      
      setFormData({
        ...formData,
        [name]: newValue,
      });
      
      // Check if value changed from original
      if (originalData[name] !== newValue) {
        setIsDirty(true);
      }
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
    setIsDirty(true);
    
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
    const newMobile = countryCode + currentNumber;
    
    setFormData({
      ...formData,
      mobile: newMobile,
    });
    setIsDirty(true);
  };

  const handleRemoveImage = () => {
    setFormData({
      ...formData,
      profileImage: null,
    });
    setImagePreview(null);
    setExistingProfileImage(null);
    setIsDirty(true);
    
    if (errors.profileImage) {
      setErrors({
        ...errors,
        profileImage: '',
      });
    }
  };

  const handleRemoveDocument = () => {
    setFormData({
      ...formData,
      document: null,
    });
    setDocumentPreview(null);
    setExistingDocument(null);
    setIsDirty(true);
    
    if (errors.document) {
      setErrors({
        ...errors,
        document: '',
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Create combined data for validation that includes existing files as URLs
    const validationData = {
      ...formData,
      profileImage: formData.profileImage || existingProfileImage,
      document: formData.document || existingDocument
    };
    
    // Validate form
    const validationErrors = validateEditForm(validationData, {
      hasExistingProfileImage: !!existingProfileImage,
      hasExistingDocument: !!existingDocument,
      profileImage: existingProfileImage,
      document: existingDocument
    });
    
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
      
      if (formData.dob) {
        submitData.append('dob', formData.dob.toISOString());
      }
      
      submitData.append('email', formData.email);
      submitData.append('mobile', formData.mobile);
      
      // Handle profile image
      if (formData.profileImage && typeof formData.profileImage !== 'string') {
        // New file uploaded
        submitData.append('profileImage', formData.profileImage);
      } else if (!existingProfileImage && !formData.profileImage) {
        // No existing image and no new image
        submitData.append('profileImage', '');
      }
      // If existingProfileImage exists and no new file, don't send anything (keep existing)
      
      // Handle document
      if (formData.document && typeof formData.document !== 'string') {
        // New file uploaded
        submitData.append('document', formData.document);
      } else if (!existingDocument && !formData.document) {
        // No existing document and no new document
        submitData.append('document', '');
      }
      // If existingDocument exists and no new file, don't send anything (keep existing)

      console.log('Submitting update with data:', {
        fullName: formData.fullName,
        email: formData.email,
        mobile: formData.mobile,
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
      if (error.response?.status !== 401) {
        toast.error(error.response?.data?.message || 'Update failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 animate-slide-down">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Edit User
          </h1>
          <p className="text-gray-600 text-lg">Update user information</p>
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
                  placeholder="Enter full name"
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
                  placeholder="Enter email"
                  disabled={loading}
                />
                {errors.email && (
                  <p className="text-sm text-red-600 animate-slide-up">{errors.email}</p>
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
                  Profile Image (.jpeg only)
                  {existingProfileImage && <span className="ml-2 text-sm text-green-600">(Already uploaded)</span>}
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
                          {formData.profileImage && typeof formData.profileImage !== 'string' 
                            ? formData.profileImage.name 
                            : existingProfileImage 
                            ? 'Click to change profile image (optional)'
                            : 'Click to upload profile image'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Max 1MB, JPEG only</p>
                      </div>
                    </div>
                  </label>
                  
                  {(imagePreview || existingProfileImage) && (
                    <div className="relative">
                      <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-lg">
                        <img
                          src={imagePreview || existingProfileImage}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -top-2 -left-2 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center">
                        <FaCamera className="w-4 h-4" />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        title="Remove image"
                      >
                        <FaTrash className="w-3 h-3" />
                      </button>
                      {(existingProfileImage || (formData.profileImage && typeof formData.profileImage === 'string')) && (
                        <button
                          type="button"
                          onClick={() => window.open(imagePreview || existingProfileImage, "_blank")}
                          className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                          title="View image"
                        >
                          <FaEye className="w-3 h-3" />
                        </button>
                      )}
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
                  Document (.pdf only)
                  {existingDocument && <span className="ml-2 text-sm text-green-600">(Already uploaded)</span>}
                </label>
                <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                  <label className={`cursor-pointer flex-1 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
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
                          {formData.document && typeof formData.document !== 'string'
                            ? formData.document.name
                            : existingDocument
                            ? 'Click to change PDF document (optional)'
                            : 'Click to upload PDF document'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Max 5MB, PDF only</p>
                      </div>
                    </div>
                  </label>
                  
                  {(documentPreview || existingDocument) && (
                    <div className="relative">
                      <div className="flex items-center justify-center w-32 h-32 bg-red-50 border-4 border-white shadow-lg rounded-2xl">
                        <FaFilePdf className="w-12 h-12 text-red-600" />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveDocument}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        title="Remove document"
                      >
                        <FaTrash className="w-3 h-3" />
                      </button>
                      {(existingDocument || (formData.document && typeof formData.document === 'string')) && (
                        <button
                          type="button"
                          onClick={() => window.open(documentPreview || existingDocument, "_blank")}
                          className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                          title="View document"
                        >
                          <FaEye className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {errors.document && (
                  <p className="text-sm text-red-600 animate-slide-up">{errors.document}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading || !isDirty}
                className="btn-primary flex-1 py-4 text-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="spinner mr-3"></div>
                    Updating...
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
                className="btn-secondary py-4 text-lg"
              >
                <FaArrowLeft className="inline mr-2" />
                Cancel
              </button>
            </div>

            {/* Form Progress */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Form Completion</span>
                <span className="text-sm font-semibold text-primary-600">
                  {Math.round(
                    (['fullName', 'dob', 'email', 'mobile'].filter(field => 
                      formData[field] && formData[field].toString().trim() !== ''
                    ).length + 
                    (existingProfileImage || formData.profileImage ? 1 : 0) +
                    (existingDocument || formData.document ? 1 : 0)
                    ) / 6 * 100
                  )}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(
                      ['fullName', 'dob', 'email', 'mobile'].filter(field => 
                        formData[field] && formData[field].toString().trim() !== ''
                      ).length + 
                      (existingProfileImage || formData.profileImage ? 1 : 0) +
                      (existingDocument || formData.document ? 1 : 0)
                    ) / 6 * 100}%`
                  }}
                ></div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUser;