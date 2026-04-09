/** API base includes `/api` path segment (matches Axios instance). */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://womens-safety-backend-wx7t.onrender.com/api";

/** Socket.io server origin (no path). */
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "https://womens-safety-backend-wx7t.onrender.com";
