const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        minlength: [3, 'Full name must be at least 3 characters long'],
        maxlength: [100, 'Full name cannot exceed 100 characters'],
        validate: {
            validator: function(v) {
                return /^[A-Za-z\s]+$/.test(v);
            },
            message: 'Full name should contain only letters and spaces'
        }
    },
    dob: {
        type: Date,
        required: [true, 'Date of birth is required'],
        validate: {
            validator: function(v) {
                return v <= new Date();
            },
            message: 'Date of birth cannot be in the future'
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
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Please enter a valid email address'
        }
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long']
    },
    mobile: {
        type: String,
        required: [true, 'Mobile number is required'],
        unique: false,
        validate: {
            validator: function(v) {
                return /^\+\d{1,3}\d{10}$/.test(v);
            },
            message: 'Please enter a valid mobile number with country code (e.g., +911234567890)'
        }
    },
    profileImage: {
        type: String,
        default: '',
        get: function(v) {
            if (v && !v.startsWith('http')) {
                return `${process.env.BASE_URL || 'http://localhost:5000'}/${v}`;
            }
            return v;
        }
    },
    document: {
        type: String,
        default: '',
        get: function(v) {
            if (v && !v.startsWith('http')) {
                return `${process.env.BASE_URL || 'http://localhost:5000'}/${v}`;
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
userSchema.pre('save', async function(next) {
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
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for age calculation
userSchema.virtual('age').get(function() {
    const today = new Date();
    const birthDate = new Date(this.dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
});

// Generate OTP
userSchema.methods.generateOtp = function() {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Check if OTP is valid
userSchema.methods.isOtpValid = function(otp, type = 'email') {
    const otpField = type === 'email' ? 'emailVerificationOtp' : 'passwordResetOtp';
    const expiresField = type === 'email' ? 'emailVerificationOtpExpires' : 'passwordResetOtpExpires';
    
    return this[otpField] === otp && this[expiresField] > new Date();
};

// Reset verification attempts
userSchema.methods.resetVerificationAttempts = function() {
    this.emailVerificationAttempts = 0;
    return this.save();
};

// Static method to find by mobile number
userSchema.statics.findByMobile = function(mobile) {
    return this.findOne({ 
        mobile: { 
            $regex: new RegExp(mobile.replace(/[^\d+]/g, '').replace('+', '\\+?')),
            $options: 'i'
        }
    });
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model('User', userSchema);

module.exports = User;