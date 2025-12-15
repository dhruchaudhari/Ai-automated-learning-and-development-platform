const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    try {
        console.log('=== LOGIN ATTEMPT ===');
        console.log('Email:', req.body.email);
        console.log('Has password:', !!req.body.password);

        const { email, password } = req.body;

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            console.log('Invalid email format');
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide a valid email address' 
            });
        }

        // Validate password
        if (!password || password.length < 4) {
            console.log('Password too short');
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 4 characters long' 
            });
        }

        // Check if user exists
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            console.log('User not found with email:', email);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        console.log('User found:', user.email);

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            console.log('Invalid password for user:', user.email);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        console.log('Password verified successfully');

        // Create JWT token
        const token = jwt.sign(
            { 
                userId: user._id, 
                email: user.email,
                fullName: user.fullName 
            },
            process.env.JWT_SECRET || 'your-fallback-secret-for-dev',
            { expiresIn: '24h' }
        );

        console.log('Token generated for user:', user._id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                mobile: user.mobile
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during authentication' 
        });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logout successful. Please clear your token on client-side.'
    });
});

// @route   GET /api/auth/verify
// @desc    Verify JWT token
// @access  Private
router.get('/verify', async (req, res) => {
    try {
        console.log('=== TOKEN VERIFICATION ===');
        const authHeader = req.headers.authorization;
        console.log('Authorization header:', authHeader);
        
        const token = authHeader?.split(' ')[1];
        
        if (!token) {
            console.log('No token provided');
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        console.log('Token received:', token.substring(0, 20) + '...');
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-fallback-secret-for-dev');
        console.log('Token decoded successfully:', decoded);
        
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            console.log('User not found in database:', decoded.userId);
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        console.log('User verified:', user.email);

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Token verification error:', error.message);
        res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired token' 
        });
    }
});

module.exports = router;