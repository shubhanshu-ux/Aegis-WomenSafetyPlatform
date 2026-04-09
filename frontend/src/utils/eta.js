const DEFAULT_SPEED_KMH = 30;

/**
 * Driving ETA from straight-line distance (km), assuming ~30 km/h average.
 * Returns whole minutes, at least 1 when distance &gt; 0.
 */
export function estimateETA(distanceKm) {
  if (
    distanceKm == null ||
    Number.isNaN(distanceKm) ||
    !Number.isFinite(distanceKm) ||
    distanceKm <= 0
  ) {
    return null;
  }
  const hours = distanceKm / DEFAULT_SPEED_KMH;
  const minutes = Math.round(hours * 60);
  return Math.max(1, minutes);
}
