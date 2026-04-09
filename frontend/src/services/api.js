import axios from "axios";
import { API_BASE_URL } from "../config/env";
import { safeLocalStorage } from "../utils/safeStorage";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

api.interceptors.request.use(
  (config) => {
    try {
      const token = safeLocalStorage.getItem("token");
      if (token && String(token).trim()) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      /* ignore */
    }
    return config;
  },
  (err) => Promise.reject(err)
);

export const authApi = {
  login: (payload) => api.post("/auth/login", payload),
  signup: (payload) => api.post("/auth/register", payload),
};

export const alertsApi = {
  createAlert: (body) => api.post("/alerts", body),
  getAlerts: () => api.get("/alerts"),
  getAlertById: (alertId) => api.get(`/alerts/${alertId}`),
  getMyActiveAlert: () => api.get("/alerts/active"),
  acceptAlert: (alertId) => api.post(`/alerts/${alertId}/accept`),
  resolveAlert: (alertId) => api.post(`/alerts/${alertId}/resolve`),
  endMission: (alertId, status) => api.patch(`/alerts/${alertId}`, { status }),
  cancelMission: (alertId) => api.put(`/alerts/cancel/${alertId}`),
  updateVolunteerLocation: (coords) => api.post("/volunteers/location", coords),
};

export const volunteerApi = {
  getProfile: () => api.get("/volunteers/me"),
  updateLocation: (coords) => api.post("/volunteers/location", coords),
};

export default api;
