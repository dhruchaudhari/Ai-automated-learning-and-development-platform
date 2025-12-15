export const validateFullName = (name) => {
  if (!name || name.trim().length < 3) {
    return 'Full name must be at least 3 characters long';
  }
  if (!/^[A-Za-z\s]+$/.test(name)) {
    return 'Full name should contain only letters and spaces';
  }
  return '';
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return '';
};

export const validatePassword = (password) => {
  if (!password || password.length < 4) {
    return 'Password must be at least 4 characters long';
  }
  return '';
};

export const validateMobile = (mobile) => {
  const mobileRegex = /^\+\d{1,3}\d{10}$/;
  if (!mobile || !mobileRegex.test(mobile)) {
    return 'Please enter valid country code and 10-digit mobile number (e.g., +911234567890)';
  }
  return '';
};

export const validateDOB = (date) => {
  if (!date) {
    return 'Date of birth is required';
  }
  const selectedDate = new Date(date);
  const today = new Date();
  if (selectedDate > today) {
    return 'Date of birth cannot be in the future';
  }
  return '';
};

export const validateProfileImage = (file) => {
  if (!file) {
    return 'Profile image is required';
  }
  if (typeof file === 'string' && file.startsWith('http')) {
    // If it's a URL (existing image), it's valid
    return '';
  }
  if (!['image/jpeg', 'image/jpg'].includes(file.type)) {
    return 'Only .jpeg/.jpg files are allowed';
  }
  if (file.size > 1 * 1024 * 1024) {
    return 'Image size must be less than 1MB';
  }
  return '';
};

export const validateDocument = (file) => {
  if (!file) {
    return 'Document is required';
  }
  if (typeof file === 'string' && file.startsWith('http')) {
    // If it's a URL (existing document), it's valid
    return '';
  }
  if (file.type !== 'application/pdf') {
    return 'Only .pdf files are allowed';
  }
  if (file.size > 5 * 1024 * 1024) {
    return 'Document size must be less than 5MB';
  }
  return '';
};

export const validateForm = (formData) => {
  const errors = {};
  
  errors.fullName = validateFullName(formData.fullName);
  errors.email = validateEmail(formData.email);
  errors.password = validatePassword(formData.password);
  errors.mobile = validateMobile(formData.mobile);
  errors.dob = validateDOB(formData.dob);
  errors.profileImage = validateProfileImage(formData.profileImage);
  errors.document = validateDocument(formData.document);
  
  return errors;
};

// Fixed validateEditForm function
export const validateEditForm = (formData, existingInfo = {}) => {
  const errors = {};
  
  // Use existing validation functions for required fields
  errors.fullName = validateFullName(formData.fullName);
  errors.email = validateEmail(formData.email);
  errors.mobile = validateMobile(formData.mobile);
  errors.dob = validateDOB(formData.dob);
  
  // Check for existing files - handle both ways of passing info
  const hasExistingProfileImage = existingInfo.hasExistingProfileImage || 
    (existingInfo.profileImage && typeof existingInfo.profileImage === 'string') ||
    (formData.profileImage && typeof formData.profileImage === 'string');
  
  const hasExistingDocument = existingInfo.hasExistingDocument || 
    (existingInfo.document && typeof existingInfo.document === 'string') ||
    (formData.document && typeof formData.document === 'string');
  
  // Profile image validation
  if (!hasExistingProfileImage) {
    errors.profileImage = validateProfileImage(formData.profileImage);
  } else if (formData.profileImage && typeof formData.profileImage !== 'string') {
    // If there's an existing image but user is uploading a new one, validate it
    errors.profileImage = validateProfileImage(formData.profileImage);
  }
  
  // Document validation
  if (!hasExistingDocument) {
    errors.document = validateDocument(formData.document);
  } else if (formData.document && typeof formData.document !== 'string') {
    // If there's an existing document but user is uploading a new one, validate it
    errors.document = validateDocument(formData.document);
  }
  
  return errors;
};

export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).replace(/ /g, '-');
};