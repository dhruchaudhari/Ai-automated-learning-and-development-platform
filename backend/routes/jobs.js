const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Department = require('../models/Department');
const Role = require('../models/Role');
const { admin: adminMiddleware } = require('../middleware/auth');

// GET all jobs
router.get('/', adminMiddleware, async (req, res) => {
    try {
        const filter = {};
        if (req.query.department) {
            filter.department = req.query.department;
        }
        if (req.query.role) {
            filter.role = req.query.role;
        }

        // Advanced Filters
        if (req.query.isRemote !== undefined) {
            filter['location.isRemote'] = req.query.isRemote === 'true';
        }
        if (req.query.city) {
            filter['location.city'] = { $regex: req.query.city, $options: 'i' };
        }
        if (req.query.salaryMin || req.query.salaryMax) {
            filter['salaryRange.max'] = {};
            if (req.query.salaryMin) filter['salaryRange.max'].$gte = Number(req.query.salaryMin);
            if (req.query.salaryMax) filter['salaryRange.min'] = { $lte: Number(req.query.salaryMax) };
        }
        if (req.query.deadlineStart || req.query.deadlineEnd) {
            filter.applicationDeadline = {};
            if (req.query.deadlineStart) filter.applicationDeadline.$gte = new Date(req.query.deadlineStart);
            if (req.query.deadlineEnd) filter.applicationDeadline.$lte = new Date(req.query.deadlineEnd);
        }

        const jobs = await Job.find(filter)
            .populate('department', 'name code')
            .populate('role', 'title level')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: jobs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch jobs', error: error.message });
    }
});

// POST create job
router.post('/', adminMiddleware, async (req, res) => {
    try {
        const {
            department,
            role,
            jobCode,
            description,
            responsibilities,
            location,
            salaryRange,
            openings,
            applicationDeadline
        } = req.body;

        if (!department || !role || !jobCode?.trim() || !description?.trim() || !applicationDeadline) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: department, role, jobCode, description, applicationDeadline'
            });
        }

        const job = new Job({
            department,
            role,
            jobCode: jobCode.trim(),
            description: description.trim(),
            responsibilities: Array.isArray(responsibilities) ? responsibilities : (responsibilities ? [responsibilities] : []),
            location: location || { isRemote: true },
            salaryRange: salaryRange || { currency: 'INR' },
            openings: openings || 1,
            applicationDeadline: new Date(applicationDeadline)
        });

        await job.save();

        // Populate details before returning
        await job.populate('department', 'name code');
        await job.populate('role', 'title level');

        res.status(201).json({ success: true, data: job, message: 'Job created successfully' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Job Code already exists' });
        }
        res.status(500).json({ success: false, message: 'Failed to create job', error: error.message });
    }
});

// PUT update job
router.put('/:id', adminMiddleware, async (req, res) => {
    try {
        const {
            department,
            role,
            jobCode,
            description,
            responsibilities,
            location,
            salaryRange,
            openings,
            applicationDeadline
        } = req.body;

        const updatedData = {
            department,
            role,
            jobCode: jobCode?.trim(),
            description: description?.trim(),
            responsibilities: Array.isArray(responsibilities) ? responsibilities : (responsibilities ? [responsibilities] : []),
            location,
            salaryRange,
            openings,
            applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : undefined
        };

        // Remove undefined fields
        Object.keys(updatedData).forEach(key => updatedData[key] === undefined && delete updatedData[key]);

        const job = await Job.findByIdAndUpdate(
            req.params.id,
            updatedData,
            { new: true, runValidators: true }
        ).populate('department', 'name code').populate('role', 'title level');

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        res.json({ success: true, data: job, message: 'Job updated successfully' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Job Code already exists' });
        }
        res.status(500).json({ success: false, message: 'Failed to update job', error: error.message });
    }
});

// DELETE job
router.delete('/:id', adminMiddleware, async (req, res) => {
    try {
        const job = await Job.findByIdAndDelete(req.params.id);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        res.json({ success: true, message: 'Job deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete job', error: error.message });
    }
});

module.exports = router;
