/**
 * App-wide constants (roles, alert statuses, verification levels).
 */
module.exports = {
  ROLES: {
    USER: 'user',
    VOLUNTEER: 'volunteer',
  },
  ALERT_STATUS: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    RESOLVED: 'resolved',
    CANCELLED: 'cancelled',
  },
  /** Volunteer KYC mock — not a real government verification */
  VERIFICATION_STATUS: {
    PENDING: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected',
  },
  /** Default search radius for SOS alerts (km) */
  ALERT_RADIUS_KM: 3,
};
