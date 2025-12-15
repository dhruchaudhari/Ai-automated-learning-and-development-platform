// Enhanced validation utilities with realistic validations
import { toast } from 'react-hot-toast';

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

export const validateMobile = (mobile, countryCode = '+91') => {
  if (!mobile) {
    return 'Mobile number is required';
  }
  
  // Ensure we have country code
  let mobileNumber = mobile;
  if (!mobile.startsWith('+')) {
    mobileNumber = countryCode + mobile.replace(/^\+\d{1,3}/, '');
  }
  
  // Remove any non-digit characters except leading +
  const cleanedNumber = mobileNumber.replace(/[^\d+]/g, '');
  
  // Validate country code format
  const countryCodeRegex = /^\+\d{1,3}$/;
  const code = cleanedNumber.match(/^\+\d{1,3}/)?.[0] || '';
  
  if (!countryCodeRegex.test(code)) {
    return 'Invalid country code format';
  }
  
  // Get just the number part
  const numberPart = cleanedNumber.replace(code, '');
  
  // Check length
  if (numberPart.length === 0) {
    return 'Mobile number is required';
  }
  
  // Check only digits
  if (!/^\d+$/.test(numberPart)) {
    return 'Mobile number can only contain digits';
  }
  
  // Country-specific validations based on real-world requirements
  const countryValidations = {
    '+1': { // USA/Canada
      minLength: 10,
      maxLength: 10,
      pattern: /^[2-9]\d{2}[2-9]\d{6}$/,
      message: 'US/Canada: 10 digits, format: NXX-NXX-XXXX (N=2-9, X=0-9)',
      areaCodes: [
        '201','202','203','205','206','207','208','209','210','212','213','214','215','216','217','218',
        '219','224','225','228','229','231','234','239','240','248','251','252','253','254','256','260',
        '262','267','269','270','272','274','276','279','281','283','301','302','303','304','305','307',
        '308','309','310','312','313','314','315','316','317','318','319','320','321','323','325','326',
        '327','330','331','332','334','336','337','339','340','341','346','347','351','352','360','361',
        '364','380','385','386','401','402','404','405','406','407','408','409','410','412','413','414',
        '415','417','419','423','424','425','430','432','434','435','440','442','443','445','447','448',
        '458','463','469','470','475','478','479','480','484','501','502','503','504','505','507','508',
        '509','510','512','513','515','516','517','518','520','530','531','534','539','540','541','551',
        '557','559','561','562','563','564','567','570','571','573','574','575','580','585','586','601',
        '602','603','605','606','607','608','609','610','612','614','615','616','617','618','619','620',
        '623','626','628','629','630','631','636','640','641','646','650','651','657','659','660','661',
        '662','667','669','670','671','678','679','680','681','682','684','689','701','702','703','704',
        '706','707','708','712','713','714','715','716','717','718','719','720','724','725','726','727',
        '728','730','731','732','734','737','740','743','747','754','757','760','762','763','765','769',
        '770','772','773','774','775','779','781','785','786','787','801','802','803','804','805','806',
        '808','810','812','813','814','815','816','817','818','820','826','828','830','831','832','838',
        '839','840','843','845','847','848','850','854','856','857','858','859','860','862','863','864',
        '865','870','872','878','901','903','904','906','907','908','909','910','912','913','914','915',
        '916','917','918','919','920','925','927','928','929','930','931','934','936','937','938','939',
        '940','941','947','949','951','952','954','956','959','970','971','972','973','975','978','979',
        '980','984','985','986','989'
      ]
    },
    '+44': { // UK
      minLength: 10,
      maxLength: 10,
      pattern: /^7[1-9]\d{8}$/,
      message: 'UK: 10 digits, must start with 7 followed by 1-9',
      areaCodes: [
        '20','23','24','28','29','113','114','115','116','117','118','121','131','141','151','161',
        '191','203','207','208','209','300','303','306','309','330','333','336','339','350','353',
        '356','359','370','373','376','379','380','383','386','389','400','403','406','409','430',
        '433','436','439','450','453','456','459','470','473','476','479','500','503','506','509',
        '530','533','536','539','560','563','566','569','580','583','586','589'
      ]
    },
    '+91': { // India
      minLength: 10,
      maxLength: 10,
      pattern: /^[6-9]\d{9}$/,
      message: 'India: 10 digits, must start with 6, 7, 8, or 9',
      telecomOperators: {
        '6': ['Airtel', 'Vodafone Idea', 'Reliance Jio'],
        '7': ['Airtel', 'Vodafone Idea', 'Reliance Jio', 'BSNL'],
        '8': ['Airtel', 'Vodafone Idea', 'Reliance Jio'],
        '9': ['Airtel', 'Vodafone Idea', 'Reliance Jio', 'BSNL']
      }
    },
    '+61': { // Australia
      minLength: 9,
      maxLength: 9,
      pattern: /^[1-9]\d{8}$/,
      message: 'Australia: 9 digits, cannot start with 0',
      areaCodes: ['2','3','7','8']
    },
    '+49': { // Germany
      minLength: 10,
      maxLength: 11,
      pattern: /^[1-9]\d{9,10}$/,
      message: 'Germany: 10-11 digits, cannot start with 0',
      areaCodes: [
        '30','40','69','89','211','221','231','241','251','261','271','281','291','341','351','361',
        '371','381','391','421','431','441','451','461','471','481','491','511','521','531','541',
        '551','561','571','581','591','611','621','631','641','651','661','671','681','691','711',
        '721','731','741','751','761','771','781','791','800','811','821','831','841','851','861',
        '871','881','891','911','921','931','941','951','961','971','981','991'
      ]
    },
    '+33': { // France
      minLength: 9,
      maxLength: 9,
      pattern: /^[1-9]\d{8}$/,
      message: 'France: 9 digits, cannot start with 0',
      areaCodes: ['1','2','3','4','5']
    },
    '+81': { // Japan
      minLength: 10,
      maxLength: 11,
      pattern: /^[7-9]\d{9,10}$/,
      message: 'Japan: 10-11 digits, must start with 7, 8, or 9',
      areaCodes: ['3','6','11','45','52','75','78','92','98']
    },
    '+86': { // China
      minLength: 11,
      maxLength: 11,
      pattern: /^1[3-9]\d{9}$/,
      message: 'China: 11 digits, must start with 13-19',
      operators: {
        '13': 'China Mobile',
        '14': 'China Unicom',
        '15': 'China Telecom',
        '16': 'China Unicom',
        '17': 'China Telecom',
        '18': 'China Mobile',
        '19': 'China Unicom'
      }
    }
  };
  
  const validation = countryValidations[code];
  
  if (!validation) {
    // Generic validation for other countries
    if (numberPart.length < 7 || numberPart.length > 15) {
      return 'Mobile number must be between 7-15 digits';
    }
    if (!/^[1-9]\d+$/.test(numberPart)) {
      return 'Mobile number cannot start with 0';
    }
  } else {
    // Country-specific validation
    if (numberPart.length < validation.minLength || numberPart.length > validation.maxLength) {
      return `Mobile number must be ${validation.minLength} digits for ${code}`;
    }
    
    if (validation.pattern && !validation.pattern.test(numberPart)) {
      return validation.message;
    }
    
    // Additional country-specific validations
    if (code === '+1' && validation.areaCodes) {
      const areaCode = numberPart.substring(0, 3);
      if (!validation.areaCodes.includes(areaCode)) {
        return 'Invalid area code for US/Canada';
      }
    }
    
    if (code === '+44' && validation.areaCodes) {
      const areaCode = numberPart.substring(0, 2);
      if (!validation.areaCodes.includes(areaCode) && 
          !validation.areaCodes.includes(numberPart.substring(0, 3)) &&
          !validation.areaCodes.includes(numberPart.substring(0, 4))) {
        return 'Invalid area code for UK';
      }
    }
    
    if (code === '+86' && validation.operators) {
      const prefix = numberPart.substring(0, 2);
      if (!validation.operators.hasOwnProperty(prefix)) {
        return 'Invalid mobile operator prefix for China';
      }
    }
  }
  
  // Check for unrealistic patterns
  if (/^(\d)\1{5,}$/.test(numberPart)) {
    return 'Invalid mobile number pattern (too many repeated digits)';
  }
  
  // Check for sequential numbers
  const sequentialPatterns = [
    '0123456789', '1234567890', '9876543210', '0987654321',
    '123456789', '234567890', '345678901', '456789012',
    '567890123', '678901234', '789012345', '890123456',
    '901234567'
  ];
  
  if (sequentialPatterns.some(pattern => numberPart.includes(pattern))) {
    return 'Invalid mobile number pattern (sequential digits)';
  }
  
  return '';
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