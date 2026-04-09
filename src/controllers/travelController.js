const Trip = require('../models/Trip');
const { asyncHandler } = require('../utils/asyncHandler');
const { filePublicUrl } = require('../utils/publicUrl');

/**
 * Log a trip for travel safety: vehicle plate, driver photo, time.
 */
const createTrip = asyncHandler(async (req, res) => {
  const { vehiclePlate, recordedAt, destinationNote } = req.body;
  if (!vehiclePlate || String(vehiclePlate).trim() === '') {
    res.status(400).json({ message: 'vehiclePlate is required' });
    return;
  }

  let driverImageUrl = '';
  if (req.file) {
    const rel = `/uploads/drivers/${req.file.filename}`;
    driverImageUrl = filePublicUrl(req, rel);
  }

  const trip = await Trip.create({
    user: req.user._id,
    vehiclePlate: String(vehiclePlate).trim().toUpperCase(),
    driverImageUrl,
    recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
    destinationNote: destinationNote || '',
  });

  res.status(201).json({ trip: formatTrip(trip) });
});

/**
 * List trips for the logged-in user.
 */
const listMyTrips = asyncHandler(async (req, res) => {
  const trips = await Trip.find({ user: req.user._id }).sort({ recordedAt: -1 }).limit(200).lean();
  res.json({ trips: trips.map(formatTrip) });
});

function formatTrip(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: o._id,
    vehiclePlate: o.vehiclePlate,
    driverImageUrl: o.driverImageUrl,
    recordedAt: o.recordedAt,
    destinationNote: o.destinationNote,
    createdAt: o.createdAt,
  };
}

module.exports = { createTrip, listMyTrips };
