const express = require('express');
const router = express.Router();
const { upload, handleUploadError } = require('../middleware/upload');
const User = require('../models/User');
const Advertisement = require('../models/Advertisement');
const Panel = require('../models/Panel');
const jwt = require('jsonwebtoken');
const emailService = require('../utils/emailService');

const { auth: authMiddleware, admin: adminMiddleware } = require('../middleware/auth');

// ==================== USER PROFILE ====================

// Get current user profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .select('-password')
            .populate('advertisements');

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
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
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

// ==================== ENHANCED REGISTRATION WITH ALL FIELDS ====================

router.post(
    '/register-enhanced',
    upload.fields([
        { name: 'profileImage', maxCount: 1 },
        { name: 'resume', maxCount: 1 },
        { name: 'tenthMarksheet', maxCount: 1 },
        { name: 'twelfthMarksheet', maxCount: 1 },
        { name: 'graduationMarksheet', maxCount: 1 },
        { name: 'qualifyingMarksheet', maxCount: 1 },
        { name: 'identityProof', maxCount: 1 }
    ]),
    handleUploadError,
    async (req, res) => {
        try {
            console.log('=== ENHANCED REGISTRATION REQUEST ===');
            console.log('Body fields:', Object.keys(req.body));
            console.log('Files:', req.files ? Object.keys(req.files) : 'No files');

            const {
                fullName,
                fathersName,
                dob,
                email,
                password,
                confirmPassword,
                mobile,
                gender,
                permanentAddress,
                state,

                // Education details
                tenthBoard,
                tenthPassingYear,
                tenthPercentage,

                twelfthBoard,
                twelfthPassingYear,
                twelfthPercentage,

                graduationDegree,
                graduationPassingYear,
                graduationCGPA,
                graduationPercentage,
                graduationSpecialization,

                qualifyingDegree,
                qualifyingPercentage,
                qualifyingSpecialization
            } = req.body;

            // Validation
            if (!fullName || !email || !password || !confirmPassword || !mobile) {
                return res.status(400).json({
                    success: false,
                    message: 'Required fields missing: fullName, email, password, confirmPassword, mobile'
                });
            }

            if (password !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Passwords do not match'
                });
            }

            // Check if user already exists
            const existingUser = await User.findOne({ email: email.toLowerCase() });
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

            // Check if mobile already exists
            const existingMobile = await User.findOne({ mobile });
            if (existingMobile) {
                return res.status(400).json({
                    success: false,
                    message: 'Mobile number already registered'
                });
            }

            // Parse skillSets if provided as JSON string
            let skillSetsParsed = {
                technical: [],
                creative: [],
                cognitive: [],
                tools: [],
                ethics: []
            };

            if (req.body.skillSets) {
                try {
                    skillSetsParsed = typeof req.body.skillSets === 'string'
                        ? JSON.parse(req.body.skillSets)
                        : req.body.skillSets;
                } catch (e) {
                    console.error('Skillsets parsing error in register-enhanced:', e);
                }
            }

            // Create new user with all fields
            const newUser = new User({
                // Personal details
                fullName,
                fathersName: fathersName || '',
                dob,
                email: email.toLowerCase(),
                password,
                mobile,
                gender: gender || '',
                permanentAddress: permanentAddress || '',
                state: state || '',
                isEmailVerified: false,

                // Education details with marksheet URLs
                education: {
                    tenth: {
                        board: tenthBoard || '',
                        passingYear: tenthPassingYear || '',
                        percentage: tenthPercentage || '',
                        marksheetUrl: req.files?.tenthMarksheet?.[0]?.path || null
                    },
                    twelfth: {
                        board: twelfthBoard || '',
                        passingYear: twelfthPassingYear || '',
                        percentage: twelfthPercentage || '',
                        marksheetUrl: req.files?.twelfthMarksheet?.[0]?.path || null
                    },
                    graduation: {
                        degree: graduationDegree || '',
                        specialization: graduationSpecialization || '',
                        passingYear: graduationPassingYear || '',
                        cgpa: graduationCGPA || '',
                        percentage: graduationPercentage || '',
                        marksheetUrl: req.files?.graduationMarksheet?.[0]?.path || null
                    },
                    qualifyingDegree: {
                        degree: qualifyingDegree || '',
                        specialization: qualifyingSpecialization || '',
                        percentage: qualifyingPercentage || '',
                        marksheetUrl: req.files?.qualifyingMarksheet?.[0]?.path || null
                    }
                },

                // File paths
                profileImage: req.files?.profileImage?.[0]?.path || null,
                resumeUrl: req.files?.resume?.[0]?.path || null,
                identityProofUrl: req.files?.identityProof?.[0]?.path || null,
                advertisements: req.body.advertisements ? JSON.parse(req.body.advertisements) : [],
                skillSets: skillSetsParsed
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
                const field = error.keyPattern?.email ? 'Email' : 'Mobile number';
                return res.status(400).json({
                    success: false,
                    message: `${field} already exists`
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

// ==================== ORIGINAL SIMPLE REGISTRATION ====================

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

            // Parse skillSets if provided
            let skillSetsParsed = {
                technical: [],
                creative: [],
                cognitive: [],
                tools: [],
                ethics: []
            };

            if (req.body.skillSets) {
                try {
                    skillSetsParsed = typeof req.body.skillSets === 'string'
                        ? JSON.parse(req.body.skillSets)
                        : req.body.skillSets;
                } catch (e) {
                    console.error('Skillsets parsing error in simple register:', e);
                }
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
                document: req.files?.document?.[0]?.path || null,
                advertisement: req.body.advertisement || null,
                skillSets: skillSetsParsed
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

        // Check if password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if this user should be boosted to admin (if no admins exist)
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount === 0) {
            user.role = 'admin';
            user.status = 'approved';
            await user.save();
            console.log('Bootstrapping login user to admin:', user.email);
        }

        // Generate JWT token with role
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                fullName: user.fullName,
                gender: user.gender,
                role: user.role || 'user'
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
                resume: user.resumeUrl,
                age: user.age,
                role: user.role || 'user',
                // Include education details if they exist
                education: user.education || {}
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

// ==================== PROTECTED ROUTES ====================

// View user via /grid/view/:id
router.get('/grid/view/:id', authMiddleware, async (req, res) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const user = await User.findById(req.params.id, '-password -__v')
            .populate('advertisements');

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
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user'
        });
    }
});

// Edit user via /grid/edit/:id
router.put(
    '/grid/edit/:id',
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
            if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID format'
                });
            }

            const updateData = {
                fullName: req.body.fullName,
                fathersName: req.body.fathersName,
                dob: req.body.dob,
                email: req.body.email,
                mobile: req.body.mobile,
                gender: req.body.gender,
                permanentAddress: req.body.permanentAddress,
                state: req.body.state,
                updatedAt: Date.now(),

                // Education fields
                'education.tenth.board': req.body.tenthBoard,
                'education.tenth.passingYear': req.body.tenthPassingYear,
                'education.tenth.percentage': req.body.tenthPercentage,

                'education.twelfth.board': req.body.twelfthBoard,
                'education.twelfth.passingYear': req.body.twelfthPassingYear,
                'education.twelfth.percentage': req.body.twelfthPercentage,

                'education.graduation.degree': req.body.graduationDegree,
                'education.graduation.specialization': req.body.graduationSpecialization,
                'education.graduation.passingYear': req.body.graduationPassingYear,
                'education.graduation.cgpa': req.body.graduationCGPA,
                'education.graduation.percentage': req.body.graduationPercentage,

                'education.qualifyingDegree.degree': req.body.qualifyingDegree,
                'education.qualifyingDegree.specialization': req.body.qualifyingSpecialization,
                'education.qualifyingDegree.percentage': req.body.qualifyingPercentage
            };

            // Handle file updates
            if (req.files?.profileImage) {
                updateData.profileImage = req.files.profileImage[0].path;
            }
            if (req.files?.resume) {
                updateData.resume = req.files.resume[0].path;
            }
            if (req.files?.tenthMarksheet) {
                updateData.tenthMarksheet = req.files.tenthMarksheet[0].path;
            }
            if (req.files?.twelfthMarksheet) {
                updateData.twelfthMarksheet = req.files.twelfthMarksheet[0].path;
            }
            if (req.files?.graduationMarksheet) {
                updateData.graduationMarksheet = req.files.graduationMarksheet[0].path;
            }
            if (req.files?.qualifyingMarksheet) {
                updateData.qualifyingMarksheet = req.files.qualifyingMarksheet[0].path;
            }

            if (req.body.advertisements) {
                updateData.advertisements = JSON.parse(req.body.advertisements);
            }

            if (req.body.skillSets) {
                updateData.skillSets = JSON.parse(req.body.skillSets);
            }

            const updatedUser = await User.findByIdAndUpdate(
                req.params.id,
                updateData,
                { new: true, runValidators: true }
            ).select('-password -__v').populate('advertisements');

            if (!updatedUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                message: 'User updated successfully',
                data: updatedUser
            });

        } catch (err) {
            console.error('Update error:', err);
            res.status(500).json({
                success: false,
                message: 'User update failed'
            });
        }
    }
);

// Get all users
router.get('/all', authMiddleware, async (req, res) => {
    try {
        const users = await User.find({}, '-password -__v')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
});

// Delete user
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const deletedUser = await User.findByIdAndDelete(req.params.id);

        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({
            success: false,
            message: 'User deletion failed'
        });
    }
});

// ==================== ADMIN ENDPOINTS ====================

// Admin: Get all users (admin only)
router.get('/admin/users', adminMiddleware, async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } }, '-password -__v')
            .populate('advertisements')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
});

// Admin: Approve user
router.put('/admin/users/:id/approve', adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            {
                status: 'approved',
                adminNotes: adminNotes || 'Approved by admin'
            },
            { new: true, select: '-password -__v' }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User approved successfully',
            data: user
        });
    } catch (err) {
        console.error('Approve error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to approve user'
        });
    }
});

// Admin: Reject user
router.put('/admin/users/:id/reject', adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            {
                status: 'rejected',
                adminNotes: adminNotes || 'Rejected by admin'
            },
            { new: true, select: '-password -__v' }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User rejected',
            data: user
        });
    } catch (err) {
        console.error('Reject error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to reject user'
        });
    }
});

// Admin: Get single user details (admin only)
router.get('/admin/users/:id', adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const user = await User.findById(id, '-password -__v').populate('advertisements');

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
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to get user details'
        });
    }
});

// Admin: Set user status to pending
router.put('/admin/users/:id/pending', adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            {
                status: 'pending',
                adminNotes: adminNotes || 'Status reset to pending by admin'
            },
            { new: true, select: '-password -__v' }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User status set to pending',
            data: user
        });
    } catch (err) {
        console.error('Set pending error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to set user status to pending'
        });
    }
});

// Admin: Set user status to eligible
router.put('/admin/users/:id/eligible', adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            {
                status: 'eligible',
                adminNotes: adminNotes || 'Marked as eligible by admin'
            },
            { new: true, select: '-password -__v' }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User marked as eligible',
            data: user
        });
    } catch (err) {
        console.error('Set eligible error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to set user as eligible'
        });
    }
});

// Admin: Bulk reject users
router.post('/admin/users/bulk-reject', adminMiddleware, async (req, res) => {
    try {
        const { userIds, adminNotes } = req.body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'User IDs array is required'
            });
        }

        // Validate all IDs
        const invalidIds = userIds.filter(id => !id.match(/^[0-9a-fA-F]{24}$/));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Some user IDs are invalid'
            });
        }

        const result = await User.updateMany(
            { _id: { $in: userIds }, role: { $ne: 'admin' } },
            {
                status: 'rejected',
                adminNotes: adminNotes || 'Bulk rejected - did not meet filter criteria'
            }
        );

        res.json({
            success: true,
            message: `${result.modifiedCount} users rejected`,
            modifiedCount: result.modifiedCount
        });
    } catch (err) {
        console.error('Bulk reject error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to bulk reject users'
        });
    }
});

// Admin: Bulk eligible users
router.post('/admin/users/bulk-eligible', adminMiddleware, async (req, res) => {
    try {
        const { userIds, adminNotes } = req.body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'User IDs array is required'
            });
        }

        // Validate all IDs
        const invalidIds = userIds.filter(id => !id.match(/^[0-9a-fA-F]{24}$/));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Some user IDs are invalid'
            });
        }

        const result = await User.updateMany(
            { _id: { $in: userIds }, role: { $ne: 'admin' } },
            {
                status: 'eligible',
                adminNotes: adminNotes || 'Bulk marked as eligible by admin'
            }
        );

        res.json({
            success: true,
            message: `${result.modifiedCount} users marked as eligible`,
            modifiedCount: result.modifiedCount
        });
    } catch (err) {
        console.error('Bulk eligible error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to bulk mark users as eligible'
        });
    }
});

// Admin: Bulk pending users
router.post('/admin/users/bulk-pending', adminMiddleware, async (req, res) => {
    try {
        const { userIds, adminNotes } = req.body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'User IDs array is required'
            });
        }

        // Validate all IDs
        const invalidIds = userIds.filter(id => !id.match(/^[0-9a-fA-F]{24}$/));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Some user IDs are invalid'
            });
        }

        const result = await User.updateMany(
            { _id: { $in: userIds }, role: { $ne: 'admin' } },
            {
                status: 'pending',
                adminNotes: adminNotes || 'Bulk marked as pending by admin'
            }
        );

        res.json({
            success: true,
            message: `${result.modifiedCount} users marked as pending`,
            modifiedCount: result.modifiedCount
        });
    } catch (err) {
        console.error('Bulk pending error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to bulk mark users as pending'
        });
    }
});

// Admin: Bulk permanent delete
router.post('/admin/users/bulk-delete', adminMiddleware, async (req, res) => {
    try {
        const { userIds } = req.body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'User IDs array is required'
            });
        }

        // Validate all IDs
        const invalidIds = userIds.filter(id => !id.match(/^[0-9a-fA-F]{24}$/));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Some user IDs are invalid'
            });
        }

        // Perform permanent deletion (excluding admins for safety)
        const result = await User.deleteMany({
            _id: { $in: userIds },
            role: { $ne: 'admin' }
        });

        res.json({
            success: true,
            message: `${result.deletedCount} users permanently deleted`,
            deletedCount: result.deletedCount
        });
    } catch (err) {
        console.error('Bulk delete error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to bulk delete users'
        });
    }
});

// View user via /grid/view/:id
router.get('/grid/view/:id', authMiddleware, async (req, res) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const user = await User.findById(req.params.id, '-password -__v');

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
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user'
        });
    }
});

// Edit user via /grid/edit/:id
router.put(
    '/grid/edit/:id',
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
            if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID format'
                });
            }

            // Basic fields
            const updateData = {
                fullName: req.body.fullName,
                fathersName: req.body.fathersName,
                dob: req.body.dob,
                email: req.body.email,
                mobile: req.body.mobile,
                gender: req.body.gender,
                permanentAddress: req.body.permanentAddress,
                state: req.body.state,
                updatedAt: Date.now()
            };

            // Handle file uploads
            if (req.files?.profileImage) {
                updateData.profileImage = req.files.profileImage[0].path;
            }
            if (req.files?.resume) {
                updateData.resumeUrl = req.files.resume[0].path;
            }

            // Handle education data if provided
            if (req.body.education) {
                try {
                    // Try to parse if it's a string (from FormData)
                    updateData.education = typeof req.body.education === 'string'
                        ? JSON.parse(req.body.education)
                        : req.body.education;
                } catch (e) {
                    console.error('Error parsing education data:', e);
                }
            } else {
                // Handle flattened education fields
                updateData.education = {
                    tenth: {
                        board: req.body.tenthBoard,
                        passingYear: req.body.tenthPassingYear,
                        percentage: req.body.tenthPercentage,
                        marksheetUrl: req.files?.tenthMarksheet?.[0]?.path || undefined
                    },
                    twelfth: {
                        board: req.body.twelfthBoard,
                        passingYear: req.body.twelfthPassingYear,
                        percentage: req.body.twelfthPercentage,
                        marksheetUrl: req.files?.twelfthMarksheet?.[0]?.path || undefined
                    },
                    graduation: {
                        degree: req.body.graduationDegree,
                        passingYear: req.body.graduationPassingYear,
                        percentage: req.body.graduationPercentage,
                        cgpa: req.body.graduationCGPA,
                        marksheetUrl: req.files?.graduationMarksheet?.[0]?.path || undefined
                    },
                    qualifyingDegree: {
                        degree: req.body.qualifyingDegree,
                        percentage: req.body.qualifyingPercentage,
                        marksheetUrl: req.files?.qualifyingMarksheet?.[0]?.path || undefined
                    }
                };
            }

            // Clean undefined fields
            Object.keys(updateData).forEach(key => (updateData[key] === undefined) && delete updateData[key]);

            // Clean undefined nested education fields
            if (updateData.education) {
                ['tenth', 'twelfth', 'graduation', 'qualifyingDegree'].forEach(level => {
                    if (updateData.education[level]) {
                        Object.keys(updateData.education[level]).forEach(key =>
                            (updateData.education[level][key] === undefined) && delete updateData.education[level][key]
                        );
                        // If level is empty after cleaning, remove it
                        if (Object.keys(updateData.education[level]).length === 0) {
                            delete updateData.education[level];
                        }
                    }
                });
                if (Object.keys(updateData.education).length === 0) {
                    delete updateData.education;
                }
            }

            const updatedUser = await User.findByIdAndUpdate(
                req.params.id,
                { $set: updateData },
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
                message: 'User updated successfully',
                data: updatedUser
            });

        } catch (err) {
            console.error('Update error:', err);
            res.status(500).json({
                success: false,
                message: 'User update failed',
                error: err.message
            });
        }
    }
);

// Get all users
router.get('/all', authMiddleware, async (req, res) => {
    try {
        const users = await User.find({}, '-password -__v')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
});

// Delete user
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const deletedUser = await User.findByIdAndDelete(req.params.id);

        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({
            success: false,
            message: 'User deletion failed'
        });
    }
});

// Assign a panel to a user for a specific advertisement
router.put('/:id/assign-panel', adminMiddleware, async (req, res) => {
    try {
        const { advertisementId, panelId } = req.body;

        if (!advertisementId || !panelId) {
            return res.status(400).json({
                success: false,
                message: 'Advertisement ID and Panel ID are required'
            });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Initialize panelAssignments if not exists
        if (!user.panelAssignments) {
            user.panelAssignments = [];
        }

        // Check if an assignment for this advertisement already exists
        const existingAssignmentIndex = user.panelAssignments.findIndex(
            pa => pa.advertisementId && pa.advertisementId.toString() === advertisementId.toString()
        );

        if (existingAssignmentIndex > -1) {
            // Update existing assignment
            user.panelAssignments[existingAssignmentIndex].panelId = panelId;
            user.panelAssignments[existingAssignmentIndex].assignedAt = Date.now();
        } else {
            // Add new assignment
            user.panelAssignments.push({
                advertisementId,
                panelId,
                assignedAt: Date.now()
            });
        }

        await user.save();

        // Populate everything needed for the frontend update
        const updatedUser = await User.findById(req.params.id)
            .populate('advertisements')
            .populate('advertisement');

        res.json({
            success: true,
            message: 'Panel assigned successfully',
            user: updatedUser
        });

    } catch (err) {
        console.error('Assign panel error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to assign panel',
            error: err.message
        });
    }
});

// Admin: Bulk assign panels - one panel per advertisement
router.put('/admin/users/:id/assign-panels-bulk', adminMiddleware, async (req, res) => {
    try {
        const { assignments } = req.body; // [{ advertisementId, panelId }]

        if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Assignments array is required and must not be empty'
            });
        }

        // Validate each assignment has both fields
        const errors = [];
        assignments.forEach((a, idx) => {
            if (!a.advertisementId) errors.push(`Assignment ${idx + 1}: Advertisement ID is missing`);
            if (!a.panelId) errors.push(`Assignment ${idx + 1}: Panel ID is missing`);
        });

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        const user = await User.findById(req.params.id).populate('advertisements');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Validate that all advertisement IDs belong to this user
        const userAdIds = new Set(
            (user.advertisements || []).filter(Boolean).map(ad => ad._id.toString())
        );
        const invalidAds = assignments.filter(a => {
            if (!a.advertisementId) return true;
            return !userAdIds.has(a.advertisementId.toString());
        });

        if (invalidAds.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Some advertisements do not belong to this user or are invalid'
            });
        }

        // Validate that all panel IDs exist
        const panelIds = assignments.map(a => a.panelId);
        const existingPanels = await Panel.find({ _id: { $in: panelIds } });
        if (existingPanels.length !== new Set(panelIds).size) {
            return res.status(400).json({
                success: false,
                message: 'One or more panels do not exist'
            });
        }

        // Replace all panel assignments
        user.panelAssignments = assignments.map(a => ({
            advertisementId: a.advertisementId,
            panelId: a.panelId,
            assignedAt: Date.now()
        }));

        await user.save();

        const updatedUser = await User.findById(req.params.id)
            .populate('advertisements')
            .populate('panelAssignments.advertisementId')
            .populate('panelAssignments.panelId');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found after update'
            });
        }

        res.json({
            success: true,
            message: `${assignments.length} panel(s) assigned successfully`,
            user: updatedUser
        });

    } catch (err) {
        console.error('Bulk assign panels error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to bulk assign panels',
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// Admin: Schedule interview for a user
router.put('/admin/users/:id/schedule-interview', adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { scheduledDate, advertisementId, advertisementIds } = req.body;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        if (!scheduledDate) {
            return res.status(400).json({
                success: false,
                message: 'Scheduled date is required'
            });
        }

        const user = await User.findById(id).populate('advertisements');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Validate scheduled date is at least 5 days after the last advertisement deadline
        const ads = user.advertisements || [];
        if (ads.length > 0) {
            const latestDeadline = new Date(Math.max(...ads.map(ad => new Date(ad.lastDateToApply).getTime())));
            const schedDate = new Date(scheduledDate);
            // Compare date-only (ignore time)
            const deadlineDateOnly = new Date(latestDeadline.getFullYear(), latestDeadline.getMonth(), latestDeadline.getDate());
            const minAllowedDate = new Date(deadlineDateOnly);
            minAllowedDate.setDate(minAllowedDate.getDate() + 5); // Must be at least 5 days after
            const scheduleDateOnly = new Date(schedDate.getFullYear(), schedDate.getMonth(), schedDate.getDate());

            if (scheduleDateOnly < minAllowedDate) {
                return res.status(400).json({
                    success: false,
                    message: `Interview date must be at least 5 days after the last advertisement deadline (${latestDeadline.toLocaleDateString('en-IN')})`
                });
            }
        }

        const scheduleData = {
            scheduledDate: new Date(scheduledDate),
            scheduledBy: req.userId,
            scheduledAt: new Date()
        };

        const targetAdIds = advertisementIds || (advertisementId ? [advertisementId] : []);

        if (targetAdIds.length > 0) {
            // Update individual advertisementMarks
            targetAdIds.forEach(adId => {
                const adIndex = user.advertisementMarks.findIndex(am => am.advertisementId.toString() === adId.toString());
                if (adIndex !== -1) {
                    user.advertisementMarks[adIndex].interviewSchedule = scheduleData;
                } else {
                    user.advertisementMarks.push({
                        advertisementId: adId,
                        interviewSchedule: scheduleData
                    });
                }
            });
            await user.save();
        } else {
            // Backward compatibility / Global schedule (update only if no specific ads target)
            user.interviewSchedule = scheduleData;
            await user.save();
        }

        const updatedUser = await User.findById(id).populate('advertisements').select('-password -__v');

        res.json({
            success: true,
            message: 'Interview scheduled successfully',
            user: updatedUser
        });
    } catch (err) {
        console.error('Schedule interview error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to schedule interview',
            error: err.message
        });
    }
});

// Admin: Send interview invite email to a user
router.post('/admin/users/:id/send-interview-email', adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { location, helpline, advertisementId, advertisementIds } = req.body;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const user = await User.findById(id).populate('advertisements');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User find failed'
            });
        }

        const targetAdIds = advertisementIds || (advertisementId ? [advertisementId] : []);
        let scheduleInfo;
        let selectedAds = [];

        if (targetAdIds.length > 0) {
            selectedAds = user.advertisements.filter(ad => targetAdIds.some(id => id.toString() === ad._id.toString()));

            // For email content, we'll use the schedule from the first selected ad if multi-ad
            // (Assuming they are scheduled for the same time if sent together)
            const firstAdMark = user.advertisementMarks.find(am => am.advertisementId.toString() === targetAdIds[0].toString());
            scheduleInfo = firstAdMark?.interviewSchedule;
        } else {
            scheduleInfo = user.interviewSchedule;
            selectedAds = user.advertisements;
        }

        if (!scheduleInfo?.scheduledDate) {
            return res.status(400).json({
                success: false,
                message: 'Interview must be scheduled before sending an email'
            });
        }

        if (!location || !helpline) {
            return res.status(400).json({
                success: false,
                message: 'Interview location and helpline contact are required'
            });
        }

        // Validate panel assignment for selected ads
        for (const adId of targetAdIds) {
            const hasPanel = user.panelAssignments && user.panelAssignments.some(pa => pa.advertisementId.toString() === adId.toString());
            if (!hasPanel) {
                return res.status(400).json({
                    success: false,
                    message: `Advertisement "${user.advertisements.find(a => a._id.toString() === adId.toString())?.title}" must have an assigned panel.`
                });
            }
        }

        // Get panel name (from first ad for simplicity in email)
        let panelName = null;
        if (targetAdIds.length > 0) {
            const firstAssignment = user.panelAssignments.find(pa => pa.advertisementId.toString() === targetAdIds[0].toString());
            if (firstAssignment?.panelId) {
                const panel = await Panel.findById(firstAssignment.panelId);
                panelName = panel?.name;
            }
        } else if (user.panelAssignments?.length > 0) {
            const panel = await Panel.findById(user.panelAssignments[0].panelId);
            panelName = panel?.name;
        }

        const adTitles = selectedAds.map(ad => ad.title).join(', ');

        const emailResult = await emailService.sendInterviewInvitation(
            user.email,
            {
                fullName: user.fullName,
                scheduledDate: scheduleInfo.scheduledDate,
                location,
                helpline,
                advertisementTitle: adTitles,
                panelName
            }
        );

        if (!emailResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send interview email',
                error: emailResult.error
            });
        }

        const emailSentData = {
            sent: true,
            sentAt: new Date(),
            sentBy: req.userId
        };

        if (targetAdIds.length > 0) {
            targetAdIds.forEach(adId => {
                const adIndex = user.advertisementMarks.findIndex(am => am.advertisementId.toString() === adId.toString());
                if (adIndex !== -1) {
                    user.advertisementMarks[adIndex].interviewEmailSent = emailSentData;
                } else {
                    user.advertisementMarks.push({
                        advertisementId: adId,
                        interviewEmailSent: emailSentData
                    });
                }
            });
        } else {
            user.interviewEmailSent = emailSentData;
        }

        await user.save();
        const updatedUser = await User.findById(id).populate('advertisements').select('-password -__v');

        res.json({
            success: true,
            message: 'Interview invite email sent successfully',
            user: updatedUser
        });
    } catch (err) {
        console.error('Send interview email error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to send interview email',
            error: err.message
        });
    }
});

// Admin: Assign interview marks for a specific advertisement
router.put('/admin/users/:id/assign-marks', adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { marks, advertisementId } = req.body;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        if (marks === undefined || !advertisementId) {
            return res.status(400).json({
                success: false,
                message: 'Marks and advertisementId are required'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const adIndex = user.advertisementMarks.findIndex(am => am.advertisementId.toString() === advertisementId);

        if (adIndex !== -1) {
            user.advertisementMarks[adIndex].marks = marks;
            user.advertisementMarks[adIndex].assignedAt = new Date();
        } else {
            user.advertisementMarks.push({
                advertisementId,
                marks,
                assignedAt: new Date()
            });
        }

        // Keep root level marks updated for backward compatibility
        user.interviewMarks = marks;

        await user.save();
        const updatedUser = await User.findById(id).select('-password -__v').populate('advertisements');

        res.json({
            success: true,
            message: 'Marks assigned successfully',
            user: updatedUser
        });
    } catch (err) {
        console.error('Assign marks error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to assign marks',
            error: err.message
        });
    }
});

module.exports = router;
