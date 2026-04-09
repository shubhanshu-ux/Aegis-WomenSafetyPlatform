import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AlertCard from "../components/AlertCard";
import AlertCardSkeleton from "../components/AlertCardSkeleton";
import ButtonSpinner from "../components/ButtonSpinner";
import HeaderAnimatedTagline from "../components/HeaderAnimatedTagline";
import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";
import Map from "../components/Map";
import { APP_NAME, APP_TAGLINE } from "../constants/branding";
import { useVolunteerAlerts } from "../hooks/useVolunteerAlerts";
import { useVolunteerGeolocation } from "../hooks/useVolunteerGeolocation";
import { useVolunteerTracking } from "../hooks/useVolunteerTracking";
import useAuth from "../hooks/useAuth";
import { isVolunteerRole } from "../utils/roles";

function VolunteerDashboardPage() {
  const navigate = useNavigate();
  const { clearToken, user, role } = useAuth();
  const canAccept = isVolunteerRole(user?.role ?? role);
  
  const {
    alerts,
    initialLoading,
    pollingTick,
    newAlertIds,
    acceptingId,
    acceptAlert,
    refresh,
    emergencyFlashTick,
  } = useVolunteerAlerts();

  const { location: volunteerLocation } = useVolunteerGeolocation();
  
  // Initialize tracking for accepted alerts
  const [trackingAlertId, setTrackingAlertId] = useState(null);
  const [activeAlert, setActiveAlert] = useState(null);
  const { 
    location: trackingLocation, 
    isTracking, 
    startTracking: startVolunteerTracking,
    stopTracking: stopVolunteerTracking 
  } = useVolunteerTracking(trackingAlertId, user?._id);

  // Handle alert acceptance
  const handleAcceptAlert = async (alertId) => {
    console.log("handleAcceptAlert called with alertId:", alertId);
    
    const acceptedAlert = await acceptAlert(alertId);
    console.log("Accepted alert data:", acceptedAlert);
    
    // Store full alert data in localStorage
    const missionData = {
      ...acceptedAlert,
      _id: acceptedAlert?._id || acceptedAlert?.id || alertId,
      name: acceptedAlert?.user?.name || 'Unknown',
      phone: acceptedAlert?.user?.phone || 'Not available',
      latitude: acceptedAlert?.latitude,
      longitude: acceptedAlert?.longitude,
      location: acceptedAlert?.user?.location || 'Unknown'
    };
    
    localStorage.setItem("activeMission", JSON.stringify(missionData));
    console.log("Mission data stored in localStorage:", missionData);
    
    // Navigate to Mission Mode without ID in URL
    navigate("/mission");
  };

  // Handle locate functionality
  const handleLocate = () => {
    if (volunteerLocation) {
      // Center map on volunteer location with zoom
      const mapElement = document.querySelector('.leaflet-container');
      if (mapElement && mapElement._leaflet_map) {
        mapElement._leaflet_map.flyTo([volunteerLocation.latitude, volunteerLocation.longitude], 15, {
          duration: 1.5
        });
      }
    }
  };

  // Prepare map data
  const mapMarkers = [];

  // Add volunteer marker
  if (volunteerLocation?.latitude && volunteerLocation?.longitude) {
    mapMarkers.push({
      position: [volunteerLocation.latitude, volunteerLocation.longitude],
      type: 'volunteer',
      popup: 'Your location'
    });
  }

  // Add user markers for all alerts
  alerts.forEach(alert => {
    if (alert.latitude && alert.longitude) {
      mapMarkers.push({
        position: [alert.latitude, alert.longitude],
        type: 'user',
        popup: `User: ${alert.user?.name || 'Unknown'}`
      });
    }
  });

  // Add route if we have an active alert
  let route = null;
  if (activeAlert && volunteerLocation && activeAlert.latitude && activeAlert.longitude) {
    route = [
      [volunteerLocation.latitude, volunteerLocation.longitude],
      [activeAlert.latitude, activeAlert.longitude]
    ];
  }

  const [emergencyFlashSession, setEmergencyFlashSession] = useState(0);

  useEffect(() => {
    if (emergencyFlashTick > 0) {
      setEmergencyFlashSession(emergencyFlashTick);
    }
  }, [emergencyFlashTick]);

  const handleLogout = () => {
    clearToken();
    navigate("/");
  };

  return (
    <>
      {emergencyFlashSession > 0 ? (
        <div
          key={emergencyFlashSession}
          className="pointer-events-none fixed inset-0 z-[25] bg-red-500/10 emergency-flash-overlay transition-opacity duration-300 ease-in-out"
          onAnimationEnd={() => setEmergencyFlashSession(0)}
          aria-hidden
        />
      ) : null}
      <PageContainer
        nav={<Navbar showLogout userRole="volunteer" onLogout={handleLogout} />}
      >
        <header className="mb-16 text-center animate-fade-in">
          <div className="mb-8 text-center">
            <p className="font-display text-sm font-bold tracking-[0.25em] text-teal-300">
              {APP_NAME}
            </p>
            <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white sm:text-6xl">
              Volunteer Dashboard
            </h1>
            <HeaderAnimatedTagline className="mx-auto mt-3 max-w-md" />
            <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-white/80">
              {APP_TAGLINE}
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between sm:gap-0">
            <p className="text-center text-xl font-semibold text-white">
              {alerts.length} pending alert{alerts.length !== 1 ? "s" : ""} nearby
            </p>
            {pollingTick ? (
              <span className="ml-3 inline-flex items-center gap-3 font-medium text-teal-300">
                <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-teal-400" />
                Updating…
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={initialLoading || pollingTick}
            className="glass-button-primary mt-8"
          >
            {pollingTick ? (
              <>
                <ButtonSpinner className="h-5 w-5 text-white" />
                Refreshing…
              </>
            ) : (
              "Refresh"
            )}
          </button>
        </header>

        {/* Active Mission Section */}
        {activeAlert && (
          <section className="mb-12 glass-card border-emerald-400/30 bg-emerald-500/10 p-8 animate-slide-up">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-emerald-200">
                🚑 Active Mission
              </h3>
              <span className="status-badge status-badge-accepted">
                Accepted
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-white/70">User in need</p>
                <p className="text-lg font-medium text-white">{activeAlert.user?.name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-white/70">Alert ID</p>
                <p className="text-lg font-medium text-white">#{String(activeAlert._id || activeAlert.id).slice(-6)}</p>
              </div>
              {isTracking && (
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-400"></div>
                  <span className="text-base text-emerald-300">Live tracking active</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Map Section */}
        <section className="mb-12 animate-slide-up">
          <div className="glass-card p-8">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">
                📍 Live Location Map
              </h3>
              {isTracking && (
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-400"></div>
                  <span className="text-base text-emerald-300">Live tracking</span>
                </div>
              )}
            </div>
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <Map
                center={volunteerLocation ? [volunteerLocation.latitude, volunteerLocation.longitude] : [12.9716, 77.5946]}
                zoom={14}
                markers={mapMarkers}
                route={route}
                onLocate={handleLocate}
                style={{ height: '450px', width: '100%' }}
                className="rounded-2xl overflow-hidden"
              />
            </div>
          </div>
        </section>

        {initialLoading ? (
          <div className="grid gap-6 animate-slide-up">
            <AlertCardSkeleton />
            <AlertCardSkeleton />
            <AlertCardSkeleton />
          </div>
        ) : null}

        {!initialLoading && alerts.length === 0 ? (
          <div className="glass-card p-16 text-center animate-slide-up">
            <p className="text-xl font-semibold text-white/80">
              No pending SOS requests right now.
            </p>
          </div>
        ) : null}

        {!initialLoading && alerts.length > 0 ? (
          <section className="grid gap-8 animate-slide-up">
            {alerts.map((alert, index) => {
              const id = String(alert._id || alert.id);
              return (
                <AlertCard
                  key={id}
                  alert={alert}
                  isNew={newAlertIds.has(id)}
                  isAccepting={acceptingId === id}
                  canAccept={canAccept}
                  volunteerCoords={volunteerLocation}
                  onAccept={handleAcceptAlert}
                  style={{ animationDelay: `${index * 0.1}s` }}
                />
              );
            })}
          </section>
        ) : null}
      </PageContainer>
    </>
  );
}

export default VolunteerDashboardPage;
