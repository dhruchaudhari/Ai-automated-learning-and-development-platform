const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = (req, res, next) => {
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

const admin = async (req, res, next) => {
    try {
        // First run auth middleware logic (or expect it to be run before)
        // For safety, we check if req.user exists, if not we try to decode
        if (!req.user) {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ success: false, message: 'No token provided' });
            }
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-for-dev');
            req.userId = decoded.userId;
            req.user = decoded;
        }

        console.log(`Admin Check: User ${req.userId}, Role: ${req.user?.role}`);

        if (req.user && req.user.role === 'admin') {
            console.log('Admin Check: Role "admin" found in token payload');
            return next();
        }

        console.log('Admin Check: Role not in token, checking database...');
        const user = await User.findById(req.userId);

        if (!user) {
            console.log('Admin Check: User not found in database');
            return res.status(403).json({
                success: false,
                message: 'Access denied. User not found.'
            });
        }

        console.log(`Admin Check: Database role for ${user.email} is "${user.role}"`);

        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        console.log('Admin Check: Database check passed');
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

module.exports = { auth, admin };
