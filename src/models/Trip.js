const mongoose = require('mongoose');

/**
 * Travel safety log: vehicle + driver photo + time.
 */
const tripSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehiclePlate: { type: String, required: true, trim: true, uppercase: true },
    driverImageUrl: { type: String, default: '' },
    recordedAt: { type: Date, required: true },
    destinationNote: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trip', tripSchema);
