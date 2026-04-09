const mongoose = require('mongoose');
const { VERIFICATION_STATUS } = require('../config/constants');

/**
 * Extended volunteer registration (mock Aadhaar + face image + address).
 * One-to-one with User when role is volunteer.
 */
const volunteerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    /** Mock identifier — do not use real Aadhaar in demos */
    aadhaarMock: { type: String, required: true, trim: true },
    faceImageUrl: { type: String, default: '' },
    address: {
      line1: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    verificationStatus: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.PENDING,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VolunteerProfile', volunteerProfileSchema);
