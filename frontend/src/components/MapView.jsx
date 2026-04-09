import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function MapController({ alertLat, alertLng, volunteerLat, volunteerLng, routePositions }) {
  const map = useMap();

  useEffect(() => {
    if (alertLat == null || alertLng == null) return;
    const alertPt = L.latLng(alertLat, alertLng);

    if (routePositions?.length >= 2) {
      const b = L.latLngBounds(routePositions);
      if (b.isValid()) {
        map.fitBounds(b, { padding: [36, 36], maxZoom: 16 });
      }
      return;
    }

    const hasVol =
      volunteerLat != null &&
      volunteerLng != null &&
      !Number.isNaN(Number(volunteerLat)) &&
      !Number.isNaN(Number(volunteerLng));
    if (hasVol) {
      const volunteerPt = L.latLng(volunteerLat, volunteerLng);
      const b = L.latLngBounds(alertPt, volunteerPt);
      if (b.isValid()) {
        map.fitBounds(b, { padding: [44, 44], maxZoom: 15 });
      }
      return;
    }

    map.setView(alertPt, 14);
  }, [map, alertLat, alertLng, volunteerLat, volunteerLng, routePositions]);

  return null;
}

/**
 * OpenStreetMap + markers (alert = red, volunteer = blue) + optional OSRM route polyline.
 * Client-only (Leaflet needs DOM).
 */
function MapView({
  alertLat,
  alertLng,
  volunteerLat,
  volunteerLng,
  routePositions = null,
  className = "",
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`flex h-56 items-center justify-center rounded-xl bg-slate-100 text-xs font-medium text-gray-500 shadow-lg dark:bg-gray-900 dark:text-gray-400 sm:h-64 ${className}`}
      >
        Loading map…
      </div>
    );
  }

  const hasVolunteer =
    volunteerLat != null &&
    volunteerLng != null &&
    !Number.isNaN(Number(volunteerLat)) &&
    !Number.isNaN(Number(volunteerLng));

  return (
    <div
      className={`animate-fade-in overflow-hidden rounded-xl shadow-lg ring-1 ring-black/5 dark:shadow-black/50 dark:ring-white/10 ${className}`}
    >
      <MapContainer
        center={[alertLat, alertLng]}
        zoom={14}
        className="z-0 h-56 w-full sm:h-64"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController
          alertLat={alertLat}
          alertLng={alertLng}
          volunteerLat={volunteerLat}
          volunteerLng={volunteerLng}
          routePositions={routePositions}
        />
        <CircleMarker
          center={[alertLat, alertLng]}
          radius={10}
          pathOptions={{
            color: "#b91c1c",
            fillColor: "#ef4444",
            fillOpacity: 0.95,
            weight: 2,
          }}
        />
        {hasVolunteer ? (
          <CircleMarker
            center={[Number(volunteerLat), Number(volunteerLng)]}
            radius={9}
            pathOptions={{
              color: "#1d4ed8",
              fillColor: "#3b82f6",
              fillOpacity: 0.95,
              weight: 2,
            }}
          />
        ) : null}
        {routePositions?.length >= 2 ? (
          <Polyline
            positions={routePositions}
            pathOptions={{ color: "#2563eb", weight: 5, opacity: 0.88 }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}

export default MapView;
