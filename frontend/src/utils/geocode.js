import api from "../services/api";

const memoryCache = new Map();
const CACHE_MAX = 150;

function cacheKey(lat, lng) {
  return `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`;
}

/** Remove repeated leading "Near" (any case) so UI can add a single "Near". */
export function stripNearPrefix(text) {
  let t = String(text ?? "").trim();
  const re = /^near\s+/i;
  while (re.test(t)) {
    t = t.replace(re, "").trim();
  }
  return t;
}

/** Keep at most `max` comma-separated place segments (premium, scannable). */
export function trimToPlaceSegments(line, maxSegments = 2) {
  if (line == null || line === "") return "";
  const parts = String(line)
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.slice(0, maxSegments).join(", ");
}

/** Normalize stored API / geocode text: no duplicate "near", max 2 segments. */
export function formatPlaceForDisplay(raw) {
  const core = stripNearPrefix(raw);
  return trimToPlaceSegments(core, 2);
}

function finalizeGeocodeLine(line) {
  if (!line) return null;
  const out = trimToPlaceSegments(line, 2);
  return out || null;
}

/**
 * Build a short human-readable line from Nominatim `address` object.
 * Example: "SJCE Campus Road, Mysuru" (max two segments)
 */
export function formatNominatimLabel(data) {
  if (!data || typeof data !== "object" || !data.address) return null;
  const a = data.address;
  const road =
    a.road || a.pedestrian || a.path || a.footway || a.residential;
  const neighbourhood = a.neighbourhood || a.quarter;
  const suburb = a.suburb || a.city_district || a.hamlet;
  const city = a.city || a.town || a.village || a.municipality;

  const parts = [];
  if (road) parts.push(road);
  const area = suburb || neighbourhood;
  if (area && area !== road) parts.push(area);
  let line = parts.join(", ");
  if (city) {
    const hasCity = line.toLowerCase().includes(String(city).toLowerCase());
    if (!hasCity) line = line ? `${line}, ${city}` : city;
  }
  if (line) return finalizeGeocodeLine(line);
  if (a.county) return finalizeGeocodeLine(a.county);
  if (a.state) return finalizeGeocodeLine(a.state);
  if (a.country) return finalizeGeocodeLine(a.country);
  return null;
}

/**
 * Reverse geocode via backend proxy (Nominatim + valid User-Agent).
 * Returns a short place line without the "Near" prefix, or null on failure.
 * Results are cached in memory per session.
 */
export async function getAddressFromCoords(lat, lng) {
  const la = Number(lat);
  const ln = Number(lng);
  if (Number.isNaN(la) || Number.isNaN(ln)) return null;

  const key = cacheKey(la, ln);
  if (memoryCache.has(key)) {
    const cached = memoryCache.get(key);
    const normalized = cached ? formatPlaceForDisplay(cached) : "";
    return normalized || null;
  }

  try {
    const { data } = await api.get("/geocode/reverse", {
      params: { lat: la, lon: ln },
      timeout: 12000,
    });
    const label = formatNominatimLabel(data);
    if (!label) return null;
    const normalized = formatPlaceForDisplay(label);
    if (normalized) {
      if (memoryCache.size >= CACHE_MAX) {
        const first = memoryCache.keys().next().value;
        memoryCache.delete(first);
      }
      memoryCache.set(key, normalized);
    }
    return normalized || null;
  } catch {
    return null;
  }
}
