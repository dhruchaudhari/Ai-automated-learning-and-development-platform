const express = require('express');
const router = express.Router();
const Advertisement = require('../models/Advertisement');
const User = require('../models/User');
const { upload, handleUploadError } = require('../middleware/upload');
const jwt = require('jsonwebtoken');

// Auth Middleware (Simplified for internal use, usually imported)
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-for-dev');
        req.userId = decoded.userId;
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Authentication failed' });
    }
};

const adminMiddleware = async (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    const user = await User.findById(req.userId);
    if (user && user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Admin access required' });
};

// GET all advertisements
router.get('/', async (req, res) => {
    try {
        const ads = await Advertisement.find().populate('createdBy', 'fullName').sort({ createdAt: -1 });
        res.json({ success: true, data: ads });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET active advertisements
router.get('/active', async (req, res) => {
    try {
        const ads = await Advertisement.find({ isActive: true }).sort({ createdAt: -1 });
        res.json({ success: true, data: ads });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST create advertisement
router.post('/', authMiddleware, adminMiddleware, upload.single('document'), handleUploadError, async (req, res) => {
    try {
        const { title, lastDateToApply, isActive } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Advertisement PDF is required' });
        }

        const newAd = new Advertisement({
            title,
            detail: req.file.path,
            lastDateToApply,
            isActive: isActive === 'true' || isActive === true,
            createdBy: req.userId
        });

        await newAd.save();
        res.status(201).json({ success: true, data: newAd });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'This PDF document is already used in another advertisement' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT update advertisement
router.put('/:id', authMiddleware, adminMiddleware, upload.single('document'), handleUploadError, async (req, res) => {
    try {
        const { title, lastDateToApply, isActive } = req.body;
        const updateData = {
            title,
            lastDateToApply,
            isActive: isActive === 'true' || isActive === true,
            updatedBy: req.userId
        };

        if (req.file) {
            updateData.detail = req.file.path;
        }

        const ad = await Advertisement.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!ad) return res.status(404).json({ success: false, message: 'Advertisement not found' });

        res.json({ success: true, data: ad });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'This PDF document is already used in another advertisement' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE advertisement
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const ad = await Advertisement.findByIdAndDelete(req.params.id);
        if (!ad) return res.status(404).json({ success: false, message: 'Advertisement not found' });
        res.json({ success: true, message: 'Advertisement deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


module.exports = router;
