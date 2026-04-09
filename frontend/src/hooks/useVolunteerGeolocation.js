import { useEffect, useState } from "react";

/**
 * Watches volunteer position for distance + map. Does not block UI if denied.
 */
export function useVolunteerGeolocation() {
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("unsupported");
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setError(null);
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setError("denied");
        setCoords(null);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 20000,
        timeout: 20000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { volunteerCoords: coords, geoError: error };
}
