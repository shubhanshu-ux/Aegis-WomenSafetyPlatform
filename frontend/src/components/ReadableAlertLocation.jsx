import { useEffect, useMemo, useState } from "react";
import { getAlertLatLng } from "../utils/alertCoords";
import { formatPlaceForDisplay, getAddressFromCoords } from "../utils/geocode";

function mapsUrl(lat, lng) {
  return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`;
}

/**
 * Shared location row: 📍 Near … (max 2 segments, no duplicate “near”), map link, loading shimmer.
 * Used on volunteer AlertCard and user “Current alert” for identical UX.
 */
function ReadableAlertLocation({ alert, showMapLink = true, className = "" }) {
  const storedRaw =
    alert?.locationName != null ? String(alert.locationName).trim() : "";
  const storedFormatted = storedRaw ? formatPlaceForDisplay(storedRaw) : "";
  const coords = getAlertLatLng(alert);
  const rawId = alert?._id ?? alert?.id;
  const alertId = rawId != null ? String(rawId) : "";

  const [resolvedLabel, setResolvedLabel] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (storedFormatted) {
      setResolvedLabel(null);
      setLoading(false);
      return undefined;
    }
    if (!coords) {
      setResolvedLabel(null);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setResolvedLabel(null);

    (async () => {
      const label = await getAddressFromCoords(coords.lat, coords.lng);
      if (!cancelled) {
        setResolvedLabel(label);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [storedFormatted, alertId, coords?.lat, coords?.lng]);

  const placeSuffix = useMemo(() => {
    if (storedFormatted) return storedFormatted;
    if (loading) return null;
    const fromGeo = resolvedLabel ? formatPlaceForDisplay(resolvedLabel) : "";
    if (fromGeo) return fromGeo;
    if (coords) return "your location";
    return null;
  }, [storedFormatted, loading, resolvedLabel, coords]);

  const showLoadingRow = Boolean(!storedFormatted && coords && loading);
  const noCoords = !coords && !storedFormatted;

  return (
    <div
      className={`group/loc mt-1 space-y-1 ${className}`.trim()}
    >
      {noCoords ? (
        <p className="text-sm text-gray-400 dark:text-gray-400">
          <span aria-hidden>📍 </span>
          Location unavailable
        </p>
      ) : showLoadingRow ? (
        <p
          className="text-sm text-gray-400 transition-opacity duration-200 dark:text-gray-400 animate-loc-shimmer"
          aria-live="polite"
        >
          <span aria-hidden>📍 </span>
          Locating area…
        </p>
      ) : (
        <p className="text-sm text-gray-400 transition-colors duration-200 group-hover/loc:text-gray-300 dark:text-gray-400 dark:group-hover/loc:text-gray-300">
          <span aria-hidden>📍 </span>
          Near {placeSuffix ?? "your location"}
        </p>
      )}

      {showMapLink && coords && !noCoords ? (
        <a
          href={mapsUrl(coords.lat, coords.lng)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex cursor-pointer text-xs text-blue-400 underline underline-offset-2 transition-colors duration-200 hover:text-blue-300 group-hover/loc:text-blue-300 dark:text-blue-400 dark:hover:text-blue-300 dark:group-hover/loc:text-blue-300"
        >
          View on map
        </a>
      ) : null}
    </div>
  );
}

export default ReadableAlertLocation;
