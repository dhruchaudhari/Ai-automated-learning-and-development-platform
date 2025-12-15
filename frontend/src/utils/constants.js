export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REGISTER: '/users/register',
  USERS: '/users/all',
  PROFILE: '/users/profile',
  HEALTH: '/health',
};

export const APP_CONSTANTS = {
  APP_NAME: import.meta.env.VITE_APP_NAME || 'MERN Registration App',
  MAX_IMAGE_SIZE: 1 * 1024 * 1024, // 1MB
  MAX_DOC_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg'],
  ALLOWED_DOC_TYPES: ['application/pdf'],
};

export const MOBILE_COUNTRIES = [
  { code: '+1', name: 'USA', flag: '🇺🇸' },
  { code: '+44', name: 'UK', flag: '🇬🇧' },
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
];

export const DATE_FORMAT = {
  DISPLAY: 'dd-MMM-yyyy',
  API: 'yyyy-MM-dd',
  INPUT: 'yyyy-MM-dd',
};