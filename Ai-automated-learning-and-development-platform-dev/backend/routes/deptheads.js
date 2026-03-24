const express = require('express');
const router = express.Router();
const deptheadController = require('../controllers/deptheadController');

// POST /api/deptheads/signup
router.post('/signup', deptheadController.signup);

// POST /api/deptheads/login
router.post('/login', deptheadController.login);

module.exports = router;
