const express = require('express');
const router = express.Router();
const Role = require('../models/Role');
const Department = require('../models/Department');
const Job = require('../models/Job');
const { auth, admin } = require('../middleware/auth');

// GET all roles
router.get('/', [auth, admin], async (req, res) => {
    try {
        const filter = {};
        if (req.query.department) {
            filter.department = req.query.department;
        }

        // Advanced Filters
        if (req.query.level) {
            filter.level = req.query.level;
        }
        if (req.query.employmentType) {
            filter.employmentType = req.query.employmentType;
        }

        const roles = await Role.find(filter).populate('department', 'name').sort({ createdAt: -1 });
        res.json({ success: true, data: roles });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST create role
router.post('/', [auth, admin], async (req, res) => {
    try {
        const { title, department, level, employmentType, requiredSkills, preferredSkills, education, description, criteriaSet } = req.body;

        if (!title || !department || !level || !employmentType) {
            return res.status(400).json({ success: false, message: 'Required fields: title, department, level, employmentType' });
        }

        const newRole = new Role({
            title,
            department,
            level,
            employmentType,
            requiredSkills: requiredSkills || [],
            preferredSkills: preferredSkills || [],
            education: education || "Bachelor's",
            description: description || title,
            criteriaSet: criteriaSet || {}
        });

        await newRole.save();
        await newRole.populate('department', 'name');

        res.status(201).json({ success: true, data: newRole });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Role with this title already exists in this department' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT update role
router.put('/:id', [auth, admin], async (req, res) => {
    try {
        const role = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('department', 'name');
        if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
        res.json({ success: true, data: role });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE role
router.delete('/:id', [auth, admin], async (req, res) => {
    try {
        const role = await Role.findByIdAndDelete(req.params.id);
        if (!role) return res.status(404).json({ success: false, message: 'Role not found' });

        // Cascade delete associated jobs
        const deletedJobs = await Job.deleteMany({ role: req.params.id });

        res.json({
            success: true,
            message: `Role deleted successfully along with ${deletedJobs.deletedCount} job(s)`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
