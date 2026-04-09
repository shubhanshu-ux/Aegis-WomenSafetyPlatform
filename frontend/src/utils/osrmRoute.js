/**
 * Fetch driving route geometry from OSRM demo server.
 * Coordinates: WGS84 degrees. API expects lon,lat order in URL and returns GeoJSON [lon,lat].
 * Resolves to positions as [lat, lng][] for Leaflet.
 */
export async function fetchOsrmDrivingRoute(lat1, lon1, lat2, lon2) {
  const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Route request failed (${res.status})`);
  }
  const data = await res.json();
  if (data.code && data.code !== "Ok") {
    throw new Error(data.message || "No route found");
  }
  const coords = data?.routes?.[0]?.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) {
    throw new Error("No route geometry");
  }
  return coords.map(([lng, lat]) => [lat, lng]);
}
