import { useState, useEffect, useCallback, useRef } from 'react';
import { createSocketClient } from '../services/socket';
import { useLiveLocation } from './useLiveLocation';
import { alertsApi } from '../services/api';

export function useVolunteerTracking(alertId = null, volunteerId = null) {
  const [isTracking, setIsTracking] = useState(false);
  const [trackingError, setTrackingError] = useState(null);
  const socketRef = useRef(null);
  const intervalRef = useRef(null);

  const { location, error: locationError, startTracking: startLocationTracking, stopTracking: stopLocationTracking } = useLiveLocation({
    watchInterval: 5000, // Send location every 5 seconds
  });

  const sendLocationUpdate = useCallback(async (coords) => {
    try {
      await alertsApi.updateVolunteerLocation(coords);
      console.log('[BSafe] Location sent:', coords);
    } catch (err) {
      console.error('[BSafe] Failed to send location:', err);
      setTrackingError(err);
    }
  }, []);

  const startTracking = useCallback(() => {
    if (!alertId || !volunteerId) {
      console.warn('[BSafe] Need alertId and volunteerId to start tracking');
      return;
    }

    setIsTracking(true);
    setTrackingError(null);

    // Start location tracking
    startLocationTracking();

    // Send location updates every 5 seconds
    intervalRef.current = setInterval(() => {
      if (location.latitude && location.longitude) {
        sendLocationUpdate(location);
      }
    }, 5000);

    // Listen for socket events
    try {
      socketRef.current = createSocketClient();
      
      socketRef.current.on('volunteer-location-ack', (data) => {
        console.log('[BSafe] Location update acknowledged:', data);
      });

      socketRef.current.on('disconnect', () => {
        console.log('[BSafe] Socket disconnected, stopping tracking');
        stopTracking();
      });
    } catch (err) {
      console.warn('[BSafe] Socket unavailable:', err);
    }
  }, [alertId, volunteerId, location, startLocationTracking, sendLocationUpdate]);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
    
    // Stop location tracking
    stopLocationTracking();
    
    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Clean up socket
    if (socketRef.current) {
      try {
        socketRef.current.off('volunteer-location-ack');
        socketRef.current.disconnect();
      } catch (err) {
        console.warn('[BSafe] Socket cleanup error:', err);
      }
      socketRef.current = null;
    }
  }, [stopLocationTracking]);

  // Auto-stop when component unmounts
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    location,
    isTracking,
    error: locationError || trackingError,
    startTracking,
    stopTracking,
  };
}
