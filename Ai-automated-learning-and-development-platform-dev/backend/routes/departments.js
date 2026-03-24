const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const Role = require('../models/Role');
const Job = require('../models/Job');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const { admin: adminMiddleware } = require('../middleware/auth');

// GET all departments
router.get('/', async (req, res) => {
    try {
        const departments = await Department.find().populate('parentDepartment', 'name code').sort({ createdAt: -1 });
        res.json({ success: true, data: departments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch departments', error: error.message });
    }
});

// POST create department
router.post('/', adminMiddleware, async (req, res) => {
    try {
        const { name, code, description, parentDepartment } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Department name is required' });
        }
        if (!code || !code.trim()) {
            return res.status(400).json({ success: false, message: 'Department code is required' });
        }

        const existing = await Department.findOne({ $or: [{ name: name.trim() }, { code: code.trim().toUpperCase() }] });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Department with this name or code already exists' });
        }

        const deptData = { name: name.trim(), code: code.trim().toUpperCase(), description: (description || '').trim() };
        if (parentDepartment) deptData.parentDepartment = parentDepartment;
        const department = new Department(deptData);
        await department.save();

        const populated = await Department.findById(department._id).populate('parentDepartment', 'name code');
        res.status(201).json({ success: true, data: populated, message: 'Department created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create department', error: error.message });
    }
});

// PUT update department
router.put('/:id', adminMiddleware, async (req, res) => {
    try {
        const { name, code, description, parentDepartment } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Department name is required' });
        }
        if (!code || !code.trim()) {
            return res.status(400).json({ success: false, message: 'Department code is required' });
        }

        // Check uniqueness (excluding self)
        const existing = await Department.findOne({
            $or: [{ name: name.trim() }, { code: code.trim().toUpperCase() }],
            _id: { $ne: req.params.id }
        });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Another department with this name or code already exists' });
        }

        const updateData = { name: name.trim(), code: code.trim().toUpperCase(), description: (description || '').trim() };
        updateData.parentDepartment = parentDepartment || null;

        const department = await Department.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('parentDepartment', 'name code');

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

        // Cascade delete associated roles and jobs
        const deletedRoles = await Role.deleteMany({ department: req.params.id });
        const deletedJobs = await Job.deleteMany({ department: req.params.id });

        res.json({
            success: true,
            message: `Department deleted along with ${deletedRoles.deletedCount} role(s) and ${deletedJobs.deletedCount} job(s)`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete department', error: error.message });
    }
});

module.exports = router;
