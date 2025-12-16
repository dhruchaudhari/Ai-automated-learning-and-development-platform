import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword, preventPasswordCopyPaste } from '../utils/validations';
import { toast } from 'react-hot-toast';
import { FaEye, FaEyeSlash, FaUser, FaLock, FaEnvelope, FaCheck, FaTimes, FaInfoCircle } from 'react-icons/fa';

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
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldTouched, setFieldTouched] = useState({
    email: false,
    password: false,
  });
  const [passwordStrength, setPasswordStrength] = useState(0);

  const validateField = useCallback(async (name, value) => {
    switch (name) {
      case 'email':
        return validateEmail(value);
      case 'password':
        const error = validatePassword(value, false); // false for login (no strict validation needed)
        calculatePasswordStrength(value);
        return error;
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
          newErrors[field] = await validateField(field, value);
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
  }, [debouncedFormData, fieldTouched, validateField]);

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
    if (/(.)\1{3,}/.test(password)) strength = Math.max(0, strength - 20);
    
    setPasswordStrength(Math.min(100, strength));
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return 'bg-red-500';
    if (passwordStrength < 70) return 'bg-yellow-500';
    if (passwordStrength < 90) return 'bg-blue-500';
    return 'bg-green-500';
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
    
    if (name === 'email') {
      newValue = value.toLowerCase();
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const isFieldValid = (fieldName) => {
    return fieldTouched[fieldName] && formData[fieldName] && !errors[fieldName];
  };

  const isFieldInvalid = (fieldName) => {
    return fieldTouched[fieldName] && errors[fieldName];
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched for validation
    const allTouched = Object.keys(fieldTouched).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setFieldTouched(allTouched);
    
    // Validate all fields
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
    
    console.log('=== LOGIN DEBUG START ===');
    console.log('1. Before login - localStorage:', {
      token: localStorage.getItem('token'),
      user: localStorage.getItem('user')
    });
    
    const result = await login(formData.email, formData.password);
    
    console.log('2. Login result:', result);
    console.log('3. After login - localStorage:', {
      token: localStorage.getItem('token'),
      user: localStorage.getItem('user')
    });
    console.log('=== LOGIN DEBUG END ===');
    
    if (result && result.success) {
      // Wait a moment to ensure token is saved
      setTimeout(() => {
        navigate('/grid');
      }, 300);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-md">
        {/* Animated Background Card */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-3xl transform rotate-3 opacity-20"></div>
        
        <div className="relative card backdrop-blur-xl shadow-2xl">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
           {/* Email Input */}
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
      onBlur={() => handleBlur('email')}
      onKeyDown={(e) => {
        // Prevent space key in email
        if (e.key === ' ') {
          e.preventDefault();
          toast.error('Email cannot contain spaces');
        }
      }}
      className={`form-input pl-12 ${isFieldInvalid('email') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('email') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'}`}
      placeholder="vatsalraj@example.com"
      disabled={loading}
      maxLength={254} // Standard RFC 5321 limit for email
      minLength={6} // Minimum reasonable email: a@b.co
      pattern="^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$"
      autoComplete="email"
    />
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <FaUser className="text-gray-400" />
    </div>
    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
      {isFieldValid('email') && <FaCheck className="text-green-600" />}
      {isFieldInvalid('email') && <FaTimes className="text-red-600" />}
    </div>
  </div>
  {errors.email && (
    <p className="mt-2 text-sm text-red-600 animate-slide-up flex items-center">
      <FaTimes className="mr-1" /> {errors.email}
    </p>
  )}
  {isFieldValid('email') && (
    <p className="mt-2 text-sm text-green-600 animate-slide-up flex items-center">
      <FaCheck className="mr-1" /> Valid email address
    </p>
  )}
  <p className="text-xs text-gray-500 mt-1">
    Format: user@domain.com (max 254 characters, no spaces)
  </p>
</div>

            {/* Password Input */}
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
                  onPaste={handlePasswordPaste}
                  onCut={handlePasswordCut}
                  className={`form-input pl-12 pr-12 ${isFieldInvalid('password') ? 'border-red-500 focus:ring-red-500 focus:ring-opacity-50' : isFieldValid('password') ? 'border-green-500 focus:ring-green-500 focus:ring-opacity-50' : 'border-gray-300'}`}
                  placeholder="Enter your password"
                  disabled={loading}
                  maxLength={128}
                  autoComplete="current-password"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <div className="absolute inset-y-0 right-10 flex items-center">
                  {isFieldValid('password') && <FaCheck className="text-green-600" />}
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
              
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Password Strength:</span>
                    <span className="text-xs font-medium">
                      {passwordStrength < 40 ? 'Weak' : 
                       passwordStrength < 70 ? 'Fair' : 
                       passwordStrength < 90 ? 'Good' : 'Strong'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                      style={{ width: `${passwordStrength}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 animate-slide-up flex items-center">
                  <FaTimes className="mr-1" /> {errors.password}
                </p>
              )}
              {isFieldValid('password') && (
                <p className="mt-2 text-sm text-green-600 animate-slide-up flex items-center">
                  <FaCheck className="mr-1" /> Valid password
                </p>
              )}
            </div>

            {/* Password Requirements Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <FaInfoCircle className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800 mb-1">Password Requirements</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li className={`flex items-center ${formData.password?.length >= 8 ? 'text-green-600' : ''}`}>
                      {formData.password?.length >= 8 ? <FaCheck className="mr-1" /> : <span className="mr-1">•</span>}
                      Minimum 8 characters
                    </li>
                    <li className={`flex items-center ${/[a-z]/.test(formData.password) ? 'text-green-600' : ''}`}>
                      {/[a-z]/.test(formData.password) ? <FaCheck className="mr-1" /> : <span className="mr-1">•</span>}
                      At least one lowercase letter
                    </li>
                    <li className={`flex items-center ${/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}`}>
                      {/[A-Z]/.test(formData.password) ? <FaCheck className="mr-1" /> : <span className="mr-1">•</span>}
                      At least one uppercase letter
                    </li>
                    <li className={`flex items-center ${/\d/.test(formData.password) ? 'text-green-600' : ''}`}>
                      {/\d/.test(formData.password) ? <FaCheck className="mr-1" /> : <span className="mr-1">•</span>}
                      At least one number
                    </li>
                    <li className={`flex items-center ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-green-600' : ''}`}>
                      {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? <FaCheck className="mr-1" /> : <span className="mr-1">•</span>}
                      At least one special character
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || Object.keys(errors).length > 0 || !formData.email || !formData.password}
              className={`btn-primary w-full py-4 text-lg ${Object.keys(errors).length > 0 || !formData.email || !formData.password ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="spinner mr-3"></div>
                  Signing In...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
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

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our Terms and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;