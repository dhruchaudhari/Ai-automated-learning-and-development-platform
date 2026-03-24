const DeptHead = require('../models/DeptHead');
const jwt = require('jsonwebtoken');

// Helper to generate JWT
const generateToken = (id) => {
    return jwt.sign({ id, role: 'depthead' }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '30d'
    });
};

/**
 * Register a new Department Head
 * POST /api/deptheads/signup
 */
const signup = async (req, res) => {
    try {
        const { username, email, password, department } = req.body;

        if (!username || !email || !password || !department) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Check if email already exists
        const emailExists = await DeptHead.findOne({ email });
        if (emailExists) {
            return res.status(400).json({ success: false, message: 'Email is already registered' });
        }

        // Check if username already exists
        const usernameExists = await DeptHead.findOne({ username });
        if (usernameExists) {
            return res.status(400).json({ success: false, message: 'Username is already taken' });
        }

        // Check if department already has a head
        const deptHasHead = await DeptHead.findOne({ department });
        if (deptHasHead) {
            return res.status(400).json({ success: false, message: 'This department already has a Department Head assigned' });
        }

        const deptHead = new DeptHead({
            username,
            email,
            password,
            department
        });

        await deptHead.save();

        const token = generateToken(deptHead._id);

        // Populate department name before sending back
        const populatedDeptHead = await DeptHead.findById(deptHead._id).populate('department');

        res.status(201).json({
            success: true,
            token,
            deptHead: {
                id: populatedDeptHead._id,
                username: populatedDeptHead.username,
                email: populatedDeptHead.email,
                department: populatedDeptHead.department ? populatedDeptHead.department.name : populatedDeptHead.department,
                role: populatedDeptHead.role
            }
        });
    } catch (error) {
        console.error('DeptHead Signup Error:', error);
        res.status(500).json({ success: false, message: 'Server error during signup', error: error.message });
    }
};

/**
 * Login Department Head
 * POST /api/deptheads/login
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        // Check user credentials
        const deptHead = await DeptHead.findOne({ email });

        if (!deptHead) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await deptHead.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Populate department name before sending back
        const populatedDeptHead = await DeptHead.findById(deptHead._id).populate('department');

        const token = generateToken(deptHead._id);

        res.json({
            success: true,
            token,
            deptHead: {
                id: populatedDeptHead._id,
                username: populatedDeptHead.username,
                email: populatedDeptHead.email,
                department: populatedDeptHead.department ? populatedDeptHead.department.name : populatedDeptHead.department,
                role: populatedDeptHead.role
            }
        });
    } catch (error) {
        console.error('DeptHead Login Error:', error);
        res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
    }
};

module.exports = {
    signup,
    login
};
