/**
 * Exact alert coordinates from API (latitude/longitude or nested location).
 * GeoJSON order is [lng, lat]; API formatAlert exposes latitude/longitude explicitly.
 * Returns { lat, lng } in WGS84 degrees or null if invalid.
 */
export function getAlertLatLng(alert) {
  if (!alert || typeof alert !== "object") return null;

  const latRaw =
    alert.latitude ??
    alert.location?.latitude ??
    alert.location?.lat;
  const lngRaw =
    alert.longitude ??
    alert.location?.longitude ??
    alert.location?.lng ??
    alert.location?.lon;

  const lat = Number(latRaw);
  const lng = Number(lngRaw);

  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
}

/**
 * Display string preserving full numeric precision from backend (no swapping).
 */
export function formatLatLngPrecise(lat, lng) {
  if (lat == null || lng == null) return null;
  const la = Number(lat);
  const ln = Number(lng);
  if (Number.isNaN(la) || Number.isNaN(ln)) return null;
  return {
    latStr: la.toFixed(6),
    lngStr: ln.toFixed(6),
    lat: la,
    lng: ln,
  };
}
