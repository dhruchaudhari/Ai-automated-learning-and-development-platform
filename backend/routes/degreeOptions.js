const express = require('express');
const router = express.Router();
const DegreeOption = require('../models/DegreeOption');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const { admin: adminMiddleware } = require('../middleware/auth');

// GET all degree options (PUBLIC — needed by Register form)
router.get('/', async (req, res) => {
    try {
        const options = await DegreeOption.find().sort({ category: 1, name: 1 });
        res.json({ success: true, data: options });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch degree options', error: error.message });
    }
});

// POST create degree option (admin only)
router.post('/', adminMiddleware, async (req, res) => {
    try {
        const { name, category, specializations } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Degree name is required' });
        }
        if (!category || !['bachelor', 'master'].includes(category)) {
            return res.status(400).json({ success: false, message: 'Category must be bachelor or master' });
        }

        const existing = await DegreeOption.findOne({ name: name.trim() });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Degree with this name already exists' });
        }

        const specs = Array.isArray(specializations)
            ? specializations.map(s => s.trim()).filter(Boolean)
            : [];

        const option = new DegreeOption({ name: name.trim(), category, specializations: specs });
        await option.save();

        res.status(201).json({ success: true, data: option, message: 'Degree option created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create degree option', error: error.message });
    }
});

// PUT update degree option (admin only)
router.put('/:id', adminMiddleware, async (req, res) => {
    try {
        const { name, category, specializations } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Degree name is required' });
        }

        // Check uniqueness (excluding self)
        const existing = await DegreeOption.findOne({ name: name.trim(), _id: { $ne: req.params.id } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Another degree with this name already exists' });
        }

        const specs = Array.isArray(specializations)
            ? specializations.map(s => s.trim()).filter(Boolean)
            : [];

        const option = await DegreeOption.findByIdAndUpdate(
            req.params.id,
            { name: name.trim(), category: category || 'bachelor', specializations: specs },
            { new: true, runValidators: true }
        );

        if (!option) {
            return res.status(404).json({ success: false, message: 'Degree option not found' });
        }

        res.json({ success: true, data: option, message: 'Degree option updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update degree option', error: error.message });
    }
});

// DELETE degree option (admin only)
router.delete('/:id', adminMiddleware, async (req, res) => {
    try {
        const option = await DegreeOption.findByIdAndDelete(req.params.id);
        if (!option) {
            return res.status(404).json({ success: false, message: 'Degree option not found' });
        }

        res.json({ success: true, message: 'Degree option deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete degree option', error: error.message });
    }
});

module.exports = router;
