import { estimateETA } from "./eta";

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine distance between two WGS84 points (degrees). Returns km.
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const φ1 = (Number(lat1) * Math.PI) / 180;
  const φ2 = (Number(lat2) * Math.PI) / 180;
  const Δφ = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
  const Δλ = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Human label with optional ETA: "Nearby • ~2 km • ~4 min away" (30 km/h assumption).
 * Falls back to "Nearby" when volunteer position is unknown.
 */
export function formatDistanceLabel(volunteerCoords, alertCoords) {
  if (
    !volunteerCoords ||
    !alertCoords ||
    Number.isNaN(volunteerCoords.lat) ||
    Number.isNaN(volunteerCoords.lng) ||
    Number.isNaN(alertCoords.lat) ||
    Number.isNaN(alertCoords.lng)
  ) {
    return "Nearby";
  }
  const km = calculateDistance(
    volunteerCoords.lat,
    volunteerCoords.lng,
    alertCoords.lat,
    alertCoords.lng
  );
  if (Number.isNaN(km) || !Number.isFinite(km)) return "Nearby";

  let distSegment;
  if (km < 1) {
    const m = Math.round(km * 1000);
    distSegment = `~${m} m`;
  } else {
    const rounded = Math.round(km * 10) / 10;
    distSegment = `~${rounded} km`;
  }

  const etaMin = estimateETA(km);
  if (etaMin == null) {
    return `Nearby • ${distSegment} away`;
  }
  return `Nearby • ${distSegment} • ~${etaMin} min away`;
}
