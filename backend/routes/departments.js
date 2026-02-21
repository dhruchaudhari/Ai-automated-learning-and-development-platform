const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const JobDescription = require('../models/JobDescription');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const { admin: adminMiddleware } = require('../middleware/auth');

// GET all departments
router.get('/', adminMiddleware, async (req, res) => {
    try {
        const departments = await Department.find().sort({ createdAt: -1 });
        res.json({ success: true, data: departments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch departments', error: error.message });
    }
});

// POST create department
router.post('/', adminMiddleware, async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Department name is required' });
        }

        const existing = await Department.findOne({ name: name.trim() });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Department with this name already exists' });
        }

        const department = new Department({ name: name.trim(), description: (description || '').trim() });
        await department.save();

        res.status(201).json({ success: true, data: department, message: 'Department created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create department', error: error.message });
    }
});

// PUT update department
router.put('/:id', adminMiddleware, async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Department name is required' });
        }

        // Check uniqueness (excluding self)
        const existing = await Department.findOne({ name: name.trim(), _id: { $ne: req.params.id } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Another department with this name already exists' });
        }

        const department = await Department.findByIdAndUpdate(
            req.params.id,
            { name: name.trim(), description: (description || '').trim() },
            { new: true, runValidators: true }
        );

        if (!department) {
            return res.status(404).json({ success: false, message: 'Department not found' });
        }

        res.json({ success: true, data: department, message: 'Department updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update department', error: error.message });
    }
});

// DELETE department (cascades to job descriptions)
router.delete('/:id', adminMiddleware, async (req, res) => {
    try {
        const department = await Department.findByIdAndDelete(req.params.id);
        if (!department) {
            return res.status(404).json({ success: false, message: 'Department not found' });
        }

        // Cascade delete associated job descriptions
        const deletedJobs = await JobDescription.deleteMany({ department: req.params.id });

        res.json({
            success: true,
            message: `Department deleted along with ${deletedJobs.deletedCount} job description(s)`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete department', error: error.message });
    }
});

module.exports = router;
