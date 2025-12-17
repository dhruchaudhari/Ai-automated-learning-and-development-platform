const express = require('express');
const router = express.Router();
const { upload, handleUploadError } = require('../middleware/upload');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// JWT Auth - FIXED VERSION
const authMiddleware = (req, res, next) => {
  try {
    console.log('=== AUTH MIDDLEWARE TRIGGERED ===');
    console.log('Path:', req.path);
    console.log('Authorization Header:', req.headers.authorization ? 'Present' : 'Missing');
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('❌ No Authorization header found');
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }
    
    // Check if it's Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      console.log('❌ Authorization header does not start with Bearer');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token format' 
      });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('❌ No token found after Bearer');
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }
    
    console.log('✅ Token extracted, verifying...');
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-for-dev');
    req.userId = decoded.userId;
    req.user = decoded;
    
    console.log('✅ Token verified for user:', decoded.userId);
    next();
    
  } catch (err) {
    console.error('❌ JWT Error:', err.message);
    
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

// ==================== AUTH ROUTES ====================

// Register - NO AUTH NEEDED
router.post(
  '/register',
  upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'document', maxCount: 1 }
  ]),
  handleUploadError,
  async (req, res) => {
    try {
      // 🔍 DEBUG: Log what's coming in
      console.log('=== BACKEND REGISTER REQUEST ===');
      console.log('Request body:', req.body);
      console.log('Request files:', req.files);
      console.log('Password in body:', req.body.password ? 'PRESENT' : 'MISSING');
      console.log('Password value:', req.body.password ? req.body.password.substring(0, 5) + '...' : 'undefined');
      
      // Extract ALL fields from request body (ADD GENDER HERE)
      const { 
        fullName, 
        dob, 
        email, 
        password,
        mobile,
        gender  // ← ADD GENDER FIELD
      } = req.body;
      
      // Validate required fields
      if (!password) {
        console.error('❌ ERROR: Password is missing from request body');
        return res.status(400).json({
          success: false,
          message: 'Password is required'
        });
      }
      
      if (!gender) {
        console.error('❌ ERROR: Gender is missing from request body');
        return res.status(400).json({
          success: false,
          message: 'Gender is required'
        });
      }
      
      // Validate gender value
      const validGenders = ['Male', 'Female', 'Other'];
      if (!validGenders.includes(gender)) {
        return res.status(400).json({
          success: false,
          message: 'Gender must be either Male, Female, or Other'
        });
      }
      
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists'
        });
      }

      // Create new user WITH ALL FIELDS INCLUDING GENDER
      const newUser = new User({
        fullName,
        dob,
        email,
        password,
        mobile,
        gender,  // ← ADD GENDER HERE
        profileImage: req.files?.profileImage?.[0]?.path || null,
        document: req.files?.document?.[0]?.path || null
      });

      console.log('✅ Creating user with data:', {
        fullName: newUser.fullName,
        email: newUser.email,
        password: '[HIDDEN]',
        mobile: newUser.mobile,
        dob: newUser.dob,
        gender: newUser.gender  // ← LOG GENDER
      });

      await newUser.save();

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email,
          gender: newUser.gender
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      // More detailed error handling
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

// ==================== NEW ROUTES ADDED ====================
// These match your frontend routes

// View user via /grid/view/:id - PROTECTED
router.get('/grid/view/:id', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 Fetching user via /grid/view/:id:', req.params.id);
    
    // Validate ID format
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

    console.log('✅ User found via /grid/view/:id');
    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Error fetching user via /grid/view/:id:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user' 
    });
  }
});

// Edit user via /grid/edit/:id - PROTECTED
router.put(
  '/grid/edit/:id',
  authMiddleware,
  upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'document', maxCount: 1 }
  ]),
  handleUploadError,
  async (req, res) => {
    try {
      console.log('✏️ Updating user via /grid/edit/:id:', req.params.id);
      
      // Validate ID format
      if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format'
        });
      }

      const updateData = {
        fullName: req.body.fullName,
        dob: req.body.dob,
        email: req.body.email,
        mobile: req.body.mobile,
        gender: req.body.gender,  // ← ADD GENDER HERE
        updatedAt: Date.now()
      };

      if (req.files?.profileImage) {
        updateData.profileImage = req.files.profileImage[0].path;
      }

      if (req.files?.document) {
        updateData.document = req.files.document[0].path;
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password -__v');

      if (!updatedUser) {
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }

      console.log('✅ User updated via /grid/edit/:id');
      res.json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });

    } catch (err) {
      console.error('Update error via /grid/edit/:id:', err);
      res.status(500).json({ 
        success: false,
        message: 'User update failed' 
      });
    }
  }
);

// Get all users - PROTECTED
router.get('/all', authMiddleware, async (req, res) => {
  try {
    console.log('📋 Fetching all users for user ID:', req.userId);
    
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

// Get single user by ID - PROTECTED
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 Fetching user via /:id:', req.params.id);
    
    // Validate ID format
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

    console.log('✅ User found via /:id');
    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Error fetching user via /:id:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user' 
    });
  }
});

// Update user - PROTECTED
router.put(
  '/:id',
  authMiddleware,
  upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'document', maxCount: 1 }
  ]),
  handleUploadError,
  async (req, res) => {
    try {
      console.log('✏️ Updating user via /:id:', req.params.id);
      
      // Validate ID format
      if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format'
      });
    }

      const updateData = {
        fullName: req.body.fullName,
        dob: req.body.dob,
        email: req.body.email,
        mobile: req.body.mobile,
        gender: req.body.gender,  // ← ADD GENDER HERE
        updatedAt: Date.now()
      };

      if (req.files?.profileImage) {
        updateData.profileImage = req.files.profileImage[0].path;
      }

      if (req.files?.document) {
        updateData.document = req.files.document[0].path;
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password -__v');

      if (!updatedUser) {
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }

      console.log('✅ User updated via /:id');
      res.json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });

    } catch (err) {
      console.error('Update error via /:id:', err);
      res.status(500).json({ 
        success: false,
        message: 'User update failed' 
      });
    }
  }
);

// Delete user - PROTECTED
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    console.log('🗑️ Deleting user:', req.params.id, 'by user:', req.userId);
    
    // Validate ID format
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

// ==================== LOGOUT ROUTE ====================
// Logout user - CLEAR TOKEN ON SERVER SIDE
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    console.log('🚪 User logging out:', req.userId);
    
    // In a real application, you might:
    // 1. Add token to blacklist
    // 2. Clear session data
    // 3. Update user's last logout time
    
    // For JWT (stateless), we just return success
    // Client will remove token from localStorage
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Logout failed' 
    });
  }
});

// ==================== PUBLIC LOGOUT (for when token is expired) ====================
router.post('/public-logout', (req, res) => {
  // This route doesn't require auth - for cases where token is expired
  console.log('🚪 Public logout endpoint hit');
  
  res.json({
    success: true,
    message: 'Ready for logout'
  });
});

// Health check endpoint (no auth needed)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Users API is working',
    timestamp: new Date().toISOString()
  });
});

// ==================== TEST ENDPOINT ====================
// Add this test endpoint to debug FormData
router.post('/test-formdata', upload.none(), (req, res) => {
  console.log('=== TEST FORMDATA RECEIVED ===');
  console.log('Body:', req.body);
  console.log('Headers:', req.headers);
  console.log('==============================');
  
  res.json({
    success: true,
    message: 'FormData test successful',
    received: req.body
  });
});

// ==================== LOGIN ROUTE ====================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
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
        gender: user.gender  // ← ADD GENDER TO TOKEN
      },
      process.env.JWT_SECRET || 'fallback-secret-for-dev',
      { expiresIn: '24h' }
    );

    // Return user data and token
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        gender: user.gender,  // ← INCLUDE GENDER IN RESPONSE
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

module.exports = router;