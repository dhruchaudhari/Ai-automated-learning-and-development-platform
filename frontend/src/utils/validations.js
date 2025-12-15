// Enhanced validation utilities
export const validateFullName = (name) => {
  if (!name || name.trim().length === 0) {
    return 'Full name is required';
  }
  if (name.trim().length < 3) {
    return 'Full name must be at least 3 characters long';
  }
  if (!/^[A-Za-z\s]+$/.test(name.trim())) {
    return 'Full name should contain only letters and spaces';
  }
  if (name.trim().length > 100) {
    return 'Full name is too long (max 100 characters)';
  }
  return '';
};

export const validateEmail = (email) => {
  if (!email || email.trim().length === 0) {
    return 'Email address is required';
  }
  
  const trimmedEmail = email.trim();
  
  // Basic email pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return 'Please enter a valid email address (e.g., user@example.com)';
  }
  
  // Check for consecutive dots
  if (trimmedEmail.includes('..')) {
    return 'Email cannot contain consecutive dots';
  }
  
  // Check for spaces
  if (trimmedEmail.includes(' ')) {
    return 'Email cannot contain spaces';
  }
  
  // Check length limits
  if (trimmedEmail.length > 254) {
    return 'Email is too long (max 254 characters)';
  }
  
  // Check local part length (before @)
  const localPart = trimmedEmail.split('@')[0];
  if (localPart.length > 64) {
    return 'Email username is too long';
  }
  
  // Check for special characters in domain
  const domainPart = trimmedEmail.split('@')[1];
  if (!/^[a-zA-Z0-9.-]+$/.test(domainPart)) {
    return 'Email domain contains invalid characters';
  }
  
  return '';
};

export const validatePassword = (password, isRegistration = true) => {
  if (!password) {
    return 'Password is required';
  }
  
  if (password.length < 4) {
    return 'Password must be at least 4 characters long';
  }
  
  if (password.length > 100) {
    return 'Password is too long (max 100 characters)';
  }
  
  // Check for weak passwords
  const weakPasswords = [
    'password', '123456', 'qwerty', 'admin', 'letmein', 
    'welcome', 'monkey', '12345678', '123456789', 'password1'
  ];
  
  if (isRegistration && weakPasswords.includes(password.toLowerCase())) {
    return 'Password is too common. Choose a stronger password';
  }
  
  // Check for repeated characters
  if (/(.)\1{4,}/.test(password)) {
    return 'Password contains too many repeated characters';
  }
  
  return '';
};

export const validateMobile = (mobile, countryCode = '+91') => {
  if (!mobile) {
    return 'Mobile number is required';
  }
  
  // Ensure we have country code in the mobile number
  let mobileNumber = mobile;
  if (!mobile.startsWith('+') && !mobile.startsWith(countryCode)) {
    mobileNumber = countryCode + mobile;
  }
  
  // Validate country code + 10 digits format
  const mobileRegex = /^\+\d{1,3}\d{10}$/;
  if (!mobileRegex.test(mobileNumber)) {
    return 'Please enter a valid 10-digit mobile number with country code';
  }
  
  // Extract just the digits after country code
  const numberOnly = mobileNumber.replace(/^\+\d{1,3}/, '');
  
  // Check exactly 10 digits
  if (numberOnly.length !== 10) {
    return 'Mobile number must be exactly 10 digits';
  }
  
  // Check only digits
  if (!/^\d+$/.test(numberOnly)) {
    return 'Mobile number can only contain digits';
  }
  
  // Check for unrealistic patterns
  if (/^(\d)\1{9}$/.test(numberOnly)) {
    return 'Invalid mobile number pattern';
  }
  
  // Check for sequential numbers
  if ('0123456789'.includes(numberOnly) || '9876543210'.includes(numberOnly)) {
    return 'Invalid mobile number pattern';
  }
  
  // For Indian numbers (+91), validate starting digit
  if (mobileNumber.startsWith('+91') && !['6', '7', '8', '9'].includes(numberOnly.charAt(0))) {
    return 'Indian mobile numbers must start with 6, 7, 8, or 9';
  }
  
  // Check for impossible area codes (first 4-5 digits)
  const areaCode = numberOnly.substring(0, 4);
  const invalidAreaCodes = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999'];
  if (invalidAreaCodes.includes(areaCode)) {
    return 'Invalid mobile number';
  }
  
  return '';
};

export const validateDOB = (date) => {
  if (!date) {
    return 'Date of birth is required';
  }
  
  let inputDate;
  
  // Handle string input with allowed separators
  if (typeof date === 'string') {
    const trimmedDate = date.trim();
    
    // Validate format: DD/MMM/YYYY or DD-MMM-YYYY
    const dobRegex = /^(0[1-9]|[12][0-9]|3[01])[/\-](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[/\-]\d{4}$/i;
    
    if (!dobRegex.test(trimmedDate)) {
      return 'Invalid date format. Use DD/MMM/YYYY or DD-MMM-YYYY (e.g., 15/Jan/1990)';
    }
    
    // Parse the date
    const parts = trimmedDate.split(/[/\-]/);
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1].toLowerCase().substring(0, 3);
    const year = parseInt(parts[2], 10);
    
    // Month mapping
    const monthMap = {
      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    };
    
    const month = monthMap[monthStr];
    if (month === undefined) {
      return 'Invalid month name';
    }
    
    inputDate = new Date(year, month, day);
  } else if (date instanceof Date) {
    inputDate = new Date(date);
  } else {
    return 'Invalid date format';
  }
  
  // Check if date is valid
  if (isNaN(inputDate.getTime())) {
    return 'Invalid date';
  }
  
  // Check realistic year range (1900 to current year)
  const currentYear = new Date().getFullYear();
  const year = inputDate.getFullYear();
  
  if (year < 1900) {
    return 'Year must be 1900 or later';
  }
  
  if (year > currentYear) {
    return `Year cannot be in the future (max ${currentYear})`;
  }
  
  // Check if month is valid (should be redundant but double-check)
  const month = inputDate.getMonth();
  if (month < 0 || month > 11) {
    return 'Invalid month';
  }
  
  // Check if day is valid for the month
  const day = inputDate.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return `Invalid day for selected month (max: ${daysInMonth})`;
  }
  
  // Check if date is not in future
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to compare only dates
  
  if (inputDate > today) {
    return 'Date of birth cannot be in the future';
  }
  
  // Check minimum age (at least 13 years old)
  const minAge = 13;
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - minAge);
  minDate.setHours(0, 0, 0, 0);
  
  if (inputDate > minDate) {
    return `You must be at least ${minAge} years old`;
  }
  
  // Check maximum age (reasonable upper limit, e.g., 150 years)
  const maxAge = 150;
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - maxAge);
  maxDate.setHours(0, 0, 0, 0);
  
  if (inputDate < maxDate) {
    return `Age must be less than ${maxAge} years`;
  }
  
  return '';
};

export const validateProfileImage = (file) => {
  if (!file) {
    return 'Profile image is required';
  }
  
  // Handle existing image URLs
  if (typeof file === 'string' && file.startsWith('http')) {
    return '';
  }
  
  // Check if it's a file object
  if (!(file instanceof File)) {
    return 'Invalid file format';
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    return 'Only JPEG/JPG images are allowed (.jpg, .jpeg)';
  }
  
  // Check file extension
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith('.jpg') && !fileName.endsWith('.jpeg')) {
    return 'File must have .jpg or .jpeg extension';
  }
  
  // Check file size (1MB)
  const maxSize = 1 * 1024 * 1024; // 1MB in bytes
  if (file.size > maxSize) {
    return 'Image size must be less than 1MB';
  }
  
  // Check file size is not 0
  if (file.size === 0) {
    return 'Image file is empty';
  }
  
  return '';
};

export const validateDocument = (file) => {
  if (!file) {
    return 'Document is required';
  }
  
  // Handle existing document URLs
  if (typeof file === 'string' && file.startsWith('http')) {
    return '';
  }
  
  // Check if it's a file object
  if (!(file instanceof File)) {
    return 'Invalid file format';
  }
  
  // Check file type
  if (file.type !== 'application/pdf') {
    return 'Only PDF documents are allowed (.pdf)';
  }
  
  // Check file extension
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith('.pdf')) {
    return 'File must have .pdf extension';
  }
  
  // Check file size (5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return 'Document size must be less than 5MB';
  }
  
  // Check file size is not 0
  if (file.size === 0) {
    return 'PDF file is empty';
  }
  
  // Additional PDF validation (check for PDF magic number)
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const arr = new Uint8Array(e.target.result);
        // Check for PDF magic number "%PDF"
        if (arr.length >= 4 && 
            arr[0] === 0x25 && // %
            arr[1] === 0x50 && // P
            arr[2] === 0x44 && // D
            arr[3] === 0x46) { // F
          resolve('');
        } else {
          resolve('Invalid PDF file format');
        }
      } catch (error) {
        resolve('Failed to validate PDF file');
      }
    };
    reader.onerror = () => resolve('Failed to read PDF file');
    reader.readAsArrayBuffer(file.slice(0, 4)); // Read only first 4 bytes
  });
};

export const validateForm = (formData) => {
  const errors = {};
  
  errors.fullName = validateFullName(formData.fullName);
  errors.email = validateEmail(formData.email);
  errors.password = validatePassword(formData.password, true);
  errors.mobile = validateMobile(formData.mobile, formData.mobile?.startsWith('+') ? undefined : '+91');
  errors.dob = validateDOB(formData.dob);
  errors.profileImage = validateProfileImage(formData.profileImage);
  errors.document = validateDocument(formData.document);
  
  return errors;
};

export const validateEditForm = (formData, existingInfo = {}) => {
  const errors = {};
  
  // Use existing validation functions for required fields
  errors.fullName = validateFullName(formData.fullName);
  errors.email = validateEmail(formData.email);
  errors.mobile = validateMobile(formData.mobile, formData.mobile?.startsWith('+') ? undefined : '+91');
  errors.dob = validateDOB(formData.dob);
  
  // Check for existing files
  const hasExistingProfileImage = existingInfo.hasExistingProfileImage || 
    (existingInfo.profileImage && typeof existingInfo.profileImage === 'string' && existingInfo.profileImage.startsWith('http'));
  
  const hasExistingDocument = existingInfo.hasExistingDocument || 
    (existingInfo.document && typeof existingInfo.document === 'string' && existingInfo.document.startsWith('http'));
  
  // Profile image validation
  if (!hasExistingProfileImage && !formData.profileImage) {
    errors.profileImage = 'Profile image is required';
  } else if (formData.profileImage) {
    if (typeof formData.profileImage === 'string' && formData.profileImage.startsWith('http')) {
      // Valid existing image
      errors.profileImage = '';
    } else if (typeof formData.profileImage === 'object') {
      // New file upload
      errors.profileImage = validateProfileImage(formData.profileImage);
    }
  }
  
  // Document validation
  if (!hasExistingDocument && !formData.document) {
    errors.document = 'Document is required';
  } else if (formData.document) {
    if (typeof formData.document === 'string' && formData.document.startsWith('http')) {
      // Valid existing document
      errors.document = '';
    } else if (typeof formData.document === 'object') {
      // New file upload - handle Promise for PDF validation
      const validationResult = validateDocument(formData.document);
      if (validationResult.then) {
        // It's a Promise, we'll handle it in the component
        errors.document = 'Validating PDF...';
      } else {
        errors.document = validationResult;
      }
    }
  }
  
  return errors;
};

export const formatDate = (date) => {
  if (!date) return '';
  
  let dateObj;
  
  if (typeof date === 'string') {
    // Parse string date with allowed formats
    const parts = date.split(/[/\-]/);
    if (parts.length === 3) {
      const day = parts[0];
      const month = parts[1];
      const year = parts[2];
      
      // Check if month is text (MMM)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = monthNames.findIndex(m => 
        m.toLowerCase() === month.substring(0, 3).toLowerCase()
      );
      
      if (monthIndex !== -1) {
        dateObj = new Date(year, monthIndex, day);
      } else {
        // Assume numeric month
        dateObj = new Date(date.replace(/(\d{2})[/\-](\d{2})[/\-](\d{4})/, '$3-$2-$1'));
      }
    } else {
      dateObj = new Date(date);
    }
  } else {
    dateObj = new Date(date);
  }
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  return dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).replace(/ /g, '-');
};

// Additional helper function for live validation
export const getValidationStatus = (field, value, additionalData = {}) => {
  switch (field) {
    case 'fullName':
      return validateFullName(value);
    case 'email':
      return validateEmail(value);
    case 'password':
      return validatePassword(value);
    case 'mobile':
      return validateMobile(value, additionalData.countryCode || '+91');
    case 'dob':
      return validateDOB(value);
    case 'profileImage':
      return validateProfileImage(value);
    case 'document':
      return validateDocument(value);
    default:
      return '';
  }
};

// Password copy/paste prevention helper
export const preventPasswordCopyPaste = (e) => {
  e.preventDefault();
  return false;
};