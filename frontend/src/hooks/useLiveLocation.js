import { useState, useEffect, useCallback, useRef } from 'react';

const DEFAULT_LOCATION = { latitude: 12.9716, longitude: 77.5946 };

export function useLiveLocation(options = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000,
    watchInterval = 5000, // 5 seconds
  } = options;

  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);

  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve({ latitude, longitude });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      );
    });
  }, [enableHighAccuracy, timeout, maximumAge]);

  const startTracking = useCallback(() => {
    setLoading(true);
    setError(null);

    // Get initial position
    getCurrentPosition()
      .then((position) => {
        setLocation(position);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
        console.warn('[BSafe] Location error:', err);
      });

    // Watch position changes
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          setLoading(false);
        },
        (err) => {
          setError(err);
          console.warn('[BSafe] Location watch error:', err);
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      );
    }
  }, [getCurrentPosition, enableHighAccuracy, timeout, maximumAge]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    location,
    error,
    loading,
    startTracking,
    stopTracking,
    getCurrentPosition,
  };
}
