const VolunteerProfile = require('../models/VolunteerProfile');
const { ROLES, VERIFICATION_STATUS } = require('../config/constants');
const { asyncHandler } = require('../utils/asyncHandler');
const { filePublicUrl } = require('../utils/publicUrl');
const { emitVolunteerLocationUpdate } = require('../socket/socketServer');

/**
 * Complete volunteer profile after signup (face image + mock Aadhaar + address).
 * Only users with role volunteer may call this; one profile per user.
 */
const registerProfile = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.VOLUNTEER) {
    res.status(403).json({ message: 'Only volunteer accounts can submit this registration' });
    return;
  }

  const existing = await VolunteerProfile.findOne({ user: req.user._id });
  if (existing) {
    res.status(409).json({ message: 'Volunteer profile already exists; use PATCH to update (demo)' });
    return;
  }

  const {
    aadhaarMock,
    addressLine1,
    city,
    state,
    pincode,
  } = req.body;

  if (!aadhaarMock) {
    res.status(400).json({ message: 'aadhaarMock is required (mock value for demo)' });
    return;
  }

  let faceImageUrl = '';
  if (req.file) {
    const rel = `/uploads/faces/${req.file.filename}`;
    faceImageUrl = filePublicUrl(req, rel);
  }

  const profile = await VolunteerProfile.create({
    user: req.user._id,
    aadhaarMock: String(aadhaarMock),
    faceImageUrl,
    address: {
      line1: addressLine1 || '',
      city: city || '',
      state: state || '',
      pincode: pincode || '',
    },
    verificationStatus: VERIFICATION_STATUS.PENDING,
  });

  res.status(201).json({
    message: 'Volunteer registration received; pending verification',
    profile: formatProfile(profile, req),
  });
});

/**
 * Get logged-in volunteer's profile + user basics.
 */
const getMyProfile = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.VOLUNTEER) {
    res.status(403).json({ message: 'Volunteers only' });
    return;
  }
  const profile = await VolunteerProfile.findOne({ user: req.user._id }).populate('user', 'name phone email');
  if (!profile) {
    res.status(404).json({ message: 'No volunteer profile yet' });
    return;
  }
  res.json({ profile: formatProfile(profile, req) });
});

/**
 * Demo: mark verification (would be admin-only in production).
 */
const setVerificationDemo = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.VOLUNTEER) {
    res.status(403).json({ message: 'Volunteers only' });
    return;
  }
  const { status } = req.body;
  if (!Object.values(VERIFICATION_STATUS).includes(status)) {
    res.status(400).json({ message: 'Invalid status' });
    return;
  }
  const profile = await VolunteerProfile.findOneAndUpdate(
    { user: req.user._id },
    { verificationStatus: status },
    { new: true }
  );
  if (!profile) {
    res.status(404).json({ message: 'Profile not found' });
    return;
  }
  res.json({ profile: formatProfile(profile, req) });
});

/**
 * Update volunteer's current location.
 */
const updateLocation = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.VOLUNTEER) {
    res.status(403).json({ message: 'Only volunteers can update location' });
    return;
  }

  const { latitude, longitude } = req.body;
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    res.status(400).json({ message: 'Valid latitude and longitude required' });
    return;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    res.status(400).json({ message: 'Coordinates out of range' });
    return;
  }

  // Store location in volunteer profile (or create a separate location collection)
  const profile = await VolunteerProfile.findOneAndUpdate(
    { user: req.user._id },
    { 
      $set: { 
        lastLocation: {
          latitude: lat,
          longitude: lng,
          timestamp: new Date(),
        }
      }
    },
    { new: true, upsert: true }
  );

  // Emit socket event for real-time tracking
  emitVolunteerLocationUpdate({
    volunteerId: req.user._id,
    latitude: lat,
    longitude: lng,
    timestamp: new Date().toISOString(),
  });

  res.json({ 
    message: 'Location updated',
    location: { latitude: lat, longitude: lng }
  });
});

function formatProfile(doc, req) {
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: o._id,
    user: o.user,
    aadhaarMock: o.aadhaarMock,
    faceImageUrl: o.faceImageUrl,
    address: o.address,
    verificationStatus: o.verificationStatus,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

module.exports = {
  registerProfile,
  getMyProfile,
  setVerificationDemo,
  updateLocation,
};
