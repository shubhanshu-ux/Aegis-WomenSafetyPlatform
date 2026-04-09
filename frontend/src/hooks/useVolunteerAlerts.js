import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "../context/ToastContext";
import { alertsApi } from "../services/api";
import { createSocketClient } from "../services/socket";
import { playAlertSound } from "../utils/playAlertSound";

/** Keeps toast fns stable for loadAlerts deps (avoids resetting poll interval). */
function useToastRefs() {
  const { success, error, sos } = useToast();
  const successRef = useRef(success);
  const errorRef = useRef(error);
  const sosRef = useRef(sos);
  successRef.current = success;
  errorRef.current = error;
  sosRef.current = sos;
  return { successRef, errorRef, sosRef };
}

const POLL_MS = 30000;
const NEW_HIGHLIGHT_MS = 45000;
/** Keep accepted card visible for accepter so map + auto-route can run */
const ACCEPT_GRACE_MS = 2800;
const PLAYED_SOUND_CAP = 400;

function normalizeAlerts(response) {
  const raw = response?.data?.alerts ?? response?.data?.data ?? response?.data ?? [];
  return Array.isArray(raw) ? raw : [];
}

function alertKey(alert) {
  const id = alert?._id ?? alert?.id;
  return id != null ? String(id) : "";
}

/** Maps server `new-alert` socket payload to list item shape (matches GET /alerts). */
function mapSocketPayloadToAlert(payload) {
  try {
    if (!payload || payload.id == null) return null;
    const id = String(payload.id);
    if (!id || id === "undefined" || id === "null") return null;
    return {
      id,
      _id: id,
      latitude: payload.location?.latitude,
      longitude: payload.location?.longitude,
      location: payload.location
        ? {
            latitude: payload.location.latitude,
            longitude: payload.location.longitude,
          }
        : undefined,
      locationName: payload.locationName != null ? String(payload.locationName) : "",
      occurredAt: payload.timestamp,
      status: "pending",
    };
  } catch {
    return null;
  }
}

function mergeGraceAcceptedAlert(serverList, prevList, graceId) {
  if (!graceId) return serverList;
  const g = String(graceId);
  const ghost = prevList.find(
    (a) => alertKey(a) === g && String(a.status || "").toLowerCase() === "accepted"
  );
  if (!ghost || serverList.some((a) => alertKey(a) === g)) return serverList;
  return [ghost, ...serverList];
}

/**
 * Fetches alerts with polling fallback + real-time Socket.io "new-alert" for instant SOS.
 */
export function useVolunteerAlerts() {
  const { successRef, errorRef, sosRef } = useToastRefs();
  const [alerts, setAlerts] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [pollingTick, setPollingTick] = useState(false);
  const [newAlertIds, setNewAlertIds] = useState(() => new Set());
  const [acceptingId, setAcceptingId] = useState(null);
  const [emergencyFlashTick, setEmergencyFlashTick] = useState(0);

  const prevIdsRef = useRef(new Set());
  const isFirstFetchDoneRef = useRef(false);
  const newIdTimeoutsRef = useRef(new Map());
  const playedSoundForAlertIdRef = useRef(new Set());
  /** While set, polling merge keeps this accepted row visible for the volunteer who accepted */
  const selfAcceptedGraceIdRef = useRef(null);

  const scheduleHighlightExpiry = useCallback((id) => {
    const key = String(id);
    const existing = newIdTimeoutsRef.current.get(key);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      setNewAlertIds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      newIdTimeoutsRef.current.delete(key);
    }, NEW_HIGHLIGHT_MS);
    newIdTimeoutsRef.current.set(key, t);
  }, []);

  const applyNewAlertFromSocket = useCallback(
    (payload) => {
      try {
        const mapped = mapSocketPayloadToAlert(payload);
        if (!mapped) return;
        const id = alertKey(mapped);
        if (!id) return;

        setAlerts((prev) => {
          if (prev.some((a) => alertKey(a) === id)) {
            return prev;
          }
          const next = [mapped, ...prev];
          next.sort((a, b) => {
            const ta = new Date(a.occurredAt || 0).getTime();
            const tb = new Date(b.occurredAt || 0).getTime();
            return tb - ta;
          });
          return next;
        });

        prevIdsRef.current.add(id);
        setNewAlertIds((prev) => {
          const next = new Set(prev);
          next.add(id);
          return next;
        });
        scheduleHighlightExpiry(id);

        const played = playedSoundForAlertIdRef.current;
        if (!played.has(id)) {
          played.add(id);
          if (played.size > PLAYED_SOUND_CAP) {
            played.clear();
            played.add(id);
          }
          playAlertSound();
        }

        sosRef.current("New SOS alert received");
        setEmergencyFlashTick((t) => t + 1);
      } catch (e) {
        console.warn("[BSafe] Ignoring invalid new-alert payload:", e);
      }
    },
    [scheduleHighlightExpiry, sosRef]
  );

  const onSocketAlertRef = useRef(applyNewAlertFromSocket);
  onSocketAlertRef.current = applyNewAlertFromSocket;

  const loadAlerts = useCallback(
    async (isInitial) => {
      if (isInitial) {
        setInitialLoading(true);
      } else {
        setPollingTick(true);
      }

      try {
        const response = await alertsApi.getAlerts();
        const list = normalizeAlerts(response);

        setAlerts((prev) => {
          const merged = mergeGraceAcceptedAlert(list, prev, selfAcceptedGraceIdRef.current);
          const ids = merged.map(alertKey).filter(Boolean);

          if (isInitial) {
            prevIdsRef.current = new Set(ids);
            isFirstFetchDoneRef.current = true;
            setNewAlertIds(new Set());
          } else if (isFirstFetchDoneRef.current) {
            const newlySeen = ids.filter((id) => !prevIdsRef.current.has(id));
            prevIdsRef.current = new Set(ids);
            if (newlySeen.length > 0) {
              setNewAlertIds((p) => {
                const next = new Set(p);
                newlySeen.forEach((nid) => next.add(nid));
                return next;
              });
              newlySeen.forEach((nid) => scheduleHighlightExpiry(nid));
            }
          }

          return merged;
        });
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load alerts.";
        if (isInitial) {
          errorRef.current(typeof msg === "string" ? msg : "Failed to load alerts.");
        }
      } finally {
        if (isInitial) {
          setInitialLoading(false);
        }
        setPollingTick(false);
      }
    },
    [errorRef, scheduleHighlightExpiry]
  );

  useEffect(() => {
    let socket;
    try {
      socket = createSocketClient();
    } catch (e) {
      console.warn("[BSafe] Socket unavailable:", e);
      return undefined;
    }

    if (!socket) {
      return undefined;
    }

    const onNewAlert = (payload) => {
      try {
        onSocketAlertRef.current(payload);
      } catch (e) {
        console.warn("[BSafe] new-alert handler error:", e);
      }
    };

    const onConnectError = (err) => {
      console.warn("[BSafe] Socket connection issue (app continues):", err?.message || err);
    };

    const onStatusChange = (payload) => {
      try {
        const alertId = payload?.alertId != null ? String(payload.alertId) : "";
        const status = String(payload?.status || "").toLowerCase();
        if (!alertId) return;

        if (status === "accepted") {
          if (selfAcceptedGraceIdRef.current === alertId) {
            return;
          }
        }

        if (status !== "resolved" && status !== "accepted") return;

        setAlerts((prev) => prev.filter((a) => alertKey(a) !== alertId));
        setNewAlertIds((prev) => {
          const next = new Set(prev);
          next.delete(alertId);
          return next;
        });
        const t = newIdTimeoutsRef.current.get(alertId);
        if (t) {
          clearTimeout(t);
          newIdTimeoutsRef.current.delete(alertId);
        }
        prevIdsRef.current.delete(alertId);
      } catch (e) {
        console.warn("[BSafe] alert-status-change handler:", e);
      }
    };

    socket.on("new-alert", onNewAlert);
    socket.on("alert-status-change", onStatusChange);
    socket.on("connect_error", onConnectError);

    return () => {
      try {
        socket.off("new-alert", onNewAlert);
        socket.off("alert-status-change", onStatusChange);
        socket.off("connect_error", onConnectError);
        socket.disconnect();
      } catch (e) {
        console.warn("[BSafe] Socket cleanup:", e);
      }
    };
  }, []);

  useEffect(() => {
    loadAlerts(true);
    const intervalId = setInterval(() => {
      loadAlerts(false);
    }, POLL_MS);

    return () => {
      clearInterval(intervalId);
      newIdTimeoutsRef.current.forEach((t) => clearTimeout(t));
      newIdTimeoutsRef.current.clear();
    };
  }, [loadAlerts]);

  const acceptAlert = useCallback(
    async (alertId) => {
      const id = String(alertId);
      console.log("Accepting alert with ID:", id);
      setAcceptingId(id);
      selfAcceptedGraceIdRef.current = id;

      try {
        const response = await alertsApi.acceptAlert(alertId);
        console.log("Accept alert response:", response.data);
        
        successRef.current("Alert accepted.");

        setAlerts((prev) =>
          prev.map((a) => (alertKey(a) === id ? { ...a, status: "accepted" } : a))
        );

        setNewAlertIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        const t = newIdTimeoutsRef.current.get(id);
        if (t) {
          clearTimeout(t);
          newIdTimeoutsRef.current.delete(id);
        }

        const acceptedAlert = response.data?.alert || response.data;
        console.log("Returning accepted alert:", acceptedAlert);

        window.setTimeout(() => {
          selfAcceptedGraceIdRef.current = null;
          setAlerts((prev) => prev.filter((a) => alertKey(a) !== id));
          prevIdsRef.current.delete(id);
          loadAlerts(false);
        }, ACCEPT_GRACE_MS);

        return acceptedAlert;
      } catch (err) {
        selfAcceptedGraceIdRef.current = null;
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to accept alert.";
        errorRef.current(typeof msg === "string" ? msg : "Failed to accept alert.");
      } finally {
        setAcceptingId(null);
      }
    },
    [errorRef, loadAlerts, successRef]
  );

  return {
    alerts,
    initialLoading,
    pollingTick,
    newAlertIds,
    acceptingId,
    acceptAlert,
    refresh: () => loadAlerts(false),
    emergencyFlashTick,
  };
}
