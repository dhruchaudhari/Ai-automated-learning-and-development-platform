const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { auth, admin } = require('../middleware/auth');

// Route for manual triggered cleanup (Admin only)
router.post('/cleanup', auth, admin, maintenanceController.manualCleanup);

module.exports = router;
