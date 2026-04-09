const express = require('express');
const volunteerController = require('../controllers/volunteerController');
const { requireAuth } = require('../middleware/auth');
const { faceUpload } = require('../middleware/upload');

const router = express.Router();

/** Multipart: fields + faceImage file */
router.post(
  '/register',
  requireAuth,
  faceUpload.single('faceImage'),
  volunteerController.registerProfile
);

router.get('/me', requireAuth, volunteerController.getMyProfile);

router.post('/location', requireAuth, volunteerController.updateLocation);

/** Demo-only: volunteer can set own verification status for staging */
router.patch('/me/verification', requireAuth, volunteerController.setVerificationDemo);

module.exports = router;
