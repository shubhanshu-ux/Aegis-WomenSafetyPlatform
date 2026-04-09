const SOSAlert = require('../models/SOSAlert');
const User = require('../models/User');
const { ALERT_STATUS, ROLES, ALERT_RADIUS_KM } = require('../config/constants');
const { asyncHandler } = require('../utils/asyncHandler');
const { distanceKm } = require('../utils/geo');
const {
  emitNewAlert,
  emitAlertAccepted,
  emitAlertStatusChange,
} = require('../socket/socketServer');

/** Active = user is still in an emergency workflow (cannot send another SOS). */
const ACTIVE_STATUSES = [ALERT_STATUS.PENDING, ALERT_STATUS.ACCEPTED];

/**
 * Create SOS alert (authenticated user).
 * Body: latitude, longitude, optional occurredAt (ISO), optional notes
 */
const createAlert = asyncHandler(async (req, res) => {
  const { latitude, longitude, occurredAt, notes, locationName: rawLocationName } = req.body;
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    res.status(400).json({ message: 'latitude and longitude must be numbers' });
    return;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    res.status(400).json({ message: 'Coordinates out of range' });
    return;
  }

  let locationName = '';
  if (rawLocationName != null && String(rawLocationName).trim()) {
    locationName = String(rawLocationName).trim().slice(0, 500);
  }

  const existingActive = await SOSAlert.findOne({
    user: req.user._id,
    status: { $in: ACTIVE_STATUSES },
  })
    .select('_id')
    .lean();
  if (existingActive) {
    res.status(400).json({ message: 'You already have an active SOS alert' });
    return;
  }

  const alert = await SOSAlert.create({
    user: req.user._id,
    location: {
      type: 'Point',
      coordinates: [lng, lat],
    },
    occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
    notes: notes || '',
    status: ALERT_STATUS.PENDING,
    locationName,
  });

  const formatted = formatAlert(alert);
  const ts =
    formatted.occurredAt instanceof Date
      ? formatted.occurredAt.toISOString()
      : new Date(formatted.occurredAt).toISOString();

  emitNewAlert({
    id: String(formatted.id),
    location: {
      latitude: formatted.latitude,
      longitude: formatted.longitude,
    },
    locationName: formatted.locationName || '',
    timestamp: ts,
  });

  res.status(201).json({ alert: formatted });
});

/**
 * Current user's single active alert (pending or accepted), or null.
 */
const getMyActiveAlert = asyncHandler(async (req, res) => {
  const alert = await SOSAlert.findOne({
    user: req.user._id,
    status: { $in: ACTIVE_STATUSES },
  })
    .sort({ createdAt: -1 })
    .populate('acceptedBy', 'name phone')
    .lean();

  if (!alert) {
    res.json({ alert: null });
    return;
  }
  res.json({ alert: formatAlert(alert) });
});

/**
 * List open SOS items for volunteer dashboard (pending only — accepted/resolved excluded, within 4 hours).
 */
const listOpenAlerts = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.VOLUNTEER) {
    res.status(403).json({ message: 'Volunteers only' });
    return;
  }
  
  // Only return alerts from the last 4 hours
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
  
  const list = await SOSAlert.find({ 
    status: ALERT_STATUS.PENDING,
    createdAt: { $gte: fourHoursAgo }
  })
    .populate('user', 'name phone')
    .sort({ occurredAt: -1 })
    .limit(100)
    .lean();
  res.json({ alerts: list.map(formatAlert) });
});

/**
 * Alerts within ~3km using MongoDB 2dsphere; falls back to Haversine mock if needed.
 * Query: latitude, longitude (volunteer position)
 */
const nearbyAlerts = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.VOLUNTEER) {
    res.status(403).json({ message: 'Volunteers only' });
    return;
  }
  const lat = Number(req.query.latitude);
  const lng = Number(req.query.longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    res.status(400).json({ message: 'latitude and longitude query params required' });
    return;
  }

  const maxMeters = ALERT_RADIUS_KM * 1000;

  // Only return alerts from the last 4 hours
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

  let alerts;
  try {
    alerts = await SOSAlert.find({
      status: ALERT_STATUS.PENDING,
      createdAt: { $gte: fourHoursAgo },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: maxMeters,
        },
      },
    })
      .populate('user', 'name phone')
      .sort({ occurredAt: -1 })
      .limit(50)
      .lean();
  } catch {
    const open = await SOSAlert.find({ 
      status: ALERT_STATUS.PENDING,
      createdAt: { $gte: fourHoursAgo }
    })
      .populate('user', 'name phone')
      .sort({ occurredAt: -1 })
      .lean();
    alerts = open.filter((a) => {
      const [aLng, aLat] = a.location.coordinates;
      return distanceKm(lat, lng, aLat, aLng) <= ALERT_RADIUS_KM;
    });
  }

  const withDistance = alerts.map((a) => {
    const [aLng, aLat] = a.location.coordinates;
    return {
      ...formatAlert(a),
      distanceKm: Math.round(distanceKm(lat, lng, aLat, aLng) * 1000) / 1000,
    };
  });

  res.json({
    radiusKm: ALERT_RADIUS_KM,
    count: withDistance.length,
    alerts: withDistance,
  });
});

/**
 * Volunteer accepts a pending alert.
 */
const acceptAlert = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.VOLUNTEER) {
    res.status(403).json({ message: 'Only volunteers can accept alerts' });
    return;
  }
  const alert = await SOSAlert.findOneAndUpdate(
    { _id: req.params.id, status: ALERT_STATUS.PENDING },
    {
      $set: {
        status: ALERT_STATUS.ACCEPTED,
        acceptedBy: req.user._id,
        acceptedAt: new Date(),
      },
    },
    { new: true }
  );
  if (!alert) {
    const existing = await SOSAlert.findById(req.params.id).select('status').lean();
    if (!existing) {
      res.status(404).json({ message: 'Alert not found' });
      return;
    }
    res.status(409).json({ message: `Alert is already ${existing.status}` });
    return;
  }
  await alert.populate('user', 'name phone');
  await alert.populate('acceptedBy', 'name phone');

  const volunteer = await User.findById(req.user._id).select('name phone').lean();

  emitAlertAccepted({
    alertId: String(alert._id),
    volunteer: {
      name: volunteer?.name || 'Volunteer',
      phone: volunteer?.phone || '',
    },
  });

  emitAlertStatusChange({
    alertId: String(alert._id),
    status: ALERT_STATUS.ACCEPTED,
  });

  res.json({ alert: formatAlert(alert) });
});

const cancelByVolunteer = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.VOLUNTEER) {
    res.status(403).json({ message: 'Only volunteers can cancel mission' });
    return;
  }

  const alert = await SOSAlert.findOneAndUpdate(
    {
      _id: req.params.id,
      status: ALERT_STATUS.ACCEPTED,
      acceptedBy: req.user._id,
    },
    {
      $set: {
        status: ALERT_STATUS.PENDING,   // 🔥 make it visible again
        acceptedBy: null,
        acceptedAt: null,
      },
    },
    { new: true }
  );

  if (!alert) {
    res.status(404).json({ message: 'Alert not found or not yours' });
    return;
  }

  emitAlertStatusChange({
    alertId: String(alert._id),
    status: ALERT_STATUS.PENDING,
  });

  res.json({ alert: formatAlert(alert) });
});

/**
 * Owner marks alert resolved (re-enables SOS).
 */
const resolveAlert = asyncHandler(async (req, res) => {
  const alert = await SOSAlert.findOneAndUpdate(
    {
      _id: req.params.id,
      user: req.user._id,
      status: { $ne: ALERT_STATUS.RESOLVED },
    },
    { $set: { status: ALERT_STATUS.RESOLVED } },
    { new: true }
  );
  if (!alert) {
    const existing = await SOSAlert.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .select('status')
      .lean();
    if (!existing) {
      res.status(404).json({ message: 'Alert not found' });
      return;
    }
    res.status(409).json({ message: 'Alert already resolved' });
    return;
  }

  emitAlertStatusChange({
    alertId: String(alert._id),
    status: ALERT_STATUS.RESOLVED,
  });

  await alert.populate('acceptedBy', 'name phone');
  res.json({ alert: formatAlert(alert) });
});

/**
 * List current user's alerts (demo).
 */
const myAlerts = asyncHandler(async (req, res) => {
  const list = await SOSAlert.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100).lean();
  res.json({ alerts: list.map(formatAlert) });
});

function formatAlert(doc) {
  const o = doc.toObject ? doc.toObject() : { ...doc };
  const coords = o.location?.coordinates || [];
  const lat = coords.length >= 2 ? coords[1] : undefined;
  const lng = coords.length >= 2 ? coords[0] : undefined;
  let acceptedByOut = o.acceptedBy;
  if (acceptedByOut && typeof acceptedByOut === 'object' && acceptedByOut.name !== undefined) {
    acceptedByOut = {
      id: acceptedByOut._id,
      name: acceptedByOut.name,
      phone: acceptedByOut.phone,
    };
  }
  const location =
    lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))
      ? { latitude: Number(lat), longitude: Number(lng) }
      : undefined;
  return {
    id: o._id,
    _id: o._id,
    user: o.user,
    latitude: lat != null ? Number(lat) : undefined,
    longitude: lng != null ? Number(lng) : undefined,
    location,
    locationName: o.locationName || '',
    occurredAt: o.occurredAt,
    status: o.status,
    acceptedBy: acceptedByOut,
    acceptedAt: o.acceptedAt,
    notes: o.notes,
    createdAt: o.createdAt,
  };
}

module.exports = {
  createAlert,
  getMyActiveAlert,
  listOpenAlerts,
  nearbyAlerts,
  acceptAlert,
  resolveAlert,
  cancelByVolunteer,
  myAlerts,
};
