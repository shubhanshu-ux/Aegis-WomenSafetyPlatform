import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderAnimatedTagline from "../components/HeaderAnimatedTagline";
import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";
import ReadableAlertLocation from "../components/ReadableAlertLocation";
import SosButton from "../components/SosButton";
import Map from "../components/Map";
import { useToast } from "../context/ToastContext";
import { APP_NAME, APP_TAGLINE } from "../constants/branding";
import { alertsApi } from "../services/api";
import useAuth from "../hooks/useAuth";
import { useUserActiveSos } from "../hooks/useUserActiveSos";
import { getApiErrorMessage } from "../utils/errors";
import { getAddressFromCoords } from "../utils/geocode";
import { createSocketClient } from "../services/socket";

const DEFAULT_SOS_COORDS = { latitude: 12.9716, longitude: 77.5946 };

function getSosCoordinates() {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(DEFAULT_SOS_COORDS);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      () => resolve(DEFAULT_SOS_COORDS),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 }
    );
  });
}

function UserDashboardPage() {
  const navigate = useNavigate();
  const { clearToken } = useAuth();
  const { sos, error } = useToast();
  const {
    activeAlert,
    loading: activeLoading,
    hasActiveSos,
    refresh,
    resolveAlert,
  } = useUserActiveSos();
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const [showAcceptNotification, setShowAcceptNotification] = useState(false);
  const [acceptedVolunteer, setAcceptedVolunteer] = useState(null);
  const [volunteerLocation, setVolunteerLocation] = useState(null);

  useEffect(() => {
    if (!justSent) return undefined;
    const t = setTimeout(() => setJustSent(false), 12000);
    return () => clearTimeout(t);
  }, [justSent]);

  // Socket listener for alert acceptance
  useEffect(() => {
    let socket;
    try {
      socket = createSocketClient();
    } catch (e) {
      console.warn("[BSafe] Socket unavailable:", e);
      return undefined;
    }

    if (!socket) return undefined;

    const onAlertAccepted = (payload) => {
      const alertId = String(activeAlert?.id || activeAlert?._id);
      if (payload.alertId === alertId) {
        setAcceptedVolunteer(payload.volunteer);
        setShowAcceptNotification(true);
        sos("🚑 Help is on the way!");
        
        // Auto-hide notification after 8 seconds
        setTimeout(() => {
          setShowAcceptNotification(false);
        }, 8000);
      }
    };

    const onVolunteerLocationUpdate = (payload) => {
      const alertId = String(activeAlert?.id || activeAlert?._id);
      const volunteerId = activeAlert?.acceptedBy?.id || activeAlert?.acceptedBy?._id;
      
      if (payload.volunteerId === volunteerId) {
        setVolunteerLocation({
          latitude: payload.latitude,
          longitude: payload.longitude,
          timestamp: payload.timestamp,
        });
      }
    };

    socket.on("alert-accepted", onAlertAccepted);
    socket.on("volunteer-location-update", onVolunteerLocationUpdate);

    return () => {
      try {
        socket.off("alert-accepted", onAlertAccepted);
        socket.off("volunteer-location-update", onVolunteerLocationUpdate);
        socket.disconnect();
      } catch (e) {
        console.warn("[BSafe] Socket cleanup:", e);
      }
    };
  }, [activeAlert, sos]);

  const sendSosAlert = async () => {
    if (hasActiveSos) return;
    setSending(true);
    try {
      const coords = await getSosCoordinates();
      let locationName = "";
      try {
        const line = await getAddressFromCoords(coords.latitude, coords.longitude);
        if (line) locationName = line;
      } catch {
        /* optional — SOS still succeeds */
      }
      await alertsApi.createAlert({ ...coords, locationName });
      sos("SOS sent — help is being notified.");
      setJustSent(true);
      await refresh();
    } catch (err) {
      error(getApiErrorMessage(err, "Could not send SOS. Try again."));
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    const id = activeAlert?.id ?? activeAlert?._id;
    if (!id) return;
    setResolving(true);
    try {
      await resolveAlert(id);
      setJustSent(false);
    } catch (err) {
      error(getApiErrorMessage(err, "Could not resolve alert."));
    } finally {
      setResolving(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    navigate("/");
  };

  const status = String(activeAlert?.status || "").toLowerCase();
  const volunteer = activeAlert?.acceptedBy;
  const volName = volunteer?.name;
  const volPhone = volunteer?.phone;

  return (
    <PageContainer nav={<Navbar showLogout userRole="user" onLogout={handleLogout} />}>
      <header className="mb-16 text-center animate-fade-in">
        <p className="font-display text-sm font-bold tracking-[0.25em] text-teal-300">
          {APP_NAME}
        </p>
        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white sm:text-6xl">
          Your safety hub
        </h1>
        <HeaderAnimatedTagline className="mx-auto mt-3 max-w-md" />
        <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-white/80">
          {APP_TAGLINE}
        </p>
      </header>

      {activeLoading ? (
        <p className="mb-8 text-center text-lg font-medium text-white/70 animate-slide-up">
          Checking alert status…
        </p>
      ) : null}

      {activeAlert ? (
        <section className="mb-10 glass-card p-6 animate-slide-up">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/70">
              Current alert
            </h2>
            <span className={`status-badge ${
              status === "pending" ? "status-badge-pending" : 
              status === "accepted" ? "status-badge-accepted" : 
              "status-badge-resolved"
            }`}>
              {status === "pending" && "⏳ Pending"}
              {status === "accepted" && "✅ Accepted"}
              {status === "resolved" && "✓ Resolved"}
              {!["pending", "accepted", "resolved"].includes(status) && status}
            </span>
          </div>
          <p className="mt-3 text-lg font-semibold text-white">
            {status === "pending" && "Waiting for a volunteer"}
            {status === "accepted" && "Help is assigned"}
            {status === "resolved" && "Alert resolved"}
            {!["pending", "accepted", "resolved"].includes(status) && status}
          </p>
          <ReadableAlertLocation alert={activeAlert} />
          {status === "accepted" && (volName || volPhone) ? (
            <div className="mt-6 glass-card bg-emerald-500/10 border-emerald-400/30 p-4 animate-slide-up">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                🚑 Volunteer Assigned
              </p>
              {volName ? (
                <p className="mt-2 text-lg font-medium text-white">{volName}</p>
              ) : null}
              {volPhone ? (
                <p className="mt-1 text-emerald-200 font-medium">📞 {volPhone}</p>
              ) : null}
            </div>
          ) : null}
          {(status === "pending" || status === "accepted") && (
            <button
              type="button"
              onClick={handleResolve}
              disabled={resolving}
              className="glass-button-secondary w-full mt-6"
            >
              {resolving ? "Saving…" : "✓ I'm safe — mark resolved"}
            </button>
          )}
        </section>
      ) : null}

      {/* Map Section - Show after alert is accepted */}
      {activeAlert && status === "accepted" && (
        <section className="mb-10 animate-slide-up">
          <div className="glass-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                🚑 Live Tracking
              </h3>
              {volunteerLocation && (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></div>
                  <span className="text-sm text-emerald-300">Live tracking</span>
                </div>
              )}
            </div>
            <div className="rounded-xl overflow-hidden shadow-2xl">
              <Map
                center={activeAlert.latitude && activeAlert.longitude ? [activeAlert.latitude, activeAlert.longitude] : [12.9716, 77.5946]}
                zoom={14}
                markers={[
                  // User location
                  ...(activeAlert.latitude && activeAlert.longitude ? [{
                    position: [activeAlert.latitude, activeAlert.longitude],
                    type: 'user',
                    popup: 'Your location'
                  }] : []),
                  // Volunteer location
                  ...(volunteerLocation?.latitude && volunteerLocation?.longitude ? [{
                    position: [volunteerLocation.latitude, volunteerLocation.longitude],
                    type: 'volunteer',
                    popup: 'Volunteer location'
                  }] : [])
                ]}
                route={
                  volunteerLocation && activeAlert.latitude && activeAlert.longitude
                    ? [
                        [volunteerLocation.latitude, volunteerLocation.longitude],
                        [activeAlert.latitude, activeAlert.longitude]
                      ]
                    : null
                }
                style={{ height: '400px', width: '100%' }}
                className="rounded-xl overflow-hidden"
              />
            </div>
          </div>
        </section>
      )}

      <section className="glass-card p-8 animate-slide-up">
        <div className="flex flex-col items-center justify-center py-4">
          <SosButton
            loading={sending}
            disabled={hasActiveSos || activeLoading}
            onClick={sendSosAlert}
          />
          {justSent ? (
            <p className="mt-8 max-w-sm animate-fade-in text-center text-lg font-medium leading-relaxed text-white/80">
              🛡️ Stay calm. Help is being notified.
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-12 grid gap-6 sm:mt-16">
        <button
          type="button"
          className="glass-card group p-6 text-left transition-all duration-300 hover:-translate-y-1 animate-slide-up"
        >
          <span className="block text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
            🎥 Start recording
          </span>
          <span className="text-sm text-white/60">Coming soon</span>
        </button>
        <button
          type="button"
          className="glass-card group p-6 text-left transition-all duration-300 hover:-translate-y-1 animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          <span className="block text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
            📍 Add travel details
          </span>
          <span className="text-sm text-white/60">Coming soon</span>
        </button>
      </section>

      {/* Alert Acceptance Notification */}
      {showAcceptNotification && acceptedVolunteer && (
        <div className="fixed top-24 left-1/2 z-50 w-full max-w-md -translate-x-1/2 animate-slide-in-top">
          <div className="glass-card border-emerald-400/30 bg-emerald-500/10 p-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                <span className="text-2xl">🚑</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">Help is on the way!</h3>
                {acceptedVolunteer.name && (
                  <p className="mt-1 text-emerald-200 font-medium">{acceptedVolunteer.name}</p>
                )}
                {acceptedVolunteer.phone && (
                  <p className="mt-0.5 text-emerald-200">📞 {acceptedVolunteer.phone}</p>
                )}
              </div>
              <button
                onClick={() => setShowAcceptNotification(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default UserDashboardPage;
