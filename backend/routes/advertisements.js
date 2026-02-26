const express = require('express');
const router = express.Router();
const Advertisement = require('../models/Advertisement');
const User = require('../models/User');
const Job = require('../models/Job');
const Role = require('../models/Role');
const Department = require('../models/Department');
const DegreeOption = require('../models/DegreeOption');
const { upload, handleUploadError } = require('../middleware/upload');
const jwt = require('jsonwebtoken');

const { auth: authMiddleware, admin: adminMiddleware } = require('../middleware/auth');

// GET all advertisements
router.get('/', async (req, res) => {
    try {
        const ads = await Advertisement.find()
            .populate('createdBy', 'fullName')
            .populate('department')
            .populate({
                path: 'role',
                populate: { path: 'criteriaSet.specificDegrees' }
            })
            .populate({
                path: 'job',
                populate: [
                    {
                        path: 'role',
                        populate: { path: 'criteriaSet.specificDegrees' }
                    },
                    { path: 'department' }
                ]
            })
            .sort({ createdAt: -1 });
        res.json({ success: true, data: ads });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET active advertisements
router.get('/active', async (req, res) => {
    try {
        const ads = await Advertisement.find({ isActive: true })
            .populate('createdBy', 'fullName')
            .populate('department')
            .populate({
                path: 'role',
                populate: { path: 'criteriaSet.specificDegrees' }
            })
            .populate({
                path: 'job',
                populate: [
                    {
                        path: 'role',
                        populate: { path: 'criteriaSet.specificDegrees' }
                    },
                    { path: 'department' }
                ]
            })
            .sort({ createdAt: -1 });
        res.json({ success: true, data: ads });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET single advertisement
router.get('/:id', async (req, res) => {
    try {
        const ad = await Advertisement.findById(req.params.id)
            .populate('createdBy', 'fullName')
            .populate('department')
            .populate({
                path: 'role',
                populate: { path: 'criteriaSet.specificDegrees' }
            })
            .populate({
                path: 'job',
                populate: [
                    {
                        path: 'role',
                        populate: { path: 'criteriaSet.specificDegrees' }
                    },
                    { path: 'department' }
                ]
            });

        if (!ad) {
            return res.status(404).json({ success: false, message: 'Advertisement not found' });
        }

        res.json({ success: true, data: ad });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST create advertisement
router.post('/', authMiddleware, adminMiddleware, upload.single('document'), handleUploadError, async (req, res) => {
    try {
        const { lastDateToApply, isActive, job } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Advertisement PDF is required' });
        }

        if (!job) {
            return res.status(400).json({ success: false, message: 'Job selection is required' });
        }

        // Fetch job to get role and department
        const Job = require('../models/Job');
        const jobData = await Job.findById(job).populate('role');
        if (!jobData) {
            return res.status(404).json({ success: false, message: 'Selected job not found' });
        }

        const newAd = new Advertisement({
            title: jobData.role?.title || 'Untitled Position',
            detail: req.file.path,
            lastDateToApply: lastDateToApply || jobData.applicationDeadline,
            isActive: isActive === 'true' || isActive === true,
            createdBy: req.userId,
            department: jobData.department,
            role: jobData.role?._id,
            job: job
        });

        await newAd.save();
        await newAd.populate('department');
        await newAd.populate({
            path: 'role',
            populate: { path: 'criteriaSet.specificDegrees' }
        });
        await newAd.populate({
            path: 'job',
            populate: [
                {
                    path: 'role',
                    populate: { path: 'criteriaSet.specificDegrees' }
                },
                { path: 'department' }
            ]
        });

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
        const { lastDateToApply, isActive, job } = req.body;

        const Job = require('../models/Job');
        let jobData = null;
        if (job) {
            jobData = await Job.findById(job).populate('role');
            if (!jobData) {
                return res.status(404).json({ success: false, message: 'Selected job not found' });
            }
        }

        const updateData = {
            isActive: isActive === 'true' || isActive === true,
            updatedBy: req.userId,
        };

        if (jobData) {
            updateData.job = job;
            updateData.title = jobData.role?.title || 'Untitled Position';
            updateData.department = jobData.department;
            updateData.role = jobData.role?._id;
            updateData.lastDateToApply = lastDateToApply || jobData.applicationDeadline;
        } else if (lastDateToApply) {
            updateData.lastDateToApply = lastDateToApply;
        }

        if (req.file) {
            updateData.detail = req.file.path;
        }

        const ad = await Advertisement.findByIdAndUpdate(req.params.id, updateData, { new: true })
            .populate('department')
            .populate({
                path: 'role',
                populate: { path: 'criteriaSet.specificDegrees' }
            })
            .populate({
                path: 'job',
                populate: [
                    {
                        path: 'role',
                        populate: { path: 'criteriaSet.specificDegrees' }
                    },
                    { path: 'department' }
                ]
            });

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
