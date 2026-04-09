import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "../context/ToastContext";
import { alertsApi } from "../services/api";
import { createSocketClient } from "../services/socket";

/**
 * Tracks the current user's active SOS (pending/accepted), listens for acceptance via socket.
 */
export function useUserActiveSos() {
  const { success, sos } = useToast();
  const successRef = useRef(success);
  const sosRef = useRef(sos);
  const refreshRef = useRef(async () => {});
  successRef.current = success;
  sosRef.current = sos;

  const [activeAlert, setActiveAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await alertsApi.getMyActiveAlert();
      setActiveAlert(data?.alert ?? null);
    } catch {
      setActiveAlert(null);
    }
  }, []);

  refreshRef.current = refresh;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await refresh();
      if (!cancelled) setLoading(false);
    })();
    
    // Add polling every 5 seconds to check for mission completion
    const pollInterval = setInterval(async () => {
      try {
        await refresh();
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 5000);
    
    return () => {
      cancelled = true;
      setLoading(false);
      clearInterval(pollInterval);
    };
  }, [refresh]);

  useEffect(() => {
    const socket = createSocketClient();
    if (!socket) return undefined;

    const onAccepted = (payload) => {
      try {
        const alertId = payload?.alertId;
        const volunteer = payload?.volunteer;
        if (!alertId || !volunteer) return;

        setActiveAlert((prev) => {
          const pid = prev?.id ?? prev?._id;
          if (!prev || String(pid) !== String(alertId)) return prev;
          const lat = prev.latitude ?? prev.location?.latitude;
          const lng = prev.longitude ?? prev.location?.longitude;
          return {
            ...prev,
            latitude: lat,
            longitude: lng,
            location:
              lat != null && lng != null
                ? { latitude: Number(lat), longitude: Number(lng) }
                : prev.location,
            locationName: prev.locationName ?? "",
            status: "accepted",
            acceptedBy: {
              name: volunteer.name,
              phone: volunteer.phone,
            },
            acceptedAt: new Date().toISOString(),
          };
        });

        sosRef.current(
          "Help is on the way! A volunteer has accepted your request."
        );
      } catch (e) {
        console.warn("[BSafe] alert-accepted handler:", e);
      }
    };

    const onStatusChange = (payload) => {
      try {
        const status = String(payload?.status || "").toLowerCase();
        if (status !== "resolved") return;
        const aid = payload?.alertId != null ? String(payload.alertId) : "";
        if (!aid) return;
        setActiveAlert((prev) => {
          const pid = prev?.id ?? prev?._id;
          if (!prev || String(pid) !== aid) return prev;
          return null;
        });
        refreshRef.current();
      } catch (e) {
        console.warn("[BSafe] user alert-status-change:", e);
      }
    };

    socket.on("alert-accepted", onAccepted);
    socket.on("alert-status-change", onStatusChange);
    return () => {
      socket.off("alert-accepted", onAccepted);
      socket.off("alert-status-change", onStatusChange);
      socket.disconnect();
    };
  }, []);

  const resolveAlert = useCallback(async (alertId) => {
    await alertsApi.resolveAlert(alertId);
    setActiveAlert(null);
    await refresh();
    successRef.current(
      "Alert marked as resolved. You can send a new SOS if needed."
    );
  }, [refresh]);

  const hasActiveSos = Boolean(activeAlert);

  return {
    activeAlert,
    loading,
    hasActiveSos,
    refresh,
    resolveAlert,
  };
}
