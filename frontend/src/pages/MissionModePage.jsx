import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";
import useAuth from "../hooks/useAuth";

function MissionModePage() {
  const navigate = useNavigate();
  const { user: volunteer } = useAuth();
  
  // Load mission data from localStorage
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load mission data from localStorage
    const storedMission = localStorage.getItem("activeMission");
    
    if (storedMission) {
      try {
        const missionData = JSON.parse(storedMission);
        console.log("Mission data loaded from localStorage:", missionData);
        setMission(missionData);
        setLoading(false);
      } catch (error) {
        console.error("Failed to parse mission data:", error);
        setLoading(false);
      }
    } else {
      console.log("No mission data found in localStorage");
      setLoading(false);
    }
  }, []);

  // Handle call user
  const handleCallUser = () => {
    if (mission?.user?.phone && mission.user.phone !== 'Not available') {
  window.location.href = `tel:${mission.user.phone}`;
}
  };

  // Handle end mission
  const handleEndMission = async () => {
    console.log("Ending mission...");
  
    try {
      const storedMission = localStorage.getItem("activeMission");
      if (storedMission) {
        const missionData = JSON.parse(storedMission);
        const missionId = missionData._id || missionData.id;
        
        console.log("Mission data before cancel:", missionData);
        console.log("Mission ID:", missionId);
        
        // 🔥 FIX HERE - Use cancelMission API instead of endMission
        const response = await alertsApi.cancelMission(missionId);
        console.log("Cancel mission response:", response.data);
      }
      
      localStorage.removeItem("activeMission");
      navigate("/volunteer");
    } catch (error) {
      console.error("Failed to end mission:", error);
      localStorage.removeItem("activeMission");
      navigate("/volunteer");
    }
  };

  // Generate Google Maps URL
  const getGoogleMapsUrl = () => {
    if (mission?.latitude && mission?.longitude) {
      return `https://www.google.com/maps?q=${mission.latitude},${mission.longitude}&output=embed`;
    }
    return null;
  };

  if (loading) {
    return (
      <PageContainer nav={<Navbar showLogout userRole="volunteer" />}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white text-xl">Loading mission...</div>
        </div>
      </PageContainer>
    );
  }

  if (!mission) {
    return (
      <PageContainer nav={<Navbar showLogout userRole="volunteer" />}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white text-xl text-center">
            <p>No active mission found</p>
            <button
              onClick={() => navigate("/volunteer")}
              className="glass-button-primary mt-4 px-4 py-2"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer nav={<Navbar showLogout userRole="volunteer" />}>
      {/* User Details Section */}
      <section className="glass-card p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Mission Mode
            </h2>
            <p className="text-emerald-300 font-semibold">
              Navigating to user
            </p>
          </div>
          <button
            onClick={handleEndMission}
            className="glass-button-secondary px-4 py-2"
          >
            End Mission
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-semibold text-white/70 mb-1">User Name</p>
            <p className="text-lg font-medium text-white">{mission?.user?.name || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-white/70 mb-1">Phone Number</p>
            <div className="flex items-center gap-2">
  <p className="text-lg font-medium text-white">
    {mission?.user?.phone || 'Not available'}
  </p>

  {mission?.user?.phone && mission.user.phone !== 'Not available' && (
    <button
                  onClick={handleCallUser}
                  className="glass-button-primary px-3 py-1 text-sm"
                >
                  Call
                </button>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-white/70 mb-1">Location</p>
            <p className="text-lg font-medium text-white">{mission.location || 'Unknown'}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-emerald-300 text-sm">Mission active</span>
        </div>
      </section>

      {/* Google Maps Section */}
      <section className="glass-card p-0 overflow-hidden" style={{ height: 'calc(100vh - 300px)' }}>
        <div className="relative w-full h-full">
          {getGoogleMapsUrl() ? (
            <iframe
              src={getGoogleMapsUrl()}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="User Location Map"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-white text-center">
                <p className="text-xl">Location not available</p>
                <p className="text-sm text-white/70 mt-2">No coordinates found for this mission</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </PageContainer>
  );
}

export default MissionModePage;
