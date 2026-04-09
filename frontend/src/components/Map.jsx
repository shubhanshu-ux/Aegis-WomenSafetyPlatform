import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function Map({ 
  center = [12.9716, 77.5946], 
  zoom = 13, 
  markers = [], 
  route = null,
  className = '',
  style = { height: '400px', width: '100%' },
  onLocate = null
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const routeRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center and zoom
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers
    markers.forEach(markerData => {
      const { position, type, popup, iconOptions } = markerData;
      
      let icon;
      if (type === 'volunteer') {
        icon = L.divIcon({
          className: 'volunteer-marker',
          html: `<div style="background: #3B82F6; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
      } else if (type === 'user') {
        icon = L.divIcon({
          className: 'user-marker',
          html: `<div style="background: #EF4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
      } else {
        icon = iconOptions || new L.Icon.Default();
      }

      const marker = L.marker(position, { icon })
        .addTo(mapInstanceRef.current);
      
      if (popup) {
        marker.bindPopup(popup);
      }
      
      markersRef.current.push(marker);
    });
  }, [markers]);

  // Update route
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing route
    if (routeRef.current) {
      mapInstanceRef.current.removeLayer(routeRef.current);
      routeRef.current = null;
    }

    // Add new route
    if (route && route.length >= 2) {
      routeRef.current = L.polyline(route, {
        color: '#8B5CF6',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10',
        dashOffset: '0',
      }).addTo(mapInstanceRef.current);
    }
  }, [route]);

  // Add locate control
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Create custom locate control
    const LocateControl = L.Control.extend({
      options: {
        position: 'topright'
      },
      
      onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-control-locate');
        container.innerHTML = `
          <div style="
            background: rgba(255, 255, 255, 0.9);
            border: 2px solid rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            width: 36px;
            height: 36px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="3"/>
              <line x1="12" y1="1" x2="12" y2="7"/>
              <line x1="12" y1="17" x2="12" y2="23"/>
            </svg>
          </div>
        `;
        
        container.onclick = () => {
          if (onLocate) {
            onLocate();
          }
        };
        
        L.DomEvent.disableClickPropagation(container);
        return container;
      }
    });

    const locateControl = new LocateControl();
    mapInstanceRef.current.addControl(locateControl);
  }, [mapInstanceRef.current, onLocate]);

  return (
    <div 
      ref={mapRef} 
      className={className}
      style={style}
    />
  );
}

export default Map;
