const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Education Schema for different levels
const educationSchema = new mongoose.Schema({
  // 10th/Matriculation
  tenth: {
    board: {
      type: String,
      trim: true
    },
    passingYear: {
      type: Number,
      min: 1950,
      max: new Date().getFullYear() + 1
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100
    },
    marksheetUrl: {
      type: String,
      get: function (v) {
        if (v && !v.startsWith('http')) {
          return `/${v}`;
        }
        return v;
      }
    },
    verified: {
      type: Boolean,
      default: false
    }
  },

  // 12th/Diploma
  twelfth: {
    board: {
      type: String,
      trim: true
    },
    passingYear: {
      type: Number,
      min: 1950,
      max: new Date().getFullYear() + 1
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100
    },
    marksheetUrl: {
      type: String,
      get: function (v) {
        if (v && !v.startsWith('http')) {
          return `/${v}`;
        }
        return v;
      }
    },
    verified: {
      type: Boolean,
      default: false
    }
  },

  // Graduation (Bachelor's Degree)
  graduation: {
    degree: {
      type: String,
      trim: true
    },
    specialization: {
      type: String,
      trim: true,
      default: ''
    },
    passingYear: {
      type: Number,
      min: 1950,
      max: new Date().getFullYear() + 1
    },
    cgpa: {
      type: Number,
      min: 0,
      max: 10
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100
    },
    marksheetUrl: {
      type: String,
      get: function (v) {
        if (v && !v.startsWith('http')) {
          return `/${v}`;
        }
        return v;
      }
    },
    verified: {
      type: Boolean,
      default: false
    }
  },

  // Qualifying Degree (M.Tech or other postgraduate)
  qualifyingDegree: {
    degree: {
      type: String,
      trim: true
    },
    specialization: {
      type: String,
      trim: true,
      default: ''
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100
    },
    marksheetUrl: {
      type: String,
      get: function (v) {
        if (v && !v.startsWith('http')) {
          return `/${v}`;
        }
        return v;
      }
    },
    verified: {
      type: Boolean,
      default: false
    }
  }
}, {
  _id: false,
  toJSON: { getters: true },
  toObject: { getters: true }
});

const userSchema = new mongoose.Schema({
  // ============ PERSONAL DETAILS ============
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [3, 'Full name must be at least 3 characters long'],
    maxlength: [100, 'Full name cannot exceed 100 characters'],
    validate: {
      validator: function (v) {
        return /^[A-Za-z\s.]+$/.test(v);
      },
      message: 'Full name should contain only letters, spaces, and dots'
    }
  },

  fathersName: {
    type: String,
    required: [true, "Father's name is required"],
    trim: true,
    minlength: [3, "Father's name must be at least 3 characters long"],
    maxlength: [100, "Father's name cannot exceed 100 characters"],
    validate: {
      validator: function (v) {
        return /^[A-Za-z\s.]+$/.test(v);
      },
      message: "Father's name should contain only letters, spaces, and dots"
    }
  },

  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: {
      values: ['Male', 'Female', 'Other'],
      message: 'Gender must be either Male, Female, or Other'
    },
    trim: true
  },

  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    validate: {
      validator: function (v) {
        return /^\+?[1-9]\d{1,14}$/.test(v);
      },
      message: 'Please enter a valid mobile number with country code (e.g., +911234567890)'
    }
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },

  dob: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: {
      validator: function (v) {
        return v <= new Date();
      },
      message: 'Date of birth cannot be in the future'
    }
  },

  permanentAddress: {
    type: String,
    required: [true, 'Permanent address is required'],
    trim: true,
    minlength: [10, 'Address must be at least 10 characters long'],
    maxlength: [500, 'Address cannot exceed 500 characters']
  },

  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true
  },

  // ============ EDUCATION QUALIFICATIONS ============
  education: {
    type: educationSchema,
    default: () => ({})
  },

  // ============ RESUME UPLOAD ============
  resumeUrl: {
    type: String,
    get: function (v) {
      if (v && !v.startsWith('http')) {
        return `/${v}`;
      }
      return v;
    }
  },

  // ============ IDENTITY PROOF UPLOAD ============
  identityProofUrl: {
    type: String,
    default: null,
    get: function (v) {
      if (v && !v.startsWith('http')) {
        return `/${v}`;
      }
      return v;
    }
  },

  // ============ AUTHENTICATION ============
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long']
  },

  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  profileImage: {
    type: String,
    default: '',
    get: function (v) {
      if (v && !v.startsWith('http')) {
        return `/${v}`;
      }
      return v;
    }
  },

  // Email verification fields
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationOtp: {
    type: String
  },
  emailVerificationOtpExpires: {
    type: Date
  },
  emailVerificationAttempts: {
    type: Number,
    default: 0
  },
  emailOtpResendAttempts: {
    type: Number,
    default: 0
  },
  lastEmailOtpSent: {
    type: Date
  },

  // Password reset fields
  passwordResetOtp: {
    type: String
  },
  passwordResetOtpExpires: {
    type: Date
  },
  passwordResetAttempts: {
    type: Number,
    default: 0
  },

  // ============ ADMIN FIELDS ============
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'shortlisted', 'eligible'],
    default: 'pending'
  },

  adminNotes: {
    type: String,
    default: ''
  },

  selectedForDegree: {
    type: String,
    default: ''
  },

  advertisement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advertisement',
    default: null
  },

  // ============ TIMESTAMPS ============
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update updatedAt timestamp
userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for age calculation
userSchema.virtual('age').get(function () {
  const today = new Date();
  const birthDate = new Date(this.dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
});

// Calculate overall percentage (average of available percentages)
userSchema.virtual('overallPercentage').get(function () {
  const percentages = [];

  if (this.education?.tenth?.percentage) percentages.push(this.education.tenth.percentage);
  if (this.education?.twelfth?.percentage) percentages.push(this.education.twelfth.percentage);
  if (this.education?.graduation?.percentage) percentages.push(this.education.graduation.percentage);
  if (this.education?.qualifyingDegree?.percentage) percentages.push(this.education.qualifyingDegree.percentage);

  if (percentages.length === 0) return 0;

  const sum = percentages.reduce((a, b) => a + b, 0);
  return (sum / percentages.length).toFixed(2);
});

// Generate OTP
userSchema.methods.generateOtp = function () {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Check if OTP is valid
userSchema.methods.isOtpValid = function (otp, type = 'email') {
  const otpField = type === 'email' ? 'emailVerificationOtp' : 'passwordResetOtp';
  const expiresField = type === 'email' ? 'emailVerificationOtpExpires' : 'passwordResetOtpExpires';

  return this[otpField] === otp && this[expiresField] > new Date();
};

// Reset verification attempts
userSchema.methods.resetVerificationAttempts = function () {
  this.emailVerificationAttempts = 0;
  return this.save();
};

// Static method to find by mobile number
userSchema.statics.findByMobile = function (mobile) {
  return this.findOne({
    mobile: {
      $regex: new RegExp(mobile.replace(/[^\d+]/g, '').replace('+', '\\+?')),
      $options: 'i'
    }
  });
};

// Static method to find by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method for admin filtering
userSchema.statics.filterCandidates = async function (filters = {}) {
  const query = {};

  // Filter by passing year
  if (filters.passingYear) {
    const passingYear = parseInt(filters.passingYear);
    query.$or = [
      { 'education.tenth.passingYear': passingYear },
      { 'education.twelfth.passingYear': passingYear },
      { 'education.graduation.passingYear': passingYear }
    ];

    // Include qualifying degree only if it exists
    if (filters.includeQualifying) {
      query.$or.push({ 'education.qualifyingDegree.passingYear': passingYear });
    }
  }

  // Filter by minimum percentage
  if (filters.minPercentage) {
    const minPercentage = parseFloat(filters.minPercentage);
    query.$or = [
      { 'education.tenth.percentage': { $gte: minPercentage } },
      { 'education.twelfth.percentage': { $gte: minPercentage } },
      { 'education.graduation.percentage': { $gte: minPercentage } }
    ];

    // Include qualifying degree only if it exists
    if (filters.includeQualifying) {
      query.$or.push({ 'education.qualifyingDegree.percentage': { $gte: minPercentage } });
    }
  }

  // Filter by specific degree
  if (filters.degree) {
    query.$or = [
      { 'education.graduation.degree': { $regex: filters.degree, $options: 'i' } },
      { 'education.qualifyingDegree.degree': { $regex: filters.degree, $options: 'i' } }
    ];
  }

  // Filter by status
  if (filters.status) {
    query.status = filters.status;
  }

  // Filter by state
  if (filters.state) {
    query.state = { $regex: filters.state, $options: 'i' };
  }

  return this.find(query).select('-password -__v').sort({ createdAt: -1 });
};

// Get candidates for specific degree
userSchema.statics.getDegreeCandidates = function (degreeType) {
  let query = {};

  switch (degreeType) {
    case 'graduation':
      query = { 'education.graduation': { $exists: true, $ne: null } };
      break;
    case 'qualifying':
      query = { 'education.qualifyingDegree': { $exists: true, $ne: null } };
      break;
    case 'both':
      query = {
        $and: [
          { 'education.graduation': { $exists: true, $ne: null } },
          { 'education.qualifyingDegree': { $exists: true, $ne: null } }
        ]
      };
      break;
    case 'graduation-only':
      query = {
        'education.graduation': { $exists: true, $ne: null },
        'education.qualifyingDegree': { $exists: false }
      };
      break;
    default:
      query = {};
  }

  return this.find(query)
    .select('-password -__v')
    .sort({ createdAt: -1 });
};

const User = mongoose.model('User', userSchema);

module.exports = User;