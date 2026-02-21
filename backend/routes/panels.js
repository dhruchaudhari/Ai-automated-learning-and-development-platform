const express = require('express');
const router = express.Router();
const Panel = require('../models/Panel');
const { auth, admin } = require('../middleware/auth');

// @route   GET api/panels
// @desc    Get all panels
// @access  Private/Admin
router.get('/', [auth, admin], async (req, res) => {
    try {
        const panels = await Panel.find().sort({ createdAt: -1 });
        res.json({ success: true, count: panels.length, data: panels });
    } catch (err) {
        console.error('Error fetching panels:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST api/panels
// @desc    Create a new panel
// @access  Private/Admin
router.post('/', [auth, admin], async (req, res) => {
    try {
        const { name, experts } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Panel name is required' });
        }

        if (!experts || !Array.isArray(experts) || experts.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one expert is required' });
        }

        const newPanel = new Panel({ name, experts });
        await newPanel.save();

        res.status(201).json({ success: true, data: newPanel });
    } catch (err) {
        console.error('Error creating panel:', err.message);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   PUT api/panels/:id
// @desc    Update a panel
// @access  Private/Admin
router.put('/:id', [auth, admin], async (req, res) => {
    try {
        const { name, experts } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Panel name is required' });
        }

        if (!experts || !Array.isArray(experts) || experts.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one expert is required' });
        }

        let panel = await Panel.findById(req.params.id);
        if (!panel) {
            return res.status(404).json({ success: false, message: 'Panel not found' });
        }

        panel = await Panel.findByIdAndUpdate(
            req.params.id,
            { name, experts },
            { new: true, runValidators: true }
        );

        res.json({ success: true, data: panel });
    } catch (err) {
        console.error('Error updating panel:', err.message);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   DELETE api/panels/:id
// @desc    Delete a panel
// @access  Private/Admin
router.delete('/:id', [auth, admin], async (req, res) => {
    try {
        const panel = await Panel.findById(req.params.id);
        if (!panel) {
            return res.status(404).json({ success: false, message: 'Panel not found' });
        }

        await Panel.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Panel removed' });
    } catch (err) {
        console.error('Error deleting panel:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
