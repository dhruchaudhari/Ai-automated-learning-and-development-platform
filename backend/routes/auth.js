// const express = require('express');
// const router = express.Router();
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// // @route   POST /api/auth/login
// // @desc    Authenticate user & get token
// // @access  Public
// router.post('/login', async (req, res) => {
//     try {
//         console.log('=== LOGIN ATTEMPT ===');
//         console.log('Email:', req.body.email);
//         console.log('Has password:', !!req.body.password);

//         const { email, password } = req.body;

//         // Validate email format
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if (!email || !emailRegex.test(email)) {
//             console.log('Invalid email format');
//             return res.status(400).json({ 
//                 success: false, 
//                 message: 'Please provide a valid email address' 
//             });
//         }

//         // Validate password
//         if (!password || password.length < 4) {
//             console.log('Password too short');
//             return res.status(400).json({ 
//                 success: false, 
//                 message: 'Password must be at least 4 characters long' 
//             });
//         }

//         // Check if user exists
//         const user = await User.findOne({ email: email.toLowerCase() });
//         if (!user) {
//             console.log('User not found with email:', email);
//             return res.status(401).json({ 
//                 success: false, 
//                 message: 'Invalid credentials' 
//             });
//         }

//         console.log('User found:', user.email);

//         // Verify password
//         const isPasswordValid = await user.comparePassword(password);
//         if (!isPasswordValid) {
//             console.log('Invalid password for user:', user.email);
//             return res.status(401).json({ 
//                 success: false, 
//                 message: 'Invalid credentials' 
//             });
//         }

//         console.log('Password verified successfully');

//         // Create JWT token
//         const token = jwt.sign(
//             { 
//                 userId: user._id, 
//                 email: user.email,
//                 fullName: user.fullName 
//             },
//             process.env.JWT_SECRET || 'your-fallback-secret-for-dev',
//             { expiresIn: '24h' }
//         );

//         console.log('Token generated for user:', user._id);

//         res.json({
//             success: true,
//             message: 'Login successful',
//             token,
//             user: {
//                 id: user._id,
//                 fullName: user.fullName,
//                 email: user.email,
//                 mobile: user.mobile
//             }
//         });

//     } catch (error) {
//         console.error('Login error:', error);
//         res.status(500).json({ 
//             success: false, 
//             message: 'Server error during authentication' 
//         });
//     }
// });

// // @route   POST /api/auth/logout
// // @desc    Logout user (client-side token removal)
// // @access  Private
// router.post('/logout', (req, res) => {
//     res.json({
//         success: true,
//         message: 'Logout successful. Please clear your token on client-side.'
//     });
// });

// // @route   GET /api/auth/verify
// // @desc    Verify JWT token
// // @access  Private
// router.get('/verify', async (req, res) => {
//     try {
//         console.log('=== TOKEN VERIFICATION ===');
//         const authHeader = req.headers.authorization;
//         console.log('Authorization header:', authHeader);

//         const token = authHeader?.split(' ')[1];

//         if (!token) {
//             console.log('No token provided');
//             return res.status(401).json({ 
//                 success: false, 
//                 message: 'No token provided' 
//             });
//         }

//         console.log('Token received:', token.substring(0, 20) + '...');

//         const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-fallback-secret-for-dev');
//         console.log('Token decoded successfully:', decoded);

//         const user = await User.findById(decoded.userId).select('-password');

//         if (!user) {
//             console.log('User not found in database:', decoded.userId);
//             return res.status(404).json({ 
//                 success: false, 
//                 message: 'User not found' 
//             });
//         }

//         console.log('User verified:', user.email);

//         res.json({
//             success: true,
//             user
//         });
//     } catch (error) {
//         console.error('Token verification error:', error.message);
//         res.status(401).json({ 
//             success: false, 
//             message: 'Invalid or expired token' 
//         });
//     }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const { upload, handleUploadError } = require('../middleware/upload');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const emailService = require('../utils/emailService');

// JWT Auth Middleware
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-for-dev');
        req.userId = decoded.userId;
        req.user = decoded;
        next();

    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        } else if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

// ==================== AUTH VERIFICATION ====================

// Verify token and return user data
router.get('/verify', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Verify token error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
            error: error.message
        });
    }
});

// ==================== FORGOT EMAIL ====================

router.post('/forgot-email', async (req, res) => {
    try {
        const { mobile } = req.body;

        if (!mobile) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number is required'
            });
        }

        // Clean mobile number - remove all non-digit characters except plus
        let mobileNumber = mobile.replace(/[^\d+]/g, '');

        // If starts with country code, extract just the national number
        let searchMobile = mobileNumber;
        if (mobileNumber.startsWith('+')) {
            // Remove country code for searching
            const dialCodeMatch = mobileNumber.match(/^\+\d{1,3}/);
            if (dialCodeMatch) {
                searchMobile = mobileNumber.substring(dialCodeMatch[0].length);
            }
        }

        // Find user by mobile number (exact match)
        const user = await User.findOne({
            mobile: {
                $regex: new RegExp(`^\\+?\\d*${searchMobile}$`),
                $options: 'i'
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this mobile number'
            });
        }

        if (!user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Account email is not verified. Please contact support.'
            });
        }

        // Send email with registered email address
        const emailSent = await emailService.sendForgotEmail(user.email, user.fullName, user.mobile);

        if (!emailSent.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send email'
            });
        }

        res.json({
            success: true,
            message: 'Email sent successfully to your registered email address',
            email: user.email,
            name: user.fullName,
            mobile: user.mobile
        });

    } catch (error) {
        console.error('Forgot email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve email',
            error: error.message
        });
    }
});

// ==================== REGISTRATION WITH OTP ====================

router.post(
    '/register',
    upload.fields([
        { name: 'profileImage', maxCount: 1 },
        { name: 'document', maxCount: 1 }
    ]),
    handleUploadError,
    async (req, res) => {
        try {
            const {
                fullName,
                dob,
                email,
                password,
                mobile,
                gender
            } = req.body;

            if (!password) {
                return res.status(400).json({
                    success: false,
                    message: 'Password is required'
                });
            }

            if (!gender) {
                return res.status(400).json({
                    success: false,
                    message: 'Gender is required'
                });
            }

            // Check if user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                if (existingUser.isEmailVerified) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email already registered and verified'
                    });
                }
                // If user exists but not verified, allow re-registration
                await User.findByIdAndDelete(existingUser._id);
            }

            // Create new user with unverified status
            const newUser = new User({
                fullName,
                dob,
                email,
                password,
                mobile,
                gender,
                isEmailVerified: false,
                profileImage: req.files?.profileImage?.[0]?.path || null,
                document: req.files?.document?.[0]?.path || null
            });

            // Check if this is the first admin (bootstrap)
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount === 0) {
                newUser.role = 'admin';
                newUser.status = 'approved';
                console.log('Bootstrapping first admin:', email);
            }

            // Generate and save OTP
            const otp = newUser.generateOtp();
            newUser.emailVerificationOtp = otp;
            newUser.emailVerificationOtpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
            newUser.lastEmailOtpSent = new Date();
            newUser.emailOtpResendAttempts = 0;

            await newUser.save();

            // Send OTP email
            const emailSent = await emailService.sendVerificationEmail(email, otp, fullName);

            if (!emailSent.success) {
                await User.findByIdAndDelete(newUser._id);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to send verification email'
                });
            }

            res.status(201).json({
                success: true,
                message: 'Registration successful! Please verify your email with the OTP sent.',
                data: {
                    userId: newUser._id,
                    email: newUser.email,
                    name: newUser.fullName,
                    otpExpiresIn: '5 minutes'
                }
            });

        } catch (error) {
            console.error('Registration error:', error);

            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(val => val.message);
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: messages
                });
            }

            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Registration failed',
                error: error.message
            });
        }
    }
);

// ==================== ENHANCED REGISTRATION WITH ALL DETAILS ====================

router.post(
    '/register-enhanced',
    upload.fields([
        { name: 'profileImage', maxCount: 1 },
        { name: 'resume', maxCount: 1 },
        { name: 'tenthMarksheet', maxCount: 1 },
        { name: 'twelfthMarksheet', maxCount: 1 },
        { name: 'graduationMarksheet', maxCount: 1 },
        { name: 'qualifyingMarksheet', maxCount: 1 }
    ]),
    handleUploadError,
    async (req, res) => {
        try {
            const {
                // Personal details
                fullName,
                fathersName,
                dob,
                email,
                password,
                mobile,
                gender,
                permanentAddress,
                state,

                // 10th details
                tenthBoard,
                tenthPassingYear,
                tenthPercentage,

                // 12th details
                twelfthBoard,
                twelfthPassingYear,
                twelfthPercentage,

                // Graduation details
                graduationDegree,
                graduationPassingYear,
                graduationCGPA,
                graduationPercentage,

                // Qualifying degree details (optional)
                qualifyingDegree,
                qualifyingPercentage
            } = req.body;

            // Validate required fields
            if (!password || password.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 8 characters long'
                });
            }

            // Check if user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                if (existingUser.isEmailVerified) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email already registered and verified'
                    });
                }
                // If user exists but not verified, allow re-registration
                await User.findByIdAndDelete(existingUser._id);
            }

            // Prepare education data
            const educationData = {
                tenth: {
                    board: tenthBoard,
                    passingYear: tenthPassingYear ? parseInt(tenthPassingYear) : null,
                    percentage: tenthPercentage ? parseFloat(tenthPercentage) : null,
                    marksheetUrl: req.files?.tenthMarksheet?.[0]?.path || null
                },
                twelfth: {
                    board: twelfthBoard,
                    passingYear: twelfthPassingYear ? parseInt(twelfthPassingYear) : null,
                    percentage: twelfthPercentage ? parseFloat(twelfthPercentage) : null,
                    marksheetUrl: req.files?.twelfthMarksheet?.[0]?.path || null
                },
                graduation: {
                    degree: graduationDegree,
                    passingYear: graduationPassingYear ? parseInt(graduationPassingYear) : null,
                    cgpa: graduationCGPA ? parseFloat(graduationCGPA) : null,
                    percentage: graduationPercentage ? parseFloat(graduationPercentage) : null,
                    marksheetUrl: req.files?.graduationMarksheet?.[0]?.path || null
                }
            };

            // Add qualifying degree if provided
            if (qualifyingDegree && qualifyingDegree.trim() !== '') {
                educationData.qualifyingDegree = {
                    degree: qualifyingDegree,
                    percentage: qualifyingPercentage ? parseFloat(qualifyingPercentage) : null,
                    marksheetUrl: req.files?.qualifyingMarksheet?.[0]?.path || null
                };
            }

            // Create new user
            const newUser = new User({
                // Personal details
                fullName,
                fathersName,
                dob,
                email,
                password,
                mobile,
                gender,
                permanentAddress,
                state,

                // Education details
                education: educationData,

                // Resume
                resumeUrl: req.files?.resume?.[0]?.path || null,

                // Profile image
                profileImage: req.files?.profileImage?.[0]?.path || null,

                // Verification status
                isEmailVerified: false,
            });

            // Check if this is the first admin (bootstrap)
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount === 0) {
                newUser.role = 'admin';
                newUser.status = 'approved';
                console.log('Bootstrapping first admin (enhanced):', email);
            }

            // Generate and save OTP
            const otp = newUser.generateOtp();
            newUser.emailVerificationOtp = otp;
            newUser.emailVerificationOtpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
            newUser.lastEmailOtpSent = new Date();
            newUser.emailOtpResendAttempts = 0;

            await newUser.save();

            // Send OTP email
            const emailSent = await emailService.sendVerificationEmail(email, otp, fullName);

            if (!emailSent.success) {
                await User.findByIdAndDelete(newUser._id);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to send verification email'
                });
            }

            // Send registration confirmation email
            await emailService.sendRegistrationConfirmation(email, fullName);

            res.status(201).json({
                success: true,
                message: 'Registration successful! Please verify your email with the OTP sent.',
                data: {
                    userId: newUser._id,
                    email: newUser.email,
                    name: newUser.fullName,
                    otpExpiresIn: '5 minutes'
                }
            });

        } catch (error) {
            console.error('Enhanced registration error:', error);

            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(val => val.message);
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: messages
                });
            }

            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Registration failed',
                error: error.message
            });
        }
    }
);

// ==================== VERIFY EMAIL OTP ====================

router.post('/verify-email', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email already verified'
            });
        }

        // Check if OTP attempts exceeded
        if (user.emailVerificationAttempts >= 3) {
            return res.status(429).json({
                success: false,
                message: 'Too many verification attempts. Please request a new OTP.'
            });
        }

        // Check if OTP is expired
        if (user.emailVerificationOtpExpires < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new one.'
            });
        }

        // Verify OTP
        if (user.emailVerificationOtp !== otp) {
            user.emailVerificationAttempts += 1;
            await user.save();

            const attemptsLeft = 3 - user.emailVerificationAttempts;

            return res.status(400).json({
                success: false,
                message: `Invalid OTP. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} left.`
            });
        }

        // OTP verified successfully
        user.isEmailVerified = true;
        user.emailVerificationOtp = undefined;
        user.emailVerificationOtpExpires = undefined;
        user.emailVerificationAttempts = 0;
        user.emailOtpResendAttempts = 0;
        await user.save();

        res.json({
            success: true,
            message: 'Email verified successfully! You can now login.'
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Email verification failed',
            error: error.message
        });
    }
});

// ==================== RESEND VERIFICATION OTP ====================

router.post('/resend-verification-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email already verified'
            });
        }

        // Check resend attempts
        if (user.emailOtpResendAttempts >= 3) {
            return res.status(429).json({
                success: false,
                message: 'Maximum resend attempts reached. Please contact support.'
            });
        }

        // Check if enough time has passed since last OTP (30 seconds cooldown)
        const now = new Date();
        if (user.lastEmailOtpSent && (now - user.lastEmailOtpSent) < 30000) {
            return res.status(429).json({
                success: false,
                message: 'Please wait 30 seconds before requesting a new OTP.'
            });
        }

        // Generate new OTP
        const otp = user.generateOtp();
        user.emailVerificationOtp = otp;
        user.emailVerificationOtpExpires = new Date(Date.now() + 5 * 60 * 1000);
        user.emailVerificationAttempts = 0;
        user.emailOtpResendAttempts += 1;
        user.lastEmailOtpSent = now;
        await user.save();

        // Send new OTP email
        const emailSent = await emailService.sendVerificationEmail(email, otp, user.fullName);

        if (!emailSent.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send verification email'
            });
        }

        res.json({
            success: true,
            message: 'New OTP sent to your email',
            resendAttemptsLeft: 3 - user.emailOtpResendAttempts,
            otpExpiresIn: '5 minutes'
        });

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resend OTP',
            error: error.message
        });
    }
});

// ==================== LOGIN WITH EMAIL VERIFICATION CHECK ====================

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email before logging in',
                requiresVerification: true,
                email: user.email
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                fullName: user.fullName,
                gender: user.gender
            },
            process.env.JWT_SECRET || 'fallback-secret-for-dev',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                gender: user.gender,
                mobile: user.mobile,
                dob: user.dob,
                profileImage: user.profileImage,
                document: user.document,
                age: user.age
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

// ==================== FORGOT PASSWORD ====================

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email'
            });
        }

        // Check if password reset attempts exceeded
        if (user.passwordResetAttempts >= 3) {
            return res.status(429).json({
                success: false,
                message: 'Too many password reset attempts. Please try again later.'
            });
        }

        // Generate password reset OTP
        const otp = user.generateOtp();
        user.passwordResetOtp = otp;
        user.passwordResetOtpExpires = new Date(Date.now() + 5 * 60 * 1000);
        user.passwordResetAttempts = 0;
        await user.save();

        // Send password reset OTP email
        const emailSent = await emailService.sendPasswordResetEmail(email, otp, user.fullName);

        if (!emailSent.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send password reset email'
            });
        }

        res.json({
            success: true,
            message: 'Password reset OTP sent to your email',
            email: user.email,
            otpExpiresIn: '5 minutes'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Password reset request failed',
            error: error.message
        });
    }
});

// ==================== VERIFY PASSWORD RESET OTP ====================

router.post('/verify-password-reset-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if OTP is expired
        if (!user.passwordResetOtpExpires || user.passwordResetOtpExpires < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new one.'
            });
        }

        // Check OTP attempts
        if (user.passwordResetAttempts >= 3) {
            return res.status(429).json({
                success: false,
                message: 'Too many OTP verification attempts'
            });
        }

        // Verify OTP
        if (user.passwordResetOtp !== otp) {
            user.passwordResetAttempts += 1;
            await user.save();

            const attemptsLeft = 3 - user.passwordResetAttempts;

            return res.status(400).json({
                success: false,
                message: `Invalid OTP. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} left.`
            });
        }

        // Generate reset token
        const resetToken = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                purpose: 'password_reset'
            },
            process.env.JWT_SECRET || 'fallback-secret-for-dev',
            { expiresIn: '15m' }
        );

        res.json({
            success: true,
            message: 'OTP verified successfully',
            resetToken,
            email: user.email
        });

    } catch (error) {
        console.error('Verify password reset OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'OTP verification failed',
            error: error.message
        });
    }
});

// ==================== RESET PASSWORD ====================

router.post('/reset-password', async (req, res) => {
    try {
        const { resetToken, newPassword, confirmPassword } = req.body;

        if (!resetToken || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Reset token, new password and confirmation are required'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        // Verify reset token
        let decoded;
        try {
            decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'fallback-secret-for-dev');
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        if (decoded.purpose !== 'password_reset') {
            return res.status(401).json({
                success: false,
                message: 'Invalid reset token'
            });
        }

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if new password is same as old password
        const isSamePassword = await user.comparePassword(newPassword);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'New password must be different from old password'
            });
        }

        // Update password
        user.password = newPassword;
        user.passwordResetOtp = undefined;
        user.passwordResetOtpExpires = undefined;
        user.passwordResetAttempts = 0;
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successfully! You can now login with your new password.'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Password reset failed',
            error: error.message
        });
    }
});

// ==================== CHECK VERIFICATION STATUS ====================

router.get('/verification-status/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            isVerified: user.isEmailVerified,
            email: user.email,
            name: user.fullName
        });

    } catch (error) {
        console.error('Check verification status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check verification status',
            error: error.message
        });
    }
});

// ==================== ADMIN ROUTES FOR FILTERING ====================

// Get all candidates with filtering (Admin only)
router.get('/admin/candidates', authMiddleware, async (req, res) => {
    try {
        const filters = {};

        // Apply filters from query parameters
        if (req.query.passingYear) {
            filters.passingYear = parseInt(req.query.passingYear);
        }

        if (req.query.minPercentage) {
            filters.minPercentage = parseFloat(req.query.minPercentage);
        }

        if (req.query.degree) {
            filters.degree = req.query.degree;
        }

        if (req.query.status) {
            filters.status = req.query.status;
        }

        if (req.query.state) {
            filters.state = req.query.state;
        }

        if (req.query.includeQualifying) {
            filters.includeQualifying = req.query.includeQualifying === 'true';
        }

        // Use the static method from User model
        const candidates = await User.filterCandidates(filters);

        res.json({
            success: true,
            count: candidates.length,
            filters,
            data: candidates
        });
    } catch (error) {
        console.error('Admin candidates error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch candidates',
            error: error.message
        });
    }
});

// Get candidates by degree type
router.get('/admin/candidates/degree/:type', authMiddleware, async (req, res) => {
    try {
        const { type } = req.params;
        const validTypes = ['graduation', 'qualifying', 'both', 'graduation-only'];

        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid degree type. Use: graduation, qualifying, both, or graduation-only'
            });
        }

        const candidates = await User.getDegreeCandidates(type);

        res.json({
            success: true,
            count: candidates.length,
            degreeType: type,
            data: candidates
        });
    } catch (error) {
        console.error('Degree candidates error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch degree candidates',
            error: error.message
        });
    }
});

// Update candidate status (Admin only)
router.put('/admin/candidates/:id/status', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes, selectedForDegree } = req.body;

        if (!status || !['pending', 'approved', 'rejected', 'shortlisted'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Valid status is required'
            });
        }

        const updateData = { status };

        if (adminNotes) {
            updateData.adminNotes = adminNotes;
        }

        if (selectedForDegree) {
            updateData.selectedForDegree = selectedForDegree;
        }

        const updatedCandidate = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password -__v');

        if (!updatedCandidate) {
            return res.status(404).json({
                success: false,
                message: 'Candidate not found'
            });
        }

        // Send status update email to candidate
        if (updatedCandidate.email && updatedCandidate.fullName) {
            await emailService.sendStatusUpdateEmail(
                updatedCandidate.email,
                updatedCandidate.fullName,
                status,
                adminNotes
            );
        }

        res.json({
            success: true,
            message: 'Candidate status updated successfully',
            data: updatedCandidate
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update candidate status',
            error: error.message
        });
    }
});

// Get candidate statistics (Admin only)
router.get('/admin/statistics', authMiddleware, async (req, res) => {
    try {
        const totalCandidates = await User.countDocuments();
        const pendingCandidates = await User.countDocuments({ status: 'pending' });
        const approvedCandidates = await User.countDocuments({ status: 'approved' });
        const rejectedCandidates = await User.countDocuments({ status: 'rejected' });
        const shortlistedCandidates = await User.countDocuments({ status: 'shortlisted' });

        const withQualifyingDegree = await User.countDocuments({
            'education.qualifyingDegree': { $exists: true, $ne: null }
        });

        // Get state-wise distribution
        const stateDistribution = await User.aggregate([
            { $group: { _id: "$state", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Get degree-wise distribution
        const degreeDistribution = await User.aggregate([
            {
                $group: {
                    _id: {
                        graduation: "$education.graduation.degree",
                        qualifying: "$education.qualifyingDegree.degree"
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                totalCandidates,
                pendingCandidates,
                approvedCandidates,
                rejectedCandidates,
                shortlistedCandidates,
                withQualifyingDegree,
                withoutQualifyingDegree: totalCandidates - withQualifyingDegree,
                stateDistribution,
                degreeDistribution
            }
        });
    } catch (error) {
        console.error('Statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
            error: error.message
        });
    }
});

// Search candidates (Admin only)
router.get('/admin/search', authMiddleware, async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters long'
            });
        }

        const searchResults = await User.find({
            $or: [
                { fullName: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
                { mobile: { $regex: query, $options: 'i' } },
                { 'education.graduation.degree': { $regex: query, $options: 'i' } },
                { 'education.qualifyingDegree.degree': { $regex: query, $options: 'i' } },
                { state: { $regex: query, $options: 'i' } }
            ]
        }).select('-password -__v').limit(50).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: searchResults.length,
            query,
            data: searchResults
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search candidates',
            error: error.message
        });
    }
});

// ==================== USER PROFILE ROUTES ====================

// Get complete user profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password -__v');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: error.message
        });
    }
});

// Update user profile
router.put(
    '/profile',
    authMiddleware,
    upload.fields([
        { name: 'profileImage', maxCount: 1 },
        { name: 'resume', maxCount: 1 },
        { name: 'tenthMarksheet', maxCount: 1 },
        { name: 'twelfthMarksheet', maxCount: 1 },
        { name: 'graduationMarksheet', maxCount: 1 },
        { name: 'qualifyingMarksheet', maxCount: 1 }
    ]),
    handleUploadError,
    async (req, res) => {
        try {
            const updateData = {};

            // Personal details
            if (req.body.fullName) updateData.fullName = req.body.fullName;
            if (req.body.fathersName) updateData.fathersName = req.body.fathersName;
            if (req.body.dob) updateData.dob = req.body.dob;
            if (req.body.mobile) updateData.mobile = req.body.mobile;
            if (req.body.gender) updateData.gender = req.body.gender;
            if (req.body.permanentAddress) updateData.permanentAddress = req.body.permanentAddress;
            if (req.body.state) updateData.state = req.body.state;

            // Handle file uploads
            if (req.files?.profileImage) {
                updateData.profileImage = req.files.profileImage[0].path;
            }

            if (req.files?.resume) {
                updateData.resumeUrl = req.files.resume[0].path;
            }

            // Update education data
            const educationUpdate = {};

            // 10th details
            if (req.body.tenthBoard || req.body.tenthPassingYear || req.body.tenthPercentage) {
                educationUpdate.tenth = {
                    board: req.body.tenthBoard,
                    passingYear: req.body.tenthPassingYear ? parseInt(req.body.tenthPassingYear) : null,
                    percentage: req.body.tenthPercentage ? parseFloat(req.body.tenthPercentage) : null
                };
                if (req.files?.tenthMarksheet) {
                    educationUpdate.tenth.marksheetUrl = req.files.tenthMarksheet[0].path;
                }
            }

            // 12th details
            if (req.body.twelfthBoard || req.body.twelfthPassingYear || req.body.twelfthPercentage) {
                educationUpdate.twelfth = {
                    board: req.body.twelfthBoard,
                    passingYear: req.body.twelfthPassingYear ? parseInt(req.body.twelfthPassingYear) : null,
                    percentage: req.body.twelfthPercentage ? parseFloat(req.body.twelfthPercentage) : null
                };
                if (req.files?.twelfthMarksheet) {
                    educationUpdate.twelfth.marksheetUrl = req.files.twelfthMarksheet[0].path;
                }
            }

            // Graduation details
            if (req.body.graduationDegree || req.body.graduationPassingYear ||
                req.body.graduationCGPA || req.body.graduationPercentage) {
                educationUpdate.graduation = {
                    degree: req.body.graduationDegree,
                    passingYear: req.body.graduationPassingYear ? parseInt(req.body.graduationPassingYear) : null,
                    cgpa: req.body.graduationCGPA ? parseFloat(req.body.graduationCGPA) : null,
                    percentage: req.body.graduationPercentage ? parseFloat(req.body.graduationPercentage) : null
                };
                if (req.files?.graduationMarksheet) {
                    educationUpdate.graduation.marksheetUrl = req.files.graduationMarksheet[0].path;
                }
            }

            // Qualifying degree details
            if (req.body.qualifyingDegree || req.body.qualifyingPercentage) {
                educationUpdate.qualifyingDegree = {
                    degree: req.body.qualifyingDegree,
                    percentage: req.body.qualifyingPercentage ? parseFloat(req.body.qualifyingPercentage) : null
                };
                if (req.files?.qualifyingMarksheet) {
                    educationUpdate.qualifyingDegree.marksheetUrl = req.files.qualifyingMarksheet[0].path;
                }
            }

            if (Object.keys(educationUpdate).length > 0) {
                // Get current user to merge education data
                const currentUser = await User.findById(req.userId);
                if (currentUser && currentUser.education) {
                    updateData.education = {
                        ...currentUser.education.toObject(),
                        ...educationUpdate
                    };
                } else {
                    updateData.education = educationUpdate;
                }
            }

            const updatedUser = await User.findByIdAndUpdate(
                req.userId,
                updateData,
                { new: true, runValidators: true }
            ).select('-password -__v');

            if (!updatedUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: updatedUser
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update profile',
                error: error.message
            });
        }
    }
);

// ==================== PROTECTED ROUTES ====================

module.exports = router;