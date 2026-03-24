const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        let token = '';
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
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
        // If auth middleware didn't run yet, run it
        if (!req.user) {
            const authHeader = req.headers.authorization;
            let token = '';
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            } else if (req.query.token) {
                token = req.query.token;
            }

            if (!token) {
                return res.status(401).json({ success: false, message: 'No token provided' });
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-for-dev');
            req.userId = decoded.userId || decoded.id; // Support both userId and id
            req.user = decoded;
        }

        console.log('[Admin Middleware] Checking role for user:', req.userId || req.user?.id || req.user?.userId);
        console.log('[Admin Middleware] Role in token:', req.user?.role);

        // Trust token role if it exists
        if (req.user && req.user.role === 'admin') {
            return next();
        }

        // Fallback to DB check
        const user = await User.findById(req.userId || req.user?.userId || req.user?.id);

        if (!user) {
            console.log('[Admin Middleware] User not found in DB');
            return res.status(403).json({
                success: false,
                message: 'Access denied. User not found.'
            });
        }

        console.log('[Admin Middleware] User found in DB, role:', user.role);

        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        next();
    } catch (err) {
        console.error('[Admin Middleware] Error:', err.message);
        return res.status(401).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

module.exports = { auth, admin };
