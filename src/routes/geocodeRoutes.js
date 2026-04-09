const express = require('express');
const { requireAuth } = require('../middleware/auth');
const geocodeController = require('../controllers/geocodeController');

const router = express.Router();

router.get('/reverse', requireAuth, geocodeController.reverse);

module.exports = router;
