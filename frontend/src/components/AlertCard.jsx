import { useCallback, useEffect, useRef, useState } from "react";
import { formatDistanceLabel } from "../utils/distance";
import { getAlertLatLng, formatLatLngPrecise } from "../utils/alertCoords";
import { fetchOsrmDrivingRoute } from "../utils/osrmRoute";
import { useLiveTimeAgo } from "../hooks/useLiveTimeAgo";
import ButtonSpinner from "./ButtonSpinner";
import MapView from "./MapView";
import ReadableAlertLocation from "./ReadableAlertLocation";

function normalizeStatus(alert) {
  return String(alert?.status ?? "pending").toLowerCase();
}

function StatusBadge({ status }) {
  const s = String(status || "pending").toLowerCase();
  if (s === "pending") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-500/20 backdrop-blur-sm border border-red-400/30 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-red-200">
        Pending
      </span>
    );
  }
  if (s === "accepted") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-200">
        Accepted
      </span>
    );
  }
  if (s === "resolved") {
    return (
      <span className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white/70">
        Resolved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1 text-[11px] font-semibold text-white/70">
      {s}
    </span>
  );
}

function ResponseStatusPulse({ status }) {
  const s = String(status || "").toLowerCase();
  if (s === "pending") {
    return (
      <p className="mt-3 flex items-center gap-2 text-sm font-medium text-white/80 animate-status-line-pulse transition-all duration-300 ease-in-out">
        <span className="shrink-0" aria-hidden>
          🔴
        </span>
        <span>Searching for nearby volunteers…</span>
      </p>
    );
  }
  if (s === "accepted") {
    return (
      <p className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-200 transition-all duration-300 ease-in-out">
        <span className="shrink-0" aria-hidden>
          🟢
        </span>
        <span>Volunteer is on the way</span>
      </p>
    );
  }
  return null;
}

/**
 * Accept is shown only for volunteers (`canAccept`) on pending alerts.
 */
function AlertCard({
  alert,
  onAccept,
  isNew,
  isAccepting,
  canAccept = false,
  volunteerCoords = null,
}) {
  const id = alert._id || alert.id;
  const alertId = id != null ? String(id) : "";
  const status = normalizeStatus(alert);
  const isPending = status === "pending";
  const showAcceptButton = Boolean(canAccept) && isPending;

  const alertCoords = getAlertLatLng(alert);
  const precise = alertCoords
    ? formatLatLngPrecise(alertCoords.lat, alertCoords.lng)
    : null;

  const distanceLabel = formatDistanceLabel(volunteerCoords, alertCoords);

  const timeSource = alert?.occurredAt ?? alert?.createdAt;
  const timeAgoLabel = useLiveTimeAgo(timeSource, 12000);

  const [routePositions, setRoutePositions] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);

  const mapSectionRef = useRef(null);
  const autoRouteAttemptedForStatusRef = useRef(null);

  useEffect(() => {
    setRoutePositions(null);
    setRouteError(null);
    setRouteLoading(false);
    autoRouteAttemptedForStatusRef.current = null;
  }, [alertId]);

  const canComputeRoute = Boolean(
    volunteerCoords &&
      alertCoords &&
      !Number.isNaN(volunteerCoords.lat) &&
      !Number.isNaN(volunteerCoords.lng)
  );

  const fetchAndShowRoute = useCallback(async () => {
    if (!canComputeRoute || !alertCoords || !volunteerCoords) return false;
    setRouteLoading(true);
    setRouteError(null);
    try {
      const positions = await fetchOsrmDrivingRoute(
        volunteerCoords.lat,
        volunteerCoords.lng,
        alertCoords.lat,
        alertCoords.lng
      );
      setRoutePositions(positions);
      requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          mapSectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        });
      });
      return true;
    } catch {
      setRouteError("Route unavailable");
      return false;
    } finally {
      setRouteLoading(false);
    }
  }, [alertCoords, canComputeRoute, volunteerCoords]);

  /** Auto route once when this alert becomes accepted (grace period card). */
  useEffect(() => {
    if (status !== "accepted") return;
    const marker = `${alertId}:accepted`;
    if (autoRouteAttemptedForStatusRef.current === marker) return;
    if (!canComputeRoute) return;

    autoRouteAttemptedForStatusRef.current = marker;
    let cancelled = false;

    (async () => {
      if (cancelled) return;
      await fetchAndShowRoute();
    })();

    return () => {
      cancelled = true;
    };
  }, [alertId, status, canComputeRoute, fetchAndShowRoute]);

  const handleRouteToggle = useCallback(async () => {
    if (routePositions) {
      setRoutePositions(null);
      setRouteError(null);
      return;
    }
    await fetchAndShowRoute();
  }, [fetchAndShowRoute, routePositions]);

  return (
    <article
      className={`glass-card glass-light-blob relative overflow-hidden p-6 transition-all duration-300 ease-in-out ${
        isNew
          ? "ring-2 ring-red-400/50 bg-gradient-to-br from-red-500/10 to-white/10"
          : ""
      }`}
    >
      {isNew ? (
        <span className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-red-500 to-red-700 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
          New
        </span>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 pr-16">
        <h3 className="text-glass-primary text-lg">
          Alert #{String(id).slice(-6)}
        </h3>
        <StatusBadge status={status} />
      </div>

      <ReadableAlertLocation alert={alert} />

      {precise ? (
        <p className="mt-2 font-mono text-xs tabular-nums text-white/60">
          <span aria-hidden>📌 </span>
          Lat: {precise.latStr}, Lng: {precise.lngStr}
        </p>
      ) : (
        <p className="mt-2 text-xs text-white/60">
          Location unavailable
        </p>
      )}

      <p className="mt-2 text-sm text-glass-secondary transition-all duration-300 ease-in-out">
        {distanceLabel}
      </p>

      <ResponseStatusPulse status={status} />

      {timeAgoLabel ? (
        <p className="mt-2 text-sm text-glass-secondary">{timeAgoLabel}</p>
      ) : null}

      {alertCoords ? (
        <div ref={mapSectionRef} className="mt-4 space-y-2">
          <MapView
            alertLat={alertCoords.lat}
            alertLng={alertCoords.lng}
            volunteerLat={volunteerCoords?.lat ?? null}
            volunteerLng={volunteerCoords?.lng ?? null}
            routePositions={routePositions}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <button
              type="button"
              onClick={handleRouteToggle}
              disabled={!canComputeRoute || routeLoading}
              className="glass-button-secondary px-4 py-2 text-sm"
            >
              {routeLoading ? (
                <>
                  <ButtonSpinner className="h-3.5 w-3.5 text-white" />
                  Building route…
                </>
              ) : routePositions ? (
                "Hide route"
              ) : (
                "Show route"
              )}
            </button>
            {!canComputeRoute ? (
              <span className="text-[11px] text-white/60">
                Enable location to see turn-by-turn route
              </span>
            ) : null}
          </div>
          {routeError ? (
            <p className="text-xs text-red-300 transition-all duration-300">
              {routeError}
            </p>
          ) : null}
        </div>
      ) : null}

      {showAcceptButton ? (
        <button
          type="button"
          onClick={() => onAccept?.(id)}
          disabled={isAccepting}
          className="glass-button-primary w-full mt-6"
        >
          {isAccepting ? (
            <span className="inline-flex items-center justify-center gap-2">
              <ButtonSpinner className="h-4 w-4 text-white" />
              Accepting…
            </span>
          ) : (
            "Accept & assist"
          )}
        </button>
      ) : null}
    </article>
  );
}

export default AlertCard;
