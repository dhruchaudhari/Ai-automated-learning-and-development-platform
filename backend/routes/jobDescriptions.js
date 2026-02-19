const express = require('express');
const router = express.Router();
const JobDescription = require('../models/JobDescription');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Admin Middleware
const adminMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-for-dev');
        req.userId = decoded.userId;
        req.user = decoded;

        if (decoded.role === 'admin') return next();

        const user = await User.findById(decoded.userId);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
        }
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Authentication failed' });
    }
};

// GET job descriptions (optionally filter by department)
router.get('/', adminMiddleware, async (req, res) => {
    try {
        const filter = {};
        if (req.query.department) {
            filter.department = req.query.department;
        }

        const jobs = await JobDescription.find(filter)
            .populate('department', 'name')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: jobs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch job descriptions', error: error.message });
    }
});

// POST create job description
router.post('/', adminMiddleware, async (req, res) => {
    try {
        const { department, jobTitle, description, responsibilities, requiredSkillset, qualifications } = req.body;

        if (!department || !jobTitle?.trim() || !description?.trim() || !responsibilities?.trim() || !requiredSkillset?.trim() || !qualifications?.trim()) {
            return res.status(400).json({ success: false, message: 'All fields are required: department, jobTitle, description, responsibilities, requiredSkillset, qualifications' });
        }

        const job = new JobDescription({
            department,
            jobTitle: jobTitle.trim(),
            description: description.trim(),
            responsibilities: responsibilities.trim(),
            requiredSkillset: requiredSkillset.trim(),
            qualifications: qualifications.trim()
        });
        await job.save();

        // Populate department name before returning
        await job.populate('department', 'name');

        res.status(201).json({ success: true, data: job, message: 'Job description created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create job description', error: error.message });
    }
});

// PUT update job description
router.put('/:id', adminMiddleware, async (req, res) => {
    try {
        const { jobTitle, description, responsibilities, requiredSkillset, qualifications } = req.body;

        if (!jobTitle?.trim() || !description?.trim() || !responsibilities?.trim() || !requiredSkillset?.trim() || !qualifications?.trim()) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const job = await JobDescription.findByIdAndUpdate(
            req.params.id,
            {
                jobTitle: jobTitle.trim(),
                description: description.trim(),
                responsibilities: responsibilities.trim(),
                requiredSkillset: requiredSkillset.trim(),
                qualifications: qualifications.trim()
            },
            { new: true, runValidators: true }
        ).populate('department', 'name');

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job description not found' });
        }

        res.json({ success: true, data: job, message: 'Job description updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update job description', error: error.message });
    }
});

// DELETE job description
router.delete('/:id', adminMiddleware, async (req, res) => {
    try {
        const job = await JobDescription.findByIdAndDelete(req.params.id);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job description not found' });
        }

        res.json({ success: true, message: 'Job description deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete job description', error: error.message });
    }
});

module.exports = router;
