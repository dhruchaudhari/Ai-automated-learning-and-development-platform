// Enhanced validation utilities with realistic validations
import { toast } from 'react-hot-toast';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export const validateFullName = (name) => {
  if (!name || name.trim().length === 0) {
    return 'Full name is required';
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 3) {
    return 'Full name must be at least 3 characters long';
  }
  
  if (trimmedName.length > 100) {
    return 'Full name is too long (max 100 characters)';
  }
  
  // Allow letters, spaces, hyphens, and apostrophes
  if (!/^[A-Za-z\s\-\']+$/.test(trimmedName)) {
    return 'Full name can only contain letters, spaces, hyphens, and apostrophes';
  }
  
  // Must contain at least one space
  if (!trimmedName.includes(' ')) {
    return 'Please enter your full name (first and last name)';
  }
  
  // Check for minimum 2 words
  const words = trimmedName.split(/\s+/).filter(word => word.length > 0);
  if (words.length < 2) {
    return 'Please enter both first and last name';
  }
  
  // Check if each word starts with capital letter
  for (const word of words) {
    if (!/^[A-Z][a-z]*$/.test(word)) {
      return 'Each name should start with a capital letter';
    }
  }
  
  return '';
};

// Helper function to format name (capitalize first letter of each word)
export const formatName = (name) => {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
};

export const validateEmail = (email) => {
  if (!email || email.trim().length === 0) {
    return 'Email address is required';
  }
  
  const trimmedEmail = email.trim();
  
  // Check for spaces
  if (trimmedEmail.includes(' ')) {
    return 'Email cannot contain spaces';
  }
  
  // Length limits
  if (trimmedEmail.length > 254) {
    return 'Email is too long (max 254 characters)';
  }
  
  // Basic structure check
  const emailParts = trimmedEmail.split('@');
  if (emailParts.length !== 2) {
    return 'Invalid email format (must contain one @ symbol)';
  }
  
  const [localPart, domainPart] = emailParts;
  
  // Validate local part
  if (localPart.length === 0) {
    return 'Email username is required';
  }
  
  if (localPart.length > 64) {
    return 'Email username is too long (max 64 characters)';
  }
  
  // Local part validation
  if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(localPart)) {
    return 'Email username contains invalid characters';
  }
  
  // No consecutive dots
  if (localPart.includes('..')) {
    return 'Email cannot contain consecutive dots';
  }
  
  // Cannot start or end with dot
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return 'Email username cannot start or end with a dot';
  }
  
  // Validate domain part
  if (domainPart.length === 0) {
    return 'Email domain is required';
  }
  
  // Domain must have at least one dot
  if (!domainPart.includes('.')) {
    return 'Email domain must contain a dot (e.g., gmail.com)';
  }
  
  // Domain format validation
  const domainRegex = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63}(?<!-))*\.[A-Za-z]{2,}$/;
  if (!domainRegex.test(domainPart)) {
    return 'Invalid email domain format';
  }
  
  // Domain cannot have consecutive dots
  if (domainPart.includes('..')) {
    return 'Email domain cannot contain consecutive dots';
  }
  
  // Check TLDs
  const tld = domainPart.split('.').pop().toLowerCase();
  const commonTLDs = [
    'com', 'org', 'net', 'edu', 'gov', 'mil', 
    'io', 'co', 'ai', 'dev', 'app', 'tech',
    'info', 'biz', 'me', 'us', 'uk', 'ca',
    'au', 'in', 'jp', 'cn', 'de', 'fr', 'es',
    'it', 'nl', 'ru', 'br', 'mx', 'za'
  ];
  
  const countryCodeRegex = /^[a-z]{2}$/;
  
  if (!commonTLDs.includes(tld) && !countryCodeRegex.test(tld)) {
    return 'Email domain extension is not valid';
  }
  
  return '';
};

// Helper function to format email (lowercase)
export const formatEmail = (email) => {
  if (!email) return '';
  return email.toLowerCase().trim();
};

export const validatePassword = (password, isRegistration = true) => {
  if (!password) {
    return 'Password is required';
  }
  
  // Minimum length
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  
  // Maximum length
  if (password.length > 128) {
    return 'Password is too long (max 128 characters)';
  }
  
  // Check for spaces
  if (/\s/.test(password)) {
    return 'Password cannot contain spaces';
  }
  
  // Check for repeated characters
  if (/(.)\1{4,}/.test(password)) {
    return 'Password contains too many repeated characters';
  }
  
  // Check for sequential characters
  if (/123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)) {
    return 'Password contains easily guessable sequences';
  }
  
  // Check for keyboard patterns
  const keyboardPatterns = [
    'qwerty', 'asdfgh', 'zxcvbn', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
    '1qaz', '2wsx', '3edc', '4rfv', '5tgb', '6yhn', '7ujm', '8ik,', '9ol.',
    '0p;/'
  ];
  
  const lowerPassword = password.toLowerCase();
  if (keyboardPatterns.some(pattern => lowerPassword.includes(pattern))) {
    return 'Password contains easily guessable keyboard patterns';
  }
  
  // Common weak passwords
  const weakPasswords = [
    'password', '12345678', 'qwertyui', 'admin123', 'letmein',
    'welcome1', 'monkey123', 'password1', '123456789', 'football',
    'iloveyou', 'adminadmin', 'superman', 'trustno1', 'sunshine',
    'master', 'hello123', 'charlie', 'donald', 'mustang', 'shadow',
    'michael', 'ninja', 'bailey', 'lovely', 'solo', 'starwars'
  ];
  
  if (isRegistration && weakPasswords.includes(lowerPassword)) {
    return 'This password is too common. Please choose a stronger password';
  }
  
  // Check strength requirements
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  if (!hasLowercase) {
    return 'Password must contain at least one lowercase letter';
  }
  
  if (!hasUppercase) {
    return 'Password must contain at least one uppercase letter';
  }
  
  if (!hasNumbers) {
    return 'Password must contain at least one number';
  }
  
  if (!hasSpecialChars) {
    return 'Password must contain at least one special character (!@#$%^&* etc.)';
  }
  
  return '';
};

// Helper to map dial codes to ISO country codes
const getIsoCountryCodeFromDialCode = (dialCode) => {
  const dialCodeToCountry = {
    '+1': 'US',
    '+44': 'GB',
    '+91': 'IN',
    '+61': 'AU',
    '+49': 'DE',
    '+33': 'FR',
    '+81': 'JP',
    '+86': 'CN',
  };
  return dialCodeToCountry[dialCode] || null;
};

// Helper to get country name for error messages
const getCountryNameFromCode = (isoCode) => {
  const countryNames = {
    'US': 'United States/Canada',
    'GB': 'United Kingdom',
    'IN': 'India',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'JP': 'Japan',
    'CN': 'China',
  };
  return countryNames[isoCode] || isoCode;
};

export const validateMobile = (mobile, countryCode = '+91') => {
  if (!mobile) {
    return 'Mobile number is required';
  }
  
  // Clean the input - remove all non-digit characters except plus
  let mobileNumber = mobile.replace(/[^\d+]/g, '');
  
  // If user typed with country code, extract just the national number
  if (mobileNumber.startsWith('+')) {
    // Remove country code for parsing
    const dialCodeMatch = mobileNumber.match(/^\+\d{1,3}/);
    if (dialCodeMatch) {
      mobileNumber = mobileNumber.substring(dialCodeMatch[0].length);
    }
  }
  
  // If no digits left after cleaning, return error
  if (!mobileNumber || mobileNumber.length === 0) {
    return 'Please enter a valid phone number';
  }
  
  // Construct full international number for validation
  const fullNumber = countryCode + mobileNumber;
  
  try {
    // Parse the phone number using libphonenumber-js
    const phoneNumber = parsePhoneNumberFromString(fullNumber);
    
    if (!phoneNumber) {
      return 'Invalid phone number format';
    }
    
    // Check if the number is valid
    if (!phoneNumber.isValid()) {
      const expectedCountry = getIsoCountryCodeFromDialCode(countryCode);
      const countryName = expectedCountry ? getCountryNameFromCode(expectedCountry) : 'selected country';
      return `Invalid ${countryName} phone number`;
    }
    
    // Verify the number belongs to the selected country
    const expectedCountry = getIsoCountryCodeFromDialCode(countryCode);
    if (expectedCountry && phoneNumber.country && phoneNumber.country !== expectedCountry) {
      const selectedCountryName = getCountryNameFromCode(expectedCountry);
      const detectedCountryName = getCountryNameFromCode(phoneNumber.country);
      return `This number belongs to ${detectedCountryName}, not ${selectedCountryName}. Please select the correct country code.`;
    }
    
    // Additional validation for specific countries
    const numberStr = phoneNumber.nationalNumber.toString();
    
    // US/Canada validation (NXX-NXX-XXXX where N=2-9)
    if (countryCode === '+1') {
      if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(numberStr)) {
        return 'Invalid US/Canada number format. Must follow NXX-NXX-XXXX (N=2-9)';
      }
    }
    
    // UK validation (starts with 7)
    if (countryCode === '+44') {
      if (!/^7[1-9]\d{8}$/.test(numberStr)) {
        return 'Invalid UK number. Must start with 7 followed by 1-9';
      }
    }
    
    // India validation (starts with 6-9)
    if (countryCode === '+91') {
      if (!/^[6-9]\d{9}$/.test(numberStr)) {
        return 'Invalid India number. Must start with 6, 7, 8, or 9';
      }
    }
    
    // China validation (11 digits, starts with 1[3-9])
    if (countryCode === '+86') {
      if (!/^1[3-9]\d{9}$/.test(numberStr)) {
        return 'Invalid China number. Must be 11 digits starting with 13-19';
      }
    }
    
    // Japan validation (starts with 7-9)
    if (countryCode === '+81') {
      if (!/^[7-9]\d{8,9}$/.test(numberStr)) {
        return 'Invalid Japan number. Must start with 7, 8, or 9';
      }
    }
    
    return ''; // Validation passed
    
  } catch (error) {
    console.error('Phone validation error:', error);
    const expectedCountry = getIsoCountryCodeFromDialCode(countryCode);
    const countryName = expectedCountry ? getCountryNameFromCode(expectedCountry) : 'selected country';
    return `Invalid ${countryName} phone number format`;
  }
};

// Helper function to format mobile number
export const formatMobile = (mobile, countryCode = '+91') => {
  if (!mobile) return '';
  
  const digitsOnly = mobile.replace(/\D/g, '');
  
  if (countryCode === '+1') {
    // US/Canada format: (XXX) XXX-XXXX
    if (digitsOnly.length <= 3) return digitsOnly;
    if (digitsOnly.length <= 6) return `(${digitsOnly.slice(0,3)}) ${digitsOnly.slice(3)}`;
    return `(${digitsOnly.slice(0,3)}) ${digitsOnly.slice(3,6)}-${digitsOnly.slice(6,10)}`;
  } else if (countryCode === '+44') {
    // UK format: XXXXX XXXXXX
    if (digitsOnly.length <= 5) return digitsOnly;
    if (digitsOnly.length <= 8) return `${digitsOnly.slice(0,5)} ${digitsOnly.slice(5)}`;
    return `${digitsOnly.slice(0,5)} ${digitsOnly.slice(5,8)} ${digitsOnly.slice(8,10)}`;
  } else if (countryCode === '+91') {
    // India format: XXXXX-XXXXX
    if (digitsOnly.length <= 5) return digitsOnly;
    return `${digitsOnly.slice(0,5)}-${digitsOnly.slice(5,10)}`;
  } else {
    return digitsOnly;
  }
};

export const validateDOB = (date) => {
  if (!date) {
    return 'Date of birth is required';
  }
  
  let inputDate;
  let day, month, year;
  
  // Handle string input (manual typing)
  if (typeof date === 'string') {
    const trimmedDate = date.trim();
    
    // Accept formats: dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy, dd/mmm/yyyy, dd-mmm-yyyy
    const dobRegex = /^(0[1-9]|[12][0-9]|3[01])[/\-\.](0[1-9]|1[0-2]|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[/\-\.](\d{4})$/i;
    
    if (!dobRegex.test(trimmedDate)) {
      return 'Invalid format. Use: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY or DD/MMM/YYYY, DD-MMM-YYYY';
    }
    
    // Parse the date
    const parts = trimmedDate.split(/[/\-\.]/);
    day = parseInt(parts[0], 10);
    
    // Handle month (could be number or text)
    const monthStr = parts[1].toLowerCase();
    const monthNames = {
      'jan': 0, 'january': 0,
      'feb': 1, 'february': 1,
      'mar': 2, 'march': 2,
      'apr': 3, 'april': 3,
      'may': 4,
      'jun': 5, 'june': 5,
      'jul': 6, 'july': 6,
      'aug': 7, 'august': 7,
      'sep': 8, 'september': 8,
      'oct': 9, 'october': 9,
      'nov': 10, 'november': 10,
      'dec': 11, 'december': 11
    };
    
    if (monthNames.hasOwnProperty(monthStr)) {
      month = monthNames[monthStr];
    } else if (!isNaN(monthStr)) {
      month = parseInt(monthStr, 10) - 1;
    } else {
      return 'Invalid month';
    }
    
    year = parseInt(parts[2], 10);
    
    inputDate = new Date(year, month, day);
    
  } else if (date instanceof Date) {
    inputDate = new Date(date);
    day = inputDate.getDate();
    month = inputDate.getMonth();
    year = inputDate.getFullYear();
  } else {
    return 'Invalid date format';
  }
  
  // Check if date is valid
  if (isNaN(inputDate.getTime())) {
    return 'Invalid date';
  }
  
  // Check if parsed components match input
  if (inputDate.getDate() !== day || inputDate.getMonth() !== month || inputDate.getFullYear() !== year) {
    return 'Invalid date (date overflow)';
  }
  
  // Check realistic year range
  const currentYear = new Date().getFullYear();
  if (year < 1900) {
    return 'Year must be 1900 or later';
  }
  
  if (year > currentYear) {
    return `Year cannot be in the future (max ${currentYear})`;
  }
  
  // Check if month is valid
  if (month < 0 || month > 11) {
    return 'Invalid month (must be 1-12 or Jan-Dec)';
  }
  
  // Check if day is valid for the month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long' });
    return `Invalid day for ${monthName} (valid: 1-${daysInMonth})`;
  }
  
  // Check for leap year (February 29)
  if (month === 1 && day === 29) {
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    if (!isLeapYear) {
      return `${year} is not a leap year. February 29 is invalid.`;
    }
  }
  
  // Check if date is not in future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
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
  
  // Check maximum age (reasonable upper limit, e.g., 120 years)
  const maxAge = 120;
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - maxAge);
  maxDate.setHours(0, 0, 0, 0);
  
  if (inputDate < maxDate) {
    return `Age must be less than ${maxAge} years`;
  }
  
  return '';
};

export const parseDateInput = (input) => {
  if (!input || typeof input !== 'string') return null;
  
  const trimmed = input.trim();
  
  // Try to parse the date
  const parts = trimmed.split(/[/\-\.]/);
  if (parts.length !== 3) return null;
  
  let day = parseInt(parts[0], 10);
  let month;
  const year = parseInt(parts[2], 10);
  
  // Check if month is text
  const monthStr = parts[1].toLowerCase();
  const monthNames = {
    'jan': 0, 'january': 0,
    'feb': 1, 'february': 1,
    'mar': 2, 'march': 2,
    'apr': 3, 'april': 3,
    'may': 4,
    'jun': 5, 'june': 5,
    'jul': 6, 'july': 6,
    'aug': 7, 'august': 7,
    'sep': 8, 'september': 8,
    'oct': 9, 'october': 9,
    'nov': 10, 'november': 10,
    'dec': 11, 'december': 11
  };
  
  if (monthNames.hasOwnProperty(monthStr)) {
    month = monthNames[monthStr];
  } else if (!isNaN(monthStr)) {
    month = parseInt(monthStr, 10) - 1;
  } else {
    return null;
  }
  
  // Validate date
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (month < 0 || month > 11) return null;
  
  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return null;
  
  // Check if date is valid (e.g., not Feb 30)
  if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
    return null;
  }
  
  return date;
};

// Helper function to format date
export const formatDate = (date) => {
  if (!date) return '';
  
  let dateObj;
  
  if (typeof date === 'string') {
    const parts = date.split(/[/\-\.]/);
    if (parts.length === 3) {
      const day = parts[0];
      const month = parts[1];
      const year = parts[2];
      
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthNamesFull = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      let monthIndex = -1;
      
      for (let i = 0; i < monthNames.length; i++) {
        if (month.toLowerCase() === monthNames[i].toLowerCase() || 
            month.toLowerCase() === monthNamesFull[i].toLowerCase()) {
          monthIndex = i;
          break;
        }
      }
      
      if (monthIndex !== -1) {
        dateObj = new Date(year, monthIndex, day);
      } else if (!isNaN(month)) {
        dateObj = new Date(year, parseInt(month, 10) - 1, day);
      } else {
        dateObj = new Date(date);
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

// Alternative format for date
export const formatDateToDisplay = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}/${month}/${year}`;
};

export const validateProfileImage = (file) => {
  if (!file) {
    return 'Profile image is required';
  }
  
  if (typeof file === 'string' && file.startsWith('http')) {
    return '';
  }
  
  if (!(file instanceof File)) {
    return 'Invalid file format';
  }
  
  const allowedTypes = ['image/jpeg', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    return 'Only JPEG/JPG images are allowed (.jpg, .jpeg)';
  }
  
  const fileName = file.name.toLowerCase();
  const validExtensions = ['.jpg', '.jpeg'];
  const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    return 'File must have .jpg or .jpeg extension';
  }
  
  const maxSize = 1 * 1024 * 1024;
  if (file.size > maxSize) {
    return 'Image size must be less than 1MB';
  }
  
  if (file.size === 0) {
    return 'Image file is empty';
  }
  
  return '';
};

export const validateDocument = (file) => {
  if (!file) {
    return 'Document is required';
  }
  
  if (typeof file === 'string' && file.startsWith('http')) {
    return '';
  }
  
  if (!(file instanceof File)) {
    return 'Invalid file format';
  }
  
  if (file.type !== 'application/pdf') {
    return 'Only PDF documents are allowed (.pdf)';
  }
  
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith('.pdf')) {
    return 'File must have .pdf extension';
  }
  
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return 'Document size must be less than 5MB';
  }
  
  if (file.size === 0) {
    return 'PDF file is empty';
  }
  
  if (file.size < 100) {
    return 'Invalid PDF file (too small)';
  }
  
  return '';
};

export const validateForm = (formData) => {
  const errors = {};
  
  errors.fullName = validateFullName(formData.fullName);
  errors.email = validateEmail(formData.email);
  errors.password = validatePassword(formData.password, true);
  errors.mobile = validateMobile(formData.mobile);
  errors.dob = validateDOB(formData.dob);
  errors.profileImage = validateProfileImage(formData.profileImage);
  errors.document = validateDocument(formData.document);
  
  return errors;
};

export const validateEditForm = (formData, existingInfo = {}) => {
  const errors = {};
  
  errors.fullName = validateFullName(formData.fullName);
  errors.email = validateEmail(formData.email);
  errors.mobile = validateMobile(formData.mobile);
  errors.dob = validateDOB(formData.dob);
  
  const hasExistingProfileImage = existingInfo.hasExistingProfileImage || 
    (existingInfo.profileImage && typeof existingInfo.profileImage === 'string' && existingInfo.profileImage.startsWith('http'));
  
  const hasExistingDocument = existingInfo.hasExistingDocument || 
    (existingInfo.document && typeof existingInfo.document === 'string' && existingInfo.document.startsWith('http'));
  
  if (!hasExistingProfileImage && !formData.profileImage) {
    errors.profileImage = 'Profile image is required';
  } else if (formData.profileImage) {
    if (typeof formData.profileImage === 'string' && formData.profileImage.startsWith('http')) {
      errors.profileImage = '';
    } else if (typeof formData.profileImage === 'object') {
      errors.profileImage = validateProfileImage(formData.profileImage);
    }
  }
  
  if (!hasExistingDocument && !formData.document) {
    errors.document = 'Document is required';
  } else if (formData.document) {
    if (typeof formData.document === 'string' && formData.document.startsWith('http')) {
      errors.document = '';
    } else if (typeof formData.document === 'object') {
      errors.document = validateDocument(formData.document);
    }
  }
  
  return errors;
};

export const getValidationStatus = (field, value, additionalData = {}) => {
  switch (field) {
    case 'fullName':
      return validateFullName(value);
    case 'email':
      return validateEmail(value);
    case 'password':
      return validatePassword(value, true);
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

export const preventPasswordCopyPaste = (e) => {
  e.preventDefault();
  toast.error('Copying/pasting password is not allowed for security reasons');
  return false;
};

// Helper to mask email for display
export const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email || '';
  
  const [name, domain] = email.split('@');
  const maskedName = name.length > 2 
    ? name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1)
    : '*'.repeat(name.length);
  return `${maskedName}@${domain}`;
};

// Helper to mask mobile for display
export const maskMobile = (mobile) => {
  if (!mobile) return '';
  
  const digitsOnly = mobile.replace(/\D/g, '');
  if (digitsOnly.length <= 6) return '***' + digitsOnly.slice(-3);
  return digitsOnly.slice(0, 3) + '****' + digitsOnly.slice(-3);
};

// Helper to calculate age from date of birth
export const calculateAge = (dob) => {
  if (!dob) return 0;
  
  const birthDate = new Date(dob);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Helper to check if password is strong
export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: 'Empty', color: 'gray' };
  
  let score = 0;
  
  // Length
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  
  // Character types
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/\d/.test(password)) score += 15;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;
  
  // Bonus for combinations
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 5;
  if (/\d/.test(password) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 5;
  
  // Penalties for weak patterns
  if (/password|123456|qwerty/i.test(password)) score = Math.max(0, score - 30);
  if (/(.)\1{4,}/.test(password)) score = Math.max(0, score - 20);
  
  score = Math.min(100, Math.max(0, score));
  
  let label, color;
  if (score < 40) {
    label = 'Weak';
    color = 'red';
  } else if (score < 70) {
    label = 'Fair';
    color = 'yellow';
  } else if (score < 90) {
    label = 'Good';
    color = 'blue';
  } else {
    label = 'Strong';
    color = 'green';
  }
  
  return { score, label, color };
};

// In your validations.js file, add this function:
export const validatePasswordRequirements = (password) => {
  if (!password) {
    return {
      minLength: false,
      hasUpperCase: false,
      hasLowerCase: false,
      hasNumber: false,
      hasSpecialChar: false,
      noCommonPatterns: false,
      noRepeatingChars: false
    };
  }

  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    noCommonPatterns: !/password|123456|qwerty|abc123|letmein|welcome|admin|iloveyou|monkey|sunshine/i.test(password),
    noRepeatingChars: !/(.)\1{4,}/.test(password) // No character repeated 5+ times
  };

  return requirements;
};

// Export all functions
export default {
  validateFullName,
  formatName,
  validateEmail,
  formatEmail,
  validatePassword,
  validateMobile,
  formatMobile,
  validateDOB,
  parseDateInput,
  formatDate,
  formatDateToDisplay,
  validateProfileImage,
  validateDocument,
  validateForm,
  validateEditForm,
  getValidationStatus,
  preventPasswordCopyPaste,
  maskEmail,
  maskMobile,
  calculateAge,
  getPasswordStrength
};