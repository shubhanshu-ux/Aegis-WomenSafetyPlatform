const mongoose = require('mongoose');
const { ALERT_STATUS } = require('../config/constants');

/**
 * SOS ping: geo point + status; optional volunteer acceptance.
 */
const sosAlertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: {
        type: [Number], // [longitude, latitude] per GeoJSON
        required: true,
      },
    },
    /** Client or server time of the emergency */
    occurredAt: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(ALERT_STATUS),
      default: ALERT_STATUS.PENDING,
    },
    acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    acceptedAt: { type: Date, default: null },
    notes: { type: String, default: '' },
    /** Human-readable place line from client geocoding (optional) */
    locationName: { type: String, default: '', trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

sosAlertSchema.index({ location: '2dsphere' });

// TTL index - automatically delete alerts after 4 hours (4 * 60 * 60 = 14400 seconds)
sosAlertSchema.index({ createdAt: 1 }, { expireAfterSeconds: 14400 });

module.exports = mongoose.model('SOSAlert', sosAlertSchema);
